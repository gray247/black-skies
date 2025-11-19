# services/tools/check_startup.py
"""
Dev helper: diagnostic script to import the backend module and surface import/startup tracebacks.
Safe to remove. Run with: python services/tools/check_startup.py
"""
import importlib
import pathlib
import re
import sys
import traceback

_repo_root = pathlib.Path(__file__).resolve().parents[2]
_repo_root_str = str(_repo_root)
if _repo_root_str not in sys.path:
    sys.path.insert(0, _repo_root_str)
    print(">>> ADDED_TO_SYSPATH:", _repo_root_str)

MODULE = "services.src.blackskies.services.app"


def find_env_keys_in_source(mod_path: str):
    try:
        text = pathlib.Path(mod_path).read_text(encoding="utf8")
    except Exception:
        return []
    keys = set()
    for pattern in [
        r"os\.environ\[['\"]([^'\"]+)['\"]\]",
        r"os\.environ\.get\(\s*['\"]([^'\"]+)['\"]",
        r"os\.getenv\(\s*['\"]([^'\"]+)['\"]",
    ]:
        for m in re.finditer(pattern, text):
            keys.add(m.group(1))
    return sorted(keys)


def ensure_importable():
    print(">>> DIAGNOSTIC: importing", MODULE)
    try:
        module = importlib.import_module(MODULE)
        print(">>> IMPORT OK:", getattr(module, "__file__", "<unknown>"))
        return module
    except (ModuleNotFoundError, ImportError) as exc:
        repo_root = pathlib.Path(__file__).resolve().parents[2]
        extra_paths = [str(repo_root), str(repo_root / "services" / "src")]
        print(
            ">>> IMPORT FAILED:",
            exc,
            "; adding repo root and services/src to sys.path and retrying...",
        )
        added = []
        for path in extra_paths:
            if path not in sys.path:
                sys.path.insert(0, path)
                added.append(path)
        print(">>> PATHS ADDED:", added)
        try:
            module = importlib.import_module(MODULE)
            print(">>> RETRY IMPORT OK:", getattr(module, "__file__", "<unknown>"))
            return module
        except Exception:
            print(">>> FINAL IMPORT FAILED — traceback follows:")
            traceback.print_exc()
            sys.exit(2)
    except Exception:
        print(">>> IMPORT FAILED with unexpected error:")
        traceback.print_exc()
        sys.exit(2)


def main():
    module = ensure_importable()

    mod_file = getattr(module, "__file__", None)
    if mod_file:
        env_keys = find_env_keys_in_source(mod_file)
        if env_keys:
            print(">>> ENV VARS referenced in module source (guess):", env_keys)
        else:
            print(">>> No obvious env var references found by heuristic scan.")
    else:
        print(">>> Module file path not found; skipping env var scan.")

    if hasattr(module, "create_app"):
        print(">>> create_app found; attempting to call create_app() ...")
        try:
            app = module.create_app()
            print(">>> create_app() returned:", type(app))
        except Exception:
            print(">>> create_app() RAISED — traceback follows:")
            traceback.print_exc()
            sys.exit(3)
    elif hasattr(module, "app"):
        print(">>> module exports 'app' object:", type(module.app))
    else:
        print(">>> No create_app() or app found in module.")

    print(">>> DIAGNOSTIC COMPLETE — if this finished without tracebacks, start uvicorn normally.")


if __name__ == "__main__":
    main()
