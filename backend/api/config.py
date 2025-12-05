"""
Configuration API endpoints.
Provides dynamic league configuration and app settings.
"""

import logging
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import aiohttp

from backend.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/config", tags=["config"])


class LeagueInfo(BaseModel):
    id: str
    name: str
    is_current: bool = False
    is_hardcore: bool = False


class ConfigResponse(BaseModel):
    app_name: str
    app_version: str
    current_league: str
    leagues: List[LeagueInfo]
    last_updated: str


# Cache for leagues (refreshed periodically)
_leagues_cache: List[LeagueInfo] = []
_leagues_cache_time: Optional[datetime] = None
LEAGUES_CACHE_TTL = 3600  # 1 hour


async def fetch_leagues_from_poe_ninja() -> List[LeagueInfo]:
    """Fetch available leagues from poe.ninja API."""
    try:
        async with aiohttp.ClientSession() as session:
            # poe.ninja doesn't have a direct leagues endpoint, but we can infer from economy
            # For PoE2, we use known league patterns
            url = "https://poe.ninja/api/data/getindexstate"
            async with session.get(url, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    leagues = []

                    # Extract PoE2 leagues from the response
                    economy_leagues = data.get("economyLeagues", [])
                    for league in economy_leagues:
                        league_name = league.get("name", "")
                        # Filter for PoE2 leagues (they typically have specific patterns)
                        if league_name and "poe2" in league.get("url", "").lower():
                            leagues.append(LeagueInfo(
                                id=league_name,
                                name=league.get("displayName", league_name),
                                is_current="current" in league.get("url", "").lower(),
                                is_hardcore="hardcore" in league_name.lower() or "hc " in league_name.lower()
                            ))

                    if leagues:
                        return leagues
    except Exception as e:
        logger.warning(f"Failed to fetch leagues from poe.ninja: {e}")

    return []


def get_default_leagues() -> List[LeagueInfo]:
    """Return default/fallback league list for PoE2."""
    current_league = settings.POE_LEAGUE

    # Known PoE2 leagues - update this when new leagues are announced
    # The current league from settings is marked as current
    leagues = [
        LeagueInfo(id="Standard", name="Standard", is_current=current_league == "Standard"),
        LeagueInfo(
            id="Dawn of the Hunt",
            name="Dawn of the Hunt",
            is_current=current_league == "Dawn of the Hunt"
        ),
        LeagueInfo(
            id="HC Dawn of the Hunt",
            name="HC Dawn of the Hunt",
            is_hardcore=True,
            is_current=current_league == "HC Dawn of the Hunt"
        ),
        # Future league - will be activated when it launches
        LeagueInfo(
            id="Legacy of the Vaal",
            name="Legacy of the Vaal (Upcoming)",
            is_current=current_league == "Legacy of the Vaal"
        ),
        LeagueInfo(
            id="HC Legacy of the Vaal",
            name="HC Legacy of the Vaal (Upcoming)",
            is_hardcore=True,
            is_current=current_league == "HC Legacy of the Vaal"
        ),
    ]

    return leagues


async def get_cached_leagues() -> List[LeagueInfo]:
    """Get leagues with caching."""
    global _leagues_cache, _leagues_cache_time

    now = datetime.utcnow()

    # Check cache validity
    if _leagues_cache and _leagues_cache_time:
        age = (now - _leagues_cache_time).total_seconds()
        if age < LEAGUES_CACHE_TTL:
            return _leagues_cache

    # Try to fetch fresh data
    fresh_leagues = await fetch_leagues_from_poe_ninja()

    if fresh_leagues:
        _leagues_cache = fresh_leagues
        _leagues_cache_time = now
        return fresh_leagues

    # Fallback to defaults
    return get_default_leagues()


@router.get("", response_model=ConfigResponse)
async def get_config():
    """
    Get application configuration including current league and available leagues.

    This endpoint provides dynamic configuration that the frontend can use
    to stay synchronized with the backend settings.
    """
    leagues = await get_cached_leagues()

    return ConfigResponse(
        app_name=settings.APP_NAME,
        app_version=settings.APP_VERSION,
        current_league=settings.POE_LEAGUE,
        leagues=leagues,
        last_updated=datetime.utcnow().isoformat()
    )


@router.get("/leagues", response_model=List[LeagueInfo])
async def get_leagues():
    """
    Get available leagues.

    Attempts to fetch from poe.ninja, falls back to known leagues.
    """
    return await get_cached_leagues()


@router.get("/current-league")
async def get_current_league():
    """Get the currently configured league."""
    return {
        "league": settings.POE_LEAGUE,
        "message": f"Currently tracking {settings.POE_LEAGUE}"
    }


@router.post("/leagues/refresh")
async def refresh_leagues():
    """Force refresh of league list from poe.ninja."""
    global _leagues_cache, _leagues_cache_time

    fresh_leagues = await fetch_leagues_from_poe_ninja()

    if fresh_leagues:
        _leagues_cache = fresh_leagues
        _leagues_cache_time = datetime.utcnow()
        return {
            "status": "refreshed",
            "leagues": fresh_leagues,
            "source": "poe.ninja"
        }

    # Return defaults if refresh failed
    defaults = get_default_leagues()
    return {
        "status": "fallback",
        "leagues": defaults,
        "source": "defaults",
        "message": "Could not fetch from poe.ninja, using default league list"
    }
