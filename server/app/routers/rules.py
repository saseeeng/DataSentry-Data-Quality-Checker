from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ValidationRule
from app.schemas import RuleCreate, RuleOut, RuleUpdate

router = APIRouter(prefix="/api/rules", tags=["rules"])

DEFAULT_PRESET_RULES = [
    {
        "name": "Customer ID Required",
        "column_name": "customer_id",
        "rule_type": "required",
        "rule_config": {},
        "severity": "high",
        "is_active": True,
    },
    {
        "name": "Customer ID Must Be Unique",
        "column_name": "customer_id",
        "rule_type": "unique",
        "rule_config": {},
        "severity": "high",
        "is_active": True,
    },
    {
        "name": "Customer Email Format Validation",
        "column_name": "email",
        "rule_type": "email",
        "rule_config": {},
        "severity": "high",
        "is_active": True,
    },
    {
        "name": "Subscription Tier Allowed Values",
        "column_name": "subscription_tier",
        "rule_type": "allowed_values",
        "rule_config": {"values": ["Basic", "Standard", "Premium", "Enterprise"]},
        "severity": "medium",
        "is_active": True,
    },
    {
        "name": "Payment Status Allowed Values",
        "column_name": "payment_status",
        "rule_type": "allowed_values",
        "rule_config": {"values": ["completed", "pending", "failed", "refunded"]},
        "severity": "medium",
        "is_active": True,
    },
]


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


@router.post("/seed", response_model=list[RuleOut])
def seed_default_rules(db: Session = Depends(get_db)):
    """Seed standard validation rules if they don't already exist."""
    existing_names = {r.name for r in db.query(ValidationRule).all()}
    added_rules = []
    for preset in DEFAULT_PRESET_RULES:
        if preset["name"] not in existing_names:
            rule = ValidationRule(**preset)
            db.add(rule)
            added_rules.append(rule)
    if added_rules:
        db.commit()
        for r in added_rules:
            db.refresh(r)
    return db.query(ValidationRule).order_by(ValidationRule.id.desc()).all()


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