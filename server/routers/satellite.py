from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any
from server.services.satellite import get_sentinel_ndvi

router = APIRouter(prefix="/api", tags=["Satellite"])

@router.get("/satellite")
async def get_satellite(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0)
) -> Dict[str, Any]:
    try:
        data = await get_sentinel_ndvi(lat, lon)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Satellite query error: {str(e)}")
