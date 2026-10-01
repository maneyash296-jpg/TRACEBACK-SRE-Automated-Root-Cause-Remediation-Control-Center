"""
Unit Tests for CropSense Irrigation Planning
"""
import unittest
from main import create_irrigation_plan

class TestIrrigationPlanning(unittest.TestCase):
    def test_plan_generation_normal(self):
        plan = create_irrigation_plan("zone_north_01", raw_moisture=45.0, target_moisture=65.0)
        self.assertEqual(plan["zone_id"], "zone_north_01")
        self.assertEqual(plan["duration_minutes"], 30.0)
        self.assertGreater(plan["water_liters"], 0.0)
        self.assertFalse(plan["wilting_risk"])

    def test_plan_sufficient_moisture(self):
        plan = create_irrigation_plan("zone_east_02", raw_moisture=70.0, target_moisture=60.0)
        self.assertEqual(plan["duration_minutes"], 0.0)
        self.assertEqual(plan["water_liters"], 0.0)

if __name__ == "__main__":
    unittest.main()
