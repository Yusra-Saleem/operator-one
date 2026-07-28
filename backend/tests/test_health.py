"""Health & Readiness tests for Operation One API."""


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_ready_endpoint(client):
    response = client.get("/ready")
    assert response.status_code in (200, 503)
    data = response.json()
    assert "ready" in data
    assert "database" in data
