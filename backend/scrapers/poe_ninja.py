"""
poe.ninja builds scraper.
Fetches popular builds from poe.ninja builds API.
"""

import logging
import asyncio
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import aiohttp

logger = logging.getLogger(__name__)

# poe.ninja builds API endpoints
POE_NINJA_API = "https://poe.ninja/api/data"
POE_NINJA_BUILDS_API = "https://poe.ninja/api/data/builds"


@dataclass
class PoeNinjaBuild:
    """Represents a build from poe.ninja."""

    class_name: str
    ascendancy: str
    skill_name: str
    life: int
    es: int
    dps: float
    account_name: str
    character_name: str
    character_level: int
    unique_items: List[str] = field(default_factory=list)
    keystones: List[str] = field(default_factory=list)
    weapon_types: List[str] = field(default_factory=list)
    popularity: float = 0.0
    pob_code: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "class_name": self.class_name,
            "ascendancy": self.ascendancy,
            "skill_name": self.skill_name,
            "life": self.life,
            "es": self.es,
            "dps": self.dps,
            "account_name": self.account_name,
            "character_name": self.character_name,
            "character_level": self.character_level,
            "unique_items": self.unique_items,
            "keystones": self.keystones,
            "weapon_types": self.weapon_types,
            "popularity": self.popularity,
            "pob_code": self.pob_code,
        }


class PoeNinjaScraper:
    """Scraper for poe.ninja builds data."""

    # Class name mappings for PoE2
    POE2_CLASSES = {
        "Warrior": ["Titan", "Warbringer"],
        "Ranger": ["Deadeye", "Pathfinder"],
        "Monk": ["Invoker", "Acolyte"],
        "Witch": ["Infernalist", "Blood Mage"],
        "Mercenary": ["Witchhunter", "Gemling Legionnaire"],
        "Sorceress": ["Stormweaver", "Chronomancer"],
    }

    def __init__(self, league: str = "poe2-Standard"):
        self.league = league
        self.session: Optional[aiohttp.ClientSession] = None
        self._builds_cache: Dict[str, List[PoeNinjaBuild]] = {}
        self._cache_timestamp: Optional[datetime] = None
        self._cache_ttl = 3600  # 1 hour

    async def _get_session(self) -> aiohttp.ClientSession:
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(
                headers={
                    "User-Agent": "PoE2BuildTracker/1.0",
                    "Accept": "application/json",
                }
            )
        return self.session

    async def close(self):
        if self.session and not self.session.closed:
            await self.session.close()

    async def fetch_skill_builds(
        self,
        skill: str,
        class_name: Optional[str] = None,
        limit: int = 50,
    ) -> List[PoeNinjaBuild]:
        """
        Fetch builds using a specific skill.

        Args:
            skill: The main skill name
            class_name: Optional class filter
            limit: Max builds to return

        Returns:
            List of PoeNinjaBuild objects
        """
        session = await self._get_session()

        params = {
            "league": self.league,
            "skill": skill,
            "sort": "dps",
        }

        if class_name:
            params["class"] = class_name

        try:
            url = f"{POE_NINJA_BUILDS_API}/builds"
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    logger.error(f"poe.ninja API error: {response.status}")
                    return []

                data = await response.json()
                builds = self._parse_builds(data, limit)
                return builds

        except Exception as e:
            logger.error(f"Error fetching builds for {skill}: {e}")
            return []

    async def fetch_top_builds(
        self,
        class_name: Optional[str] = None,
        ascendancy: Optional[str] = None,
        limit: int = 100,
    ) -> List[PoeNinjaBuild]:
        """
        Fetch top builds by class or ascendancy.

        Args:
            class_name: Optional class filter
            ascendancy: Optional ascendancy filter
            limit: Max builds to return

        Returns:
            List of PoeNinjaBuild objects
        """
        session = await self._get_session()

        params = {
            "league": self.league,
            "sort": "dps",
        }

        # Note: poe.ninja uses "class" param for both base class and ascendancy
        # Ascendancy takes priority if provided, otherwise use class_name
        if ascendancy:
            params["class"] = ascendancy
        elif class_name:
            params["class"] = class_name

        try:
            # poe.ninja builds overview
            url = f"{POE_NINJA_BUILDS_API}/builds"
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    logger.error(f"poe.ninja API error: {response.status}")
                    return []

                data = await response.json()
                builds = self._parse_builds(data, limit)
                return builds

        except Exception as e:
            logger.error(f"Error fetching top builds: {e}")
            return []

    async def fetch_popular_skills(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Fetch most popular skills from poe.ninja.

        Returns:
            List of skill names with usage statistics
        """
        session = await self._get_session()

        try:
            url = f"{POE_NINJA_BUILDS_API}/skillpopularityoverview"
            params = {"league": self.league}

            async with session.get(url, params=params) as response:
                if response.status != 200:
                    logger.error(f"poe.ninja API error: {response.status}")
                    return []

                data = await response.json()
                skills = data.get("lines", [])[:limit]

                return [
                    {
                        "skill": s.get("name"),
                        "usage_percent": s.get("usePercent", 0),
                        "dps_percentile": s.get("dpsPercentile", 0),
                    }
                    for s in skills
                ]

        except Exception as e:
            logger.error(f"Error fetching popular skills: {e}")
            return []

    async def fetch_unique_items_usage(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Fetch most used unique items from poe.ninja builds.

        Returns:
            List of unique items with usage statistics
        """
        session = await self._get_session()

        try:
            url = f"{POE_NINJA_BUILDS_API}/uniqueitemoverview"
            params = {"league": self.league}

            async with session.get(url, params=params) as response:
                if response.status != 200:
                    logger.error(f"poe.ninja API error: {response.status}")
                    return []

                data = await response.json()
                items = data.get("lines", [])[:limit]

                return [
                    {
                        "name": i.get("name"),
                        "usage_percent": i.get("usePercent", 0),
                        "item_class": i.get("itemClass"),
                        "icon": i.get("icon"),
                    }
                    for i in items
                ]

        except Exception as e:
            logger.error(f"Error fetching unique items usage: {e}")
            return []

    async def fetch_all_builds_by_class(self) -> Dict[str, List[PoeNinjaBuild]]:
        """
        Fetch top builds for all classes.

        Returns:
            Dict mapping class names to their top builds
        """
        if self._is_cache_valid():
            return self._builds_cache

        results = {}

        for class_name, ascendancies in self.POE2_CLASSES.items():
            class_builds = []

            # Fetch for each ascendancy
            for asc in ascendancies:
                builds = await self.fetch_top_builds(ascendancy=asc, limit=25)
                class_builds.extend(builds)
                # Rate limiting
                await asyncio.sleep(0.5)

            results[class_name] = class_builds

        self._builds_cache = results
        self._cache_timestamp = datetime.utcnow()

        return results

    def _parse_builds(self, data: Dict[str, Any], limit: int) -> List[PoeNinjaBuild]:
        """Parse builds from poe.ninja API response."""
        builds = []

        for entry in data.get("entries", [])[:limit]:
            try:
                build = PoeNinjaBuild(
                    class_name=entry.get("class", "Unknown"),
                    ascendancy=entry.get("class", "Unknown"),  # poe.ninja uses class for ascendancy
                    skill_name=entry.get("allSkillGems", ["Unknown"])[0] if entry.get("allSkillGems") else "Unknown",
                    life=entry.get("life", 0),
                    es=entry.get("energyShield", 0),
                    dps=entry.get("dps", 0),
                    account_name=entry.get("account", {}).get("name", ""),
                    character_name=entry.get("character", {}).get("name", ""),
                    character_level=entry.get("character", {}).get("level", 0),
                    unique_items=entry.get("uniqueItems", []),
                    keystones=entry.get("keystones", []),
                    weapon_types=entry.get("weaponTypes", []),
                    popularity=entry.get("matchPercent", 0),
                )
                builds.append(build)
            except Exception as e:
                logger.warning(f"Error parsing build entry: {e}")
                continue

        return builds

    def _is_cache_valid(self) -> bool:
        """Check if the builds cache is still valid."""
        if not self._builds_cache or not self._cache_timestamp:
            return False

        age = (datetime.utcnow() - self._cache_timestamp).total_seconds()
        return age < self._cache_ttl

    async def get_build_archetypes(self) -> List[Dict[str, Any]]:
        """
        Generate build archetypes from poe.ninja data.
        Groups similar builds and identifies common patterns.

        Returns:
            List of archetype definitions
        """
        all_builds = await self.fetch_all_builds_by_class()
        archetypes = []

        # Group builds by main skill
        skill_groups: Dict[str, List[PoeNinjaBuild]] = {}

        for class_name, builds in all_builds.items():
            for build in builds:
                skill = build.skill_name
                if skill not in skill_groups:
                    skill_groups[skill] = []
                skill_groups[skill].append(build)

        # Create archetypes from groups
        for skill, builds in skill_groups.items():
            if len(builds) < 3:  # Skip skills with too few builds
                continue

            # Find common items
            item_counts: Dict[str, int] = {}
            for build in builds:
                for item in build.unique_items:
                    item_counts[item] = item_counts.get(item, 0) + 1

            # Items used by >30% of builds
            common_items = [
                item for item, count in item_counts.items()
                if count / len(builds) > 0.3
            ]

            # Calculate average stats
            avg_life = sum(b.life for b in builds) / len(builds)
            avg_dps = sum(b.dps for b in builds) / len(builds)
            avg_level = sum(b.character_level for b in builds) / len(builds)

            # Most common class
            class_counts: Dict[str, int] = {}
            for build in builds:
                class_counts[build.class_name] = class_counts.get(build.class_name, 0) + 1
            dominant_class = max(class_counts.items(), key=lambda x: x[1])[0]

            archetype = {
                "id": f"pn_{skill.lower().replace(' ', '_')}",
                "name": f"{skill} {dominant_class}",
                "class_name": dominant_class,
                "main_skill": skill,
                "common_items": common_items[:10],
                "avg_life": int(avg_life),
                "avg_dps": int(avg_dps),
                "avg_level": int(avg_level),
                "build_count": len(builds),
                "popularity": len(builds) / max(len(all_builds.get(dominant_class, [1])), 1),
                "source": "poe.ninja",
                "last_updated": datetime.utcnow().isoformat(),
            }

            archetypes.append(archetype)

        # Sort by popularity
        archetypes.sort(key=lambda x: x["build_count"], reverse=True)

        return archetypes


# Global instance
poe_ninja_scraper = PoeNinjaScraper()
