"""Build and BuildItem database models."""

from datetime import datetime
from typing import Optional, Dict, Any, List
import uuid
import json

from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from backend.db import Base


class Build(Base):
    """A saved build configuration."""

    __tablename__ = "builds"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    class_name = Column(String(100), nullable=True)  # e.g., "Blood Mage"
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    items = relationship(
        "BuildItem", back_populates="build", cascade="all, delete-orphan"
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "id": self.id,
            "name": self.name,
            "class_name": self.class_name,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "items": [item.to_dict() for item in self.items],
        }

    def __repr__(self) -> str:
        return f"<Build(id={self.id}, name={self.name})>"


class BuildItem(Base):
    """An item slot within a build."""

    __tablename__ = "build_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    build_id = Column(String(36), ForeignKey("builds.id"), nullable=False)
    slot = Column(String(50), nullable=False)  # weapon, body, helmet, etc.
    item_name = Column(String(255), nullable=False)  # exact unique name or "Rare ..."
    item_type = Column(String(255), nullable=True)  # base type for API queries
    is_unique = Column(Boolean, default=True)
    required = Column(Boolean, default=True)
    priority = Column(Integer, default=1)  # 1=core, 2=important, 3=luxury
    variant = Column(String(100), nullable=True)  # e.g., "Tecrod" for tribute items
    min_stats_json = Column(Text, nullable=True)  # JSON for rare item stat filters

    # Relationships
    build = relationship("Build", back_populates="items")

    @property
    def min_stats(self) -> Optional[Dict]:
        """Parse min_stats from JSON."""
        if self.min_stats_json:
            return json.loads(self.min_stats_json)
        return None

    @min_stats.setter
    def min_stats(self, value: Optional[Dict]):
        """Serialize min_stats to JSON."""
        self.min_stats_json = json.dumps(value) if value else None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "id": self.id,
            "build_id": self.build_id,
            "slot": self.slot,
            "item_name": self.item_name,
            "item_type": self.item_type,
            "is_unique": self.is_unique,
            "required": self.required,
            "priority": self.priority,
            "variant": self.variant,
            "min_stats": self.min_stats,
        }

    def __repr__(self) -> str:
        return f"<BuildItem(slot={self.slot}, name={self.item_name})>"
