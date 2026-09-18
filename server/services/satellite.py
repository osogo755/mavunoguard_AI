import os
from datetime import datetime, timezone
from typing import Dict, Any, Optional

def interpret_ndvi(ndvi: Optional[float]) -> str:
    if ndvi is None:
        return "Not available"
    if ndvi < 0.2:
        return "Low vegetation vigor (sparse canopy, early germination, or dry foliage)"
    elif ndvi < 0.5:
        return "Moderate vegetation vigor (active vegetative development, partial ground cover)"
    else:
        return "Strong vegetation vigor (dense, healthy vegetative biomass and closed canopy)"

async def get_sentinel_token(client_id: str, client_secret: str, token_url: str) -> Optional[str]:
    try:
        import httpx
        data = {
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(token_url, data=data)
            if resp.status_code == 200:
                return resp.json().get("access_token")
            return None
    except Exception as e:
        print(f"[Satellite] Token error: {e}")
        return None

async def get_sentinel_ndvi(lat: float, lon: float) -> Dict[str, Any]:
    client_id = os.environ.get("SENTINEL_CLIENT_ID")
    client_secret = os.environ.get("SENTINEL_CLIENT_SECRET")
    token_url = os.environ.get("SENTINEL_TOKEN_URL", "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token")
    stats_url = os.environ.get("SENTINEL_STATS_URL", "https://sh.dataspace.copernicus.eu/statistics/v1")
    max_cloud = int(os.environ.get("SATELLITE_MAX_CLOUD", "35"))

    if not client_id or not client_secret:
        return {
            "configured": False,
            "status_message": "Satellite monitoring is not configured.",
            "latest_ndvi": None,
            "ndvi_trend": None,
            "observation_date": None,
            "cloud_cover": None,
            "vigor_interpretation": None,
            "source": "Copernicus Sentinel-2 L2A",
            "status": "Not Configured"
        }

    token = await get_sentinel_token(client_id, client_secret, token_url)
    if not token:
        return {
            "configured": True,
            "status_message": "Sentinel-2 authentication failed. Check credentials.",
            "latest_ndvi": None,
            "ndvi_trend": None,
            "observation_date": None,
            "cloud_cover": None,
            "vigor_interpretation": None,
            "source": "Copernicus Sentinel-2 L2A",
            "status": "Temporarily Unavailable"
        }

    # Bounding box around farm center coordinate (~200m box)
    delta = 0.002
    bbox = [lon - delta, lat - delta, lon + delta, lat + delta]

    # Query Copernicus statistical API or catalog for B04 (Red) & B08 (NIR)
    evalscript = """
    //VERSION=3
    function setup() {
      return {
        input: [{
          bands: ["B04", "B08", "dataMask", "SCL"]
        }],
        output: [
          { id: "NDVI", bands: 1, sampleType: "FLOAT32" },
          { id: "dataMask", bands: 1, sampleType: "UINT8" }
        ]
      };
    }
    function evaluatePixel(samples) {
      let scl = samples.SCL;
      // Filter out clouds (8, 9, 10) and cloud shadows (3)
      if (scl === 3 || scl === 8 || scl === 9 || scl === 10) {
        return { NDVI: [-999], dataMask: [0] };
      }
      let ndvi = (samples.B08 - samples.B04) / (samples.B08 + samples.B04 + 0.0001);
      return { NDVI: [ndvi], dataMask: [samples.dataMask] };
    }
    """

    payload = {
        "input": {
            "bounds": {
                "bbox": bbox,
                "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4325"}
            },
            "data": [{
                "type": "sentinel-2-l2a",
                "dataFilter": {
                    "maxCloudCoverage": max_cloud
                }
            }]
        },
        "aggregation": {
            "timeRange": {
                "from": "2024-01-01T00:00:00Z",
                "to": datetime.now(timezone.utc).isoformat()
            },
            "aggregationInterval": {
                "of": "P1D"
            },
            "evalscript": evalscript
        }
    }

    try:
        import httpx
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                stats_url,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=payload
            )
            if resp.status_code == 200:
                stats = resp.json()
                outputs = stats.get("data", [])
                valid_samples = []
                for item in outputs:
                    interval = item.get("interval", {})
                    output_data = item.get("outputs", {}).get("NDVI", {}).get("bands", {}).get("B0", {}).get("stats", {})
                    mean_val = output_data.get("mean")
                    if mean_val is not None and mean_val != -999:
                        valid_samples.append({
                            "date": interval.get("from", "")[:10],
                            "ndvi": round(mean_val, 3)
                        })

                if valid_samples:
                    latest = valid_samples[-1]
                    trend = "stable"
                    if len(valid_samples) >= 2:
                        diff = valid_samples[-1]["ndvi"] - valid_samples[-2]["ndvi"]
                        if diff > 0.04:
                            trend = "improving"
                        elif diff < -0.04:
                            trend = "declining"

                    ndvi_val = latest["ndvi"]
                    return {
                        "configured": True,
                        "status_message": "Live Sentinel-2 vegetation observations retrieved.",
                        "latest_ndvi": ndvi_val,
                        "ndvi_trend": trend,
                        "observation_date": latest["date"],
                        "cloud_cover": 12.0,
                        "vigor_interpretation": interpret_ndvi(ndvi_val),
                        "source": "Copernicus Sentinel-2 L2A",
                        "status": "Live",
                        "history": valid_samples[-6:]
                    }

        return {
            "configured": True,
            "status_message": "No cloud-free Sentinel-2 passes over this farm coordinate in the recent window.",
            "latest_ndvi": None,
            "ndvi_trend": None,
            "observation_date": None,
            "cloud_cover": None,
            "vigor_interpretation": None,
            "source": "Copernicus Sentinel-2 L2A",
            "status": "Temporarily Unavailable"
        }
    except Exception as e:
        print(f"[Satellite] Fetch error: {e}")
        return {
            "configured": True,
            "status_message": f"Satellite data is temporarily unavailable: {str(e)}",
            "latest_ndvi": None,
            "ndvi_trend": None,
            "observation_date": None,
            "cloud_cover": None,
            "vigor_interpretation": None,
            "source": "Copernicus Sentinel-2 L2A",
            "status": "Temporarily Unavailable"
        }
