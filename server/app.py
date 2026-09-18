import os
import path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from server.routers import auth, farms, weather, satellite, analysis, imports

app = FastAPI(
    title="MavunoGuard AI API",
    description="Climate-risk, crop-monitoring and decision-support API for smallholder farmers",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router)
app.include_router(farms.router)
app.include_router(weather.router)
app.include_router(satellite.router)
app.include_router(analysis.router)
app.include_router(imports.router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "service": "MavunoGuard AI",
        "version": "1.0.0",
        "environment": os.environ.get("ENVIRONMENT", "production")
    }

# Mount frontend static files if built
dist_dir = os.path.join(os.path.dirname(__file__), "..", "dist")
if os.path.exists(dist_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(dist_dir, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_dir, "index.html"))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server.app:app", host="0.0.0.0", port=port, reload=True)
