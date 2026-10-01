"""
Unit Tests for Domain Models
"""
import unittest
from models import CartItem, CouponRequest, PaymentInfo

class TestDomainModels(unittest.TestCase):
    def test_cart_item_creation(self):
        item = CartItem(product_id=1, name="Widget", price=19.99, quantity=3)
        self.assertEqual(item.quantity, 3)

    def test_coupon_request(self):
        req = CouponRequest(code="SAVE10", discount_pct=10.0, order_total=50.0)
        self.assertEqual(req.code, "SAVE10")

if __name__ == "__main__":
    unittest.main()
