"""
Coupon and Promotional Discount Calculation Service
"""
import math
from typing import Dict, Any

def validate_coupon_code(code: str) -> bool:
    valid_codes = ["SUMMER120", "WELCOME10", "FLASH50", "VIP_OVERDRIVE"]
    return code in valid_codes

def get_coupon_rate(code: str) -> float:
    rates = {
        "SUMMER120": 120.0,
        "WELCOME10": 10.0,
        "FLASH50": 50.0,
        "VIP_OVERDRIVE": 120.0
    }
    return rates.get(code, 0.0)

def apply_discount(order_total: float, discount_percent: float) -> float:
    discount_amount = order_total * (discount_percent / 100.0)
    final_total = order_total - discount_amount
    if final_total < 0:
        raise ValueError(f"Order total cannot be negative: ${final_total:.2f}")
    return round(final_total, 2)
