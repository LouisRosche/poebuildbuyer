"""FastAPI main application for PoE2 Build Tracker."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.config import settings
from backend.db import init_db
from backend.api.trade import router as trade_router, trade_client
from backend.api.builds import router as builds_router
from backend.api.prices import router as prices_router
from backend.api.interview import router as interview_router
from backend.api.archetypes import router as archetypes_router
from backend.services.scheduler import sync_scheduler
from backend.scrapers.aggregator import build_aggregator

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"League: {settings.POE_LEAGUE}")
    init_db()
    logger.info("Database initialized")

    # Configure and start background sync scheduler
    sync_scheduler.configure(
        sync_func=lambda: build_aggregator.sync_all_sources(),
        interval_hours=6,  # Sync every 6 hours
    )
    await sync_scheduler.start()
    logger.info("Background sync scheduler started")

    yield

    # Shutdown
    logger.info("Shutting down...")
    await sync_scheduler.stop()
    await trade_client.close()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Build planner and price tracker for Path of Exile 2",
    lifespan=lifespan,
)

# CORS middleware for frontend
# Note: allow_credentials=True requires specific origins (not "*")
# In development, allow localhost; in production, set ALLOWED_ORIGINS env var
allowed_origins = settings.ALLOWED_ORIGINS if hasattr(settings, 'ALLOWED_ORIGINS') else [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if not settings.DEBUG else ["*"],
    allow_credentials=not settings.DEBUG,  # Only allow credentials with specific origins
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

# API routers
app.include_router(trade_router, prefix="/api")
app.include_router(builds_router, prefix="/api")
app.include_router(prices_router, prefix="/api")
app.include_router(interview_router, prefix="/api")
app.include_router(archetypes_router, prefix="/api")


# Health check
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "league": settings.POE_LEAGUE,
    }


# Serve frontend static files from docs directory
try:
    app.mount("/static", StaticFiles(directory="docs"), name="static")
except Exception:
    logger.warning("Docs directory not found, static files not mounted")


# Serve index.html for root
@app.get("/")
async def serve_frontend():
    """Serve the frontend application."""
    try:
        return FileResponse("docs/index.html")
    except Exception:
        return {"message": "Frontend not found. API available at /api"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
