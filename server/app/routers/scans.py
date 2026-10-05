import hashlib
import io
from datetime import datetime, timezone
from pathlib import Path
import json

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import QualityMetrics, Scan, ValidationIssue, ValidationRule
from app.schemas import ScanOut, ScanSummary
from app.services.analyzer import analyze_dataframe
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/scans", tags=["scans"])
MAX_UPLOAD_BYTES = 50 * 1024 * 1024
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"


@router.post("", response_model=ScanOut, status_code=201)
async def create_scan(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a .csv file")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty")
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds the 50 MB limit")

    try:
        df = pd.read_csv(io.BytesIO(content))
    except (UnicodeDecodeError, pd.errors.ParserError, pd.errors.EmptyDataError) as exc:
        raise HTTPException(status_code=400, detail=f"Could not read CSV: {exc}") from exc

    file_hash = hashlib.sha256(content).hexdigest()
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / f"{file_hash}.csv").write_bytes(content)

    scan = Scan(
        file_name=Path(file.filename).name,
        file_size=len(content),
        file_hash=file_hash,
        row_count=len(df),
        column_count=len(df.columns),
        status="processing",
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    try:
        rules = db.query(ValidationRule).filter(ValidationRule.is_active.is_(True)).all()
        metrics, issues, score = analyze_dataframe(df, rules)

        db.add(QualityMetrics(scan_id=scan.id, **metrics))
        db.add_all([ValidationIssue(scan_id=scan.id, **issue) for issue in issues])
        scan.quality_score = score
        scan.status = "completed"
        scan.completed_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as exc:
        logger.exception("Scan analysis failed")
        db.rollback()
        scan = db.get(Scan, scan.id)
        if scan:
            scan.status = "failed"
            scan.completed_at = datetime.now(timezone.utc)
            db.commit()
        raise HTTPException(status_code=500, detail="Scan analysis failed") from exc

    return db.query(Scan).options(
        selectinload(Scan.metrics), selectinload(Scan.issues)
    ).filter(Scan.id == scan.id).one()


@router.get("", response_model=list[ScanSummary])
def list_scans(db: Session = Depends(get_db)):
    return db.query(Scan).order_by(Scan.created_at.desc()).all()


@router.get("/{scan_id}", response_model=ScanOut)
def get_scan(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(Scan).options(
        selectinload(Scan.metrics), selectinload(Scan.issues)
    ).filter(Scan.id == scan_id).first()
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.get("/{scan_id}/export")
def export_cleaned_csv(scan_id: int, db: Session = Depends(get_db)):
    scan = db.get(Scan, scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found")

    stored_file = UPLOAD_DIR / f"{scan.file_hash}.csv"
    if not stored_file.exists():
        raise HTTPException(status_code=404, detail="Original CSV is unavailable")

    df = pd.read_csv(stored_file)
    df = df.drop_duplicates()
    for column in df.select_dtypes(include=["object", "string"]).columns:
        df[column] = df[column].astype("string").str.strip()

    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    filename = f"cleaned_{Path(scan.file_name).name}"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{scan_id}/preview")
def preview_scan(scan_id: int, db: Session = Depends(get_db)):
    scan = db.get(Scan, scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found")

    stored_file = UPLOAD_DIR / f"{scan.file_hash}.csv"
    if not stored_file.exists():
        raise HTTPException(status_code=404, detail="Original CSV is unavailable")

    df = pd.read_csv(stored_file).head(10)
    return {
        "columns": list(df.columns),
        "rows": json.loads(df.to_json(orient="records")),
    }