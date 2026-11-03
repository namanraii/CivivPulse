"""Route-level tests for the issue endpoints that need no live services.

``main`` imports the Firebase ``db`` module and the Gemini agents at import
time, and those need credentials. They are replaced with stubs here so the
routes can be exercised offline: ``python -m pytest tests`` from ``backend/``.
"""
import os
import sys
import types
from unittest.mock import MagicMock

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("GEMINI_API_KEY", "test-key")

fake_db_module = types.ModuleType("db")
fake_db_module.db = MagicMock(name="firestore-db")
sys.modules["db"] = fake_db_module

from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402


@pytest.fixture()
def client():
    main.db.reset_mock(return_value=True, side_effect=True)
    return TestClient(main.app)


def _set_issue(issue):
    """Make ``db.collection(...).document(...).get()`` return ``issue`` (None = missing)."""
    doc = MagicMock()
    doc.exists = issue is not None
    doc.to_dict.return_value = issue
    doc_ref = MagicMock()
    doc_ref.get.return_value = doc
    main.db.collection.return_value.document.return_value = doc_ref
    return doc_ref


def test_upvote_unknown_issue_returns_404(client):
    _set_issue(None)
    response = client.post("/api/issues/missing-id/upvote")
    assert response.status_code == 404
    assert response.json()["detail"] == "Issue not found"


def test_escalate_unknown_issue_returns_404(client):
    _set_issue(None)
    response = client.post("/api/issues/missing-id/escalate")
    assert response.status_code == 404
    assert response.json()["detail"] == "Issue not found"


def test_upvote_increments_and_rescoring_is_persisted(client, monkeypatch):
    doc_ref = _set_issue(
        {"title": "Pothole", "category": "Roads", "description": "Deep", "severity": "High", "upvotes": 4}
    )
    calls = {}

    def fake_score(**kwargs):
        calls.update(kwargs)
        return types.SimpleNamespace(urgency_score=77, justification="busy road")

    monkeypatch.setattr(main, "calculate_urgency", fake_score)

    response = client.post("/api/issues/abc/upvote")

    assert response.status_code == 200
    assert response.json() == {"success": True, "upvotes": 5, "urgency_score": 77}
    assert calls["upvotes"] == 5
    doc_ref.update.assert_called_once_with(
        {"upvotes": 5, "urgency_score": 77, "justification": "busy road"}
    )


def test_upvote_agent_failure_is_a_500(client, monkeypatch):
    _set_issue({"title": "t", "category": "c", "description": "d", "severity": "Low", "upvotes": 0})

    def boom(**kwargs):
        raise RuntimeError("gemini down")

    monkeypatch.setattr(main, "calculate_urgency", boom)
    response = client.post("/api/issues/abc/upvote")
    assert response.status_code == 500
    assert "gemini down" in response.json()["detail"]


def test_escalate_returns_drafted_letter(client, monkeypatch):
    _set_issue({"title": "Pothole", "category": "Roads", "description": "Deep", "severity": "High",
                "urgency_score": 80, "upvotes": 9})
    letter = types.SimpleNamespace(model_dump=lambda: {"subject": "Urgent", "body": "Please fix"})
    monkeypatch.setattr(main, "draft_escalation", lambda **kwargs: letter)

    response = client.post("/api/issues/abc/escalate")

    assert response.status_code == 200
    assert response.json() == {"subject": "Urgent", "body": "Please fix"}
