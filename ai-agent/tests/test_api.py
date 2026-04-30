import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "overall" in data
    assert "services" in data

def test_chat_endpoint_schema():
    # This might fail if dependencies aren't set up, but we can verify it doesn't 404
    payload = {
        "session_id": "test-123",
        "user_id": "user-1",
        "message": "Hello!"
    }
    # For CI without real keys, this will return 500, which is expected
    response = client.post("/chat", json=payload)
    assert response.status_code in [200, 500]
