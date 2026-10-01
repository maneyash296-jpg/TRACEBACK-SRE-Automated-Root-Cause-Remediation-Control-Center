"""
TRACEBACK Context Selector for Large Projects
Intelligently prunes and extracts only the relevant code around failure stack frames:
failing function + callers + callees + related test + config manifests.
Prevents massive repositories from overwhelming LLM context windows.
"""
import os
from typing import Dict, List, Any, Optional

MAX_FILE_LINES = 120
MAX_SNIPPET_RADIUS = 30

class ContextSelector:
    def __init__(self, project_path: str, scan_results: Optional[Dict[str, Any]] = None):
        self.project_path = os.path.abspath(project_path)
        self.scan_results = scan_results or {}
        self.functions = {f["id"]: f for f in self.scan_results.get("functions", [])}
        self.classes = {c["id"]: c for c in self.scan_results.get("classes", [])}

    def assemble_failure_context(self, failure: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assembles a compact, high-signal evidence context bundle for the AI Provider.
        """
        target_file = failure.get("file", "")
        target_line = failure.get("line", 1)
        target_func_name = failure.get("function", "")

        # 1. Source snippet around the failure line
        failing_snippet = self._extract_snippet(target_file, target_line, radius=MAX_SNIPPET_RADIUS)

        # 2. Extract Caller / Callee functions from call graph
        callers = []
        callees = []
        for edge in self.scan_results.get("edges", []):
            if edge.get("target") == target_func_name or target_func_name in edge.get("target", ""):
                callers.append(edge.get("source"))
            elif edge.get("source") == target_func_name or target_func_name in edge.get("source", ""):
                callees.append(edge.get("target"))

        # 3. Read relevant configuration
        configs = {}
        for cfg_name in ["pyproject.toml", "requirements.txt", "pytest.ini"]:
            p = os.path.join(self.project_path, cfg_name)
            if os.path.exists(p):
                try:
                    with open(p, "r", encoding="utf-8", errors="ignore") as f:
                        configs[cfg_name] = f.read(1024)
                except Exception:
                    pass

        return {
            "failure_id": failure.get("id"),
            "test_name": failure.get("test_name"),
            "exception_type": failure.get("exception_type"),
            "exception_message": failure.get("message"),
            "target_file": target_file,
            "target_line": target_line,
            "target_function": target_func_name,
            "failing_snippet": failing_snippet,
            "callers": callers[:3],
            "callees": callees[:3],
            "configs": configs,
            "total_context_tokens_estimate": len(failing_snippet) // 4 + 200
        }

    def _extract_snippet(self, rel_file: str, line_no: int, radius: int = 25) -> str:
        full_path = os.path.join(self.project_path, rel_file)
        if not os.path.exists(full_path):
            return ""

        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()

            start = max(0, line_no - radius - 1)
            end = min(len(lines), line_no + radius)

            snippet = []
            for i in range(start, end):
                prefix = ">> " if (i + 1) == line_no else "   "
                snippet.append(f"{prefix}{i + 1:4d} | {lines[i].rstrip()}")

            return "\n".join(snippet)
        except Exception:
            return ""
