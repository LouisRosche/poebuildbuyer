"""Build recommendation engine based on interview responses."""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

from sqlalchemy.orm import Session

from backend.models.interview import (
    BuildArchetype,
    BudgetTier,
    InterviewSession,
    INTERVIEW_QUESTIONS,
    BUDGET_TIERS,
    EXPERIENCE_COMPLEXITY,
)
from backend.services.price_fetcher import PriceFetcher

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """Engine for scoring and recommending builds based on user preferences."""

    def __init__(self, db: Session):
        self.db = db

    def get_questions(self) -> List[Dict[str, Any]]:
        """Get the interview questions."""
        return INTERVIEW_QUESTIONS

    def create_session(self) -> InterviewSession:
        """Create a new interview session."""
        session = InterviewSession()
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_session(self, session_id: str) -> Optional[InterviewSession]:
        """Get an interview session by ID."""
        return self.db.query(InterviewSession).filter(
            InterviewSession.id == session_id
        ).first()

    def update_responses(
        self, session_id: str, responses: Dict[str, Any]
    ) -> Optional[InterviewSession]:
        """Update interview responses for a session."""
        session = self.get_session(session_id)
        if not session:
            return None

        # Merge with existing responses
        current = session.responses
        current.update(responses)
        session.responses = current
        self.db.commit()
        self.db.refresh(session)
        return session

    def score_archetype(
        self, archetype: BuildArchetype, responses: Dict[str, Any]
    ) -> float:
        """
        Score an archetype based on user responses.
        Higher score = better match.
        """
        score = 100.0  # Start with base score

        # Class matching
        user_class = responses.get("class", "any")
        if user_class != "any":
            # Map user-friendly names to archetype class names (PoE2 classes)
            class_mapping = {
                "witch": ["Witch", "Infernalist", "Blood Mage", "Lich"],
                "sorceress": ["Sorceress", "Stormweaver", "Chronomancer"],
                "ranger": ["Ranger", "Deadeye", "Pathfinder"],
                "huntress": ["Huntress", "Amazon", "Ritualist"],
                "mercenary": ["Mercenary", "Witchhunter", "Gemling Legionnaire", "Tactician"],
                "monk": ["Monk", "Invoker", "Acolyte of Chayula"],
                "warrior": ["Warrior", "Titan", "Warbringer", "Smith of Kitava"],
            }
            valid_classes = class_mapping.get(user_class, [user_class.title()])
            if archetype.class_name not in valid_classes:
                score -= 50  # Heavy penalty for wrong class

        # Playstyle matching
        user_playstyle = responses.get("playstyle", "any")
        if user_playstyle != "any":
            if archetype.primary_playstyle != user_playstyle:
                # Partial match for hybrid
                if archetype.primary_playstyle == "hybrid":
                    score -= 10
                else:
                    score -= 30

        # Damage type matching
        user_damage = responses.get("damage_preference", "any")
        if user_damage != "any":
            if archetype.damage_type != user_damage and archetype.damage_type != "mixed":
                score -= 20

        # Content focus matching
        content_focus = responses.get("content_focus", [])
        if isinstance(content_focus, str):
            content_focus = [content_focus]

        if "mapping" in content_focus or "both" in content_focus:
            score += archetype.mapping_score * 2
        if "bossing" in content_focus or "both" in content_focus:
            score += archetype.bossing_score * 2

        # Budget matching - check league start viability
        budget = responses.get("budget", "mid")
        if budget in ["starter", "budget"]:
            score += archetype.league_start_score * 3

        # Experience/complexity matching
        experience = responses.get("experience", "intermediate")
        max_complexity = EXPERIENCE_COMPLEXITY.get(experience, 2)
        if archetype.complexity > max_complexity:
            score -= (archetype.complexity - max_complexity) * 15

        # Survivability preferences
        survivability = responses.get("survivability", "balanced")
        if survivability in ["tanky", "immortal"]:
            if "tanky" in archetype.tags or "defensive" in archetype.tags:
                score += 15
            if "glass-cannon" in archetype.tags:
                score -= 20
        elif survivability == "glass_cannon":
            if "glass-cannon" in archetype.tags or "high-damage" in archetype.tags:
                score += 10

        # Clear speed preferences
        clear_speed = responses.get("clear_speed", "moderate")
        if clear_speed in ["fast", "zoom"]:
            if "fast-mapper" in archetype.tags or "speed" in archetype.tags:
                score += 15
            score += archetype.mapping_score

        # Things to avoid
        avoid = responses.get("avoid", [])
        if isinstance(avoid, str):
            avoid = [avoid]

        avoid_tag_mapping = {
            "piano": ["piano", "complex-rotation"],
            "minions": ["minion", "summoner"],
            "dot": ["dot", "damage-over-time"],
            "melee": ["melee"],
            "channeling": ["channeling"],
            "totems": ["totem", "totems"],
        }

        for avoid_item in avoid:
            bad_tags = avoid_tag_mapping.get(avoid_item, [])
            for tag in bad_tags:
                if tag in archetype.tags or archetype.primary_playstyle == tag.rstrip("s"):
                    score -= 40

        # Existing gear bonus
        existing_gear = responses.get("existing_gear", "").lower().strip()
        if existing_gear:
            # Check if any tier of this archetype uses the item
            tiers = self.db.query(BudgetTier).filter(
                BudgetTier.archetype_id == archetype.id
            ).all()
            for tier in tiers:
                for item in tier.items:
                    if existing_gear in item.get("item_name", "").lower():
                        score += 25
                        break

        return max(0, score)  # Don't go negative

    def get_recommendations(
        self, session_id: str, limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Generate build recommendations based on interview responses.
        Returns archetypes sorted by score with their budget tiers.
        """
        session = self.get_session(session_id)
        if not session:
            return []

        responses = session.responses
        if not responses:
            return []

        # Get all archetypes
        archetypes = self.db.query(BuildArchetype).all()

        # Score each archetype
        scored = []
        for archetype in archetypes:
            score = self.score_archetype(archetype, responses)
            if score > 0:  # Only include positive scores
                scored.append({
                    "archetype": archetype,
                    "score": score,
                })

        # Sort by score descending
        scored.sort(key=lambda x: x["score"], reverse=True)

        # Take top N
        top_archetypes = scored[:limit]

        # Build full recommendations with budget tiers
        recommendations = []
        user_budget = responses.get("budget", "mid")

        for item in top_archetypes:
            archetype = item["archetype"]

            # Get budget tiers for this archetype
            tiers = self.db.query(BudgetTier).filter(
                BudgetTier.archetype_id == archetype.id
            ).order_by(BudgetTier.tier_order).all()

            # Find recommended tier based on budget
            budget_order = {
                "starter": 1,
                "budget": 2,
                "mid": 3,
                "high": 4,
                "unlimited": 5,
            }
            user_budget_order = budget_order.get(user_budget, 3)

            recommended_tier = None
            all_tiers = []
            for tier in tiers:
                tier_data = tier.to_dict()
                all_tiers.append(tier_data)

                # Find the best tier that fits budget
                if tier.tier_order <= user_budget_order:
                    recommended_tier = tier_data

            if not recommended_tier and all_tiers:
                recommended_tier = all_tiers[0]  # Default to cheapest

            recommendations.append({
                "archetype": archetype.to_dict(),
                "score": round(item["score"], 1),
                "match_percentage": min(100, round(item["score"])),
                "recommended_tier": recommended_tier,
                "all_tiers": all_tiers,
            })

        # Save recommendations to session
        session.recommendations = [
            {"archetype_id": r["archetype"]["id"], "score": r["score"]}
            for r in recommendations
        ]
        session.completed_at = datetime.utcnow()
        self.db.commit()

        return recommendations

    async def get_recommendations_with_prices(
        self, session_id: str, limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get recommendations with live price estimates for each tier.
        """
        recommendations = self.get_recommendations(session_id, limit)

        price_fetcher = PriceFetcher(db=self.db)

        for rec in recommendations:
            for tier in rec.get("all_tiers", []):
                total_cost = 0.0
                items_with_prices = []

                for item in tier.get("items", []):
                    try:
                        price_result = await price_fetcher.get_price(
                            item_name=item.get("item_name", ""),
                            item_type=item.get("item_type"),
                        )
                        item_price = price_result.chaos_equivalent
                        total_cost += item_price
                        items_with_prices.append({
                            **item,
                            "current_price": round(item_price, 1),
                            "price_error": price_result.error,
                        })
                    except Exception as e:
                        logger.warning(f"Price lookup failed for {item.get('item_name')}: {e}")
                        items_with_prices.append({
                            **item,
                            "current_price": 0,
                            "price_error": str(e),
                        })

                tier["items"] = items_with_prices
                tier["estimated_cost"] = round(total_cost, 1)

        return recommendations

    def get_archetype_detail(
        self, archetype_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get full details for an archetype including all budget tiers."""
        archetype = self.db.query(BuildArchetype).filter(
            BuildArchetype.id == archetype_id
        ).first()

        if not archetype:
            return None

        tiers = self.db.query(BudgetTier).filter(
            BudgetTier.archetype_id == archetype_id
        ).order_by(BudgetTier.tier_order).all()

        return {
            "archetype": archetype.to_dict(),
            "tiers": [t.to_dict() for t in tiers],
        }

    def create_build_from_tier(
        self, tier_id: str, build_name: Optional[str] = None
    ) -> Optional[str]:
        """
        Create a Build from a BudgetTier.
        Returns the new build ID.
        """
        from backend.models.build import Build, BuildItem

        tier = self.db.query(BudgetTier).filter(
            BudgetTier.id == tier_id
        ).first()

        if not tier:
            return None

        archetype = self.db.query(BuildArchetype).filter(
            BuildArchetype.id == tier.archetype_id
        ).first()

        if not archetype:
            return None

        # Create the build
        build = Build(
            name=build_name or f"{archetype.name} ({tier.tier_name})",
            class_name=archetype.class_name,
            description=f"{archetype.description}\n\nTier: {tier.tier_name}\n{tier.description or ''}",
        )
        self.db.add(build)
        self.db.flush()

        # Create items
        for item_data in tier.items:
            item = BuildItem(
                build_id=build.id,
                slot=item_data.get("slot", "weapon"),
                item_name=item_data.get("item_name", "Unknown"),
                item_type=item_data.get("item_type"),
                is_unique=item_data.get("is_unique", True),
                required=item_data.get("required", True),
                priority=item_data.get("priority", 1),
                variant=item_data.get("variant"),
            )
            if item_data.get("min_stats"):
                item.min_stats = item_data["min_stats"]
            self.db.add(item)

        self.db.commit()
        return build.id


def get_budget_tier_for_amount(chaos_amount: float) -> str:
    """Determine budget tier name based on chaos amount."""
    for tier_key, tier_info in sorted(
        BUDGET_TIERS.items(), key=lambda x: x[1]["order"]
    ):
        if tier_info["max"] is None or chaos_amount <= tier_info["max"]:
            return tier_key
    return "mirror"


def format_budget_range(min_val: float, max_val: Optional[float]) -> str:
    """Format a budget range for display."""
    if max_val is None:
        return f"{min_val:,.0f}+ chaos"
    return f"{min_val:,.0f} - {max_val:,.0f} chaos"
