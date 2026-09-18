from typing import List, Dict, Any, Optional

def calculate_deterministic_risk(
    weather: Optional[Dict[str, Any]] = None,
    farm: Optional[Dict[str, Any]] = None,
    observations: Optional[List[str]] = None,
    satellite: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Explainable, deterministic climate-risk and crop-stress calculation.
    Numerical score calculation is strictly rule-based and reproducible.
    """
    farm = farm or {}
    observations = observations or []
    weather = weather or {}
    satellite = satellite or {}

    rainfall_7d = float(weather.get("rainfall_7d", 15.0))
    rainfall_14d = float(weather.get("rainfall_14d", 30.0))
    temp_max = float(weather.get("temp_max", 26.0))
    precip_prob = float(weather.get("precip_prob", 20.0))
    soil_moisture = weather.get("soil_moisture")  # 0.0 to 1.0 if available

    drainage = str(farm.get("drainage", "moderate")).lower()
    flood_history = str(farm.get("flood_history", "never")).lower()
    slope = str(farm.get("slope", "gentle")).lower()
    soil_type = str(farm.get("soil_type", "loam")).lower()
    crop_health = str(farm.get("crop_health", "good")).lower()
    farm_problems = farm.get("current_problems", [])
    if isinstance(farm_problems, list):
        for prob in farm_problems:
            if prob not in observations:
                observations.append(prob)

    obs_lower = [str(o).lower() for o in observations]

    ndvi = satellite.get("latest_ndvi")
    ndvi_trend = satellite.get("ndvi_trend")

    reasons: List[str] = []
    actions: List[str] = []
    watch_next: List[str] = []

    # -------------------------------------------------------------
    # 1. Drought Risk Calculation (0 to 100)
    # -------------------------------------------------------------
    drought_score = 10  # baseline

    if rainfall_7d < 5.0:
        drought_score += 35
        reasons.append(f"Severe dry spell: only {rainfall_7d:.1f}mm rainfall forecast over next 7 days.")
    elif rainfall_7d < 15.0:
        drought_score += 20
        reasons.append(f"Low rainfall: {rainfall_7d:.1f}mm expected over next 7 days.")

    if rainfall_14d < 20.0:
        drought_score += 15

    if temp_max > 32.0:
        drought_score += 20
        reasons.append(f"High peak heat stress ({temp_max:.1f}°C) accelerating evapotranspiration.")
    elif temp_max > 28.0:
        drought_score += 10

    if any("dry soil" in o for o in obs_lower):
        drought_score += 15
        reasons.append("Farmer observation confirms dry topsoil.")

    if any("wilting" in o for o in obs_lower):
        drought_score += 20
        reasons.append("Vegetative wilting observed in field.")

    if soil_type in ["sandy", "shallow"]:
        drought_score += 10
        reasons.append("Sandy/shallow soil has low water-retention capacity.")

    if soil_moisture is not None and soil_moisture < 0.15:
        drought_score += 15
        reasons.append(f"Low root-zone soil moisture measured ({soil_moisture*100:.0f}%).")

    drought_risk = min(100, max(0, drought_score))

    # -------------------------------------------------------------
    # 2. Flood Risk Calculation (0 to 100)
    # -------------------------------------------------------------
    flood_score = 5

    if rainfall_7d > 80.0:
        flood_score += 45
        reasons.append(f"Extremely heavy precipitation forecast ({rainfall_7d:.1f}mm over 7 days).")
    elif rainfall_7d > 45.0:
        flood_score += 25
        reasons.append(f"High rainfall volume forecast ({rainfall_7d:.1f}mm over 7 days).")

    if drainage in ["poor", "very poor"]:
        flood_score += 25
        reasons.append("Poor soil drainage elevates standing water risk.")

    if flood_history in ["frequent", "regular"]:
        flood_score += 25
        reasons.append("Field has history of frequent flooding/waterlogging.")
    elif flood_history == "occasional":
        flood_score += 10

    if slope in ["flat", "depression", "valley bottom"]:
        flood_score += 15
        reasons.append("Flat or depression terrain collects surface runoff.")

    if any("waterlogging" in o or "standing water" in o for o in obs_lower):
        flood_score += 30
        reasons.append("Waterlogging observed in field.")

    flood_risk = min(100, max(0, flood_score))

    # -------------------------------------------------------------
    # 3. Crop Stress Calculation (0 to 100)
    # -------------------------------------------------------------
    stress_score = 10

    if crop_health == "poor":
        stress_score += 40
        reasons.append("Baseline crop health reported as poor.")
    elif crop_health == "fair":
        stress_score += 20

    if any("yellowing" in o for o in obs_lower):
        stress_score += 15
        reasons.append("Leaf chlorosis (yellowing) noted, indicating nutrient lock or moisture stress.")

    if any("pest" in o for o in obs_lower):
        stress_score += 20
        reasons.append("Pest damage detected on crop foliage/stems.")

    if any("disease" in o for o in obs_lower):
        stress_score += 20
        reasons.append("Disease symptoms observed in field.")

    if any("poor growth" in o or "stunted" in o for o in obs_lower):
        stress_score += 15
        reasons.append("Stunted plant growth observed.")

    if ndvi is not None:
        if ndvi < 0.25:
            stress_score += 25
            reasons.append(f"Sentinel-2 NDVI ({ndvi:.2f}) indicates very low vegetation vigor.")
        elif ndvi < 0.40:
            stress_score += 10
            reasons.append(f"Sentinel-2 NDVI ({ndvi:.2f}) shows moderate to restrained canopy vigor.")
        if ndvi_trend == "declining":
            stress_score += 15
            reasons.append("Satellite NDVI trend shows declining vegetation biomass over recent passes.")

    crop_stress = min(100, max(0, stress_score))

    # -------------------------------------------------------------
    # 4. Overall Composite Score (0 to 100)
    # -------------------------------------------------------------
    # Weighted composite: Max of primary climate threats + crop stress component
    primary_climate_threat = max(drought_risk, flood_risk)
    overall_score = int(round(primary_climate_threat * 0.65 + crop_stress * 0.35))
    overall_score = min(100, max(0, overall_score))

    if overall_score < 25:
        risk_level = "LOW"
    elif overall_score < 50:
        risk_level = "MODERATE"
    elif overall_score < 75:
        risk_level = "MODERATE-HIGH"
    else:
        risk_level = "HIGH"

    # Deduplicate reasons
    unique_reasons = []
    seen = set()
    for r in reasons:
        if r not in seen:
            seen.add(r)
            unique_reasons.append(r)

    if not unique_reasons:
        unique_reasons.append("Favorable climatic parameters; stable rainfall and temperature trends observed.")

    # -------------------------------------------------------------
    # 5. Deterministic Recommended Actions & Monitoring
    # -------------------------------------------------------------
    if drought_risk >= 50:
        actions.append("Apply organic mulch (dry grass, crop residues) around root zones to reduce soil evaporation.")
        actions.append("Practice supplementary deficit irrigation during early morning or late evening.")
        actions.append("Delay top-dressing fertilizer until moisture returns to prevent root scorching.")
        watch_next.append("Monitor morning leaf curling and soil cracking depth daily.")
        watch_next.append("Check updated 3-day rainfall forecast before field operations.")
    elif flood_risk >= 50:
        actions.append("Clear drainage furrows and unblock water release trenches immediately.")
        actions.append("Create raised beds or contour ridges to keep crop root zones out of saturated mud.")
        actions.append("Hold off foliar chemical spraying until heavy rain window passes.")
        watch_next.append("Inspect field corners for ponding water 2 hours after each downpour.")
        watch_next.append("Check for early damping-off or root rot signs in low-lying rows.")
    else:
        actions.append("Maintain routine weeding to reduce moisture and nutrient competition.")
        actions.append("Inspect crop canopy twice weekly for early pest arrivals.")
        watch_next.append("Track next week's precipitation probability before scheduling fertilizer.")

    if crop_stress >= 50:
        if any("pest" in o for o in obs_lower):
            actions.append("Scout field in an 'X' pattern; isolate infested perimeter plants and use targeted botanical or approved controls.")
        if any("yellowing" in o for o in obs_lower):
            actions.append("Assess if yellowing is lower leaves (nitrogen/waterlogging) or upper leaves (micronutrient/viral).")
        watch_next.append("Re-inspect tagged sample plants in 4 days to check if stress is spreading.")

    return {
        "overall_score": overall_score,
        "risk_level": risk_level,
        "drought_risk": drought_risk,
        "flood_risk": flood_risk,
        "crop_stress": crop_stress,
        "reasons": unique_reasons,
        "recommended_actions": actions,
        "watch_next": watch_next
    }
