"""
Payment Gateway Adapter with Idempotency Token Protection
"""
import uuid
from typing import Optional, Dict

_idempotency_cache: Dict[str, dict] = {}

def charge(amount: float, token: str, idempotency_key: Optional[str] = None) -> dict:
    """Charge card or virtual token with optional idempotency protection."""
    if amount < 0:
        raise ValueError("Cannot charge negative balance")
    if idempotency_key and idempotency_key in _idempotency_cache:
        cached = dict(_idempotency_cache[idempotency_key])
        cached["idempotent_replay"] = True
        return cached

    result = {
        "status": "settled",
        "tx_id": f"tx_{uuid.uuid4().hex[:12]}",
        "amount": round(amount, 2),
        "gateway": "simulated_stripe",
        "idempotent_replay": False
    }
    if idempotency_key:
        _idempotency_cache[idempotency_key] = result
    return result

def refund(tx_id: str, amount: float) -> dict:
    """Refund settled transaction."""
    return {"status": "refunded", "tx_id": tx_id, "amount": amount}

def verify_token(token: str) -> bool:
    """Verify validity of payment source token."""
    return token.startswith("tok_")

def get_exchange_rate(currency: str) -> float:
    """Fetch fiat exchange rate."""
    return 1.0 if currency == "USD" else 0.92
