"""Price fetch and history API endpoints."""

from typing import List, Optional, Dict, Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models.build import Build, BuildItem
from backend.models.price import PriceSnapshot
from backend.services.price_fetcher import PriceFetcher, PriceResult
from backend.services.currency import CurrencyService
from backend.config import settings

router = APIRouter(prefix="/prices", tags=["prices"])


# Pydantic models
class PriceRequest(BaseModel):
    item_name: str = Field(..., description="Item name to look up")
    item_type: Optional[str] = Field(None, description="Base type")


class PriceResponse(BaseModel):
    item_name: str
    min_price: float
    median_price: float
    mean_price: float
    max_price: float
    currency: str
    chaos_equivalent: float
    listings_count: int
    cached: bool
    error: Optional[str] = None


class BuildPriceItem(BaseModel):
    slot: str
    item_name: str
    priority: int
    price: PriceResponse


class BuildPriceResponse(BaseModel):
    build_id: str
    build_name: str
    items: List[BuildPriceItem]
    total_cost: float
    core_cost: float  # Priority 1 items only
    currency: str


class PriceHistoryResponse(BaseModel):
    item_name: str
    league: str
    history: List[Dict[str, Any]]


class PriceChangeResponse(BaseModel):
    item_name: str
    change_amount: float
    change_percent: float
    old_price: float
    new_price: float
    period_hours: int


class CurrencyRatesResponse(BaseModel):
    rates: Dict[str, float]
    league: str
    timestamp: str


@router.post("/lookup", response_model=PriceResponse)
async def lookup_price(request: PriceRequest, db: Session = Depends(get_db)):
    """Look up the current price for a single item."""
    fetcher = PriceFetcher(db=db)
    result = await fetcher.get_price(
        item_name=request.item_name,
        item_type=request.item_type,
    )

    return PriceResponse(
        item_name=result.item_name,
        min_price=round(result.min_price, 2),
        median_price=round(result.median_price, 2),
        mean_price=round(result.mean_price, 2),
        max_price=round(result.max_price, 2),
        currency=result.currency,
        chaos_equivalent=round(result.chaos_equivalent, 2),
        listings_count=result.listings_count,
        cached=result.cached,
        error=result.error,
    )


@router.post("/bulk", response_model=List[PriceResponse])
async def lookup_bulk_prices(
    items: List[PriceRequest], db: Session = Depends(get_db)
):
    """Look up prices for multiple items."""
    fetcher = PriceFetcher(db=db)
    results = []

    for item in items:
        result = await fetcher.get_price(
            item_name=item.item_name,
            item_type=item.item_type,
        )
        results.append(
            PriceResponse(
                item_name=result.item_name,
                min_price=round(result.min_price, 2),
                median_price=round(result.median_price, 2),
                mean_price=round(result.mean_price, 2),
                max_price=round(result.max_price, 2),
                currency=result.currency,
                chaos_equivalent=round(result.chaos_equivalent, 2),
                listings_count=result.listings_count,
                cached=result.cached,
                error=result.error,
            )
        )

    return results


@router.get("/build/{build_id}", response_model=BuildPriceResponse)
async def get_build_prices(build_id: str, db: Session = Depends(get_db)):
    """Get current prices for all items in a build."""
    build = db.query(Build).filter(Build.id == build_id).first()
    if not build:
        raise HTTPException(status_code=404, detail="Build not found")

    fetcher = PriceFetcher(db=db)
    price_items = []
    total_cost = 0.0
    core_cost = 0.0

    for item in build.items:
        result = await fetcher.get_price(
            item_name=item.item_name,
            item_type=item.item_type,
        )

        price_response = PriceResponse(
            item_name=result.item_name,
            min_price=round(result.min_price, 2),
            median_price=round(result.median_price, 2),
            mean_price=round(result.mean_price, 2),
            max_price=round(result.max_price, 2),
            currency=result.currency,
            chaos_equivalent=round(result.chaos_equivalent, 2),
            listings_count=result.listings_count,
            cached=result.cached,
            error=result.error,
        )

        price_items.append(
            BuildPriceItem(
                slot=item.slot,
                item_name=item.item_name,
                priority=item.priority,
                price=price_response,
            )
        )

        if result.chaos_equivalent > 0 and not result.error:
            total_cost += result.chaos_equivalent
            if item.priority == 1:
                core_cost += result.chaos_equivalent

    return BuildPriceResponse(
        build_id=build.id,
        build_name=build.name,
        items=price_items,
        total_cost=round(total_cost, 2),
        core_cost=round(core_cost, 2),
        currency="chaos",
    )


@router.get("/history/{item_name}", response_model=PriceHistoryResponse)
async def get_price_history(
    item_name: str,
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
):
    """Get historical price data for an item."""
    fetcher = PriceFetcher(db=db)
    history = fetcher.get_price_history(item_name=item_name, days=days)

    return PriceHistoryResponse(
        item_name=item_name,
        league=settings.POE_LEAGUE,
        history=history,
    )


@router.get("/change/{item_name}", response_model=PriceChangeResponse)
async def get_price_change(
    item_name: str,
    hours: int = Query(24, ge=1, le=168),
    db: Session = Depends(get_db),
):
    """Get price change over a time period."""
    fetcher = PriceFetcher(db=db)
    change = fetcher.get_price_change(item_name=item_name, hours=hours)

    if not change:
        raise HTTPException(
            status_code=404,
            detail="Not enough historical data for price change calculation",
        )

    return PriceChangeResponse(
        item_name=item_name,
        change_amount=change["change_amount"],
        change_percent=change["change_percent"],
        old_price=change["old_price"],
        new_price=change["new_price"],
        period_hours=change["period_hours"],
    )


@router.get("/currency/rates", response_model=CurrencyRatesResponse)
async def get_currency_rates(db: Session = Depends(get_db)):
    """Get current currency exchange rates."""
    service = CurrencyService(db=db)
    rates = service.get_cached_rates()

    return CurrencyRatesResponse(
        rates=rates,
        league=settings.POE_LEAGUE,
        timestamp=datetime.utcnow().isoformat(),
    )


@router.post("/currency/refresh")
async def refresh_currency_rates(db: Session = Depends(get_db)):
    """Force refresh of currency exchange rates."""
    service = CurrencyService(db=db)
    rates = await service.fetch_rates_from_api()

    return CurrencyRatesResponse(
        rates=rates,
        league=settings.POE_LEAGUE,
        timestamp=datetime.utcnow().isoformat(),
    )


class ConvertRequest(BaseModel):
    amount: float
    from_currency: str
    to_currency: str = "chaos"


class ConvertResponse(BaseModel):
    original_amount: float
    original_currency: str
    converted_amount: float
    converted_currency: str
    rate: float


@router.post("/currency/convert", response_model=ConvertResponse)
async def convert_currency(request: ConvertRequest, db: Session = Depends(get_db)):
    """Convert between currencies."""
    service = CurrencyService(db=db)
    rates = service.get_cached_rates()

    # Convert to chaos first
    chaos_amount = service.to_chaos(request.amount, request.from_currency)

    # Then to target currency
    if request.to_currency == "chaos":
        converted = chaos_amount
    else:
        converted = service.from_chaos(chaos_amount, request.to_currency)

    # Calculate effective rate
    if request.amount > 0:
        rate = converted / request.amount
    else:
        rate = 0

    return ConvertResponse(
        original_amount=request.amount,
        original_currency=request.from_currency,
        converted_amount=round(converted, 2),
        converted_currency=request.to_currency,
        rate=round(rate, 4),
    )


# Recent snapshots endpoint for debugging/admin
@router.get("/snapshots/recent")
async def get_recent_snapshots(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Get recent price snapshots (admin/debug endpoint)."""
    snapshots = (
        db.query(PriceSnapshot)
        .order_by(PriceSnapshot.timestamp.desc())
        .limit(limit)
        .all()
    )

    return {"snapshots": [s.to_dict() for s in snapshots]}
