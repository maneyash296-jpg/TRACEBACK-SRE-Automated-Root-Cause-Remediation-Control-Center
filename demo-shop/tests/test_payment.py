"""
Unit Tests for Payment Gateway
"""
import unittest
from services.payment import charge, refund, verify_token, get_exchange_rate

class TestPaymentGateway(unittest.TestCase):
    def test_charge_success(self):
        res = charge(50.0, "tok_valid_test")
        self.assertEqual(res["status"], "settled")
        self.assertEqual(res["amount"], 50.0)

    def test_charge_negative_fails(self):
        with self.assertRaises(ValueError):
            charge(-10.0, "tok_test")

    def test_verify_token(self):
        self.assertTrue(verify_token("tok_9918"))
        self.assertFalse(verify_token("invalid_token"))

    def test_charge_idempotency(self):
        key = "idem_key_7718"
        first = charge(25.0, "tok_valid", idempotency_key=key)
        second = charge(25.0, "tok_valid", idempotency_key=key)
        self.assertEqual(first["tx_id"], second["tx_id"])
        self.assertTrue(second["idempotent_replay"])

    def test_exchange_rate_usd(self):
        self.assertEqual(get_exchange_rate("USD"), 1.0)

if __name__ == "__main__":
    unittest.main()
