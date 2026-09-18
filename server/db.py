import os
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

# Lazy Supabase client initialization
_supabase_client = None

def get_supabase():
    global _supabase_client
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        return None
    if _supabase_client is None:
        try:
            from supabase import create_client
            _supabase_client = create_client(url, key)
        except Exception as e:
            print(f"[Supabase] Init error: {e}")
            return None
    return _supabase_client

# In-memory storage fallback for local development / testing
_local_farms: Dict[str, Dict[str, Any]] = {}
_local_observations: Dict[str, List[Dict[str, Any]]] = {}
_local_analyses: Dict[str, List[Dict[str, Any]]] = {}

def get_user_from_token(token: Optional[str]) -> Optional[Dict[str, Any]]:
    if not token:
        # Default guest/local user
        return {"id": "guest-farmer-001", "email": "farmer@mavunoguard.africa", "name": "Local Farmer"}

    token = token.replace("Bearer ", "").strip()
    client = get_supabase()
    if client:
        try:
            user_resp = client.auth.get_user(token)
            if user_resp and user_resp.user:
                return {
                    "id": user_resp.user.id,
                    "email": user_resp.user.email,
                    "name": user_resp.user.user_metadata.get("full_name", user_resp.user.email.split("@")[0])
                }
        except Exception as e:
            print(f"[Auth] Token verification failed: {e}")

    # Fallback / demo token
    return {"id": "demo-user-123", "email": "demo@mavunoguard.africa", "name": "Demo Farmer"}

# Farm DB Helpers
async def db_get_farms(user_id: str) -> List[Dict[str, Any]]:
    client = get_supabase()
    if client:
        try:
            res = client.table("farms").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
            return res.data or []
        except Exception as e:
            print(f"[DB] get_farms error: {e}")

    return [f for f in _local_farms.values() if f.get("user_id") == user_id]

async def db_create_farm(user_id: str, farm_data: Dict[str, Any]) -> Dict[str, Any]:
    farm_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    record = {
        "id": farm_id,
        "user_id": user_id,
        "created_at": now,
        "updated_at": now,
        **farm_data
    }

    client = get_supabase()
    if client:
        try:
            res = client.table("farms").insert(record).execute()
            if res.data:
                return res.data[0]
        except Exception as e:
            print(f"[DB] create_farm error: {e}")

    _local_farms[farm_id] = record
    return record

async def db_get_farm_by_id(user_id: str, farm_id: str) -> Optional[Dict[str, Any]]:
    client = get_supabase()
    if client:
        try:
            res = client.table("farms").select("*").eq("id", farm_id).eq("user_id", user_id).single().execute()
            return res.data
        except Exception as e:
            print(f"[DB] get_farm_by_id error: {e}")

    farm = _local_farms.get(farm_id)
    if farm and farm.get("user_id") == user_id:
        return farm
    return None

async def db_update_farm(user_id: str, farm_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    client = get_supabase()
    if client:
        try:
            res = client.table("farms").update(updates).eq("id", farm_id).eq("user_id", user_id).execute()
            if res.data:
                return res.data[0]
        except Exception as e:
            print(f"[DB] update_farm error: {e}")

    if farm_id in _local_farms and _local_farms[farm_id].get("user_id") == user_id:
        _local_farms[farm_id].update(updates)
        return _local_farms[farm_id]
    return None

async def db_delete_farm(user_id: str, farm_id: str) -> bool:
    client = get_supabase()
    if client:
        try:
            client.table("farms").delete().eq("id", farm_id).eq("user_id", user_id).execute()
            return True
        except Exception as e:
            print(f"[DB] delete_farm error: {e}")

    if farm_id in _local_farms and _local_farms[farm_id].get("user_id") == user_id:
        del _local_farms[farm_id]
        return True
    return False

# Analyses DB Helpers
async def db_save_analysis(user_id: str, analysis: Dict[str, Any]) -> Dict[str, Any]:
    analysis["id"] = str(uuid.uuid4())
    analysis["user_id"] = user_id
    analysis["created_at"] = datetime.now(timezone.utc).isoformat()

    client = get_supabase()
    if client:
        try:
            res = client.table("risk_analyses").insert(analysis).execute()
            if res.data:
                return res.data[0]
        except Exception as e:
            print(f"[DB] save_analysis error: {e}")

    farm_id = analysis.get("farm_id")
    if farm_id not in _local_analyses:
        _local_analyses[farm_id] = []
    _local_analyses[farm_id].insert(0, analysis)
    return analysis

async def db_get_analyses(user_id: str, farm_id: Optional[str] = None) -> List[Dict[str, Any]]:
    client = get_supabase()
    if client:
        try:
            query = client.table("risk_analyses").select("*").eq("user_id", user_id)
            if farm_id:
                query = query.eq("farm_id", farm_id)
            res = query.order("created_at", desc=True).execute()
            return res.data or []
        except Exception as e:
            print(f"[DB] get_analyses error: {e}")

    results = []
    if farm_id:
        results = _local_analyses.get(farm_id, [])
    else:
        for analyses in _local_analyses.values():
            results.extend(analyses)
    return [a for a in results if a.get("user_id") == user_id]
