import unittest
from app.calculator import divide
from app.service import calculate_share

class TestCalculator(unittest.TestCase):
    def test_divide_valid(self):
        self.assertEqual(divide(10, 2), 5)

    def test_runtime_identity(self):
        print("TRACEBACK_REAL_EXECUTION_12345")
        self.assertTrue(True)

    def test_divide_by_zero(self):
        # Deliberate unhandled ZeroDivisionError in unpatched code
        assert divide(10, 0) == 0

if __name__ == "__main__":
    unittest.main()
