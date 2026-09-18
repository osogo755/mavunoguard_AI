from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any
from server.services.weather import get_weather_data

router = APIRouter(prefix="/api", tags=["Weather"])

@router.get("/weather")
async def get_weather(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0)
) -> Dict[str, Any]:
    try:
        data = await get_weather_data(lat, lon)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve weather data: {str(e)}")
