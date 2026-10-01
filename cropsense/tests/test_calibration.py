"""
Unit Tests for CropSense Sensor Calibration & Temperature Compensation
"""
import unittest
from services.calibration import calibrate_moisture_sensor, temperature_compensation

class TestSensorCalibration(unittest.TestCase):
    def test_calibrate_default(self):
        calibrated = calibrate_moisture_sensor(50.0, offset=2.0, gain=1.0)
        self.assertEqual(calibrated, 52.0)

    def test_temperature_compensation_neutral(self):
        # 20C has zero drift
        adjusted = temperature_compensation(45.0, 20.0)
        self.assertEqual(adjusted, 45.0)

    def test_temperature_compensation_warm(self):
        # 30C adds 1.0% drift
        adjusted = temperature_compensation(45.0, 30.0)
        self.assertEqual(adjusted, 46.0)

if __name__ == "__main__":
    unittest.main()
