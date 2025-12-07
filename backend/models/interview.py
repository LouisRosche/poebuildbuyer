"""Build interview and recommendation models."""

from datetime import datetime
from typing import Optional, Dict, Any, List
import uuid
import json

from sqlalchemy import Column, String, Integer, DateTime, Text, Float

from backend.db import Base


class BuildArchetype(Base):
    """A build archetype/template that can have multiple budget variants."""

    __tablename__ = "build_archetypes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(100), nullable=False, unique=True)  # URL-friendly identifier

    # Classification
    class_name = Column(String(100), nullable=False, index=True)
    primary_playstyle = Column(String(50), nullable=False)  # melee, ranged, spell, minion, hybrid
    damage_type = Column(String(50), nullable=False)  # physical, fire, cold, lightning, chaos, mixed

    # Tags for matching (JSON array)
    tags_json = Column(Text, nullable=True)  # ["boss-killer", "fast-mapper", "tanky", "league-start"]

    # Content suitability scores (1-10)
    mapping_score = Column(Integer, default=5)
    bossing_score = Column(Integer, default=5)
    league_start_score = Column(Integer, default=5)

    # Complexity (1=beginner, 2=intermediate, 3=advanced)
    complexity = Column(Integer, default=2)

    # Description
    description = Column(Text, nullable=True)
    pros_json = Column(Text, nullable=True)  # JSON array of pros
    cons_json = Column(Text, nullable=True)  # JSON array of cons

    # Guide/notes
    playstyle_notes = Column(Text, nullable=True)
    leveling_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def tags(self) -> List[str]:
        if self.tags_json:
            return json.loads(self.tags_json)
        return []

    @tags.setter
    def tags(self, value: List[str]):
        self.tags_json = json.dumps(value) if value else None

    @property
    def pros(self) -> List[str]:
        if self.pros_json:
            return json.loads(self.pros_json)
        return []

    @pros.setter
    def pros(self, value: List[str]):
        self.pros_json = json.dumps(value) if value else None

    @property
    def cons(self) -> List[str]:
        if self.cons_json:
            return json.loads(self.cons_json)
        return []

    @cons.setter
    def cons(self, value: List[str]):
        self.cons_json = json.dumps(value) if value else None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "class_name": self.class_name,
            "primary_playstyle": self.primary_playstyle,
            "damage_type": self.damage_type,
            "tags": self.tags,
            "mapping_score": self.mapping_score,
            "bossing_score": self.bossing_score,
            "league_start_score": self.league_start_score,
            "complexity": self.complexity,
            "description": self.description,
            "pros": self.pros,
            "cons": self.cons,
            "playstyle_notes": self.playstyle_notes,
            "leveling_notes": self.leveling_notes,
        }


class BudgetTier(Base):
    """A budget tier variant of an archetype with specific items."""

    __tablename__ = "budget_tiers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    archetype_id = Column(String(36), nullable=False, index=True)

    # Tier info
    tier_name = Column(String(50), nullable=False)  # "budget", "mid", "endgame", "mirror"
    tier_order = Column(Integer, default=1)  # For sorting

    # Budget range (in chaos)
    min_budget = Column(Float, default=0)
    max_budget = Column(Float, nullable=True)  # null = unlimited
    estimated_cost = Column(Float, nullable=True)  # Cached estimated cost

    # Description of this tier
    description = Column(Text, nullable=True)
    upgrade_notes = Column(Text, nullable=True)  # What to upgrade next

    # Items for this tier (JSON array of item objects)
    items_json = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def items(self) -> List[Dict[str, Any]]:
        if self.items_json:
            return json.loads(self.items_json)
        return []

    @items.setter
    def items(self, value: List[Dict[str, Any]]):
        self.items_json = json.dumps(value) if value else "[]"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "archetype_id": self.archetype_id,
            "tier_name": self.tier_name,
            "tier_order": self.tier_order,
            "min_budget": self.min_budget,
            "max_budget": self.max_budget,
            "estimated_cost": self.estimated_cost,
            "description": self.description,
            "upgrade_notes": self.upgrade_notes,
            "items": self.items,
        }


class InterviewSession(Base):
    """Stores user interview responses for build recommendations."""

    __tablename__ = "interview_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Interview responses (JSON object)
    responses_json = Column(Text, nullable=False, default="{}")

    # Computed recommendation scores (JSON object)
    scores_json = Column(Text, nullable=True)

    # Final recommendations (JSON array of archetype IDs with scores)
    recommendations_json = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    @property
    def responses(self) -> Dict[str, Any]:
        if self.responses_json:
            return json.loads(self.responses_json)
        return {}

    @responses.setter
    def responses(self, value: Dict[str, Any]):
        self.responses_json = json.dumps(value) if value else "{}"

    @property
    def scores(self) -> Dict[str, float]:
        if self.scores_json:
            return json.loads(self.scores_json)
        return {}

    @scores.setter
    def scores(self, value: Dict[str, float]):
        self.scores_json = json.dumps(value) if value else None

    @property
    def recommendations(self) -> List[Dict[str, Any]]:
        if self.recommendations_json:
            return json.loads(self.recommendations_json)
        return []

    @recommendations.setter
    def recommendations(self, value: List[Dict[str, Any]]):
        self.recommendations_json = json.dumps(value) if value else None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "responses": self.responses,
            "scores": self.scores,
            "recommendations": self.recommendations,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


# Interview question definitions - synced with frontend docs/js/data.js
# IMPORTANT: Keep in sync with frontend Data.INTERVIEW_QUESTIONS
INTERVIEW_QUESTIONS = [
    {
        "id": "class",
        "question": "What class are you playing (or want to play)?",
        "type": "select",
        "required": True,
        "options": [
            {"value": "any", "label": "I'm flexible / Show me all options"},
            {"value": "warrior", "label": "Warrior"},
            {"value": "sorceress", "label": "Sorceress"},
            {"value": "witch", "label": "Witch"},
            {"value": "ranger", "label": "Ranger"},
            {"value": "huntress", "label": "Huntress"},
            {"value": "mercenary", "label": "Mercenary"},
            {"value": "monk", "label": "Monk"},
        ],
        "weight": 2.0,
    },
    {
        "id": "playstyle",
        "question": "What playstyle do you enjoy most?",
        "type": "select",
        "required": True,
        "options": [
            {"value": "any", "label": "I enjoy variety / No preference"},
            {"value": "melee", "label": "Up close and personal - Melee combat"},
            {"value": "ranged", "label": "Keep my distance - Ranged attacks"},
            {"value": "spell", "label": "Cast powerful spells"},
            {"value": "minion", "label": "Let my minions do the work"},
            {"value": "hybrid", "label": "A mix of styles"},
        ],
        "weight": 2.0,
    },
    {
        "id": "damage_preference",
        "question": "Do you have a damage type preference?",
        "type": "select",
        "required": False,
        "options": [
            {"value": "any", "label": "No preference"},
            {"value": "physical", "label": "Physical - Raw brute force"},
            {"value": "fire", "label": "Fire - Burn everything"},
            {"value": "cold", "label": "Cold - Freeze and shatter"},
            {"value": "lightning", "label": "Lightning - Shock and awe"},
            {"value": "chaos", "label": "Chaos - Poison and decay"},
        ],
        "weight": 1.5,
    },
    {
        "id": "content_focus",
        "question": "What content will you focus on?",
        "type": "multiselect",
        "required": True,
        "options": [
            {"value": "mapping", "label": "Fast map clearing"},
            {"value": "bossing", "label": "Boss killing"},
            {"value": "both", "label": "Balanced - both mapping and bossing"},
        ],
        "weight": 1.5,
    },
    {
        "id": "clear_speed",
        "question": "How fast do you want to clear maps?",
        "type": "select",
        "required": False,
        "options": [
            {"value": "any", "label": "No preference"},
            {"value": "slow", "label": "Slow and steady - I enjoy thorough clearing"},
            {"value": "moderate", "label": "Moderate - balanced pace"},
            {"value": "fast", "label": "Fast - I want to zoom through maps"},
            {"value": "zoom", "label": "Maximum speed - screen-wide clears"},
        ],
        "weight": 1.0,
    },
    {
        "id": "budget",
        "question": "What's your approximate budget?",
        "type": "select",
        "required": True,
        "options": [
            {"value": "starter", "label": "League start / Very low (< 50 chaos)"},
            {"value": "budget", "label": "Budget (50-500 chaos)"},
            {"value": "mid", "label": "Mid-tier (500-5000 chaos / few divines)"},
            {"value": "high", "label": "High budget (5000+ chaos / 5+ divines)"},
            {"value": "unlimited", "label": "Sky's the limit / Min-max everything"},
        ],
        "weight": 1.0,
    },
    {
        "id": "experience",
        "question": "What's your experience level with PoE?",
        "type": "select",
        "required": True,
        "options": [
            {"value": "new", "label": "New to PoE - Keep it simple"},
            {"value": "casual", "label": "Casual - I know the basics"},
            {"value": "intermediate", "label": "Intermediate - I understand most mechanics"},
            {"value": "experienced", "label": "Experienced - Bring on the complexity"},
        ],
        "weight": 1.0,
    },
    {
        "id": "survivability",
        "question": "How important is survivability to you?",
        "type": "select",
        "required": False,
        "options": [
            {"value": "any", "label": "No preference"},
            {"value": "glass_cannon", "label": "Maximum damage, I'll just dodge"},
            {"value": "balanced", "label": "Balanced - I want some tankiness"},
            {"value": "tanky", "label": "Very tanky - I hate dying"},
        ],
        "weight": 1.0,
    },
]

# Budget tier definitions
BUDGET_TIERS = {
    "starter": {"name": "League Start", "min": 0, "max": 50, "order": 1},
    "budget": {"name": "Budget", "min": 50, "max": 500, "order": 2},
    "mid": {"name": "Mid-Tier", "min": 500, "max": 5000, "order": 3},
    "high": {"name": "High Budget", "min": 5000, "max": 50000, "order": 4},
    "mirror": {"name": "Min-Maxed", "min": 50000, "max": None, "order": 5},
}

# Experience to complexity mapping
EXPERIENCE_COMPLEXITY = {
    "new": 1,
    "casual": 1,
    "intermediate": 2,
    "experienced": 3,
}
