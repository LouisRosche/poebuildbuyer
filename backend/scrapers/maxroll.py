"""
Maxroll.gg build guide scraper.
Fetches curated build guides from maxroll.gg.
"""

import logging
import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import aiohttp
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

MAXROLL_BASE_URL = "https://maxroll.gg"
MAXROLL_POE2_BUILDS = "https://maxroll.gg/poe2/build-guides"


@dataclass
class MaxrollGuide:
    """Represents a build guide from Maxroll."""

    id: str
    name: str
    class_name: str
    ascendancy: str
    url: str
    author: str
    updated_at: Optional[str] = None
    description: str = ""
    tags: List[str] = field(default_factory=list)
    tier: str = "A"  # S, A, B, C, D
    difficulty: str = "Medium"  # Easy, Medium, Hard
    budget: str = "Medium"  # Low, Medium, High
    main_skill: Optional[str] = None
    gear: List[Dict[str, Any]] = field(default_factory=list)
    pros: List[str] = field(default_factory=list)
    cons: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "class_name": self.class_name,
            "ascendancy": self.ascendancy,
            "url": self.url,
            "author": self.author,
            "updated_at": self.updated_at,
            "description": self.description,
            "tags": self.tags,
            "tier": self.tier,
            "difficulty": self.difficulty,
            "budget": self.budget,
            "main_skill": self.main_skill,
            "gear": self.gear,
            "pros": self.pros,
            "cons": self.cons,
            "source": "maxroll.gg",
        }


class MaxrollScraper:
    """Scraper for Maxroll.gg build guides."""

    # Class mappings
    CLASS_ALIASES = {
        "warrior": "Warrior",
        "ranger": "Ranger",
        "monk": "Monk",
        "witch": "Witch",
        "mercenary": "Mercenary",
        "sorceress": "Sorceress",
    }

    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self._guides_cache: List[MaxrollGuide] = []
        self._cache_timestamp: Optional[datetime] = None
        self._cache_ttl = 3600  # 1 hour

    async def _get_session(self) -> aiohttp.ClientSession:
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                }
            )
        return self.session

    async def close(self):
        if self.session and not self.session.closed:
            await self.session.close()

    async def fetch_build_list(self) -> List[MaxrollGuide]:
        """
        Fetch list of all build guides from Maxroll.

        Returns:
            List of MaxrollGuide objects (without full details)
        """
        if self._is_cache_valid():
            return self._guides_cache

        session = await self._get_session()

        try:
            async with session.get(MAXROLL_POE2_BUILDS) as response:
                if response.status != 200:
                    logger.error(f"Maxroll request failed: {response.status}")
                    return []

                html = await response.text()
                guides = self._parse_build_list(html)

                self._guides_cache = guides
                self._cache_timestamp = datetime.utcnow()

                return guides

        except Exception as e:
            logger.error(f"Error fetching Maxroll build list: {e}")
            return []

    async def fetch_guide_details(self, guide_url: str) -> Optional[MaxrollGuide]:
        """
        Fetch full details for a specific guide.

        Args:
            guide_url: The guide URL to fetch

        Returns:
            MaxrollGuide with full details, or None on error
        """
        session = await self._get_session()

        try:
            full_url = guide_url if guide_url.startswith("http") else f"{MAXROLL_BASE_URL}{guide_url}"

            async with session.get(full_url) as response:
                if response.status != 200:
                    logger.error(f"Maxroll guide request failed: {response.status}")
                    return None

                html = await response.text()
                guide = self._parse_guide_details(html, full_url)
                return guide

        except Exception as e:
            logger.error(f"Error fetching Maxroll guide {guide_url}: {e}")
            return None

    def _parse_build_list(self, html: str) -> List[MaxrollGuide]:
        """Parse the build list page HTML."""
        guides = []
        soup = BeautifulSoup(html, "html.parser")

        # Find build guide cards
        build_cards = soup.select(".build-card, .guide-card, [class*='build'], [class*='guide']")

        for card in build_cards:
            try:
                # Extract build info from card
                link = card.select_one("a[href*='build']")
                if not link:
                    continue

                url = link.get("href", "")
                name = link.get_text(strip=True) or card.select_one("h2, h3, .title")

                if isinstance(name, str) and name:
                    pass
                elif name:
                    name = name.get_text(strip=True)
                else:
                    continue

                # Extract class from URL or card
                class_name = self._extract_class_from_url(url)

                # Extract tier if present
                tier_elem = card.select_one("[class*='tier'], .rating")
                tier = tier_elem.get_text(strip=True)[0] if tier_elem else "A"

                # Create guide entry
                guide_id = self._generate_id(name)
                guide = MaxrollGuide(
                    id=guide_id,
                    name=name,
                    class_name=class_name,
                    ascendancy=class_name,  # Will be refined when fetching details
                    url=url,
                    author="Maxroll",
                    tier=tier if tier in "SABCD" else "A",
                )

                guides.append(guide)

            except Exception as e:
                logger.warning(f"Error parsing build card: {e}")
                continue

        return guides

    def _parse_guide_details(self, html: str, url: str) -> Optional[MaxrollGuide]:
        """Parse a full guide page for details."""
        soup = BeautifulSoup(html, "html.parser")

        try:
            # Get title
            title = soup.select_one("h1, .guide-title, .post-title")
            name = title.get_text(strip=True) if title else "Unknown Build"

            # Get description
            desc = soup.select_one(".guide-intro, .description, meta[name='description']")
            description = ""
            if desc:
                if desc.name == "meta":
                    description = desc.get("content", "")
                else:
                    description = desc.get_text(strip=True)

            # Extract class
            class_name = self._extract_class_from_url(url)

            # Find pros/cons
            pros = []
            cons = []

            pros_section = soup.select_one("[class*='pros'], .strengths")
            if pros_section:
                pros = [li.get_text(strip=True) for li in pros_section.select("li")]

            cons_section = soup.select_one("[class*='cons'], .weaknesses")
            if cons_section:
                cons = [li.get_text(strip=True) for li in cons_section.select("li")]

            # Find gear section
            gear = self._extract_gear(soup)

            # Find main skill
            skill_section = soup.select_one("[class*='skill'], .main-skill")
            main_skill = skill_section.get_text(strip=True) if skill_section else None

            # Extract tags
            tags = self._extract_tags(soup, name, description)

            # Find difficulty/budget info
            difficulty = "Medium"
            budget = "Medium"

            for text in soup.stripped_strings:
                text_lower = text.lower()
                if "beginner" in text_lower or "easy" in text_lower:
                    difficulty = "Easy"
                elif "advanced" in text_lower or "hard" in text_lower:
                    difficulty = "Hard"
                if "budget" in text_lower or "cheap" in text_lower:
                    budget = "Low"
                elif "expensive" in text_lower or "high investment" in text_lower:
                    budget = "High"

            guide_id = self._generate_id(name)

            return MaxrollGuide(
                id=guide_id,
                name=name,
                class_name=class_name,
                ascendancy=class_name,
                url=url,
                author="Maxroll",
                updated_at=datetime.utcnow().isoformat(),
                description=description[:500],
                tags=tags,
                difficulty=difficulty,
                budget=budget,
                main_skill=main_skill,
                gear=gear,
                pros=pros[:5],
                cons=cons[:5],
            )

        except Exception as e:
            logger.error(f"Error parsing guide details: {e}")
            return None

    def _extract_gear(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract gear recommendations from guide."""
        gear = []

        # Look for gear sections
        gear_section = soup.select_one("[class*='gear'], [class*='equipment'], .item-section")

        if gear_section:
            items = gear_section.select(".item, [class*='item'], li")
            for item in items[:15]:  # Limit to 15 items
                item_name = item.get_text(strip=True)
                if item_name and len(item_name) > 2:
                    # Try to determine slot
                    slot = self._guess_slot(item_name)
                    gear.append({
                        "slot": slot,
                        "item_name": item_name[:100],
                        "is_unique": self._is_likely_unique(item_name),
                    })

        return gear

    def _extract_tags(self, soup: BeautifulSoup, name: str, description: str) -> List[str]:
        """Extract relevant tags from guide content."""
        tags = set()
        text = f"{name} {description}".lower()

        # Tag mappings
        tag_keywords = {
            "league-start": ["league start", "starter", "ssf", "budget"],
            "boss-killer": ["boss", "single target", "endgame"],
            "fast-mapper": ["fast", "speed", "clear", "mapping"],
            "tanky": ["tank", "defensive", "survivab", "ehp"],
            "minions": ["minion", "summon", "spectre", "zombie"],
            "dot": ["damage over time", "dot", "ignite", "bleed", "poison"],
            "crit": ["critical", "crit"],
            "melee": ["melee", "strike", "slam"],
            "ranged": ["ranged", "bow", "projectile"],
            "spell": ["spell", "cast"],
        }

        for tag, keywords in tag_keywords.items():
            if any(kw in text for kw in keywords):
                tags.add(tag)

        return list(tags)[:6]

    def _extract_class_from_url(self, url: str) -> str:
        """Extract class name from guide URL."""
        url_lower = url.lower()
        for alias, class_name in self.CLASS_ALIASES.items():
            if alias in url_lower:
                return class_name
        return "Unknown"

    def _generate_id(self, name: str) -> str:
        """Generate a stable ID from guide name."""
        clean = re.sub(r"[^a-z0-9]+", "_", name.lower())
        return f"mr_{clean[:50]}"

    def _guess_slot(self, item_name: str) -> str:
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
        }

        for slot, keywords in slot_keywords.items():
            if any(kw in name_lower for kw in keywords):
                return slot

        return "unknown"

    def _is_likely_unique(self, item_name: str) -> bool:
        """Check if item name is likely a unique item."""
        # Uniques typically have proper capitalization and no "rare" indicators
        words = item_name.split()
        if len(words) >= 2:
            # Check if first words are capitalized (title case)
            return all(w[0].isupper() for w in words[:2] if w)
        return True  # Default to unique for single-word items

    def _is_cache_valid(self) -> bool:
        """Check if the guides cache is still valid."""
        if not self._guides_cache or not self._cache_timestamp:
            return False

        age = (datetime.utcnow() - self._cache_timestamp).total_seconds()
        return age < self._cache_ttl

    async def get_all_guides_with_details(self, limit: int = 50) -> List[MaxrollGuide]:
        """
        Fetch all guides with full details.
        Rate-limited to avoid overwhelming the server.

        Args:
            limit: Maximum guides to fetch details for

        Returns:
            List of MaxrollGuide objects with full details
        """
        import asyncio

        guides = await self.fetch_build_list()
        detailed_guides = []

        for guide in guides[:limit]:
            details = await self.fetch_guide_details(guide.url)
            if details:
                detailed_guides.append(details)
            else:
                detailed_guides.append(guide)

            # Rate limiting - be nice to the server
            await asyncio.sleep(1.0)

        return detailed_guides


# Global instance
maxroll_scraper = MaxrollScraper()
