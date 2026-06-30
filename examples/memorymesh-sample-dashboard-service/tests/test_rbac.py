from app.auth import get_user
from app.dashboard import can_access_dashboard, dashboard_message


def test_admin_can_access_dashboard():
    assert can_access_dashboard(get_user("admin@example.com")) is True
    assert dashboard_message(get_user("admin@example.com")) == "dashboard:admin"


def test_viewer_cannot_access_dashboard():
    assert can_access_dashboard(get_user("viewer@example.com")) is False
    assert dashboard_message(get_user("viewer@example.com")) == "redirect:/login"


def test_anonymous_user_cannot_access_dashboard():
    assert can_access_dashboard(None) is False
    assert dashboard_message(None) == "redirect:/login"
