from __future__ import annotations


def can_access_dashboard(user: dict[str, str] | None) -> bool:
    """Return whether the current user can open the admin dashboard.

    BUG: this currently allows any authenticated user. The MemoryMesh demo agent
    must patch this function after recovering context from memory.
    """
    return bool(user)


def dashboard_message(user: dict[str, str] | None) -> str:
    if not can_access_dashboard(user):
        return "redirect:/login"
    return "dashboard:admin"
