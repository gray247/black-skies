# Black Skies Services

FastAPI microservices backing the Black Skies desktop client.

## Tooling

Configuration for linting and tests lives in `pyproject.toml`. Run commands from this directory (or pass the config path explicitly) so shared options are respected:

```bash
cd services
pytest
black src tests
```

When invoking tools from elsewhere in the repo, point them at this configuration explicitly, e.g. `pytest -c services/pyproject.toml` or `black --config services/pyproject.toml services/src`.
