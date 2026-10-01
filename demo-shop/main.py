"""
FastAPI E-Commerce Main Entrypoint
Compatible with both FastAPI and lightweight stdlib environment.
"""
try:
    from fastapi import FastAPI, HTTPException
except ImportError:
    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str):
            self.status_code = status_code
            self.detail = detail
            super().__init__(f"HTTP {status_code}: {detail}")

    class FastAPI:
        def __init__(self, *args, **kwargs):
            self.routes = []
        def get(self, path: str):
            def decorator(func):
                self.routes.append(("GET", path, func))
                return func
            return decorator
        def post(self, path: str):
            def decorator(func):
                self.routes.append(("POST", path, func))
                return func
            return decorator

from typing import Optional, List
from services.checkout import process_checkout, apply_order_coupon
from services.coupon import apply_discount
from models import Order, CartItem, CouponRequest

app = FastAPI(title="Demo Shop API", version="1.4.0")

@app.get("/")
def read_root():
    return {"status": "healthy", "service": "demo-shop", "version": "1.4.0"}

@app.get("/health")
def health_check():
    return {"status": "ok", "database": "connected", "cache": "operational"}

@app.post("/api/v1/checkout/apply-coupon")
def apply_coupon_route(req: CouponRequest):
    """
    Apply promotional discount to order total.
    """
    try:
        discounted_total = apply_discount(req.order_total, req.discount_pct)
        return {
            "code": req.code,
            "original_total": req.order_total,
            "discount_pct": req.discount_pct,
            "final_total": discounted_total,
            "status": "applied"
        }
    except ValueError as e:
        # Architectural Defense: Map domain validation errors to HTTP 422 instead of crashing with 500
        raise HTTPException(status_code=422, detail=f"Unprocessable Entity: {str(e)}")

@app.post("/api/v1/checkout/process")
def process_checkout_route(order: Order):
    """
    Process full checkout flow.
    """
    result = process_checkout(order)
    return result

@app.get("/api/v1/products")
def list_products():
    return [
        {"id": 1, "name": "Telemetry Probe", "price": 49.99},
        {"id": 2, "name": "AST Analyzer Hook", "price": 129.50},
        {"id": 3, "name": "Chroot Sandbox Jail", "price": 299.00}
    ]

@app.get("/api/v1/orders/{order_id}")
def get_order(order_id: int):
    return {"order_id": order_id, "status": "settled", "total": 129.50}
