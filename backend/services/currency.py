"""Currency conversion service."""

import logging
from datetime import datetime, timedelta
from typing import Dict, Optional

from sqlalchemy.orm import Session

from backend.config import settings, DEFAULT_CURRENCY_RATES
from backend.models.price import CurrencyRate
from backend.api.trade import trade_client

logger = logging.getLogger(__name__)


class CurrencyService:
    """Service for currency conversion and exchange rate management."""

    def __init__(self, db: Optional[Session] = None):
        self.db = db
        self._cache: Dict[str, float] = {}
        self._cache_time: Optional[datetime] = None
        self._cache_ttl = timedelta(seconds=settings.CURRENCY_CACHE_TTL)

    def _is_cache_valid(self) -> bool:
        """Check if the cache is still valid."""
        if not self._cache_time:
            return False
        return datetime.utcnow() - self._cache_time < self._cache_ttl

    def get_cached_rates(self) -> Dict[str, float]:
        """Get rates from cache or default."""
        if self._is_cache_valid() and self._cache:
            return self._cache.copy()
        return DEFAULT_CURRENCY_RATES.copy()

    async def fetch_rates_from_api(self) -> Dict[str, float]:
        """Fetch current exchange rates from the trade API."""
        try:
            # This would need proper parsing of exchange API response
            # For now, return defaults and update cache
            rates = DEFAULT_CURRENCY_RATES.copy()

            # Try to get rates from API (simplified)
            # In practice, you'd parse the exchange API response
            # response = await trade_client.get_exchange_rates()

            self._cache = rates
            self._cache_time = datetime.utcnow()

            # Store in database if available
            if self.db:
                self._store_rates(rates)

            return rates

        except Exception as e:
            logger.warning(f"Failed to fetch rates from API: {e}")
            return DEFAULT_CURRENCY_RATES.copy()

    def _store_rates(self, rates: Dict[str, float]):
        """Store rates in database."""
        if not self.db:
            return

        for currency, rate in rates.items():
            db_rate = CurrencyRate(
                currency=currency,
                league=settings.POE_LEAGUE,
                chaos_equivalent=rate,
            )
            self.db.add(db_rate)

        try:
            self.db.commit()
        except Exception as e:
            logger.error(f"Failed to store rates: {e}")
            self.db.rollback()

    def get_rates_from_db(self) -> Dict[str, float]:
        """Get latest rates from database."""
        if not self.db:
            return DEFAULT_CURRENCY_RATES.copy()

        rates = {}
        # Get most recent rate for each currency
        from sqlalchemy import func

        subquery = (
            self.db.query(
                CurrencyRate.currency,
                func.max(CurrencyRate.timestamp).label("max_time"),
            )
            .filter(CurrencyRate.league == settings.POE_LEAGUE)
            .group_by(CurrencyRate.currency)
            .subquery()
        )

        results = (
            self.db.query(CurrencyRate)
            .join(
                subquery,
                (CurrencyRate.currency == subquery.c.currency)
                & (CurrencyRate.timestamp == subquery.c.max_time),
            )
            .all()
        )

        for rate in results:
            rates[rate.currency] = rate.chaos_equivalent

        # Fill in missing rates with defaults
        for currency, default_rate in DEFAULT_CURRENCY_RATES.items():
            if currency not in rates:
                rates[currency] = default_rate

        return rates

    def to_chaos(self, amount: float, currency: str) -> float:
        """
        Convert an amount in a given currency to chaos equivalent.

        Args:
            amount: The amount to convert
            currency: The source currency (e.g., "divine", "exalt")

        Returns:
            The chaos equivalent value
        """
        if currency == "chaos":
            return amount

        rates = self.get_cached_rates()
        rate = rates.get(currency.lower(), 1.0)
        return amount * rate

    def from_chaos(self, chaos_amount: float, target_currency: str) -> float:
        """
        Convert chaos to another currency.

        Args:
            chaos_amount: Amount in chaos
            target_currency: Target currency

        Returns:
            Amount in target currency
        """
        if target_currency == "chaos":
            return chaos_amount

        rates = self.get_cached_rates()
        rate = rates.get(target_currency.lower(), 1.0)
        if rate == 0:
            return 0
        return chaos_amount / rate

    def parse_price(self, listing: Dict) -> tuple[float, str]:
        """
        Parse price from a trade listing.

        Args:
            listing: A single listing from the fetch API

        Returns:
            Tuple of (amount, currency)
        """
        try:
            price_info = listing.get("listing", {}).get("price", {})
            amount = price_info.get("amount", 0)
            currency = price_info.get("currency", "chaos")

            # Normalize currency names
            currency_map = {
                "chaos": "chaos",
                "divine": "divine",
                "exalted": "exalt",
                "exalt": "exalt",
                "annulment": "annul",
                "annul": "annul",
                "vaal": "vaal",
                "regal": "regal",
                "alchemy": "alch",
                "alch": "alch",
            }
            currency = currency_map.get(currency.lower(), currency.lower())

            return float(amount), currency
        except (KeyError, TypeError, ValueError) as e:
            logger.warning(f"Failed to parse price: {e}")
            return 0.0, "chaos"


# Global service instance
currency_service = CurrencyService()
