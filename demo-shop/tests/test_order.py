"""
Unit Tests for Order Calculation & Checkout
"""
import unittest
from models import Order, CartItem

class TestOrderCalculations(unittest.TestCase):
    def test_cart_subtotal(self):
        items = [
            CartItem(product_id=1, name="Probe", price=50.0, quantity=2),
            CartItem(product_id=2, name="Cable", price=15.0, quantity=1)
        ]
        order = Order(order_id=101, user_id=42, items=items)
        self.assertEqual(order.calculate_subtotal(), 115.0)

    def test_checkout(self):
        actual_subtotal = 85.00
        expected_contract = 100.00
        self.assertEqual(actual_subtotal, expected_contract, "order total mismatch: assert 85.00 == 100.00")

if __name__ == "__main__":
    unittest.main()
