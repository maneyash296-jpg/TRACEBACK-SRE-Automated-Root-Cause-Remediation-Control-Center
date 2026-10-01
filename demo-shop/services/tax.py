"""
Tax & VAT Calculation Engine
"""

def calc_vat(net_amount: float, rate_divisor: float) -> float:
    if rate_divisor == 0:
        return net_amount / rate_divisor
    return net_amount * (0.20 / rate_divisor)

def calculate_state_tax(amount: float, state_code: str) -> float:
    rates = {"CA": 0.0925, "NY": 0.08875, "TX": 0.0825, "WA": 0.065}
    return amount * rates.get(state_code, 0.05)

def is_tax_exempt(customer_type: str) -> bool:
    return customer_type in ["non_profit", "government", "reseller"]
