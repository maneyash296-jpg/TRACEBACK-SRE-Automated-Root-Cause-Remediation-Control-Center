"""
Database Repository Adapter
"""
import time

_ORDERS_DB = {}

def save_order(order_data: dict) -> str:
    """Save order record to persistent storage."""
    order_id = f"ord_{int(time.time() * 1000)}"
    _ORDERS_DB[order_id] = order_data
    return order_id

def get_order_by_id(order_id: str) -> dict:
    """Retrieve order record by identifier."""
    return _ORDERS_DB.get(order_id, {"status": "not_found"})

def list_orders(limit: int = 50) -> list:
    """List recent orders."""
    return list(_ORDERS_DB.values())[:limit]
