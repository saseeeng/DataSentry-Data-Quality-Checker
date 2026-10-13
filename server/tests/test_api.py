import io
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["database"] == "sqlite"


def test_samples_and_instant_scan():
    # List samples
    samples_res = client.get("/api/scans/samples")
    assert samples_res.status_code == 200
    samples = samples_res.json()
    assert len(samples) >= 2

    # Run sample scan
    scan_res = client.post(f"/api/scans/sample/{samples[0]['id']}")
    assert scan_res.status_code == 201
    scan_data = scan_res.json()
    scan_id = scan_data["id"]
    assert scan_data["quality_score"] is not None
    assert scan_data["row_count"] > 0

    # Get profiling
    profile_res = client.get(f"/api/scans/{scan_id}/profile")
    assert profile_res.status_code == 200
    profile_data = profile_res.json()
    assert len(profile_data["columns"]) > 0

    # Get preview
    preview_res = client.get(f"/api/scans/{scan_id}/preview?limit=10")
    assert preview_res.status_code == 200
    preview_data = preview_res.json()
    assert len(preview_data["rows"]) <= 10

    # Cleaned export
    export_res = client.get(f"/api/scans/{scan_id}/export")
    assert export_res.status_code == 200
    assert "attachment" in export_res.headers.get("content-disposition", "")

    # Cleanup
    del_res = client.delete(f"/api/scans/{scan_id}")
    assert del_res.status_code == 204


def test_csv_upload_scan():
    csv_content = b"id,name,email,score\n1,Alice,alice@example.com,95\n2,Bob,bob-invalid,80\n3,,charlie@example.com,70\n"
    files = {"file": ("test_data.csv", io.BytesIO(csv_content), "text/csv")}
    response = client.post("/api/scans", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["row_count"] == 3
    assert len(data["issues"]) > 0

    # Cleanup
    client.delete(f"/api/scans/{data['id']}")


def test_rules_seed_and_crud():
    # Seed default rules
    seed_res = client.post("/api/rules/seed")
    assert seed_res.status_code == 200

    # List rules
    rules_res = client.get("/api/rules")
    assert rules_res.status_code == 200
    rules = rules_res.json()
    assert len(rules) >= 5

    # Create new rule
    new_rule = {
        "name": "Unique Invoice Number",
        "column_name": "invoice_id",
        "rule_type": "unique",
        "rule_config": {},
        "severity": "high",
        "is_active": True,
    }
    create_res = client.post("/api/rules", json=new_rule)
    assert create_res.status_code == 201
    created_id = create_res.json()["id"]

    # Toggle active
    update_res = client.patch(f"/api/rules/{created_id}", json={"is_active": False})
    assert update_res.status_code == 200
    assert update_res.json()["is_active"] is False

    # Delete rule
    delete_res = client.delete(f"/api/rules/{created_id}")
    assert delete_res.status_code == 204
