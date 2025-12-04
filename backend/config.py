"""Configuration settings for the PoE2 Build Tracker."""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "PoE2 Build Tracker"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # API Configuration
    POE_API_BASE: str = "https://www.pathofexile.com/api/trade2"
    POE_LEAGUE: str = "Rise of the Abyssal"
    USER_AGENT: str = "PoE2BuildTracker/1.0 (contact@example.com)"

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
