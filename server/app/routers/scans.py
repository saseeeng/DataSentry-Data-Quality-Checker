import hashlib
import io
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import QualityMetrics, Scan, ValidationIssue, ValidationRule
from app.schemas import ScanOut, ScanSummary
from app.services.analyzer import analyze_dataframe, profile_columns

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/scans", tags=["scans"])
MAX_UPLOAD_BYTES = 50 * 1024 * 1024
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
SAMPLES_DIR = Path(__file__).resolve().parents[1] / "samples"

AVAILABLE_SAMPLES = {
    "ecommerce_customers": {
        "id": "ecommerce_customers",
        "title": "E-Commerce Customer Records",
        "description": "31 customer profiles featuring duplicate rows, malformed emails, unstandardized country casings, and missing names.",
        "file": "ecommerce_customers.csv",
        "category": "CRM & Customers",
    },
    "sales_transactions": {
        "id": "sales_transactions",
        "title": "B2B Sales Transactions",
        "description": "20 transaction rows with missing order totals, duplicate records, lowercase currency codes, and null categories.",
        "file": "sales_transactions.csv",
        "category": "Finance & Sales",
    },
}


def _process_and_save_dataframe(df: pd.DataFrame, file_name: str, raw_content: bytes, db: Session) -> Scan:
    """Internal helper to analyze, score, and persist a scan."""
    file_hash = hashlib.sha256(raw_content).hexdigest()
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / f"{file_hash}.csv").write_bytes(raw_content)

    scan = Scan(
        file_name=file_name,
        file_size=len(raw_content),
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

    return _process_and_save_dataframe(
        df=df,
        file_name=Path(file.filename).name,
        raw_content=content,
        db=db,
    )


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Aggregate statistics for the main dashboard overview."""
    scans = db.query(Scan).options(selectinload(Scan.metrics), selectinload(Scan.issues)).all()
    active_rules_count = db.query(ValidationRule).filter(ValidationRule.is_active.is_(True)).count()

    total_scans = len(scans)
    total_rows = sum(s.row_count for s in scans)
    completed_scans = [s for s in scans if s.status == "completed" and s.quality_score is not None]

    avg_score = round(sum(s.quality_score for s in completed_scans) / len(completed_scans), 1) if completed_scans else 0.0

    total_issues = 0
    issue_by_severity = {"high": 0, "medium": 0, "low": 0}
    issue_by_type: dict[str, int] = {}

    quality_tiers = {"excellent": 0, "good": 0, "fair": 0, "critical": 0}

    for scan in scans:
        if scan.quality_score is not None:
            if scan.quality_score >= 90:
                quality_tiers["excellent"] += 1
            elif scan.quality_score >= 75:
                quality_tiers["good"] += 1
            elif scan.quality_score >= 50:
                quality_tiers["fair"] += 1
            else:
                quality_tiers["critical"] += 1

        for issue in scan.issues:
            total_issues += 1
            sev = issue.severity.lower() if issue.severity else "medium"
            if sev in issue_by_severity:
                issue_by_severity[sev] += 1
            else:
                issue_by_severity["medium"] += 1

            itype = issue.issue_type
            issue_by_type[itype] = issue_by_type.get(itype, 0) + 1

    return {
        "total_scans": total_scans,
        "total_rows_scanned": total_rows,
        "average_quality_score": avg_score,
        "total_issues_found": total_issues,
        "active_rules_count": active_rules_count,
        "quality_tiers": quality_tiers,
        "issue_by_severity": issue_by_severity,
        "issue_by_type": issue_by_type,
    }


@router.get("/samples")
def list_samples():
    """List bundled sample datasets available for instant analysis."""
    return list(AVAILABLE_SAMPLES.values())


@router.post("/sample/{sample_key}", response_model=ScanOut, status_code=201)
def analyze_sample(sample_key: str, db: Session = Depends(get_db)):
    """Run an instant scan on a bundled sample dataset."""
    sample_info = AVAILABLE_SAMPLES.get(sample_key)
    if not sample_info:
        raise HTTPException(status_code=404, detail="Sample dataset not found")

    sample_file_path = SAMPLES_DIR / sample_info["file"]
    if not sample_file_path.exists():
        raise HTTPException(status_code=404, detail="Sample file missing on server")

    raw_content = sample_file_path.read_bytes()
    try:
        df = pd.read_csv(io.BytesIO(raw_content))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error reading sample dataset: {exc}") from exc

    return _process_and_save_dataframe(
        df=df,
        file_name=sample_info["file"],
        raw_content=raw_content,
        db=db,
    )


@router.get("", response_model=list[ScanSummary])
def list_scans(
    status: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Scan)
    if status and status != "all":
        query = query.filter(Scan.status == status)
    if search:
        query = query.filter(Scan.file_name.ilike(f"%{search}%"))
    return query.order_by(Scan.created_at.desc()).all()


@router.delete("", status_code=204)
def clear_all_scans(db: Session = Depends(get_db)):
    """Clear all scans and reset data."""
    scans = db.query(Scan).all()
    for scan in scans:
        db.delete(scan)
    db.commit()
    return Response(status_code=204)


@router.get("/{scan_id}", response_model=ScanOut)
def get_scan(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(Scan).options(
        selectinload(Scan.metrics), selectinload(Scan.issues)
    ).filter(Scan.id == scan_id).first()
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.delete("/{scan_id}", status_code=204)
def delete_scan(scan_id: int, db: Session = Depends(get_db)):
    """Delete a scan record and its associated data."""
    scan = db.get(Scan, scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found")

    file_hash = scan.file_hash
    db.delete(scan)
    db.commit()

    # If no other scan uses this file hash, remove the file
    remaining = db.query(Scan).filter(Scan.file_hash == file_hash).count()
    if remaining == 0:
        stored_file = UPLOAD_DIR / f"{file_hash}.csv"
        if stored_file.exists():
            try:
                stored_file.unlink()
            except OSError:
                pass

    return Response(status_code=204)


@router.get("/{scan_id}/profile")
def get_scan_column_profile(scan_id: int, db: Session = Depends(get_db)):
    """Get rich column-level data quality profiling."""
    scan = db.query(Scan).options(selectinload(Scan.issues)).filter(Scan.id == scan_id).first()
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found")

    stored_file = UPLOAD_DIR / f"{scan.file_hash}.csv"
    if not stored_file.exists():
        raise HTTPException(status_code=404, detail="Original CSV is unavailable")

    try:
        df = pd.read_csv(stored_file)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to read CSV: {exc}") from exc

    issues_dicts = [
        {
            "column_name": issue.column_name,
            "issue_type": issue.issue_type,
            "severity": issue.severity,
        }
        for issue in scan.issues
    ]
    profiles = profile_columns(df, issues_dicts)

    return {
        "scan_id": scan.id,
        "file_name": scan.file_name,
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": profiles,
    }


@router.get("/{scan_id}/export")
def export_cleaned_csv(
    scan_id: int,
    mode: str = Query("standard", description="standard, drop_missing, or fill_defaults"),
    db: Session = Depends(get_db),
):
    scan = db.get(Scan, scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found")

    stored_file = UPLOAD_DIR / f"{scan.file_hash}.csv"
    if not stored_file.exists():
        raise HTTPException(status_code=404, detail="Original CSV is unavailable")

    df = pd.read_csv(stored_file)

    # 1. Deduplicate
    df = df.drop_duplicates()

    # 2. Trim string whitespace
    for column in df.select_dtypes(include=["object", "string"]).columns:
        df[column] = df[column].astype("string").str.strip()

    # 3. Optional enhanced cleanup modes
    if mode == "drop_missing":
        df = df.dropna()
    elif mode == "fill_defaults":
        for column in df.columns:
            if df[column].dtype in ["float64", "int64"]:
                df[column] = df[column].fillna(df[column].median() if not df[column].empty else 0)
            else:
                df[column] = df[column].fillna("N/A")

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
def preview_scan(
    scan_id: int,
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
):
    scan = db.get(Scan, scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found")

    stored_file = UPLOAD_DIR / f"{scan.file_hash}.csv"
    if not stored_file.exists():
        raise HTTPException(status_code=404, detail="Original CSV is unavailable")

    try:
        df = pd.read_csv(stored_file)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to read CSV: {exc}") from exc

    total_rows = len(df)

    if search:
        search_lower = search.lower()
        mask = df.astype(str).apply(lambda row: row.str.lower().str.contains(search_lower, regex=False).any(), axis=1)
        filtered_df = df[mask]
    else:
        filtered_df = df

    total_filtered = len(filtered_df)
    page_df = filtered_df.iloc[offset : offset + limit]

    return {
        "columns": list(df.columns),
        "total_rows": total_rows,
        "filtered_rows": total_filtered,
        "limit": limit,
        "offset": offset,
        "rows": json.loads(page_df.to_json(orient="records")),
    }