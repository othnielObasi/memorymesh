# MemoryMesh sample dashboard service

This intentionally small Python repo is used by the real coding-agent demo.
The starting bug is in `app/dashboard.py`: any authenticated user can access the admin dashboard. The demo task is to recover context after a simulated session wipe, patch the bug, and prove the fix by running tests.

Run locally:

```bash
python -m pytest -q
```
