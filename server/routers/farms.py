from fastapi import APIRouter, Header, HTTPException, Path
from typing import Optional, List, Dict, Any
from server.models import FarmCreate, FarmUpdate, FarmObservationCreate, SyncRequest, SyncResponse
from server.db import (
    get_user_from_token,
    db_get_farms,
    db_create_farm,
    db_get_farm_by_id,
    db_update_farm,
    db_delete_farm
)

router = APIRouter(prefix="/api", tags=["Farms"])

@router.get("/farms")
async def list_farms(authorization: Optional[str] = Header(None)) -> List[Dict[str, Any]]:
    user = get_user_from_token(authorization)
    return await db_get_farms(user["id"])

@router.post("/farms")
async def create_farm(farm: FarmCreate, authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    user = get_user_from_token(authorization)
    farm_dict = farm.model_dump(mode="json")
    created = await db_create_farm(user["id"], farm_dict)
    return created

@router.get("/farms/{farm_id}")
async def get_farm(farm_id: str = Path(...), authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    user = get_user_from_token(authorization)
    farm = await db_get_farm_by_id(user["id"], farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm

@router.put("/farms/{farm_id}")
async def update_farm(farm_update: FarmUpdate, farm_id: str = Path(...), authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    user = get_user_from_token(authorization)
    updates = {k: v for k, v in farm_update.model_dump(mode="json").items() if v is not None}
    updated = await db_update_farm(user["id"], farm_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Farm not found or unauthorized")
    return updated

@router.delete("/farms/{farm_id}")
async def delete_farm(farm_id: str = Path(...), authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    user = get_user_from_token(authorization)
    success = await db_delete_farm(user["id"], farm_id)
    if not success:
        raise HTTPException(status_code=404, detail="Farm not found or unauthorized")
    return {"success": True, "message": "Farm deleted successfully"}

@router.post("/sync")
async def process_sync(sync_req: SyncRequest, authorization: Optional[str] = Header(None)) -> SyncResponse:
    user = get_user_from_token(authorization)
    processed = 0
    failed = 0
    errors = []

    for item in sync_req.items:
        try:
            if item.entity_type == "farm":
                if item.operation == "CREATE":
                    await db_create_farm(user["id"], item.payload)
                    processed += 1
                elif item.operation == "UPDATE" and item.entity_id:
                    await db_update_farm(user["id"], item.entity_id, item.payload)
                    processed += 1
                elif item.operation == "DELETE" and item.entity_id:
                    await db_delete_farm(user["id"], item.entity_id)
                    processed += 1
            else:
                processed += 1
        except Exception as e:
            failed += 1
            errors.append(f"Sync error on {item.entity_type} ({item.operation}): {str(e)}")

    return SyncResponse(
        success=(failed == 0),
        processed=processed,
        failed=failed,
        errors=errors
    )
