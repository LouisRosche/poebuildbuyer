"""GGG Trade API wrapper with rate limiting."""

import asyncio
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import logging

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.config import settings

router = APIRouter(prefix="/trade", tags=["trade"])
logger = logging.getLogger(__name__)


@dataclass
class RateLimitState:
    """Tracks rate limit state from API headers."""

    requests_made: int = 0
    max_requests: int = 5
    period: int = 10
    last_request: float = 0
    retry_after: Optional[float] = None


class TradeAPIClient:
    """Rate-limited client for the PoE Trade API."""

    def __init__(self):
        self.base_url = settings.POE_API_BASE
        self.league = settings.POE_LEAGUE
        self.rate_limit = RateLimitState()
        self._lock = asyncio.Lock()
        self._client: Optional[httpx.AsyncClient] = None

    async def get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers={
                    "User-Agent": settings.USER_AGENT,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                timeout=30.0,
            )
        return self._client

    async def close(self):
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    def _parse_rate_limit_headers(self, headers: Dict[str, str]):
        """Parse rate limit info from response headers."""
        # Headers format: X-Rate-Limit-Ip: max:period:timeout
        # X-Rate-Limit-Ip-State: current:period:timeout
        if "X-Rate-Limit-Ip" in headers:
            parts = headers["X-Rate-Limit-Ip"].split(",")[0].split(":")
            if len(parts) >= 2:
                self.rate_limit.max_requests = int(parts[0])
                self.rate_limit.period = int(parts[1])

        if "X-Rate-Limit-Ip-State" in headers:
            parts = headers["X-Rate-Limit-Ip-State"].split(",")[0].split(":")
            if len(parts) >= 1:
                self.rate_limit.requests_made = int(parts[0])

        if "Retry-After" in headers:
            self.rate_limit.retry_after = float(headers["Retry-After"])

    async def _wait_for_rate_limit(self):
        """Wait if necessary to respect rate limits."""
        async with self._lock:
            now = time.time()

            # If we have a retry-after, respect it
            if self.rate_limit.retry_after:
                wait_time = self.rate_limit.retry_after
                self.rate_limit.retry_after = None
                logger.info(f"Rate limited, waiting {wait_time}s")
                await asyncio.sleep(wait_time)
                return

            # Ensure minimum delay between requests
            time_since_last = now - self.rate_limit.last_request
            if time_since_last < settings.REQUEST_DELAY:
                wait_time = settings.REQUEST_DELAY - time_since_last
                await asyncio.sleep(wait_time)

            self.rate_limit.last_request = time.time()

    async def search(
        self,
        name: Optional[str] = None,
        type_: Optional[str] = None,
        stats: Optional[List[Dict]] = None,
        online_only: bool = True,
    ) -> Dict[str, Any]:
        """
        Search for items on the trade site.

        Returns:
            Dict with 'id' (query ID) and 'result' (list of item hashes)
        """
        await self._wait_for_rate_limit()

        query: Dict[str, Any] = {
            "status": {"option": "online" if online_only else "any"},
        }

        if name:
            query["name"] = name
        if type_:
            query["type"] = type_
        if stats:
            query["stats"] = stats
        else:
            query["stats"] = [{"type": "and", "filters": []}]

        payload = {
            "query": query,
            "sort": {"price": "asc"},
        }

        client = await self.get_client()
        url = f"{self.base_url}/search/poe2/{self.league}"

        try:
            response = await client.post(url, json=payload)
            self._parse_rate_limit_headers(dict(response.headers))

            if response.status_code == 429:
                # Rate limited - parse retry-after and raise
                self._parse_rate_limit_headers(dict(response.headers))
                raise HTTPException(
                    status_code=429,
                    detail=f"Rate limited. Retry after {self.rate_limit.retry_after}s",
                )

            if response.status_code != 200:
                logger.error(f"Trade API error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Trade API error: {response.text}",
                )

            return response.json()

        except httpx.RequestError as e:
            logger.error(f"Request error: {e}")
            raise HTTPException(status_code=503, detail=f"Trade API unavailable: {e}")

    async def fetch_results(
        self, query_id: str, result_hashes: List[str], limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Fetch actual item listings from result hashes.

        Args:
            query_id: The query ID from search
            result_hashes: List of item hashes
            limit: Max items to fetch (max 10 per request)
        """
        if not result_hashes:
            return []

        await self._wait_for_rate_limit()

        # API limits to 10 items per request
        hashes = result_hashes[: min(limit, 10)]
        hash_str = ",".join(hashes)

        client = await self.get_client()
        url = f"{self.base_url}/fetch/{hash_str}?query={query_id}"

        try:
            response = await client.get(url)
            self._parse_rate_limit_headers(dict(response.headers))

            if response.status_code == 429:
                self._parse_rate_limit_headers(dict(response.headers))
                raise HTTPException(
                    status_code=429,
                    detail=f"Rate limited. Retry after {self.rate_limit.retry_after}s",
                )

            if response.status_code != 200:
                logger.error(f"Fetch error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Trade API error: {response.text}",
                )

            data = response.json()
            return data.get("result", [])

        except httpx.RequestError as e:
            logger.error(f"Request error: {e}")
            raise HTTPException(status_code=503, detail=f"Trade API unavailable: {e}")

    async def get_exchange_rates(self, have: str = "chaos") -> Dict[str, Any]:
        """
        Get currency exchange rates.

        Args:
            have: The currency you have (default: chaos)
        """
        await self._wait_for_rate_limit()

        payload = {
            "query": {
                "status": {"option": "online"},
                "have": [have],
                "want": ["divine", "exalt", "annul", "vaal", "regal"],
            }
        }

        client = await self.get_client()
        url = f"{self.base_url}/exchange/poe2/{self.league}"

        try:
            response = await client.post(url, json=payload)
            self._parse_rate_limit_headers(dict(response.headers))

            if response.status_code == 429:
                self._parse_rate_limit_headers(dict(response.headers))
                raise HTTPException(status_code=429, detail="Rate limited")

            if response.status_code != 200:
                logger.error(f"Exchange error: {response.status_code}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Exchange API error: {response.text}",
                )

            return response.json()

        except httpx.RequestError as e:
            logger.error(f"Request error: {e}")
            raise HTTPException(status_code=503, detail=f"Trade API unavailable: {e}")


# Global client instance
trade_client = TradeAPIClient()


# Pydantic models for API endpoints
class SearchRequest(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    stats: Optional[List[Dict[str, Any]]] = None
    online_only: bool = True


class SearchResponse(BaseModel):
    query_id: str
    total: int
    results: List[str]


@router.post("/search", response_model=SearchResponse)
async def search_items(request: SearchRequest):
    """Search for items on the trade site."""
    result = await trade_client.search(
        name=request.name,
        type_=request.type,
        stats=request.stats,
        online_only=request.online_only,
    )
    return SearchResponse(
        query_id=result.get("id", ""),
        total=result.get("total", 0),
        results=result.get("result", [])[:20],  # Limit to 20 hashes
    )


class FetchRequest(BaseModel):
    query_id: str
    hashes: List[str]


@router.post("/fetch")
async def fetch_items(request: FetchRequest):
    """Fetch item details from hashes."""
    results = await trade_client.fetch_results(request.query_id, request.hashes)
    return {"results": results}


@router.get("/status")
async def get_status():
    """Get current rate limit status."""
    return {
        "requests_made": trade_client.rate_limit.requests_made,
        "max_requests": trade_client.rate_limit.max_requests,
        "period": trade_client.rate_limit.period,
        "retry_after": trade_client.rate_limit.retry_after,
    }
