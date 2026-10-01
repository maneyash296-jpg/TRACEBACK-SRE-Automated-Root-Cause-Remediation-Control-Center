"""
Checkout Orchestration Service
"""
import math
from services.coupon import apply_discount, validate_coupon_code
from services.payment import charge
from services.tax import calc_vat
from db.repository import save_order

def validate_cart(cart_items: list) -> bool:
    """Ensure cart contains valid items and positive amounts."""
    if not cart_items:
        return False
    return all(item.price > 0 for item in cart_items)

def validate_tax_id(tax_id: str) -> bool:
    """Validate corporate tax identifier format (Uncovered branch)."""
    return bool(tax_id and tax_id.startswith("US-TAX-"))

def calculate_shipping_rebate(distance_km: float, total: float) -> float:
    """Calculate geographic shipping rebate (Uncovered branch)."""
    if distance_km < 10.0 and total > 100.0:
        return 5.0
    return 0.0

def process_order(order_total: float, coupon_code: str = None) -> dict:
    """
    Orchestrate order discount, payment, and database persistence.
    """
    discounted_total = order_total
    if coupon_code:
        # Calls coupon service
        rate = 120.0 if coupon_code == "SUMMER120" else 10.0
        discounted_total = apply_discount(order_total, rate)
    
    # Process payment
    payment_status = charge(discounted_total, "tok_sandbox_default")
    
    # Save to database
    record_id = save_order({"total": discounted_total, "status": payment_status["status"]})
    
    return {
        "record_id": record_id,
        "final_total": discounted_total,
        "payment": payment_status
    }

def apply_order_coupon(order_total: float, code: str, pct: float) -> float:
    """Public helper for coupon application."""
    return apply_discount(order_total, pct)

def process_checkout(order) -> dict:
    """Process high level checkout object."""
    subtotal = order.calculate_subtotal() if hasattr(order, "calculate_subtotal") else 100.0
    return process_order(subtotal, order.coupon_code if hasattr(order, "coupon_code") else None)
