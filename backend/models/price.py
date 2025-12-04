"""Price history and currency rate models."""

from datetime import datetime
from typing import Dict, Any
import uuid

from sqlalchemy import Column, String, Float, Integer, DateTime, Index

from backend.db import Base


class PriceSnapshot(Base):
    """Historical price snapshot for an item."""

    __tablename__ = "price_snapshots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    item_name = Column(String(255), nullable=False, index=True)
    item_type = Column(String(255), nullable=True)  # base type
    league = Column(String(100), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    min_price = Column(Float, nullable=False)
    median_price = Column(Float, nullable=True)
    mean_price = Column(Float, nullable=True)
    max_price = Column(Float, nullable=True)
    currency = Column(String(20), default="chaos")  # original currency
    chaos_equivalent = Column(Float, nullable=False)  # normalized to chaos
    listings_count = Column(Integer, default=0)

    # Composite index for efficient queries
    __table_args__ = (
        Index("ix_price_item_league_time", "item_name", "league", "timestamp"),
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "id": self.id,
            "item_name": self.item_name,
            "item_type": self.item_type,
            "league": self.league,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "min_price": self.min_price,
            "median_price": self.median_price,
            "mean_price": self.mean_price,
            "max_price": self.max_price,
            "currency": self.currency,
            "chaos_equivalent": self.chaos_equivalent,
            "listings_count": self.listings_count,
        }

    def __repr__(self) -> str:
        return f"<PriceSnapshot(item={self.item_name}, price={self.min_price} {self.currency})>"


class CurrencyRate(Base):
    """Exchange rate for a currency to chaos orbs."""

    __tablename__ = "currency_rates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    currency = Column(String(50), nullable=False, index=True)
    league = Column(String(100), nullable=False, index=True)
    chaos_equivalent = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index("ix_currency_league_time", "currency", "league", "timestamp"),
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "id": self.id,
            "currency": self.currency,
            "league": self.league,
            "chaos_equivalent": self.chaos_equivalent,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }

    def __repr__(self) -> str:
        return f"<CurrencyRate({self.currency}={self.chaos_equivalent} chaos)>"
