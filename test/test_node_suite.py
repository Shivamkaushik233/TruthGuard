"""Compatibility entry point for the requested pytest command.

The application and its tests are JavaScript. This executes the same real Node
suite; the Python bridge is not counted as an additional functional test.
"""
import pathlib
import shutil
import subprocess

def test_javascript_suite():
    root = pathlib.Path(__file__).resolve().parents[1]
    tests = sorted(str(p) for p in (root / "test").glob("*.test.js"))
    completed = subprocess.run(
        [shutil.which("node") or "node", "--test", "--test-concurrency=1", *tests],
        cwd=root, capture_output=True, text=True, encoding="utf-8", errors="replace",
        timeout=180,
    )
    assert completed.returncode == 0, completed.stdout + completed.stderr
