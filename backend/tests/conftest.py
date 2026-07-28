"""Pytest shared test fixtures for Operation One backend tests."""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """FastAPI TestClient with default auth headers."""
    with TestClient(app) as test_client:
        test_client.headers.update({"Authorization": "Bearer test-dev-token"})
        yield test_client
