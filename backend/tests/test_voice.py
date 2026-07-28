"""Tests for Voice transport router."""


def test_start_voice_session(client):
    response = client.post("/api/v1/voice/start")
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert len(data["session_id"]) > 0
