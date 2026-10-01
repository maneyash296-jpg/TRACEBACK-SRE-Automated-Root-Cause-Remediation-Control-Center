"""
CropSense Soil Moisture & Irrigation Telemetry Service
"""

def calculate_irrigation_duration(soil_moisture_pct: float, target_moisture_pct: float) -> float:
    """
    Calculate required irrigation duration in minutes based on current vs target moisture.
    Uncalibrated sensor readings > 100% currently trigger an unhandled ValueError.
    """
    if soil_moisture_pct > 100.0:
        raise ValueError(f"Soil moisture reading invalid: {soil_moisture_pct:.1f}% exceeds 100% saturation limit")
    
    delta = target_moisture_pct - soil_moisture_pct
    if delta <= 0:
        return 0.0
    return round(delta * 1.5, 2)

def evaluate_wilting_point(moisture_pct: float, crop_type: str = "corn") -> bool:
    """Determines if soil moisture is below the biological permanent wilting point."""
    thresholds = {
        "corn": 18.0,
        "wheat": 14.5,
        "soybean": 16.0,
        "alfalfa": 20.0
    }
    limit = thresholds.get(crop_type.lower(), 15.0)
    return moisture_pct < limit

def compute_water_volume(duration_minutes: float, flow_rate_lpm: float = 12.0) -> float:
    """Computes total water volume in liters based on irrigation run duration."""
    return round(duration_minutes * flow_rate_lpm, 2)
