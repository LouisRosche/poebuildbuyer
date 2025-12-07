"""Seed database with initial data."""

import json
import logging
from pathlib import Path

from backend.db import SessionLocal, init_db
from backend.models.build import Build, BuildItem
from backend.models.interview import BuildArchetype, BudgetTier

logger = logging.getLogger(__name__)


def seed_builds():
    """Load seed builds from JSON file."""
    seed_file = Path(__file__).parent.parent / "data" / "seed_builds.json"

    if not seed_file.exists():
        logger.warning(f"Seed file not found: {seed_file}")
        return

    with open(seed_file) as f:
        builds_data = json.load(f)

    db = SessionLocal()

    try:
        for build_data in builds_data:
            # Check if build already exists
            existing = (
                db.query(Build).filter(Build.name == build_data["name"]).first()
            )
            if existing:
                logger.info(f"Build '{build_data['name']}' already exists, skipping")
                continue

            # Create build
            build = Build(
                name=build_data["name"],
                class_name=build_data.get("class_name"),
                description=build_data.get("description"),
            )
            db.add(build)
            db.flush()

            # Create items
            for item_data in build_data.get("items", []):
                item = BuildItem(
                    build_id=build.id,
                    slot=item_data["slot"],
                    item_name=item_data["item_name"],
                    item_type=item_data.get("item_type"),
                    is_unique=item_data.get("is_unique", True),
                    required=item_data.get("required", True),
                    priority=item_data.get("priority", 1),
                    variant=item_data.get("variant"),
                )
                if item_data.get("min_stats"):
                    item.min_stats = item_data["min_stats"]
                db.add(item)

            logger.info(f"Created build: {build_data['name']}")

        db.commit()
        logger.info("Seed data loaded successfully")

    except Exception as e:
        logger.error(f"Error loading seed data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def seed_archetypes():
    """Load build archetypes from JSON file."""
    seed_file = Path(__file__).parent.parent / "data" / "archetypes.json"

    if not seed_file.exists():
        logger.warning(f"Archetypes file not found: {seed_file}")
        return

    with open(seed_file) as f:
        archetypes_data = json.load(f)

    db = SessionLocal()

    try:
        for arch_data in archetypes_data:
            # Check if archetype already exists by ID or slug
            existing = (
                db.query(BuildArchetype)
                .filter(
                    (BuildArchetype.id == arch_data["id"]) |
                    (BuildArchetype.slug == arch_data["slug"])
                )
                .first()
            )
            if existing:
                logger.info(f"Archetype '{arch_data['name']}' already exists, skipping")
                continue

            # Create archetype - use ID from JSON to match frontend
            archetype = BuildArchetype(
                id=arch_data["id"],  # Use the ID from JSON file
                name=arch_data["name"],
                slug=arch_data["slug"],
                class_name=arch_data["class_name"],
                primary_playstyle=arch_data["primary_playstyle"],
                damage_type=arch_data["damage_type"],
                mapping_score=arch_data.get("mapping_score", 5),
                bossing_score=arch_data.get("bossing_score", 5),
                league_start_score=arch_data.get("league_start_score", 5),
                complexity=arch_data.get("complexity", 2),
                description=arch_data.get("description"),
                playstyle_notes=arch_data.get("playstyle_notes"),
                leveling_notes=arch_data.get("leveling_notes"),
            )
            archetype.tags = arch_data.get("tags", [])
            archetype.pros = arch_data.get("pros", [])
            archetype.cons = arch_data.get("cons", [])

            db.add(archetype)
            db.flush()

            # Create budget tiers
            for tier_data in arch_data.get("tiers", []):
                tier = BudgetTier(
                    archetype_id=archetype.id,
                    tier_name=tier_data["tier_name"],
                    tier_order=tier_data.get("tier_order", 1),
                    min_budget=tier_data.get("min_budget", 0),
                    max_budget=tier_data.get("max_budget"),
                    description=tier_data.get("description"),
                    upgrade_notes=tier_data.get("upgrade_notes"),
                )
                tier.items = tier_data.get("items", [])
                db.add(tier)

            logger.info(f"Created archetype: {arch_data['name']} with {len(arch_data.get('tiers', []))} tiers")

        db.commit()
        logger.info("Archetypes loaded successfully")

    except Exception as e:
        logger.error(f"Error loading archetypes: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def clear_archetypes():
    """Clear all archetypes and budget tiers from database."""
    db = SessionLocal()
    try:
        # Delete budget tiers first (foreign key constraint)
        deleted_tiers = db.query(BudgetTier).delete()
        deleted_archs = db.query(BuildArchetype).delete()
        db.commit()
        logger.info(f"Cleared {deleted_archs} archetypes and {deleted_tiers} budget tiers")
    except Exception as e:
        logger.error(f"Error clearing archetypes: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def reseed_archetypes():
    """Clear and reseed all archetypes."""
    logger.info("Clearing existing archetypes...")
    clear_archetypes()
    logger.info("Reseeding archetypes...")
    seed_archetypes()


def main():
    """Main entry point for seeding."""
    logging.basicConfig(level=logging.INFO)
    logger.info("Initializing database...")
    init_db()
    logger.info("Loading seed builds...")
    seed_builds()
    logger.info("Loading archetypes...")
    seed_archetypes()
    logger.info("Done!")


if __name__ == "__main__":
    main()
