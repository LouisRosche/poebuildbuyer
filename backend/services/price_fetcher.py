"""Price fetching service with caching."""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import statistics

from sqlalchemy.orm import Session

from backend.config import settings
from backend.models.price import PriceSnapshot
from backend.models.build import BuildItem
from backend.api.trade import trade_client
from backend.services.currency import currency_service

logger = logging.getLogger(__name__)


@dataclass
class PriceResult:
    """Result from a price lookup."""

    item_name: str
    min_price: float
    median_price: float
    mean_price: float
    max_price: float
    currency: str
    chaos_equivalent: float
    listings_count: int
    cached: bool = False
    error: Optional[str] = None


class PriceCache:
    """In-memory cache for price results."""

    def __init__(self, ttl_seconds: int = 300):
        self._cache: Dict[str, tuple[PriceResult, datetime]] = {}
        self._ttl = timedelta(seconds=ttl_seconds)

    def get(self, item_name: str) -> Optional[PriceResult]:
        """Get cached price if valid."""
        if item_name not in self._cache:
            return None

        result, timestamp = self._cache[item_name]
        if datetime.utcnow() - timestamp > self._ttl:
            del self._cache[item_name]
            return None

        result.cached = True
        return result

    def set(self, item_name: str, result: PriceResult):
        """Cache a price result."""
        self._cache[item_name] = (result, datetime.utcnow())

    def clear(self):
        """Clear all cached prices."""
        self._cache.clear()


class PriceFetcher:
    """Service for fetching and caching item prices."""

    def __init__(self, db: Optional[Session] = None):
        self.db = db
        self.cache = PriceCache(ttl_seconds=settings.PRICE_CACHE_TTL)

    async def get_price(
        self,
        item_name: str,
        item_type: Optional[str] = None,
        use_cache: bool = True,
    ) -> PriceResult:
        """
        Get the current price for an item.

        Args:
            item_name: The exact item name (for uniques)
            item_type: The base type (e.g., "Sacred Focus")
            use_cache: Whether to use cached results

        Returns:
            PriceResult with price statistics
        """
        # Check cache first
        if use_cache:
            cached = self.cache.get(item_name)
            if cached:
                logger.debug(f"Cache hit for {item_name}")
                return cached

        try:
            # Search for the item
            search_result = await trade_client.search(
                name=item_name,
                type_=item_type,
                online_only=True,
            )

            query_id = search_result.get("id", "")
            result_hashes = search_result.get("result", [])
            total = search_result.get("total", 0)

            if not result_hashes:
                return PriceResult(
                    item_name=item_name,
                    min_price=0,
                    median_price=0,
                    mean_price=0,
                    max_price=0,
                    currency="chaos",
                    chaos_equivalent=0,
                    listings_count=0,
                    error="No listings found",
                )

            # Fetch the actual listings (max 10)
            listings = await trade_client.fetch_results(
                query_id, result_hashes[:10], limit=10
            )

            # Parse prices from listings
            prices_chaos = []
            for listing in listings:
                amount, currency = currency_service.parse_price(listing)
                if amount > 0:
                    chaos_value = currency_service.to_chaos(amount, currency)
                    # Skip unreasonably high prices (likely mirrors/negotiation)
                    if chaos_value < 1000000:
                        prices_chaos.append(chaos_value)

            if not prices_chaos:
                return PriceResult(
                    item_name=item_name,
                    min_price=0,
                    median_price=0,
                    mean_price=0,
                    max_price=0,
                    currency="chaos",
                    chaos_equivalent=0,
                    listings_count=total,
                    error="Could not parse any valid prices",
                )

            # Calculate statistics
            min_price = min(prices_chaos)
            max_price = max(prices_chaos)
            median_price = statistics.median(prices_chaos)
            mean_price = statistics.mean(prices_chaos)

            result = PriceResult(
                item_name=item_name,
                min_price=min_price,
                median_price=median_price,
                mean_price=mean_price,
                max_price=max_price,
                currency="chaos",
                chaos_equivalent=min_price,  # Use min as the "buyable" price
                listings_count=total,
            )

            # Cache the result
            self.cache.set(item_name, result)

            # Store snapshot in database
            if self.db:
                self._store_snapshot(result, item_type)

            return result

        except Exception as e:
            logger.error(f"Error fetching price for {item_name}: {e}")
            return PriceResult(
                item_name=item_name,
                min_price=0,
                median_price=0,
                mean_price=0,
                max_price=0,
                currency="chaos",
                chaos_equivalent=0,
                listings_count=0,
                error=str(e),
            )

    def _store_snapshot(self, result: PriceResult, item_type: Optional[str] = None):
        """Store a price snapshot in the database."""
        if not self.db:
            return

        snapshot = PriceSnapshot(
            item_name=result.item_name,
            item_type=item_type,
            league=settings.POE_LEAGUE,
            min_price=result.min_price,
            median_price=result.median_price,
            mean_price=result.mean_price,
            max_price=result.max_price,
            currency=result.currency,
            chaos_equivalent=result.chaos_equivalent,
            listings_count=result.listings_count,
        )
        self.db.add(snapshot)

        try:
            self.db.commit()
        except Exception as e:
            logger.error(f"Failed to store snapshot: {e}")
            self.db.rollback()

    async def get_build_prices(
        self, items: List[BuildItem]
    ) -> tuple[List[PriceResult], float]:
        """
        Get prices for all items in a build.

        Args:
            items: List of BuildItem objects

        Returns:
            Tuple of (list of PriceResults, total cost in chaos)
        """
        results = []
        total_cost = 0.0

        for item in items:
            result = await self.get_price(
                item_name=item.item_name,
                item_type=item.item_type,
            )
            results.append(result)

            if result.chaos_equivalent > 0 and not result.error:
                total_cost += result.chaos_equivalent

        return results, total_cost

    def get_price_history(
        self,
        item_name: str,
        days: int = 7,
    ) -> List[Dict[str, Any]]:
        """
        Get historical price data for an item.

        Args:
            item_name: The item name to look up
            days: Number of days of history

        Returns:
            List of price snapshots
        """
        if not self.db:
            return []

        since = datetime.utcnow() - timedelta(days=days)

        snapshots = (
            self.db.query(PriceSnapshot)
            .filter(
                PriceSnapshot.item_name == item_name,
                PriceSnapshot.league == settings.POE_LEAGUE,
                PriceSnapshot.timestamp >= since,
            )
            .order_by(PriceSnapshot.timestamp.asc())
            .all()
        )

        return [s.to_dict() for s in snapshots]

    def get_price_change(
        self, item_name: str, hours: int = 24
    ) -> Optional[Dict[str, Any]]:
        """
        Calculate price change over a time period.

        Returns:
            Dict with 'change_amount', 'change_percent', 'old_price', 'new_price'
        """
        if not self.db:
            return None

        now = datetime.utcnow()
        since = now - timedelta(hours=hours)

        # Get oldest and newest snapshots in the period
        old_snapshot = (
            self.db.query(PriceSnapshot)
            .filter(
                PriceSnapshot.item_name == item_name,
                PriceSnapshot.league == settings.POE_LEAGUE,
                PriceSnapshot.timestamp >= since,
            )
            .order_by(PriceSnapshot.timestamp.asc())
            .first()
        )

        new_snapshot = (
            self.db.query(PriceSnapshot)
            .filter(
                PriceSnapshot.item_name == item_name,
                PriceSnapshot.league == settings.POE_LEAGUE,
            )
            .order_by(PriceSnapshot.timestamp.desc())
            .first()
        )

        if not old_snapshot or not new_snapshot:
            return None

        old_price = old_snapshot.chaos_equivalent
        new_price = new_snapshot.chaos_equivalent

        if old_price == 0:
            return None

        change_amount = new_price - old_price
        change_percent = (change_amount / old_price) * 100

        return {
            "change_amount": round(change_amount, 2),
            "change_percent": round(change_percent, 2),
            "old_price": round(old_price, 2),
            "new_price": round(new_price, 2),
            "period_hours": hours,
        }


# Global service instance (without DB - use dependency injection in routes)
price_fetcher = PriceFetcher()
