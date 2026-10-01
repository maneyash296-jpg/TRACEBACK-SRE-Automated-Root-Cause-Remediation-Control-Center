"""
TRACEBACK Deterministic Test Runner
Executes tests in controlled sandbox environment.
Captures test results, timings, stdout/stderr, and structured failures.
"""
import os
import sys
import time
import subprocess
import json
import traceback
from typing import Dict, List, Any, Optional

class TestRunner:
    def __init__(self, project_path: str):
        self.project_path = os.path.abspath(project_path)

    def run_suite(self, test_file: Optional[str] = None, timeout_seconds: int = 15) -> Dict[str, Any]:
        """
        Runs Python tests using python's unittest discovery runner.
        Returns structured results without AI hallucination.
        """
        start_time = time.time()
        
        # Test runner runner script executed via subprocess in project directory
        runner_code = """
import sys
import os
import time
import unittest
import json
import traceback

sys.path.insert(0, os.getcwd())

suite = unittest.TestSuite()
loader = unittest.TestLoader()

target = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] else "tests"

if os.path.isfile(target):
    # Single file
    mod_name = os.path.splitext(target)[0].replace("/", ".").replace("\\\\", ".")
    suite = loader.loadTestsFromName(mod_name)
else:
    # Directory discovery
    suite = loader.discover(target, pattern="test_*.py")

results = []
failures_list = []

class CustomResult(unittest.TestResult):
    def __init__(self):
        super().__init__()
        self.test_details = []

    def addSuccess(self, test):
        super().addSuccess(test)
        self.test_details.append({
            "test": str(test),
            "status": "PASSED"
        })

    def addFailure(self, test, err):
        super().addFailure(test, err)
        exc_type, exc_val, tb = err
        tb_str = "".join(traceback.format_exception(exc_type, exc_val, tb))
        self.test_details.append({
            "test": str(test),
            "status": "FAILED",
            "error_type": exc_type.__name__ if exc_type else "AssertionError",
            "message": str(exc_val),
            "traceback": tb_str
        })

    def addError(self, test, err):
        super().addError(test, err)
        exc_type, exc_val, tb = err
        tb_str = "".join(traceback.format_exception(exc_type, exc_val, tb))
        self.test_details.append({
            "test": str(test),
            "status": "FAILED",
            "error_type": exc_type.__name__ if exc_type else "Error",
            "message": str(exc_val),
            "traceback": tb_str
        })

runner_result = CustomResult()
t0 = time.time()
suite.run(runner_result)
duration = round(time.time() - t0, 3)

output = {
    "total": runner_result.testsRun,
    "passed": runner_result.testsRun - len(runner_result.failures) - len(runner_result.errors),
    "failed": len(runner_result.failures) + len(runner_result.errors),
    "duration": duration,
    "tests": runner_result.test_details
}

print("---TRACEBACK_RESULT_JSON---")
print(json.dumps(output))
"""

        cmd = [sys.executable, "-c", runner_code, test_file or "tests"]
        env = os.environ.copy()
        env["PYTHONPATH"] = f"{self.project_path}:{env.get('PYTHONPATH', '')}"

        try:
            proc = subprocess.run(
                cmd,
                cwd=self.project_path,
                capture_output=True,
                text=True,
                timeout=timeout_seconds,
                env=env
            )
            raw_stdout = proc.stdout
            raw_stderr = proc.stderr
            elapsed = round(time.time() - start_time, 3)

            # Extract JSON payload
            structured_data = None
            if "---TRACEBACK_RESULT_JSON---" in raw_stdout:
                parts = raw_stdout.split("---TRACEBACK_RESULT_JSON---")
                try:
                    structured_data = json.loads(parts[1].strip())
                except json.JSONDecodeError:
                    pass

            if not structured_data:
                # Fallback if discovery found 0 or crashed
                return {
                    "total": 0,
                    "passed": 0,
                    "failed": 1 if proc.returncode != 0 else 0,
                    "duration": elapsed,
                    "stdout": raw_stdout,
                    "stderr": raw_stderr,
                    "tests": [],
                    "exit_code": proc.returncode
                }

            structured_data["stdout"] = raw_stdout
            structured_data["stderr"] = raw_stderr
            structured_data["exit_code"] = proc.returncode
            return structured_data

        except subprocess.TimeoutExpired:
            return {
                "total": 0,
                "passed": 0,
                "failed": 1,
                "duration": timeout_seconds,
                "error": f"Full test suite timed out after {timeout_seconds} seconds.",
                "tests": [],
                "exit_code": -1
            }
        except Exception as e:
            return {
                "total": 0,
                "passed": 0,
                "failed": 1,
                "duration": round(time.time() - start_time, 3),
                "error": str(e),
                "tests": [],
                "exit_code": 1
            }
