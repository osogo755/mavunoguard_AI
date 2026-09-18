import os
from fastapi import APIRouter, Header, HTTPException
from typing import Optional, Dict, Any
from server.db import get_user_from_token

router = APIRouter(prefix="/api", tags=["Auth & Config"])

@router.get("/config")
async def get_public_config() -> Dict[str, Any]:
    return {
        "supabase_url": os.environ.get("SUPABASE_URL", ""),
        "supabase_configured": bool(os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_KEY")),
        "google_client_id": os.environ.get("GOOGLE_CLIENT_ID", ""),
        "gemini_configured": bool(os.environ.get("GEMINI_API_KEY")),
        "openai_configured": bool(os.environ.get("OPENAI_API_KEY")),
        "sentinel_configured": bool(os.environ.get("SENTINEL_CLIENT_ID") and os.environ.get("SENTINEL_CLIENT_SECRET")),
        "version": "1.0.0",
        "app_name": "MavunoGuard AI"
    }

@router.get("/auth/me")
async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    user = get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return user
