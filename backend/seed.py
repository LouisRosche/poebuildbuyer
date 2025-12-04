"""Seed database with initial data."""

import json
import logging
from pathlib import Path

from backend.db import SessionLocal, init_db
from backend.models.build import Build, BuildItem

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


def main():
    """Main entry point for seeding."""
    logging.basicConfig(level=logging.INFO)
    logger.info("Initializing database...")
    init_db()
    logger.info("Loading seed data...")
    seed_builds()
    logger.info("Done!")


if __name__ == "__main__":
    main()
