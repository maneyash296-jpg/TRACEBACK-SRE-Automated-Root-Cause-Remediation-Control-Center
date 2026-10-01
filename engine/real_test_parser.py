"""
TRACEBACK Deterministic Pytest & Unittest Output Parser
Extracts collection counts, durations, pass/fail status, and detailed
traceback stack frames mapped to AST components.
"""
import re
from typing import Dict, List, Any, Optional

class RealTestParser:
    @staticmethod
    def parse(
        stdout: str,
        stderr: str,
        exit_code: int,
        duration_seconds: float = 0.0,
        ast_components: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Parses output from pytest or python3 -m unittest.
        """
        combined = (stdout or "") + "\n" + (stderr or "")

        # Try pytest parser first
        if "=== FAILURES ===" in combined or "passed" in combined or "failed" in combined or "pytest" in combined.lower():
            parsed = RealTestParser._parse_pytest(combined, stdout, stderr, exit_code, duration_seconds)
        else:
            parsed = RealTestParser._parse_unittest(combined, stdout, stderr, exit_code, duration_seconds)

        # Cross-reference failure stack frames against AST components if provided
        if ast_components and parsed.get("failures"):
            for fail in parsed["failures"]:
                for frame in fail.get("stack_frames", []):
                    frame_file = frame.get("file", "")
                    frame_func = frame.get("function", "")
                    # Find matching component
                    matched_comp = None
                    for comp in ast_components:
                        comp_file = comp.get("file_path", "")
                        comp_name = comp.get("name", "")
                        if comp_file.endswith(frame_file) or frame_file.endswith(comp_file):
                            if comp_name == frame_func:
                                matched_comp = {
                                    "id": comp.get("id"),
                                    "name": comp.get("name"),
                                    "type": comp.get("type"),
                                    "file": comp.get("file_path"),
                                    "line": comp.get("start_line")
                                }
                                break
                    frame["ast_component"] = matched_comp

        return parsed

    @staticmethod
    def _parse_pytest(output: str, stdout: str, stderr: str, exit_code: int, duration_seconds: float) -> Dict[str, Any]:
        passed = 0
        failed = 0
        skipped = 0
        xfailed = 0

        # Look for pytest summary line e.g. "=== 2 failed, 15 passed, 1 skipped in 1.45s ==="
        summary_match = re.search(r'(=+\s*)(.*?)in\s+([0-9\.]+)s\s*(=+)', output)
        if summary_match:
            stats_part = summary_match.group(2)
            try:
                duration_seconds = float(summary_match.group(3))
            except Exception:
                pass

            p_match = re.search(r'(\d+)\s+passed', stats_part)
            if p_match: passed = int(p_match.group(1))

            f_match = re.search(r'(\d+)\s+failed', stats_part)
            if f_match: failed = int(f_match.group(1))

            s_match = re.search(r'(\d+)\s+skipped', stats_part)
            if s_match: skipped = int(s_match.group(1))

            x_match = re.search(r'(\d+)\s+xfailed', stats_part)
            if x_match: xfailed = int(x_match.group(1))
        else:
            # Fallback regex on whole text
            p_match = re.search(r'(\d+)\s+passed', output)
            if p_match: passed = int(p_match.group(1))
            f_match = re.search(r'(\d+)\s+failed', output)
            if f_match: failed = int(f_match.group(1))

        # Extract failures section
        failures = []
        failure_blocks = re.findall(r'_+ (ERROR|FAIL.*?) _+(.*?)(?=\n_+ |\n=+ short test summary info =+|\n=+ [0-9]+ failed|$)', output, re.DOTALL)
        
        failure_counter = 1
        for title_block, body in failure_blocks:
            test_name = title_block.strip()
            parsed_fail = RealTestParser._parse_single_failure_block(test_name, body, failure_counter)
            failures.append(parsed_fail)
            failure_counter += 1

        total = passed + failed + skipped + xfailed
        if total == 0 and exit_code == 0:
            total = passed

        status = "passed" if exit_code == 0 and failed == 0 else "failed"

        return {
            "status": status,
            "total": total,
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
            "xfailed": xfailed,
            "duration_seconds": round(duration_seconds, 3),
            "exit_code": exit_code,
            "failures": failures,
            "stdout": stdout,
            "stderr": stderr
        }

    @staticmethod
    def _normalize_rel_path(path: str) -> str:
        p = path.replace("\\", "/")
        for marker in ["/services/", "/tests/", "/src/", "/app/", "/models/", "/api/"]:
            if marker in p:
                return marker.strip("/") + "/" + p.split(marker)[1]
        return p.split("/")[-1]

    @staticmethod
    def _parse_single_failure_block(test_name: str, body: str, index: int) -> Dict[str, Any]:
        """
        Extracts exception type, message, stack frames from a pytest failure block.
        """
        # Find last exception line: e.g. "ValueError: Order total cannot be negative: -$15.00"
        lines = [l.strip() for l in body.strip().split("\n") if l.strip()]
        exc_type = "AssertionError"
        exc_msg = "Test assertion failed"

        for line in reversed(lines):
            # Check for "E   ValueError: ..."
            m_e = re.match(r'^E\s+([A-Za-z_][A-Za-z0-9_]*Error|[A-Za-z_][A-Za-z0-9_]*Exception):\s*(.*)', line)
            if m_e:
                exc_type = m_e.group(1)
                exc_msg = m_e.group(2)
                break
            m_std = re.match(r'^([A-Za-z_][A-Za-z0-9_]*Error|[A-Za-z_][A-Za-z0-9_]*Exception):\s*(.*)', line)
            if m_std:
                exc_type = m_std.group(1)
                exc_msg = m_std.group(2)
                break

        # Extract stack frames: e.g. "services/coupon.py:18: in apply_discount" or "File ... line ..."
        stack_frames = []
        frame_matches = re.finditer(r'([a-zA-Z0-9_\-\./\\]+\.py):(\d+):\s+in\s+([a-zA-Z0-9_]+)', body)
        for fm in frame_matches:
            raw_file = fm.group(1).replace("\\", "/")
            stack_frames.append({
                "file": RealTestParser._normalize_rel_path(raw_file),
                "line": int(fm.group(2)),
                "function": fm.group(3),
                "code": ""
            })

        if not stack_frames:
            # Try Python standard traceback format: File "...", line 123, in foo
            std_frames = re.finditer(r'File\s+"([^"]+)",\s+line\s+(\d+),\s+in\s+([a-zA-Z0-9_]+)', body)
            for sf in std_frames:
                raw_file = sf.group(1).replace("\\", "/")
                stack_frames.append({
                    "file": RealTestParser._normalize_rel_path(raw_file),
                    "line": int(sf.group(2)),
                    "function": sf.group(3),
                    "code": ""
                })

        target_file = stack_frames[-1]["file"] if stack_frames else "unknown.py"
        target_line = stack_frames[-1]["line"] if stack_frames else 1
        target_func = stack_frames[-1]["function"] if stack_frames else "test"

        return {
            "id": f"FL-REAL-{index:03d}",
            "test_name": test_name,
            "exception_type": exc_type,
            "message": exc_msg,
            "file": target_file,
            "line": target_line,
            "function": target_func,
            "target": f"{target_file}:{target_line}",
            "traceback": body.strip(),
            "stack_frames": stack_frames
        }

    @staticmethod
    def _parse_unittest(output: str, stdout: str, stderr: str, exit_code: int, duration_seconds: float) -> Dict[str, Any]:
        """
        Parses standard Python unittest output:
        Ran X tests in Ys
        FAILED (failures=A, errors=B)
        """
        ran_match = re.search(r'Ran\s+(\d+)\s+tests?\s+in\s+([0-9\.]+)s', output)
        total = int(ran_match.group(1)) if ran_match else 0
        if ran_match:
            try:
                duration_seconds = float(ran_match.group(2))
            except Exception:
                pass

        failed = 0
        f_match = re.search(r'failures=(\d+)', output)
        if f_match: failed += int(f_match.group(1))
        e_match = re.search(r'errors=(\d+)', output)
        if e_match: failed += int(e_match.group(1))

        if "OK" in output and failed == 0 and total == 0:
            total = output.count(".")

        passed = max(0, total - failed)

        # Extract unittest FAIL / ERROR blocks
        failures = []
        blocks = re.findall(r'(=+\n(?:FAIL|ERROR):\s*(.*?)\n-+.*?\n)(?=(=+\n(?:FAIL|ERROR)|Ran \d+ tests|\Z))', output, re.DOTALL)
        
        idx = 1
        for full_block, header, _ in blocks:
            # e.g. "test_percentage_discount (test_coupon.TestCouponService)"
            test_name = header.strip()
            
            # Find exception
            exc_type = "AssertionError"
            exc_msg = "Assertion failed"
            lines = [l.strip() for l in full_block.strip().split("\n") if l.strip()]
            for l in reversed(lines):
                m = re.match(r'^([A-Za-z_][A-Za-z0-9_]*Error|[A-Za-z_][A-Za-z0-9_]*Exception):\s*(.*)', l)
                if m:
                    exc_type = m.group(1)
                    exc_msg = m.group(2)
                    break

            # Find stack frames
            frames = []
            for fm in re.finditer(r'File\s+"([^"]+)",\s+line\s+(\d+),\s+in\s+([a-zA-Z0-9_]+)', full_block):
                fpath = fm.group(1).replace("\\", "/")
                # strip system python path
                if "/usr/lib/" not in fpath:
                    frames.append({
                        "file": fpath,
                        "line": int(fm.group(2)),
                        "function": fm.group(3),
                        "code": ""
                    })

            target_file = frames[-1]["file"] if frames else "unknown.py"
            target_line = frames[-1]["line"] if frames else 1
            target_func = frames[-1]["function"] if frames else "test"

            failures.append({
                "id": f"FL-REAL-{idx:03d}",
                "test_name": test_name,
                "exception_type": exc_type,
                "message": exc_msg,
                "file": target_file,
                "line": target_line,
                "function": target_func,
                "target": f"{target_file}:{target_line}",
                "traceback": full_block.strip(),
                "stack_frames": frames
            })
            idx += 1

        return {
            "status": "passed" if exit_code == 0 and failed == 0 else "failed",
            "total": total,
            "passed": passed,
            "failed": failed,
            "skipped": 0,
            "xfailed": 0,
            "duration_seconds": round(duration_seconds, 3),
            "exit_code": exit_code,
            "failures": failures,
            "stdout": stdout,
            "stderr": stderr
        }
