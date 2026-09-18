from fastapi import APIRouter, Header, HTTPException, Query, Path
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from server.models import AnalyzeRequest, AnalysisReport
from server.db import (
    get_user_from_token,
    db_get_farm_by_id,
    db_save_analysis,
    db_get_analyses
)
from server.services.weather import get_weather_data
from server.services.satellite import get_sentinel_ndvi
from server.services.risk_engine import calculate_deterministic_risk
from server.services.ai import generate_advisory

router = APIRouter(prefix="/api", tags=["Analysis"])

@router.post("/analyze")
async def analyze_farm(request: AnalyzeRequest, authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    user = get_user_from_token(authorization)
    farm_data = None
    farm_id = request.farm_id or "temp-farm"

    if request.farm:
        farm_data = request.farm.model_dump(mode="json")
    elif request.farm_id:
        farm_data = await db_get_farm_by_id(user["id"], request.farm_id)

    if not farm_data:
        raise HTTPException(status_code=400, detail="Farm data or valid farm_id required for analysis")

    lat = farm_data.get("latitude", 0.0)
    lon = farm_data.get("longitude", 37.0)

    # 1. Fetch live weather (or fallback/cached)
    weather = await get_weather_data(lat, lon)

    # 2. Fetch Sentinel-2 Satellite data
    satellite = await get_sentinel_ndvi(lat, lon)

    # 3. Deterministic explainable risk calculation
    observations = request.farmer_observations or []
    risk_res = calculate_deterministic_risk(
        weather=weather,
        farm=farm_data,
        observations=observations,
        satellite=satellite
    )

    # 4. AI Agricultural Advice (Gemini primary, OpenAI fallback, rule fallback)
    lang = request.language or "en"
    ai_res = await generate_advisory(
        farm=farm_data,
        weather=weather,
        risk=risk_res,
        satellite=satellite,
        observations=observations,
        lang=lang
    )

    # 5. Compile Analysis Report
    report = {
        "farm_id": farm_id,
        "farm_name": farm_data.get("name", "Field"),
        "overall_score": risk_res["overall_score"],
        "risk_level": risk_res["risk_level"],
        "drought_risk": risk_res["drought_risk"],
        "flood_risk": risk_res["flood_risk"],
        "crop_stress": risk_res["crop_stress"],
        "ndvi": satellite.get("latest_ndvi"),
        "ndvi_trend": satellite.get("ndvi_trend"),
        "reasons": risk_res["reasons"],
        "recommended_actions": ai_res.get("actions") or risk_res["recommended_actions"],
        "watch_next": ai_res.get("watch_next") or risk_res["watch_next"],
        "ai_headline": ai_res.get("headline"),
        "ai_explanation": ai_res.get("explanation"),
        "ai_provider": ai_res.get("provider", "Rule-Based"),
        "weather_source": f"{weather.get('provider')} ({weather.get('source_status')})",
        "satellite_source": f"{satellite.get('source')} ({satellite.get('status')})",
        "weather_summary": {
            "current_temp": weather.get("current_temp"),
            "condition": weather.get("current_condition"),
            "rainfall_7d": weather.get("rainfall_7d"),
            "rainfall_14d": weather.get("rainfall_14d"),
            "soil_moisture": weather.get("soil_moisture")
        }
    }

    # Save report
    saved = await db_save_analysis(user["id"], report)
    return saved

@router.get("/analyses")
async def list_analyses(
    farm_id: Optional[str] = Query(None),
    authorization: Optional[str] = Header(None)
) -> List[Dict[str, Any]]:
    user = get_user_from_token(authorization)
    return await db_get_analyses(user["id"], farm_id)

@router.get("/analyses/{analysis_id}")
async def get_analysis(
    analysis_id: str = Path(...),
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    user = get_user_from_token(authorization)
    analyses = await db_get_analyses(user["id"])
    for a in analyses:
        if a.get("id") == analysis_id:
            return a
    raise HTTPException(status_code=404, detail="Analysis report not found")
