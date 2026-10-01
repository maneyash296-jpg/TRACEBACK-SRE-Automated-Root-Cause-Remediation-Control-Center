"""
Property-based and Invariant Boundary Tests for Coupon Discounts
Synthesized based on AI Testing & Fuzzing Advisory.
"""
import unittest
import math
from services.coupon import apply_discount, validate_coupon_code, get_coupon_rate

class TestCouponInvariants(unittest.TestCase):
    def test_invariant_never_negative_for_exhaustive_percentages(self):
        """Invariant: apply_discount must NEVER return a negative balance."""
        test_totals = [0.01, 1.0, 10.0, 75.0, 100.0, 999.99, 10000.0]
        test_percents = [0.0, 5.0, 10.0, 50.0, 99.99, 100.0, 105.0, 120.0, 200.0]
        
        for total in test_totals:
            for pct in test_percents:
                try:
                    result = apply_discount(total, pct)
                    self.assertGreaterEqual(result, 0.0, f"Failed for total={total}, pct={pct}: result was {result}")
                except ValueError as err:
                    # If implementation rejects with ValueError for >100%, that's also valid defensive behavior
                    self.assertTrue("cannot be negative" in str(err) or "between" in str(err) or "Invalid" in str(err))

    def test_monotonic_pricing_invariant(self):
        """Invariant: Higher discount percentages must always result in lower or equal final price."""
        total = 100.0
        discounts = [0.0, 10.0, 25.0, 50.0, 75.0, 100.0]
        results = []
        for d in discounts:
            results.append(apply_discount(total, d))
            
        for i in range(len(results) - 1):
            self.assertGreaterEqual(results[i], results[i + 1], "Higher discount produced higher price")

if __name__ == "__main__":
    unittest.main()
