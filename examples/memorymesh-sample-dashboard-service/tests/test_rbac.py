import unittest

from app.auth import get_user
from app.dashboard import can_access_dashboard, dashboard_message


class DashboardRBACTest(unittest.TestCase):
    def test_admin_can_access_dashboard(self):
        self.assertTrue(can_access_dashboard(get_user("admin@example.com")))
        self.assertEqual(dashboard_message(get_user("admin@example.com")), "dashboard:admin")

    def test_viewer_cannot_access_dashboard(self):
        self.assertFalse(can_access_dashboard(get_user("viewer@example.com")))
        self.assertEqual(dashboard_message(get_user("viewer@example.com")), "redirect:/login")

    def test_anonymous_user_cannot_access_dashboard(self):
        self.assertFalse(can_access_dashboard(None))
        self.assertEqual(dashboard_message(None), "redirect:/login")
