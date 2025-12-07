"""Configuration settings for the PoE2 Build Tracker.

=== LEAGUE UPDATE CHECKLIST ===
When a new PoE2 league launches (e.g., "Legacy of the Vaal"):

1. Update POE_LEAGUE below to the new league name
2. Update backend/api/config.py get_default_leagues() with new league
3. Optionally update DEFAULT_CURRENCY_RATES if economy shifts significantly
4. Run: POST /api/archetypes/sync/trigger to refresh build data
5. Run: POST /api/config/leagues/refresh to update league list

The frontend will automatically fetch the new league from /api/config/leagues.
For static deployments (GitHub Pages), update docs/js/prices.js fallback list.
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "PoE2 Build Tracker"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False  # Disabled by default for security

    # === LEAGUE CONFIGURATION ===
    # Update this when a new league launches
    # Options: "Standard", "Dawn of the Hunt", "Legacy of the Vaal", etc.
    POE_LEAGUE: str = "Dawn of the Hunt"

    # API Configuration
    POE_API_BASE: str = "https://www.pathofexile.com/api/trade2"
    USER_AGENT: str = "PoE2BuildTracker/1.0 (contact@example.com)"

    # CORS settings (comma-separated origins for production)
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Rate limiting (requests per period)
    RATE_LIMIT_REQUESTS: int = 5
    RATE_LIMIT_PERIOD: int = 10  # seconds
    REQUEST_DELAY: float = 2.0  # seconds between requests

    # Database
    DATABASE_URL: str = "sqlite:///./poe2_tracker.db"

    # Redis (optional, for production caching)
    REDIS_URL: Optional[str] = None

    # Cache TTL in seconds
    PRICE_CACHE_TTL: int = 300  # 5 minutes
    CURRENCY_CACHE_TTL: int = 3600  # 1 hour

    # Price snapshot interval (seconds)
    SNAPSHOT_INTERVAL: int = 21600  # 6 hours

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()


# Currency conversion base rates (fallback when API unavailable)
DEFAULT_CURRENCY_RATES = {
    "chaos": 1.0,
    "exalt": 18.0,
    "divine": 150.0,
    "alch": 0.5,
    "annul": 10.0,
    "vaal": 1.0,
    "regal": 1.0,
    "chance": 0.1,
    "fusing": 0.3,
    "jeweller": 0.1,
    "chromatic": 0.05,
    "alteration": 0.05,
    "augmentation": 0.02,
    "transmutation": 0.01,
}

# Item slots configuration
ITEM_SLOTS = [
    "weapon",
    "offhand",
    "body",
    "helmet",
    "gloves",
    "boots",
    "belt",
    "amulet",
    "ring1",
    "ring2",
    "jewel1",
    "jewel2",
    "jewel3",
    "jewel4",
    "jewel5",
    "support",  # For lineage gems like Atalui's Bloodletting
]

# Priority levels
PRIORITY_LEVELS = {
    1: "Core",
    2: "Important",
    3: "Luxury",
}
