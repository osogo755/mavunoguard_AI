from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any
from server.services.geo_importer import parse_gpx_content, parse_kml_content, parse_exif_gps
from server.models import GeoImportResult

router = APIRouter(prefix="/api", tags=["Imports"])

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/garmin/import")
async def import_geo_file(file: UploadFile = File(...)) -> GeoImportResult:
    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="File too large (maximum 10MB)")

    filename = (file.filename or "").lower()

    if filename.endswith(".gpx"):
        try:
            text = content.decode("utf-8", errors="replace")
            res = parse_gpx_content(text)
            return GeoImportResult(**res)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    elif filename.endswith(".kml"):
        try:
            text = content.decode("utf-8", errors="replace")
            res = parse_kml_content(text)
            return GeoImportResult(**res)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    elif filename.endswith((".jpg", ".jpeg", ".tif", ".tiff")):
        try:
            res = parse_exif_gps(content)
            return GeoImportResult(**res)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Image EXIF GPS extraction error: {str(e)}")

    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload .gpx, .kml, or a geotagged .jpg/.jpeg image."
        )
