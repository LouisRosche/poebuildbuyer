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

    yield

    # Shutdown
    logger.info("Shutting down...")
    await trade_client.close()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Build planner and price tracker for Path of Exile 2",
    lifespan=lifespan,
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routers
app.include_router(trade_router, prefix="/api")
app.include_router(builds_router, prefix="/api")
app.include_router(prices_router, prefix="/api")


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


# Serve frontend static files
try:
    app.mount("/static", StaticFiles(directory="frontend"), name="static")
except Exception:
    logger.warning("Frontend directory not found, static files not mounted")


# Serve index.html for root
@app.get("/")
async def serve_frontend():
    """Serve the frontend application."""
    try:
        return FileResponse("frontend/index.html")
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
