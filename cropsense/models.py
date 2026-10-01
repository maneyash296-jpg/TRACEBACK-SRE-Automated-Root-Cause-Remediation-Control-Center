"""
CropSense Agricultural Domain Models
"""
from typing import List, Optional

class SoilSensorReading:
    def __init__(self, sensor_id: str, field_zone: str, moisture_pct: float, temperature_c: float = 22.5):
        self.sensor_id = sensor_id
        self.field_zone = field_zone
        self.moisture_pct = moisture_pct
        self.temperature_c = temperature_c

class IrrigationSchedule:
    def __init__(self, zone_id: str, duration_minutes: float, water_liters: float, priority: str = "NORMAL"):
        self.zone_id = zone_id
        self.duration_minutes = duration_minutes
        self.water_liters = water_liters
        self.priority = priority
