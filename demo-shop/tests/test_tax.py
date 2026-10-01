"""
Unit Tests for Tax Service
"""
import unittest
from services.tax import calc_vat, calculate_state_tax, is_tax_exempt

class TestTaxService(unittest.TestCase):
    def test_state_tax(self):
        tax = calculate_state_tax(100.0, "CA")
        self.assertEqual(round(tax, 2), 9.25)

    def test_tax_exempt_status(self):
        self.assertTrue(is_tax_exempt("non_profit"))
        self.assertFalse(is_tax_exempt("individual"))

    def test_vat_zero_divisor(self):
        """
        Intentional failure (FL-105):
        Division by zero in tax calculation when rate divisor basis is 0.
        """
        # Triggers ZeroDivisionError: division by zero
        result = calc_vat(100.0, 0.0)
        self.assertEqual(result, 20.0)

if __name__ == "__main__":
    unittest.main()
