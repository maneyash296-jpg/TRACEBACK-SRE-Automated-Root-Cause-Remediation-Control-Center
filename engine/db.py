"""
TRACEBACK SQLite Database Layer
Implements tables for projects, components, edges, failures, investigations,
repro_tests, fixes, and test_runs with foreign keys.
"""
import sqlite3
import os
import json
import time
from typing import Dict, List, Any, Optional

DB_PATH = os.path.abspath(os.environ.get("TRACEBACK_DB", "traceback.db"))

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.executescript("""
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        created_at REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS components (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        name TEXT NOT NULL,
        file TEXT NOT NULL,
        line_start INTEGER NOT NULL,
        line_end INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS edges (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS failures (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        source TEXT NOT NULL,
        error_type TEXT NOT NULL,
        message TEXT NOT NULL,
        trace TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS investigations (
        id TEXT PRIMARY KEY,
        failure_id TEXT NOT NULL,
        chain_json TEXT NOT NULL,
        confidence_label TEXT NOT NULL,
        FOREIGN KEY (failure_id) REFERENCES failures(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS repro_tests (
        id TEXT PRIMARY KEY,
        failure_id TEXT NOT NULL,
        code TEXT NOT NULL,
        reproduced INTEGER NOT NULL,
        FOREIGN KEY (failure_id) REFERENCES failures(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS fixes (
        id TEXT PRIMARY KEY,
        failure_id TEXT NOT NULL,
        diff TEXT NOT NULL,
        approved INTEGER NOT NULL DEFAULT 0,
        verified INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (failure_id) REFERENCES failures(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS test_runs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        fix_id TEXT,
        total INTEGER NOT NULL,
        passed INTEGER NOT NULL,
        failed INTEGER NOT NULL,
        created_at REAL NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (fix_id) REFERENCES fixes(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_components_project ON components(project_id);
    CREATE INDEX IF NOT EXISTS idx_edges_project ON edges(project_id);
    CREATE INDEX IF NOT EXISTS idx_failures_project ON failures(project_id);
    """)

    conn.commit()
    conn.close()

def reset_database():
    """Remove all stored projects, components, edges, failures, investigations, fixes, and test runs."""
    conn = get_connection()
    with conn:
        conn.execute("DELETE FROM test_runs;")
        conn.execute("DELETE FROM fixes;")
        conn.execute("DELETE FROM repro_tests;")
        conn.execute("DELETE FROM investigations;")
        conn.execute("DELETE FROM failures;")
        conn.execute("DELETE FROM edges;")
        conn.execute("DELETE FROM components;")
        conn.execute("DELETE FROM projects;")
    conn.close()

# Database Helper Functions
def save_project(project_id: str, name: str, path: str):
    conn = get_connection()
    with conn:
        conn.execute("INSERT OR REPLACE INTO projects (id, name, path, created_at) VALUES (?, ?, ?, ?)",
                     (project_id, name, path, time.time()))
    conn.close()

def get_project(project_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def get_components_by_project(project_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute("SELECT * FROM components WHERE project_id = ?", (project_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def save_components_and_edges(project_id: str, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]):
    conn = get_connection()
    with conn:
        conn.execute("DELETE FROM edges WHERE project_id = ?", (project_id,))
        conn.execute("DELETE FROM components WHERE project_id = ?", (project_id,))
        for n in nodes:
            conn.execute(
                "INSERT OR REPLACE INTO components (id, project_id, kind, name, file, line_start, line_end) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (n["id"], project_id, n.get("kind", "function"), n["name"], n.get("file", ""), n.get("line_start", 1), n.get("line_end", 1))
            )
        for e in edges:
            conn.execute(
                "INSERT OR REPLACE INTO edges (id, project_id, source_id, target_id, kind) VALUES (?, ?, ?, ?, ?)",
                (e["id"], project_id, e["source_id"], e["target_id"], e["kind"])
            )
    conn.close()

def save_failure(failure_id: str, project_id: str, source: str, error_type: str, message: str, trace: str, status: str = "FAILED"):
    conn = get_connection()
    with conn:
        conn.execute(
            "INSERT OR REPLACE INTO failures (id, project_id, source, error_type, message, trace, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (failure_id, project_id, source, error_type, message, trace, status)
        )
    conn.close()

def get_failures_by_project(project_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute("SELECT * FROM failures WHERE project_id = ?", (project_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_failure(failure_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM failures WHERE id = ?", (failure_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def save_investigation(inv_id: str, failure_id: str, chain: Dict[str, Any], confidence: str):
    conn = get_connection()
    with conn:
        conn.execute(
            "INSERT OR REPLACE INTO investigations (id, failure_id, chain_json, confidence_label) VALUES (?, ?, ?, ?)",
            (inv_id, failure_id, json.dumps(chain), confidence)
        )
    conn.close()

def get_investigation(failure_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM investigations WHERE failure_id = ? ORDER BY id DESC LIMIT 1", (failure_id,)).fetchone()
    conn.close()
    if row:
        res = dict(row)
        res["chain"] = json.loads(res["chain_json"])
        return res
    return None

def save_repro_test(repro_id: str, failure_id: str, code: str, reproduced: bool):
    conn = get_connection()
    with conn:
        conn.execute(
            "INSERT OR REPLACE INTO repro_tests (id, failure_id, code, reproduced) VALUES (?, ?, ?, ?)",
            (repro_id, failure_id, code, 1 if reproduced else 0)
        )
    conn.close()

def get_repro_test(failure_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM repro_tests WHERE failure_id = ? ORDER BY id DESC LIMIT 1", (failure_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def save_fix(fix_id: str, failure_id: str, diff: str, approved: bool = False, verified: bool = False):
    conn = get_connection()
    with conn:
        conn.execute(
            "INSERT OR REPLACE INTO fixes (id, failure_id, diff, approved, verified) VALUES (?, ?, ?, ?, ?)",
            (fix_id, failure_id, diff, 1 if approved else 0, 1 if verified else 0)
        )
    conn.close()

def approve_fix(fix_id: str):
    conn = get_connection()
    with conn:
        conn.execute("UPDATE fixes SET approved = 1 WHERE id = ?", (fix_id,))
    conn.close()

def set_fix_verified(fix_id: str, verified: bool):
    conn = get_connection()
    with conn:
        conn.execute("UPDATE fixes SET verified = ? WHERE id = ?", (1 if verified else 0, fix_id))
    conn.close()

def get_fix(fix_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM fixes WHERE id = ?", (fix_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def get_fix_by_failure(failure_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM fixes WHERE failure_id = ? ORDER BY id DESC LIMIT 1", (failure_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def record_test_run(run_id: str, project_id: str, fix_id: Optional[str], total: int, passed: int, failed: int):
    conn = get_connection()
    # Check if project_id exists; if not, create minimal record
    with conn:
        p = conn.execute("SELECT id FROM projects WHERE id = ?", (project_id,)).fetchone()
        if not p:
            conn.execute("INSERT OR IGNORE INTO projects (id, name, path, created_at) VALUES (?, ?, ?, ?)",
                         (project_id, project_id, "", time.time()))
        # Check if fix_id exists; if not, set to None
        actual_fix_id = fix_id
        if fix_id:
            f = conn.execute("SELECT id FROM fixes WHERE id = ?", (fix_id,)).fetchone()
            if not f:
                actual_fix_id = None
        conn.execute(
            "INSERT INTO test_runs (id, project_id, fix_id, total, passed, failed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (run_id, project_id, actual_fix_id, total, passed, failed, time.time())
        )
    conn.close()
