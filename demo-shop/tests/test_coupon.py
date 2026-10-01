"""
Unit Tests for Coupon Service
"""
import unittest
from services.coupon import apply_discount, validate_coupon_code, get_coupon_rate

class TestCouponService(unittest.TestCase):
    def test_standard_discount(self):
        """Test applying standard 10% discount."""
        result = apply_discount(100.0, 10.0)
        self.assertEqual(result, 90.0)

    def test_zero_discount(self):
        """Test zero discount leaves total unchanged."""
        result = apply_discount(100.0, 0.0)
        self.assertEqual(result, 100.0)

    def test_percentage_discount(self):
        """
        Intentional failure (FL-104):
        Applying promotional code SUMMER120 (120%) to $75.00 cart.
        Expected behavior should be clamping to 0 or valid balance,
        but unpatched implementation raises unhandled ValueError: Order total cannot be negative: -$15.00
        """
        # In unpatched code, this raises ValueError: Order total cannot be negative: -$15.00
        result = apply_discount(75.0, 120.0)
        self.assertEqual(result, 0.0)

if __name__ == "__main__":
    unittest.main()
