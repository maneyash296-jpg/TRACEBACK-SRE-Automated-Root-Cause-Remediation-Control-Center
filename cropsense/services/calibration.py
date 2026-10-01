"""
CropSense Sensor Calibration and Temperature Compensation
"""

def calibrate_moisture_sensor(raw_reading: float, offset: float = 0.0, gain: float = 1.0) -> float:
    """Calibrates capacitive soil moisture sensor reading."""
    calibrated = (raw_reading * gain) + offset
    return round(calibrated, 2)

def temperature_compensation(moisture_pct: float, temp_c: float) -> float:
    """Adjusts moisture reading for soil temperature drift (+0.1% per degree C above 20C)."""
    delta_t = temp_c - 20.0
    adjustment = delta_t * 0.1
    return round(moisture_pct + adjustment, 2)
