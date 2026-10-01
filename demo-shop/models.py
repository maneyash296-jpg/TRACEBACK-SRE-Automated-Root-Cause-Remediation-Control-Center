"""
Domain Models for Demo Shop
Compatible with both standard library and pydantic.
"""
from typing import List, Optional

try:
    from pydantic import BaseModel, Field
except ImportError:
    class BaseModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def dict(self):
            return self.__dict__
    def Field(*args, **kwargs):
        return None

class CartItem(BaseModel):
    def __init__(self, product_id: int = 0, name: str = "", price: float = 0.0, quantity: int = 1, **kwargs):
        super().__init__(product_id=product_id, name=name, price=price, quantity=quantity, **kwargs)
        self.product_id = product_id
        self.name = name
        self.price = price
        self.quantity = quantity

class CouponRequest(BaseModel):
    def __init__(self, code: str = "", discount_pct: float = 0.0, order_total: float = 0.0, **kwargs):
        super().__init__(code=code, discount_pct=discount_pct, order_total=order_total, **kwargs)
        self.code = code
        self.discount_pct = discount_pct
        self.order_total = order_total

class PaymentInfo(BaseModel):
    def __init__(self, method: str = "credit_card", card_token: Optional[str] = None, amount: float = 0.0, **kwargs):
        super().__init__(method=method, card_token=card_token, amount=amount, **kwargs)
        self.method = method
        self.card_token = card_token
        self.amount = amount

class Order(BaseModel):
    def __init__(self, order_id: int = 0, user_id: int = 0, items: Optional[List[CartItem]] = None, coupon_code: Optional[str] = None, tax_rate: float = 0.08, total_amount: float = 0.0, **kwargs):
        super().__init__(order_id=order_id, user_id=user_id, items=items or [], coupon_code=coupon_code, tax_rate=tax_rate, total_amount=total_amount, **kwargs)
        self.order_id = order_id
        self.user_id = user_id
        self.items = items or []
        self.coupon_code = coupon_code
        self.tax_rate = tax_rate
        self.total_amount = total_amount

    def calculate_subtotal(self) -> float:
        return sum(item.price * item.quantity for item in self.items)

class TaxRecord(BaseModel):
    def __init__(self, order_id: int = 0, rate: float = 0.0, tax_amount: float = 0.0, **kwargs):
        super().__init__(order_id=order_id, rate=rate, tax_amount=tax_amount, **kwargs)
        self.order_id = order_id
        self.rate = rate
        self.tax_amount = tax_amount
