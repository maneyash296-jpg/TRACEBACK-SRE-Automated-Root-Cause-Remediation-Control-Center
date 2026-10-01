"""
TRACEBACK Deterministic Traceback Parser
Extracts exception type, message, stack frames, file/line numbers, and maps against scanned components.
Does not let LLM parse when deterministic regex/AST parsing is possible.
"""
import re
import os
from typing import Dict, List, Any, Optional

FRAME_REGEX = re.compile(
    r'File\s+["\'](?P<file>[^"\']+)["\'],\s+line\s+(?P<line>\d+)(?:,\s+in\s+(?P<func>[^\n\r]+))?'
)
EXCEPTION_REGEX = re.compile(
    r'^(?P<type>[A-Za-z0-9_]+Error|[A-Za-z0-9_]+Exception|[A-Za-z0-9_]+AssertionError):\s*(?P<msg>.*)$',
    re.MULTILINE
)

class TracebackParser:
    def __init__(self, project_path: str = ""):
        self.project_path = os.path.abspath(project_path) if project_path else ""

    def parse(self, raw_trace: str) -> Dict[str, Any]:
        """Parse raw Python traceback string deterministically."""
        frames = []
        raw_lines = raw_trace.splitlines()

        for i, line in enumerate(raw_lines):
            match = FRAME_REGEX.search(line)
            if match:
                f_path = match.group("file").strip()
                f_line = int(match.group("line"))
                f_func = match.group("func").strip() if match.group("func") else "unknown"

                # Check if next line contains code snippet
                snippet = ""
                if i + 1 < len(raw_lines):
                    next_l = raw_lines[i + 1].strip()
                    if not next_l.startswith("File ") and not EXCEPTION_REGEX.match(next_l):
                        snippet = next_l

                # Normalize relative path if inside project
                rel_path = f_path
                if self.project_path and os.path.isabs(f_path):
                    try:
                        rel_path = os.path.relpath(f_path, self.project_path)
                    except ValueError:
                        rel_path = f_path

                frames.append({
                    "raw_file": f_path,
                    "file": rel_path,
                    "line": f_line,
                    "function": f_func,
                    "code_snippet": snippet,
                    "is_project_code": not (
                        "/site-packages/" in f_path or
                        "/python3." in f_path or
                        f_path.startswith("<") or
                        "unittest" in f_path or
                        "pytest" in f_path
                    )
                })

        # Locate exception type and message
        error_type = "UnhandledException"
        error_msg = ""
        exc_match = EXCEPTION_REGEX.search(raw_trace)
        if exc_match:
            error_type = exc_match.group("type")
            error_msg = exc_match.group("msg").strip()
        else:
            # Fallback: look for last non-empty line
            for l in reversed(raw_lines):
                s = l.strip()
                if s and not s.startswith("File ") and not s.startswith("^"):
                    if ":" in s:
                        parts = s.split(":", 1)
                        error_type = parts[0].strip()
                        error_msg = parts[1].strip()
                    else:
                        error_msg = s
                    break

        # Identify deepest project frame (Crash site)
        project_frames = [f for f in frames if f["is_project_code"]]
        crash_frame = project_frames[-1] if project_frames else (frames[-1] if frames else None)

        # Detect HTTP endpoint or trigger event if present
        trigger_event = None
        http_match = re.search(r'(POST|GET|PUT|DELETE)\s+([/\w\-]+)', raw_trace)
        if http_match:
            trigger_event = f"{http_match.group(1)} {http_match.group(2)}"

        return {
            "error_type": error_type,
            "message": error_msg,
            "frames": frames,
            "crash_frame": crash_frame,
            "trigger_event": trigger_event,
            "raw": raw_trace
        }
