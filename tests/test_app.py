import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_root_redirect():
    """Test that root path redirects to index.html"""
    response = client.get("/")
    assert response.status_code == 307 or response.status_code == 200
    if response.status_code == 307:
        assert response.headers["location"] == "/static/index.html"

def test_get_activities():
    """Test getting all activities"""
    response = client.get("/activities")
    assert response.status_code == 200
    activities = response.json()
    assert isinstance(activities, dict)
    assert len(activities) > 0
    
    # Test structure of an activity
    first_activity = next(iter(activities.values()))
    assert "description" in first_activity
    assert "schedule" in first_activity
    assert "max_participants" in first_activity
    assert "participants" in first_activity
    assert isinstance(first_activity["participants"], list)

def test_signup_for_activity():
    """Test signing up for an activity"""
    # Get first activity name
    activities = client.get("/activities").json()
    activity_name = next(iter(activities.keys()))
    
    # Test successful signup
    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": "test@mergington.edu"}
    )
    assert response.status_code == 200
    assert "message" in response.json()
    
    # Test duplicate signup
    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": "test@mergington.edu"}
    )
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"]

def test_signup_nonexistent_activity():
    """Test signing up for a non-existent activity"""
    response = client.post(
        "/activities/nonexistent/signup",
        params={"email": "test@mergington.edu"}
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]

def test_unregister_from_activity():
    """Test unregistering from an activity"""
    # First sign up for an activity
    activities = client.get("/activities").json()
    activity_name = next(iter(activities.keys()))
    email = "unregister_test@mergington.edu"
    
    # Sign up first
    client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email}
    )
    
    # Test successful unregistration
    response = client.post(
        f"/activities/{activity_name}/unregister",
        params={"email": email}
    )
    assert response.status_code == 200
    assert "message" in response.json()
    
    # Test unregistering when not registered
    response = client.post(
        f"/activities/{activity_name}/unregister",
        params={"email": email}
    )
    assert response.status_code == 400
    assert "not registered" in response.json()["detail"]

def test_unregister_nonexistent_activity():
    """Test unregistering from a non-existent activity"""
    response = client.post(
        "/activities/nonexistent/unregister",
        params={"email": "test@mergington.edu"}
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]