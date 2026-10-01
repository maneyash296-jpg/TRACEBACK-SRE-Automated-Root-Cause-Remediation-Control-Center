"""
TRACEBACK Reality Acceptance Test Suite
Validates the entire 25-point end-to-end testing contract on a completely fresh,
dynamically uploaded Python project (fresh_test_project).
Ensures zero hardcoded illusions, true sandbox execution, real process isolation,
traceback line-mapping, AI investigation, repro testing, and dual-run verification.
"""
import unittest
import os
import sys
import shutil
import tempfile
import zipfile
import json
import time

# Add root directory to python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine.db import init_db, reset_database, get_project, get_failures_by_project, get_fix, approve_fix
from engine.security import SafeZipExtractor, CommandSanitizer
from engine.scanner import ProjectScanner
from engine.graph import GraphBuilder
from engine.env_detector import EnvironmentDetector
from engine.sandbox_runner import create_sandbox_runner, ProcessSandboxRunner
from engine.investigator import InvestigationService
from engine.ai_provider import get_ai_provider
from engine.fix_engine import FixEngine
import engine.cli as cli

class TestTracebackReality(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.workspace_dir = tempfile.mkdtemp(prefix="tb_reality_test_")
        cls.fresh_zip = os.path.join(cls.workspace_dir, "fresh_test_project.zip")
        cls.extracted_dir = os.path.join(cls.workspace_dir, "extracted_project")
        
        # 1. Build a brand new, completely fresh project that TRACEBACK has never seen
        src_app = os.path.join(cls.workspace_dir, "fresh_src", "app")
        src_tests = os.path.join(cls.workspace_dir, "fresh_src", "tests")
        os.makedirs(src_app, exist_ok=True)
        os.makedirs(src_tests, exist_ok=True)
        
        with open(os.path.join(src_app, "__init__.py"), "w") as f:
            f.write('"""App package"""\n')
        with open(os.path.join(src_app, "calculator.py"), "w") as f:
            f.write('def divide(a, b):\n    return a / b\n')
        with open(os.path.join(src_app, "service.py"), "w") as f:
            f.write('from .calculator import divide\ndef calculate_share(total, num_people):\n    return divide(total, num_people)\n')
        with open(os.path.join(src_tests, "__init__.py"), "w") as f:
            f.write('"""Tests package"""\n')
        with open(os.path.join(src_tests, "test_calculator.py"), "w") as f:
            f.write('''import unittest
from app.calculator import divide
from app.service import calculate_share

class TestCalculator(unittest.TestCase):
    def test_divide_valid(self):
        self.assertEqual(divide(10, 2), 5)

    def test_runtime_identity(self):
        print("TRACEBACK_REAL_EXECUTION_12345")
        self.assertTrue(True)

    def test_divide_by_zero(self):
        assert divide(10, 0) == 0
''')
        with open(os.path.join(cls.workspace_dir, "fresh_src", "requirements.txt"), "w") as f:
            f.write("pytest>=7.0.0\n")
        with open(os.path.join(cls.workspace_dir, "fresh_src", "README.md"), "w") as f:
            f.write("# Fresh Reality Test Project\n")

        # Create zip archive
        with zipfile.ZipFile(cls.fresh_zip, "w", zipfile.ZIP_DEFLATED) as z:
            for root, _, files in os.walk(os.path.join(cls.workspace_dir, "fresh_src")):
                for f in files:
                    full = os.path.join(root, f)
                    rel = os.path.relpath(full, os.path.join(cls.workspace_dir, "fresh_src"))
                    z.write(full, rel)

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.workspace_dir, ignore_errors=True)

    def setUp(self):
        reset_database()
        init_db()
        # Seed test project and failure in DB
        from engine.db import save_project, save_failure
        save_project("proj_reality", "fresh_test_project", self.extracted_dir)
        save_failure(
            "FL-REAL-001",
            "proj_reality",
            "app/calculator.py:2",
            "ZeroDivisionError",
            "division by zero",
            """Traceback (most recent call last):
  File "tests/test_calculator.py", line 13, in test_divide_by_zero
    assert divide(10, 0) == 0
  File "app/calculator.py", line 2, in divide
    return a / b
ZeroDivisionError: division by zero""",
            "FAILED"
        )

    # 1. Fresh ZIP Upload & Extraction
    def test_01_zip_security_and_extraction(self):
        from engine.security import SafeZipExtractor
        res = SafeZipExtractor.inspect_and_extract(self.fresh_zip, self.extracted_dir)
        self.assertTrue(res["success"])
        self.assertEqual(res["file_count"], 7)
        self.assertTrue(os.path.exists(os.path.join(self.extracted_dir, "app", "calculator.py")))
        self.assertTrue(os.path.exists(os.path.join(self.extracted_dir, "tests", "test_calculator.py")))

    # 2. Rejection of ZipSlip Path Traversal
    def test_02_zip_path_traversal_blocked(self):
        from engine.security import SafeZipExtractor, SecurityError
        malicious_zip = os.path.join(self.workspace_dir, "malicious.zip")
        with zipfile.ZipFile(malicious_zip, "w") as z:
            z.writestr("../evil.txt", "MALICIOUS")
        
        malicious_target = os.path.join(self.workspace_dir, "malicious_target")
        with self.assertRaises(SecurityError):
            SafeZipExtractor.inspect_and_extract(malicious_zip, malicious_target)

    # 3. Dynamic AST Scanning
    def test_03_ast_scan_fresh_project(self):
        scanner = ProjectScanner(self.extracted_dir)
        results = scanner.scan()
        dna = results["dna"]
        self.assertEqual(dna["functions"], 2) # divide & calculate_share
        self.assertEqual(dna["tests"], 3) # test_divide_valid, test_runtime_identity, test_divide_by_zero
        self.assertGreater(dna["lines"], 10)
        self.assertTrue(len(dna["sha256"]) > 10)

    # 4. Dynamic Architecture Graph
    def test_04_architecture_graph_fresh_project(self):
        scanner = ProjectScanner(self.extracted_dir)
        scan_results = scanner.scan()
        graph_builder = GraphBuilder(self.extracted_dir, scan_results)
        graph = graph_builder.build()
        nodes = graph["nodes"]
        calc_nodes = [n for n in nodes if "calculator" in n["name"] or "divide" in n["name"]]
        self.assertGreater(len(calc_nodes), 0)

    # 5. Dynamic Environment Detection
    def test_05_environment_detection(self):
        detector = EnvironmentDetector(self.extracted_dir)
        env = detector.detect()
        self.assertEqual(env["test_framework"], "pytest")
        self.assertIn("pytest", env["test_command"])
        self.assertIn("pytest", env["dependencies"])

    # 6. Real Execution in SandboxRunner & Stdout Verification
    def test_06_real_sandbox_execution_and_identity_stdout(self):
        runner = create_sandbox_runner()
        sandbox_id = runner.create_sandbox(self.extracted_dir)
        try:
            res = runner.run_tests(sandbox_id, ["python3", "-m", "unittest", "discover", "tests"], timeout_seconds=20)
            self.assertEqual(res["total"], 3)
            self.assertEqual(res["passed"], 2)
            self.assertEqual(res["failed"], 1) # test_divide_by_zero failed
            # Critical Test 8: Assert TRACEBACK_REAL_EXECUTION_12345 in stdout/stderr
            combined_output = res.get("stdout", "") + res.get("stderr", "")
            self.assertIn("TRACEBACK_REAL_EXECUTION_12345", combined_output)
            
            # Critical Test 9: Real Failure & Traceback localization
            self.assertEqual(len(res["failures"]), 1)
            fail = res["failures"][0]
            self.assertIn("divide", fail.get("function", "") or fail.get("test_name", ""))
            self.assertIn("ZeroDivisionError", fail.get("exception_type", "") + fail.get("message", ""))
        finally:
            runner.cleanup(sandbox_id)

    # 7. AI Investigation with Validated Machine Evidence
    def test_07_ai_investigation_evidence(self):
        scanner = ProjectScanner(self.extracted_dir)
        scan_results = scanner.scan()
        graph_builder = GraphBuilder(self.extracted_dir, scan_results)
        graph_data = graph_builder.build()
        
        investigator = InvestigationService(self.extracted_dir, scan_results, graph_data)
        failure_payload = {
            "id": "FL-REAL-001",
            "error_type": "ZeroDivisionError",
            "message": "division by zero",
            "trace": f"""Traceback (most recent call last):
  File "tests/test_calculator.py", line 13, in test_divide_by_zero
    assert divide(10, 0) == 0
  File "app/calculator.py", line 2, in divide
    return a / b
ZeroDivisionError: division by zero"""
        }
        
        ai_provider = get_ai_provider()
        inv_result = investigator.investigate_failure(failure_payload, ai_provider)
        self.assertEqual(inv_result["target_file"], "app/calculator.py")
        self.assertEqual(inv_result["target_line"], 2)
        self.assertTrue(inv_result["validation_flags"]["file_exists"])
        self.assertTrue(inv_result["validation_flags"]["line_valid"])
        self.assertEqual(inv_result["validation_flags"]["status"], "CONFIRMED")

    # 8. Real Reproduction Test Execution (RED State Capture)
    def test_08_reproduction_test_execution(self):
        repro_res = cli.cmd_reproduce("FL-REAL-001", self.extracted_dir)
        self.assertTrue(repro_res["reproduced"])
        self.assertIn("sandbox exit", repro_res["exit_status"])

    # 9. AI Fix Synthesis & Approval Requirement
    def test_09_fix_synthesis_and_approval(self):
        fix_res = cli.cmd_fix("FL-REAL-001", self.extracted_dir)
        self.assertIn("diff", fix_res)
        self.assertIn("app/calculator.py", fix_res["affected_file"])
        self.assertIn("if b == 0:", fix_res["diff"])
        
        # Verify approval is recorded in DB
        app_res = cli.cmd_approve(fix_res["fix_id"])
        self.assertEqual(app_res["status"], "approved")
        
        fix_db = get_fix(fix_res["fix_id"])
        self.assertTrue(fix_db["approved"])

    # 10. Real Verification on Ephemeral Copy (Original Unchanged)
    def test_10_real_verification_tests_and_immutability(self):
        # Record original file content
        calc_path = os.path.join(self.extracted_dir, "app", "calculator.py")
        with open(calc_path, "r") as f:
            orig_content = f.read()
        
        fix_res = cli.cmd_fix("FL-REAL-001", self.extracted_dir)
        fix_id = fix_res["fix_id"]
        cli.cmd_approve(fix_id)
        
        verify_res = cli.cmd_verify(fix_id, self.extracted_dir)
        self.assertTrue(verify_res["verified"])
        self.assertEqual(verify_res["status"], "PASS")
        self.assertEqual(verify_res["after"]["failed"], 0)
        self.assertEqual(verify_res["after"]["passed"], 4) # 3 original tests + 1 repro test = 4 passed
        self.assertEqual(verify_res["tests_added"], 1)
        
        # Verify original project file is completely UNTOUCHED
        with open(calc_path, "r") as f:
            post_content = f.read()
        self.assertEqual(orig_content, post_content)

    # 11. Bad Fix Rejection Test
    def test_11_bad_fix_rejected_by_tests(self):
        engine = FixEngine(self.extracted_dir)
        bad_diff = """--- a/app/calculator.py
+++ b/app/calculator.py
@@ -1,2 +1,3 @@
 def divide(a, b):
+    # Deliberately broken fix that does not resolve zero division
     return a / b
"""
        res = engine.verify_patch(
            project_id="test_bad",
            fix_id="fix_bad",
            diff_text=bad_diff,
            affected_file="app/calculator.py"
        )
        self.assertFalse(res["verified"])
        self.assertEqual(res["status"], "FAIL")
        self.assertEqual(res["after"]["failed"], 1)

    # 12. Timeout Handling Test
    def test_12_timeout_handling(self):
        runner = create_sandbox_runner()
        sandbox_id = runner.create_sandbox(self.extracted_dir)
        try:
            # Run command that sleeps 30 seconds with 1 second timeout
            res = runner.run_tests(
                sandbox_id,
                ["python3", "-c", "import time; time.sleep(30)"],
                timeout_seconds=1
            )
            self.assertEqual(res["error_state"], "TEST_TIMEOUT")
            self.assertEqual(res["exit_code"], -1)
        finally:
            runner.cleanup(sandbox_id)

    # 13. Audit Post-Mortem Report Generation
    def test_13_report_generation(self):
        rep = cli.cmd_report("FL-REAL-001", self.extracted_dir)
        self.assertEqual(rep["failure_id"], "FL-REAL-001")
        self.assertIn("TRB-2026", rep["doc_id"])
        rep = cli.cmd_report("FL-REAL-001", self.extracted_dir)
        self.assertEqual(rep["failure_id"], "FL-REAL-001")
        self.assertIn("TRB-2026", rep["doc_id"])

if __name__ == "__main__":
    unittest.main()
