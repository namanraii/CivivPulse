from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_score_issue():
    # Test a high priority issue
    print("Testing High Priority Issue...")
    high_priority_payload = {
        "title": "Broken Streetlight at Intersection",
        "category": "Safety",
        "description": "The main streetlight is out, making the busy intersection very dark and dangerous at night.",
        "severity": "High",
        "upvotes": 50
    }
    response1 = client.post("/api/issues/score", json=high_priority_payload)
    print("Status:", response1.status_code)
    print("Result:", response1.json())
    print("-" * 40)

    # Test a low priority issue
    print("Testing Low Priority Issue...")
    low_priority_payload = {
        "title": "Small Graffiti on Park Bench",
        "category": "Cosmetic",
        "description": "Someone drew a small tag on the back of a wooden bench.",
        "severity": "Low",
        "upvotes": 2
    }
    response2 = client.post("/api/issues/score", json=low_priority_payload)
    print("Status:", response2.status_code)
    print("Result:", response2.json())

if __name__ == "__main__":
    test_score_issue()
