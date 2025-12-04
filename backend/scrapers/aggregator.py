"""
Build data aggregator.
Combines and normalizes data from multiple sources.
"""

import logging
import asyncio
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import json
from pathlib import Path

from backend.scrapers.poe_ninja import poe_ninja_scraper, PoeNinjaBuild
from backend.scrapers.maxroll import maxroll_scraper, MaxrollGuide

logger = logging.getLogger(__name__)


@dataclass
class AggregatedBuild:
    """Normalized build data from multiple sources."""

    id: str
    name: str
    class_name: str
    ascendancy: str
    main_skill: str
    description: str
    tags: List[str] = field(default_factory=list)

    # Ratings (1-10 scale)
    mapping_score: int = 5
    bossing_score: int = 5
    league_start_score: int = 5
    clear_speed_score: int = 5
    survivability_score: int = 5

    # Metadata
    difficulty: str = "Medium"  # Easy, Medium, Hard
    popularity: float = 0.0
    build_count: int = 0

    # Item recommendations by tier
    tiers: List[Dict[str, Any]] = field(default_factory=list)

    # Playstyle info
    pros: List[str] = field(default_factory=list)
    cons: List[str] = field(default_factory=list)
    playstyle_notes: str = ""
    leveling_notes: str = ""

    # Sources
    sources: List[str] = field(default_factory=list)
    guide_urls: List[str] = field(default_factory=list)
    last_updated: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "class_name": self.class_name,
            "ascendancy": self.ascendancy,
            "main_skill": self.main_skill,
            "description": self.description,
            "tags": self.tags,
            "mapping_score": self.mapping_score,
            "bossing_score": self.bossing_score,
            "league_start_score": self.league_start_score,
            "clear_speed_score": self.clear_speed_score,
            "survivability_score": self.survivability_score,
            "difficulty": self.difficulty,
            "popularity": self.popularity,
            "build_count": self.build_count,
            "tiers": self.tiers,
            "pros": self.pros,
            "cons": self.cons,
            "playstyle_notes": self.playstyle_notes,
            "leveling_notes": self.leveling_notes,
            "sources": self.sources,
            "guide_urls": self.guide_urls,
            "last_updated": self.last_updated,
        }


class BuildAggregator:
    """Aggregates and normalizes build data from multiple sources."""

    # Storage path for aggregated data
    DATA_DIR = Path("backend/data")
    BUILDS_FILE = DATA_DIR / "aggregated_builds.json"
    SYNC_STATUS_FILE = DATA_DIR / "sync_status.json"

    def __init__(self):
        self._builds: List[AggregatedBuild] = []
        self._last_sync: Optional[datetime] = None
        self._sync_status: Dict[str, Any] = {}

        # Ensure data directory exists
        self.DATA_DIR.mkdir(parents=True, exist_ok=True)

        # Load existing data
        self._load_cached_builds()

    def _load_cached_builds(self):
        """Load builds from cache file."""
        try:
            if self.BUILDS_FILE.exists():
                with open(self.BUILDS_FILE) as f:
                    data = json.load(f)
                    self._builds = [self._dict_to_build(b) for b in data.get("builds", [])]
                    self._last_sync = datetime.fromisoformat(data.get("last_sync", "2000-01-01"))
                    logger.info(f"Loaded {len(self._builds)} cached builds")
        except Exception as e:
            logger.error(f"Error loading cached builds: {e}")

    def _save_builds(self):
        """Save builds to cache file."""
        try:
            data = {
                "builds": [b.to_dict() for b in self._builds],
                "last_sync": datetime.utcnow().isoformat(),
                "count": len(self._builds),
            }
            with open(self.BUILDS_FILE, "w") as f:
                json.dump(data, f, indent=2)
            logger.info(f"Saved {len(self._builds)} builds to cache")
        except Exception as e:
            logger.error(f"Error saving builds: {e}")

    def _save_sync_status(self, status: Dict[str, Any]):
        """Save sync status."""
        try:
            with open(self.SYNC_STATUS_FILE, "w") as f:
                json.dump(status, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving sync status: {e}")

    def _dict_to_build(self, data: Dict[str, Any]) -> AggregatedBuild:
        """Convert dict back to AggregatedBuild."""
        return AggregatedBuild(
            id=data.get("id", ""),
            name=data.get("name", ""),
            class_name=data.get("class_name", ""),
            ascendancy=data.get("ascendancy", ""),
            main_skill=data.get("main_skill", ""),
            description=data.get("description", ""),
            tags=data.get("tags", []),
            mapping_score=data.get("mapping_score", 5),
            bossing_score=data.get("bossing_score", 5),
            league_start_score=data.get("league_start_score", 5),
            clear_speed_score=data.get("clear_speed_score", 5),
            survivability_score=data.get("survivability_score", 5),
            difficulty=data.get("difficulty", "Medium"),
            popularity=data.get("popularity", 0),
            build_count=data.get("build_count", 0),
            tiers=data.get("tiers", []),
            pros=data.get("pros", []),
            cons=data.get("cons", []),
            playstyle_notes=data.get("playstyle_notes", ""),
            leveling_notes=data.get("leveling_notes", ""),
            sources=data.get("sources", []),
            guide_urls=data.get("guide_urls", []),
            last_updated=data.get("last_updated", ""),
        )

    async def sync_all_sources(self, force: bool = False) -> Dict[str, Any]:
        """
        Sync data from all sources.

        Args:
            force: Force sync even if recent data exists

        Returns:
            Sync status report
        """
        status = {
            "started_at": datetime.utcnow().isoformat(),
            "sources": {},
            "total_builds": 0,
            "errors": [],
        }

        # Check if we need to sync
        if not force and self._last_sync:
            age_hours = (datetime.utcnow() - self._last_sync).total_seconds() / 3600
            if age_hours < 6:  # Less than 6 hours old
                logger.info("Skipping sync - data is recent")
                status["skipped"] = True
                status["reason"] = f"Data is only {age_hours:.1f} hours old"
                return status

        builds_by_skill: Dict[str, List[Dict[str, Any]]] = {}

        # Fetch from poe.ninja
        try:
            logger.info("Syncing from poe.ninja...")
            poe_ninja_data = await poe_ninja_scraper.get_build_archetypes()
            status["sources"]["poe.ninja"] = {
                "success": True,
                "count": len(poe_ninja_data),
            }

            for arch in poe_ninja_data:
                skill = arch.get("main_skill", "Unknown")
                if skill not in builds_by_skill:
                    builds_by_skill[skill] = []
                builds_by_skill[skill].append({
                    "source": "poe.ninja",
                    "data": arch,
                })

        except Exception as e:
            logger.error(f"poe.ninja sync failed: {e}")
            status["sources"]["poe.ninja"] = {"success": False, "error": str(e)}
            status["errors"].append(f"poe.ninja: {e}")

        # Fetch from Maxroll
        try:
            logger.info("Syncing from Maxroll...")
            maxroll_guides = await maxroll_scraper.fetch_build_list()
            status["sources"]["maxroll"] = {
                "success": True,
                "count": len(maxroll_guides),
            }

            for guide in maxroll_guides:
                skill = guide.main_skill or guide.name.split()[0]
                if skill not in builds_by_skill:
                    builds_by_skill[skill] = []
                builds_by_skill[skill].append({
                    "source": "maxroll",
                    "data": guide.to_dict(),
                })

        except Exception as e:
            logger.error(f"Maxroll sync failed: {e}")
            status["sources"]["maxroll"] = {"success": False, "error": str(e)}
            status["errors"].append(f"Maxroll: {e}")

        # Aggregate builds
        aggregated = []
        for skill, sources in builds_by_skill.items():
            try:
                build = self._merge_sources(skill, sources)
                if build:
                    aggregated.append(build)
            except Exception as e:
                logger.warning(f"Error merging build {skill}: {e}")

        # Sort by popularity
        aggregated.sort(key=lambda b: b.popularity, reverse=True)

        # Update cache
        self._builds = aggregated
        self._last_sync = datetime.utcnow()
        self._save_builds()

        status["completed_at"] = datetime.utcnow().isoformat()
        status["total_builds"] = len(aggregated)
        self._save_sync_status(status)

        logger.info(f"Sync complete: {len(aggregated)} builds aggregated")

        return status

    def _merge_sources(
        self,
        skill: str,
        sources: List[Dict[str, Any]],
    ) -> Optional[AggregatedBuild]:
        """Merge data from multiple sources for a single build."""

        if not sources:
            return None

        # Start with defaults
        name = skill
        class_name = "Unknown"
        description = ""
        tags = set()
        pros = []
        cons = []
        guide_urls = []
        source_names = []

        # poe.ninja specific data
        pn_data = None
        build_count = 0
        popularity = 0.0
        common_items = []

        # Maxroll specific data
        mr_data = None
        difficulty = "Medium"

        for source in sources:
            src_name = source["source"]
            data = source["data"]
            source_names.append(src_name)

            if src_name == "poe.ninja":
                pn_data = data
                build_count = data.get("build_count", 0)
                popularity = data.get("popularity", 0)
                common_items = data.get("common_items", [])
                class_name = data.get("class_name", class_name)
                name = data.get("name", name)

            elif src_name == "maxroll":
                mr_data = data
                description = data.get("description", description)
                tags.update(data.get("tags", []))
                pros.extend(data.get("pros", []))
                cons.extend(data.get("cons", []))
                difficulty = data.get("difficulty", difficulty)
                guide_urls.append(data.get("url", ""))
                if data.get("class_name") != "Unknown":
                    class_name = data.get("class_name", class_name)
                name = data.get("name", name)

        # Calculate scores based on available data
        mapping_score = 5
        bossing_score = 5
        league_start_score = 5
        clear_speed_score = 5
        survivability_score = 5

        # Adjust scores based on tags
        tag_set = tags
        if "fast-mapper" in tag_set or "speed" in tag_set:
            mapping_score += 2
            clear_speed_score += 2
        if "boss-killer" in tag_set:
            bossing_score += 2
        if "league-start" in tag_set or "budget" in tag_set:
            league_start_score += 2
        if "tanky" in tag_set:
            survivability_score += 2
            clear_speed_score -= 1

        # Adjust based on difficulty
        if difficulty == "Easy":
            league_start_score += 1
        elif difficulty == "Hard":
            league_start_score -= 1
            bossing_score += 1

        # Clamp scores
        mapping_score = max(1, min(10, mapping_score))
        bossing_score = max(1, min(10, bossing_score))
        league_start_score = max(1, min(10, league_start_score))
        clear_speed_score = max(1, min(10, clear_speed_score))
        survivability_score = max(1, min(10, survivability_score))

        # Generate tiers from common items
        tiers = self._generate_tiers(common_items, skill)

        # Generate ID
        build_id = f"agg_{skill.lower().replace(' ', '_')[:30]}"

        return AggregatedBuild(
            id=build_id,
            name=name,
            class_name=class_name,
            ascendancy=class_name,
            main_skill=skill,
            description=description or f"A popular {skill} build for {class_name}.",
            tags=list(tags)[:8],
            mapping_score=mapping_score,
            bossing_score=bossing_score,
            league_start_score=league_start_score,
            clear_speed_score=clear_speed_score,
            survivability_score=survivability_score,
            difficulty=difficulty,
            popularity=popularity,
            build_count=build_count,
            tiers=tiers,
            pros=pros[:5],
            cons=cons[:5],
            playstyle_notes=self._generate_playstyle_notes(skill, tags),
            leveling_notes=self._generate_leveling_notes(skill, difficulty),
            sources=source_names,
            guide_urls=[u for u in guide_urls if u],
            last_updated=datetime.utcnow().isoformat(),
        )

    def _generate_tiers(
        self,
        common_items: List[str],
        skill: str,
    ) -> List[Dict[str, Any]]:
        """Generate budget tiers from common items."""

        # Default tiers if no items
        tiers = [
            {
                "tier_order": 1,
                "tier_name": "League Start",
                "min_budget": 0,
                "max_budget": 50,
                "description": f"Basic {skill} setup using rare items.",
                "items": [
                    {"slot": "weapon", "item_name": "Rare weapon", "is_unique": False},
                    {"slot": "body", "item_name": "Rare body armour", "is_unique": False},
                ],
            },
            {
                "tier_order": 2,
                "tier_name": "Budget",
                "min_budget": 50,
                "max_budget": 500,
                "description": f"Entry-level {skill} with key uniques.",
                "items": [],
            },
            {
                "tier_order": 3,
                "tier_name": "Endgame",
                "min_budget": 500,
                "max_budget": None,
                "description": f"Fully optimized {skill} setup.",
                "items": [],
            },
        ]

        # Add common items to appropriate tiers
        for i, item in enumerate(common_items[:8]):
            slot = self._guess_slot_from_name(item)
            tier_idx = min(i // 3, 2)  # Distribute across tiers
            tiers[tier_idx]["items"].append({
                "slot": slot,
                "item_name": item,
                "is_unique": True,
            })

        return tiers

    def _guess_slot_from_name(self, item_name: str) -> str:
        """Guess equipment slot from item name."""
        name_lower = item_name.lower()

        slot_keywords = {
            "weapon": ["sword", "axe", "mace", "staff", "wand", "bow", "dagger", "claw", "sceptre"],
            "offhand": ["shield", "quiver", "focus"],
            "helmet": ["helm", "crown", "mask", "hood", "circlet"],
            "body": ["armour", "robe", "vest", "plate", "regalia"],
            "gloves": ["glove", "gauntlet", "mitt"],
            "boots": ["boot", "greave", "slippers"],
            "belt": ["belt", "sash", "stygian"],
            "amulet": ["amulet", "talisman"],
            "ring": ["ring"],
            "jewel": ["jewel"],
        }

        for slot, keywords in slot_keywords.items():
            if any(kw in name_lower for kw in keywords):
                return slot

        return "accessory"

    def _generate_playstyle_notes(self, skill: str, tags: set) -> str:
        """Generate playstyle notes based on skill and tags."""
        notes = [f"This build focuses on {skill} as the main damage skill."]

        if "melee" in tags:
            notes.append("Engage enemies at close range for maximum damage.")
        elif "ranged" in tags:
            notes.append("Maintain distance from enemies while dealing damage.")
        elif "spell" in tags:
            notes.append("Cast spells strategically for optimal damage output.")

        if "tanky" in tags:
            notes.append("The build is defensive and can take hits.")
        if "fast-mapper" in tags:
            notes.append("Excels at clearing maps quickly.")

        return " ".join(notes)

    def _generate_leveling_notes(self, skill: str, difficulty: str) -> str:
        """Generate leveling notes."""
        if difficulty == "Easy":
            return f"Straightforward leveling. Use {skill} as soon as available."
        elif difficulty == "Hard":
            return f"May require alternative skills until key items are acquired."
        return f"Level with {skill} or use a similar skill until transition point."

    def get_all_builds(self) -> List[AggregatedBuild]:
        """Get all aggregated builds."""
        return self._builds

    def get_build(self, build_id: str) -> Optional[AggregatedBuild]:
        """Get a specific build by ID."""
        for build in self._builds:
            if build.id == build_id:
                return build
        return None

    def get_builds_by_class(self, class_name: str) -> List[AggregatedBuild]:
        """Get builds filtered by class."""
        return [b for b in self._builds if b.class_name.lower() == class_name.lower()]

    def get_builds_by_tag(self, tag: str) -> List[AggregatedBuild]:
        """Get builds filtered by tag."""
        return [b for b in self._builds if tag in b.tags]

    def search_builds(self, query: str) -> List[AggregatedBuild]:
        """Search builds by name, skill, or description."""
        query_lower = query.lower()
        return [
            b for b in self._builds
            if query_lower in b.name.lower()
            or query_lower in b.main_skill.lower()
            or query_lower in b.description.lower()
        ]

    def get_sync_status(self) -> Dict[str, Any]:
        """Get the current sync status."""
        try:
            if self.SYNC_STATUS_FILE.exists():
                with open(self.SYNC_STATUS_FILE) as f:
                    return json.load(f)
        except Exception:
            pass

        return {
            "last_sync": self._last_sync.isoformat() if self._last_sync else None,
            "build_count": len(self._builds),
        }


# Global instance
build_aggregator = BuildAggregator()
