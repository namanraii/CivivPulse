"""Offline tests for agents.duplicate_detector (Gemini client is stubbed).

Run from ``backend/``: ``python -m pytest tests``.
"""
import json
import os
import sys
import types
from unittest.mock import MagicMock

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("GEMINI_API_KEY", "test-key")

from agents import duplicate_detector as dd  # noqa: E402

EXISTING = [
    {"id": "abc123", "title": "Pothole on MG Road", "description": "Deep pothole"},
    {"id": "def456", "title": "Broken streetlight", "description": "Dark corner"},
]


@pytest.fixture()
def fake_model(monkeypatch):
    client = MagicMock(name="genai-client")
    monkeypatch.setattr(dd, "client", client)

    def respond(payload):
        client.models.generate_content.return_value = types.SimpleNamespace(text=json.dumps(payload))

    return respond


def test_no_existing_issues_skips_model(monkeypatch):
    client = MagicMock(name="genai-client")
    monkeypatch.setattr(dd, "client", client)
    result = dd.check_duplicate("t", "d", [])
    assert result.is_duplicate is False
    assert result.duplicate_of_id is None
    client.models.generate_content.assert_not_called()


def test_duplicate_of_known_id_is_kept(fake_model):
    fake_model({"is_duplicate": True, "duplicate_of_id": "abc123", "reasoning": "same pothole"})
    result = dd.check_duplicate("Pothole", "MG Road", EXISTING)
    assert result.is_duplicate is True
    assert result.duplicate_of_id == "abc123"
    assert result.reasoning == "same pothole"


def test_known_id_with_whitespace_is_normalised(fake_model):
    fake_model({"is_duplicate": True, "duplicate_of_id": " def456\n", "reasoning": "same light"})
    result = dd.check_duplicate("Light", "Dark", EXISTING)
    assert result.is_duplicate is True
    assert result.duplicate_of_id == "def456"


@pytest.mark.parametrize("bad_id", ["zzz999", "", None])
def test_duplicate_with_unknown_or_missing_id_is_downgraded(fake_model, bad_id):
    fake_model({"is_duplicate": True, "duplicate_of_id": bad_id, "reasoning": "looks similar"})
    result = dd.check_duplicate("Pothole", "MG Road", EXISTING)
    assert result.is_duplicate is False
    assert result.duplicate_of_id is None
    assert "known recent issue" in result.reasoning


def test_non_duplicate_drops_stray_id(fake_model):
    fake_model({"is_duplicate": False, "duplicate_of_id": "abc123", "reasoning": "different street"})
    result = dd.check_duplicate("Pothole", "Other road", EXISTING)
    assert result.is_duplicate is False
    assert result.duplicate_of_id is None
    assert result.reasoning == "different street"
