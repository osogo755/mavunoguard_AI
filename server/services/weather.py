import httpx
from datetime import datetime, timezone
from typing import Dict, Any, Optional

WEATHER_CODE_DESCRIPTIONS = {
    0: "Clear Sky",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing Rime Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Dense Drizzle",
    61: "Slight Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    71: "Slight Snow",
    73: "Moderate Snow",
    75: "Heavy Snow",
    80: "Slight Rain Showers",
    81: "Moderate Rain Showers",
    82: "Violent Rain Showers",
    95: "Thunderstorm",
    96: "Thunderstorm with Slight Hail",
    99: "Thunderstorm with Heavy Hail"
}

# In-memory LRU-like cache for weather responses
_weather_cache: Dict[str, Dict[str, Any]] = {}

def get_cache_key(lat: float, lon: float) -> str:
    return f"{round(lat, 2)},{round(lon, 2)}"

async def fetch_open_meteo(lat: float, lon: float) -> Dict[str, Any]:
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code",
        "hourly": "soil_moisture_0_to_1cm,temperature_2m,relative_humidity_2m",
        "current": "temperature_2m,relative_humidity_2m,weather_code",
        "timezone": "auto",
        "forecast_days": 14
    }
    async with httpx.AsyncClient(timeout=8.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

        daily_data = []
        d_times = data.get("daily", {}).get("time", [])
        d_max = data.get("daily", {}).get("temperature_2m_max", [])
        d_min = data.get("daily", {}).get("temperature_2m_min", [])
        d_precip = data.get("daily", {}).get("precipitation_sum", [])
        d_prob = data.get("daily", {}).get("precipitation_probability_max", [])
        d_code = data.get("daily", {}).get("weather_code", [])

        rainfall_7d = sum(d_precip[:7]) if d_precip else 0.0
        rainfall_14d = sum(d_precip) if d_precip else 0.0

        for i in range(len(d_times)):
            daily_data.append({
                "date": d_times[i],
                "temp_max": d_max[i] if i < len(d_max) else 25.0,
                "temp_min": d_min[i] if i < len(d_min) else 15.0,
                "precipitation": d_precip[i] if i < len(d_precip) else 0.0,
                "precipitation_probability": d_prob[i] if i < len(d_prob) else 0.0,
                "weather_code": d_code[i] if i < len(d_code) else 0
            })

        curr = data.get("current", {})
        curr_temp = curr.get("temperature_2m", 22.0)
        curr_code = curr.get("weather_code", 0)

        # Average first 24h soil moisture if present
        hourly_sm = data.get("hourly", {}).get("soil_moisture_0_to_1cm", [])
        avg_sm = None
        if hourly_sm:
            valid_sm = [x for x in hourly_sm[:24] if x is not None]
            if valid_sm:
                avg_sm = round(sum(valid_sm) / len(valid_sm), 3)

        return {
            "latitude": lat,
            "longitude": lon,
            "current_temp": curr_temp,
            "current_weather_code": curr_code,
            "current_condition": WEATHER_CODE_DESCRIPTIONS.get(curr_code, "Partly Cloudy"),
            "soil_moisture": avg_sm,
            "daily": daily_data,
            "rainfall_7d": round(rainfall_7d, 1),
            "rainfall_14d": round(rainfall_14d, 1),
            "provider": "Open-Meteo",
            "source_status": "Live",
            "last_updated": datetime.now(timezone.utc).isoformat()
        }

async def fetch_met_norway_fallback(lat: float, lon: float) -> Dict[str, Any]:
    url = "https://api.met.no/weatherapi/locationforecast/2.0/compact"
    headers = {
        "User-Agent": "MavunoGuardAI/1.0 https://github.com/mavunoguard"
    }
    params = {"lat": round(lat, 4), "lon": round(lon, 4)}
    async with httpx.AsyncClient(timeout=8.0) as client:
        resp = await client.get(url, params=params, headers=headers)
        resp.raise_for_status()
        data = resp.json()

        series = data.get("properties", {}).get("timeseries", [])
        if not series:
            raise ValueError("No forecast series returned by MET Norway")

        curr_instant = series[0].get("data", {}).get("instant", {}).get("details", {})
        curr_temp = curr_instant.get("air_temperature", 20.0)

        # Group by day
        day_dict: Dict[str, Dict[str, Any]] = {}
        for item in series:
            time_str = item.get("time", "")[:10]
            details = item.get("data", {}).get("instant", {}).get("details", {})
            temp = details.get("air_temperature", curr_temp)
            precip = item.get("data", {}).get("next_6_hours", {}).get("details", {}).get("precipitation_amount", 0.0)

            if time_str not in day_dict:
                day_dict[time_str] = {"temps": [], "precip": 0.0, "code": 1}
            day_dict[time_str]["temps"].append(temp)
            day_dict[time_str]["precip"] += precip

        daily_data = []
        for d, vals in list(day_dict.items())[:14]:
            daily_data.append({
                "date": d,
                "temp_max": max(vals["temps"]) if vals["temps"] else curr_temp,
                "temp_min": min(vals["temps"]) if vals["temps"] else curr_temp,
                "precipitation": round(vals["precip"], 1),
                "precipitation_probability": 30.0,
                "weather_code": 1
            })

        rainfall_7d = sum(d["precipitation"] for d in daily_data[:7])
        rainfall_14d = sum(d["precipitation"] for d in daily_data)

        return {
            "latitude": lat,
            "longitude": lon,
            "current_temp": curr_temp,
            "current_weather_code": 1,
            "current_condition": "Fair / Clear",
            "soil_moisture": None,
            "daily": daily_data,
            "rainfall_7d": round(rainfall_7d, 1),
            "rainfall_14d": round(rainfall_14d, 1),
            "provider": "MET Norway (Fallback)",
            "source_status": "Live",
            "last_updated": datetime.now(timezone.utc).isoformat()
        }

async def get_weather_data(lat: float, lon: float) -> Dict[str, Any]:
    cache_key = get_cache_key(lat, lon)
    now = datetime.now(timezone.utc)

    # 1. Try Open-Meteo
    try:
        data = await fetch_open_meteo(lat, lon)
        _weather_cache[cache_key] = {"data": data, "cached_at": now}
        return data
    except Exception as e:
        print(f"[Weather] Open-Meteo failed: {e}. Trying MET Norway fallback...")

    # 2. Try MET Norway Fallback
    try:
        data = await fetch_met_norway_fallback(lat, lon)
        _weather_cache[cache_key] = {"data": data, "cached_at": now}
        return data
    except Exception as e:
        print(f"[Weather] MET Norway fallback failed: {e}.")

    # 3. Check memory cache
    if cache_key in _weather_cache:
        cached = _weather_cache[cache_key]["data"]
        cached["source_status"] = "Cached"
        return cached

    # 4. Return clear unavailable status
    return {
        "latitude": lat,
        "longitude": lon,
        "current_temp": 22.0,
        "current_weather_code": 3,
        "current_condition": "Weather Service Unavailable",
        "soil_moisture": None,
        "daily": [],
        "rainfall_7d": 15.0,
        "rainfall_14d": 30.0,
        "provider": "Unavailable",
        "source_status": "Unavailable",
        "last_updated": now.isoformat()
    }
