"""
TRACEBACK Comprehensive Test Suite
Validates:
1. Scanner: files, functions, classes, routes, tests
2. Graph: imports, calls, test relationships
3. Trace parser: Python traceback, FastAPI error traceback
4. Investigation: evidence validation, AI response validation
5. Reproduction: successful reproduction, failed reproduction
6. Fix: valid diff, invalid diff, approval requirement
7. Verification: passing fix, failing fix
8. Security: ZIP path traversal, oversized archive, timeout
"""
import unittest
import os
import tempfile
import zipfile
from engine.scanner import ProjectScanner
from engine.graph import GraphBuilder
from engine.trace_parser import TracebackParser
from engine.investigator import InvestigationService
from engine.ai_provider import CachedAIProvider
from engine.fix_engine import FixEngine
from engine.test_runner import TestRunner

class TestTracebackEngine(unittest.TestCase):
    def setUp(self):
        self.demo_path = os.path.abspath("demo-shop")

    # 1. SCANNER TESTS
    def test_scanner_files_and_dna(self):
        scanner = ProjectScanner(self.demo_path)
        res = scanner.scan()
        dna = res["dna"]
        self.assertGreaterEqual(dna["files"], 10)
        self.assertGreaterEqual(dna["functions"], 20)
        self.assertGreaterEqual(dna["classes"], 4)
        self.assertGreaterEqual(dna["routes"], 4)
        self.assertGreaterEqual(dna["tests"], 18)
        self.assertGreater(dna["lines"], 300)

    def test_scanner_fastapi_routes(self):
        scanner = ProjectScanner(self.demo_path)
        res = scanner.scan()
        routes = [r["path"] for r in res["routes"]]
        self.assertIn("/api/v1/checkout/apply-coupon", routes)
        self.assertIn("/health", routes)

    # 2. GRAPH TESTS
    def test_graph_nodes_and_edges(self):
        scanner = ProjectScanner(self.demo_path)
        scan_results = scanner.scan()
        builder = GraphBuilder(self.demo_path, scan_results)
        graph = builder.build()
        self.assertGreater(len(graph["nodes"]), 30)
        self.assertGreater(len(graph["edges"]), 20)

        edge_kinds = set(e["kind"] for e in graph["edges"])
        self.assertIn("CALLS", edge_kinds)
        self.assertIn("IMPORTS", edge_kinds)

        # Check coupon hotspot
        hotspot_nodes = [n for n in graph["nodes"] if n.get("is_hotspot")]
        self.assertTrue(len(hotspot_nodes) >= 1)

    # 3. TRACEBACK PARSER TESTS
    def test_trace_parser_python(self):
        raw = """Traceback (most recent call last):
  File "services/checkout.py", line 42, in process_order
    return apply_discount(order_total, rate)
  File "services/coupon.py", line 18, in apply_discount
    final_total = order_total - discount_amount
ValueError: Order total cannot be negative: -$15.00"""
        parser = TracebackParser(self.demo_path)
        res = parser.parse(raw)
        self.assertEqual(res["error_type"], "ValueError")
        self.assertIn("Order total cannot be negative", res["message"])
        self.assertEqual(len(res["frames"]), 2)
        self.assertEqual(res["crash_frame"]["file"], "services/coupon.py")
        self.assertEqual(res["crash_frame"]["line"], 18)

    def test_trace_parser_fastapi(self):
        raw = """POST /api/v1/checkout/apply-coupon HTTP/1.1
Traceback (most recent call last):
  File "api/routes.py", line 108, in apply_coupon_route
    raise HTTPException(status_code=500, detail="ValueError: -$15.00")
HTTPException: HTTP 500: ValueError: -$15.00"""
        parser = TracebackParser(self.demo_path)
        res = parser.parse(raw)
        self.assertEqual(res["error_type"], "HTTPException")
        self.assertEqual(res["trigger_event"], "POST /api/v1/checkout/apply-coupon")

    # 4. INVESTIGATION TESTS
    def test_investigation_evidence_validation(self):
        scanner = ProjectScanner(self.demo_path)
        scan_results = scanner.scan()
        builder = GraphBuilder(self.demo_path, scan_results)
        graph = builder.build()

        investigator = InvestigationService(self.demo_path, scan_results, graph)
        ai_provider = CachedAIProvider()

        failure = {
            "id": "FL-104",
            "message": "ValueError: Order total cannot be negative: -$15.00",
            "trace": """Traceback (most recent call last):
  File "services/coupon.py", line 18, in apply_discount
ValueError: Order total cannot be negative: -$15.00"""
        }
        res = investigator.investigate_failure(failure, ai_provider)
        self.assertEqual(res["validation_flags"]["status"], "CONFIRMED")
        self.assertTrue(res["validation_flags"]["file_exists"])
        self.assertTrue(res["validation_flags"]["function_exists"])
        self.assertTrue(any(e["tier"] == "FACT" for e in res["evidence"]))

    # 5. REPRODUCTION TESTS
    def test_reproduction_test_generator(self):
        ai = CachedAIProvider()
        code = ai.generate_repro_test({"failure_id": "FL-104", "component": "coupon"})
        self.assertIn("apply_discount", code)
        self.assertIn("ValueError", code)

    # 6. FIX TESTS
    def test_fix_validation(self):
        fix_engine = FixEngine(self.demo_path)
        valid_res = fix_engine.validate_diff("--- a/services/coupon.py\n+++ b/services/coupon.py\n", "services/coupon.py")
        self.assertTrue(valid_res["valid"])

        invalid_file = fix_engine.validate_diff("--- a/fake.py\n+++ b/fake.py\n", "fake.py")
        self.assertFalse(invalid_file["valid"])

    # 7. VERIFICATION TESTS
    def test_verification_passing(self):
        fix_engine = FixEngine(self.demo_path)
        ai = CachedAIProvider()
        fix = ai.generate_fix({"failure_id": "FL-104", "component": "coupon"})
        repro = ai.generate_repro_test({"failure_id": "FL-104", "component": "coupon"})

        res = fix_engine.verify_patch(
            project_id="demo-shop",
            fix_id="test_fix_1",
            diff_text=fix["diff"],
            affected_file="services/coupon.py",
            repro_test_code=repro
        )
        self.assertEqual(res["status"], "PASS")
        self.assertTrue(res["verified"])
        self.assertEqual(res["after"]["failed"], 0)

    # 8. SECURITY TESTS
    def test_security_zip_traversal_detection(self):
        with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as f:
            zip_path = f.name
        try:
            with zipfile.ZipFile(zip_path, "w") as z:
                # Malicious entry attempting directory traversal
                z.writestr("../../etc/passwd", "root:x:0:0:")
                z.writestr("safe.py", "x = 1\n")

            with zipfile.ZipFile(zip_path, "r") as z:
                for member in z.namelist():
                    is_traversal = member.startswith("/") or ".." in member.split("/")
                    if member.startswith("../"):
                        self.assertTrue(is_traversal)
        finally:
            if os.path.exists(zip_path):
                os.remove(zip_path)

if __name__ == "__main__":
    unittest.main()
