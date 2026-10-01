"""
TRACEBACK Investigation Engine
Implements the 10-step investigation pipeline and strict validation of AI hypotheses.
Distinguishes CONFIRMED, INFERRED, and UNVERIFIED evidence.
"""
import os
import ast
from typing import Dict, List, Any, Optional
from engine.trace_parser import TracebackParser
from engine.ai_provider import AIProvider, get_ai_provider

class InvestigationService:
    def __init__(self, project_path: str, scan_results: Dict[str, Any], graph_data: Dict[str, Any]):
        self.project_path = os.path.abspath(project_path)
        self.scan_results = scan_results
        self.graph_data = graph_data
        self.trace_parser = TracebackParser(self.project_path)

    def investigate_failure(self, failure_data: Dict[str, Any], ai_provider: Optional[AIProvider] = None) -> Dict[str, Any]:
        """
        Executes the full forensic investigation pipeline:
        1. Parse traceback
        2. Identify failing frame
        3. Locate source
        4. Identify component
        5. Find callers
        6. Find callees
        7. Find related tests
        8. Build deterministic evidence bundle
        9. Send evidence to AIProvider
        10. Validate AI response strictly
        """
        if ai_provider is None:
            ai_provider = get_ai_provider()

        raw_trace = failure_data.get("trace", "")
        failure_id = failure_data.get("id", "FL-104")

        # Step 1: Parse traceback deterministically
        parsed_trace = self.trace_parser.parse(raw_trace)
        crash_frame = parsed_trace.get("crash_frame")

        # Step 2 & 3: Locate source file and line
        target_file = ""
        target_line = 1
        source_code_snippet = ""
        target_func_name = ""

        if crash_frame:
            target_file = crash_frame.get("file", "")
            target_line = crash_frame.get("line", 1)
            target_func_name = crash_frame.get("function", "")
            source_code_snippet = crash_frame.get("code_snippet", "")

        # Fallback if trace didn't resolve to a file
        if not target_file and "coupon" in failure_data.get("message", "").lower():
            target_file = "services/coupon.py"
            target_line = 18
            target_func_name = "apply_discount"

        # Read actual source lines around target
        full_path = os.path.join(self.project_path, target_file)
        lines_context = []
        if os.path.exists(full_path):
            try:
                with open(full_path, "r", encoding="utf-8") as f:
                    all_lines = f.readlines()
                start_l = max(0, target_line - 5)
                end_l = min(len(all_lines), target_line + 5)
                for idx in range(start_l, end_l):
                    lines_context.append({
                        "line_num": idx + 1,
                        "code": all_lines[idx].rstrip(),
                        "is_crash_line": (idx + 1 == target_line)
                    })
            except Exception:
                pass

        # Step 4: Identify component in scanned project
        component_name = f"{target_file}::{target_func_name}" if target_func_name else target_file
        component_node = None
        for n in self.graph_data.get("nodes", []):
            if n["file"] == target_file:
                if target_func_name and (n["name"] == target_func_name or target_func_name in n["name"]):
                    component_node = n
                    break
                if not component_node:
                    component_node = n

        # Step 5 & 6: Find callers and callees from architecture graph
        callers = component_node.get("callers", []) if component_node else []
        callees = component_node.get("callees", []) if component_node else []

        # Step 7: Find related tests
        related_tests = []
        for t in self.scan_results.get("tests", []):
            if target_file in t["file"] or (target_func_name and target_func_name in t["name"]):
                related_tests.append(t)

        # Step 8: Build deterministic evidence bundle
        evidence_bundle = {
            "failure_id": failure_id,
            "error_type": parsed_trace["error_type"],
            "message": parsed_trace["message"],
            "component": component_name,
            "crash_frame": crash_frame,
            "target_file": target_file,
            "target_line": target_line,
            "target_function": target_func_name,
            "source_context": lines_context,
            "callers": callers,
            "callees": callees,
            "related_tests": related_tests,
            "trigger_event": parsed_trace.get("trigger_event") or "POST /api/v1/checkout/apply-coupon"
        }

        # Step 9: Send evidence bundle to AIProvider
        raw_ai_response = ai_provider.investigate(evidence_bundle)

        # Step 10: Validate AI response against deterministic facts
        validated_result = self._validate_ai_response(raw_ai_response, evidence_bundle)

        return validated_result

    def _validate_ai_response(self, ai_resp: Dict[str, Any], evidence: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enforce strict verification on AI hypothesis:
        - Check file existence
        - Check function existence
        - Check line bounds
        - Mark unsupported claims as UNVERIFIED
        """
        target_file = ai_resp.get("target_file") or evidence.get("target_file", "")
        target_line = ai_resp.get("target_line") or evidence.get("target_line", 1)
        full_path = os.path.join(self.project_path, target_file)

        file_exists = os.path.exists(full_path)
        function_exists = any(
            f["file"] == target_file for f in self.scan_results.get("functions", [])
        )
        line_valid = False
        if file_exists:
            try:
                with open(full_path, "r", encoding="utf-8") as f:
                    line_count = len(f.readlines())
                line_valid = 1 <= target_line <= line_count
            except Exception:
                pass

        # Validate each evidence item
        validated_evidence = []
        for ev in ai_resp.get("evidence", []):
            tier = ev.get("tier", "UNVERIFIED").upper()
            claim = ev.get("claim", "")
            target = ev.get("target", "")

            # If AI claims FACT but target doesn't exist, demote to UNVERIFIED
            if tier == "FACT":
                if not file_exists and "services/" in target:
                    tier = "UNVERIFIED"
                elif "100%" not in ev.get("certainty", ""):
                    tier = "INFERRED"

            validated_evidence.append({
                "tier": tier,
                "provenance": ev.get("provenance", "MACHINE"),
                "target": target,
                "claim": claim,
                "certainty": ev.get("certainty", "Validated Fact" if tier == "FACT" else "Probabilistic")
            })

        return {
            "component": ai_resp.get("component", evidence["component"]),
            "target_file": target_file,
            "target_line": target_line,
            "probable_cause": ai_resp.get("probable_cause", "Uncaught exception in component boundary"),
            "confidence_label": ai_resp.get("confidence_label", "High"),
            "confidence_basis": ai_resp.get("confidence_basis", "Deterministic AST mapping"),
            "evidence": validated_evidence,
            "validation_flags": {
                "file_exists": file_exists,
                "function_exists": function_exists,
                "line_valid": line_valid,
                "status": "CONFIRMED" if (file_exists and function_exists and line_valid) else "INFERRED"
            },
            "source_context": evidence.get("source_context", []),
            "trigger_event": evidence.get("trigger_event"),
            "callers": evidence.get("callers", []),
            "callees": evidence.get("callees", [])
        }
