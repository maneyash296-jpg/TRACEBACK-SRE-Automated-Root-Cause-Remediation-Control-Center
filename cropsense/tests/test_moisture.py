"""
Unit Tests for CropSense Soil Moisture Calculations
"""
import unittest
from services.moisture import calculate_irrigation_duration, evaluate_wilting_point, compute_water_volume

class TestSoilMoistureService(unittest.TestCase):
    def test_normal_irrigation(self):
        duration = calculate_irrigation_duration(40.0, 60.0)
        self.assertEqual(duration, 30.0)

    def test_zero_duration_when_moisture_exceeds_target(self):
        duration = calculate_irrigation_duration(70.0, 60.0)
        self.assertEqual(duration, 0.0)

    def test_wilting_point_detection(self):
        self.assertTrue(evaluate_wilting_point(12.0, "corn"))
        self.assertFalse(evaluate_wilting_point(25.0, "corn"))

    def test_water_volume_computation(self):
        vol = compute_water_volume(20.0, flow_rate_lpm=10.0)
        self.assertEqual(vol, 200.0)

    def test_oversaturated_sensor_reading(self):
        """
        Failure: Uncalibrated capacitive probe reports 105.0% saturation spike during heavy rainfall.
        calculate_irrigation_duration currently raises unhandled ValueError instead of clamping.
        """
        duration = calculate_irrigation_duration(105.0, 75.0)
        self.assertEqual(duration, 0.0, "Expected 0.0 duration for oversaturated soil")

if __name__ == "__main__":
    unittest.main()
