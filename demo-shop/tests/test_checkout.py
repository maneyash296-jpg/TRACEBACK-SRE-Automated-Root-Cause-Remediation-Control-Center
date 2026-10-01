"""
Unit Tests for Checkout Orchestrator
"""
import unittest
from services.checkout import validate_cart, process_order, apply_order_coupon

class TestCheckoutService(unittest.TestCase):
    def test_validate_cart_empty(self):
        self.assertFalse(validate_cart([]))

    def test_validate_cart_valid(self):
        class MockItem:
            price = 25.0
        self.assertTrue(validate_cart([MockItem(), MockItem()]))

    def test_process_order_clean(self):
        result = process_order(100.0)
        self.assertEqual(result["final_total"], 100.0)
        self.assertEqual(result["payment"]["status"], "settled")

    def test_apply_order_coupon_normal(self):
        res = apply_order_coupon(100.0, "WELCOME10", 10.0)
        self.assertEqual(res, 90.0)

if __name__ == "__main__":
    unittest.main()
