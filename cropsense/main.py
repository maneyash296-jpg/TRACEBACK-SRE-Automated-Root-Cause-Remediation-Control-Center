"""
CropSense Agricultural Irrigation API
"""
from typing import Dict, Any
from services.moisture import calculate_irrigation_duration, evaluate_wilting_point, compute_water_volume
from services.calibration import calibrate_moisture_sensor, temperature_compensation

def create_irrigation_plan(zone_id: str, raw_moisture: float, target_moisture: float = 65.0) -> Dict[str, Any]:
    """Generates automated irrigation plan for an agricultural zone."""
    calibrated = calibrate_moisture_sensor(raw_moisture, offset=0.0)
    minutes = calculate_irrigation_duration(calibrated, target_moisture)
    liters = compute_water_volume(minutes)
    
    return {
        "zone_id": zone_id,
        "current_moisture": calibrated,
        "target_moisture": target_moisture,
        "duration_minutes": minutes,
        "water_liters": liters,
        "wilting_risk": evaluate_wilting_point(calibrated)
    }
