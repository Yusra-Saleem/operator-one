"""Integration API tests for Operation One API v1 routes."""


def test_business_ops_summary(client):
    response = client.get("/api/v1/operations/summary")
    assert response.status_code == 200
    data = response.json()
    assert "mrr" in data
    assert "arr" in data
    assert "operational_health_score" in data


def test_sales_pipeline(client):
    response = client.get("/api/v1/sales/pipeline")
    assert response.status_code == 200
    data = response.json()
    assert "total_pipeline_value" in data
    assert "active_deals" in data


def test_inventory_health(client):
    response = client.get("/api/v1/inventory/health")
    assert response.status_code == 200
    data = response.json()
    assert "health_score" in data
    assert "total_items_count" in data


def test_workflows_list(client):
    response = client.get("/api/v1/workflows")
    assert response.status_code == 200
    wfs = response.json()
    assert isinstance(wfs, list)


def test_integrations_list(client):
    response = client.get("/api/v1/integrations")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_decision_risks(client):
    response = client.get("/api/v1/decision/risks")
    assert response.status_code == 200
    data = response.json()
    assert "risk_score" in data
    assert "recommendations" in data


def test_dispatch_quote(client):
    response = client.post(
        "/api/v1/dispatch/send",
        json={
            "channel": "whatsapp",
            "document_type": "quote",
            "recipient_name": "Test Client",
            "recipient_contact": "+923000000000",
            "amount": 1500.0,
            "details": "Test quote document",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "WhatsApp" in data["message"]


def test_unauthenticated_request_fails():
    from fastapi.testclient import TestClient
    from app.main import app

    with TestClient(app) as unauth_client:
        response = unauth_client.get("/api/v1/operations/summary")
        assert response.status_code == 401

