from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import date, datetime

class UserProfile(BaseModel):
    id: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    preferred_language: str = "en"
    avatar_url: Optional[str] = None

class FarmBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    size: float = Field(..., gt=0.0)
    unit: str = Field("acres", pattern="^(acres|hectares)$")
    crop: str = Field(..., min_length=1)
    variety: Optional[str] = None
    planting_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    soil_type: Optional[str] = "loam"
    drainage: Optional[str] = "moderate"
    flood_history: Optional[str] = "never"
    slope: Optional[str] = "gentle"
    crop_health: Optional[str] = "good"
    current_problems: List[str] = Field(default_factory=list)
    notes: Optional[str] = None

class FarmCreate(FarmBase):
    pass

class FarmUpdate(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    size: Optional[float] = Field(None, gt=0.0)
    unit: Optional[str] = None
    crop: Optional[str] = None
    variety: Optional[str] = None
    planting_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    soil_type: Optional[str] = None
    drainage: Optional[str] = None
    flood_history: Optional[str] = None
    slope: Optional[str] = None
    crop_health: Optional[str] = None
    current_problems: Optional[List[str]] = None
    notes: Optional[str] = None

class Farm(FarmBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

class FarmObservationCreate(BaseModel):
    farm_id: str
    crop_health: Optional[str] = "good"
    soil_moisture_visual: Optional[str] = "moderate"
    pest_signs: bool = False
    disease_signs: bool = False
    notes: Optional[str] = None
    image_url: Optional[str] = None

class FarmObservation(FarmObservationCreate):
    id: str
    user_id: str
    observation_date: datetime
    created_at: datetime

class WeatherDaily(BaseModel):
    date: str
    temp_max: float
    temp_min: float
    precipitation: float
    precipitation_probability: Optional[float] = 0.0
    weather_code: int

class WeatherData(BaseModel):
    latitude: float
    longitude: float
    current_temp: float
    current_weather_code: int
    current_condition: str
    soil_moisture: Optional[float] = None
    daily: List[WeatherDaily]
    rainfall_7d: float
    rainfall_14d: float
    provider: str
    source_status: str  # "Live" | "Cached" | "Unavailable"
    last_updated: datetime

class SatelliteNDVI(BaseModel):
    configured: bool
    status_message: str
    latest_ndvi: Optional[float] = None
    ndvi_trend: Optional[str] = None
    observation_date: Optional[str] = None
    cloud_cover: Optional[float] = None
    vigor_interpretation: Optional[str] = None
    source: str = "Copernicus Sentinel-2 L2A"
    status: str  # "Live" | "Cached" | "Not Configured" | "Temporarily Unavailable"

class RiskEngineResult(BaseModel):
    overall_score: int = Field(..., ge=0, le=100)
    risk_level: str  # "LOW" | "MODERATE" | "MODERATE-HIGH" | "HIGH"
    drought_risk: int = Field(..., ge=0, le=100)
    flood_risk: int = Field(..., ge=0, le=100)
    crop_stress: int = Field(..., ge=0, le=100)
    reasons: List[str]
    recommended_actions: List[str]
    watch_next: List[str]

class AIAdvice(BaseModel):
    headline: str
    explanation: str
    actions: List[str]
    watch_next: List[str]
    confidence_note: str
    provider: str  # "Google Gemini" | "OpenAI Fallback" | "Deterministic Rule-Based"
    language: str = "en"

class AnalysisReport(BaseModel):
    id: Optional[str] = None
    farm_id: str
    farm_name: str
    created_at: datetime
    overall_score: int
    risk_level: str
    drought_risk: int
    flood_risk: int
    crop_stress: int
    ndvi: Optional[float] = None
    ndvi_trend: Optional[str] = None
    reasons: List[str]
    recommended_actions: List[str]
    watch_next: List[str]
    ai_headline: Optional[str] = None
    ai_explanation: Optional[str] = None
    ai_provider: str
    weather_source: str
    satellite_source: str
    weather_summary: Optional[Dict[str, Any]] = None

class AnalyzeRequest(BaseModel):
    farm_id: Optional[str] = None
    farm: Optional[FarmBase] = None
    farmer_observations: Optional[List[str]] = None
    language: Optional[str] = "en"

class GeoImportResult(BaseModel):
    success: bool
    format: str
    latitude: float
    longitude: float
    point_count: int = 1
    message: str

class SyncItem(BaseModel):
    entity_type: str
    entity_id: Optional[str] = None
    operation: str
    payload: Dict[str, Any]

class SyncRequest(BaseModel):
    items: List[SyncItem]

class SyncResponse(BaseModel):
    success: bool
    processed: int
    failed: int
    errors: List[str] = []
