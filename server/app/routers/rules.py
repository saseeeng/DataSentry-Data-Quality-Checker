from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ValidationRule
from app.schemas import RuleCreate, RuleOut, RuleUpdate

router = APIRouter(prefix="/api/rules", tags=["rules"])


@router.get("", response_model=list[RuleOut])
def list_rules(db: Session = Depends(get_db)):
    return db.query(ValidationRule).order_by(ValidationRule.id.desc()).all()


@router.post("", response_model=RuleOut, status_code=201)
def create_rule(payload: RuleCreate, db: Session = Depends(get_db)):
    rule = ValidationRule(**payload.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.patch("/{rule_id}", response_model=RuleOut)
def update_rule(rule_id: int, payload: RuleUpdate, db: Session = Depends(get_db)):
    rule = db.get(ValidationRule, rule_id)
    if rule is None:
        raise HTTPException(status_code=404, detail="Rule not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(rule, key, value)

    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}", status_code=204)
def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.get(ValidationRule, rule_id)
    if rule is None:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return Response(status_code=204)