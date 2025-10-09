# RELEASE.md  Black Skies

## Prerequisites
- Target version: `v1.0.0-rc1`
- Python 3.11+
- Local wheel cache populated under `vendor/wheels/`
- Clean `git status`

## Release Checklist
1. Update `pyproject.toml` version and `services/src/blackskies/services/app.py::SERVICE_VERSION`.
2. Update `CHANGELOG.md` (if applicable) and ensure docs are current.
3. Run test suite: `python -m pytest -q`.
4. Build wheels/sdist offline:
   ```bash
   python -m build --wheel --no-isolation
   ```
5. Verify artifacts under `dist/` (check wheel metadata for correct version).
6. Create a Git tag `vX.Y.Z` and push tag + main branch.
7. Publish artifacts to your index or attach to GitHub release.
8. Announce release; close milestone.

## Rollback
- Revert to previous tag `git checkout vX.Y.(Z-1)`.
- Rebuild artifacts and redeploy.
