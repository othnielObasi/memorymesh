from __future__ import annotations

USERS = {
    "admin@example.com": {"email": "admin@example.com", "role": "admin"},
    "viewer@example.com": {"email": "viewer@example.com", "role": "viewer"},
}


def get_user(email: str | None) -> dict[str, str] | None:
    if not email:
        return None
    return USERS.get(email)
