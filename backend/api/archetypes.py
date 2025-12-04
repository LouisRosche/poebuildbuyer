"""
API endpoints for build archetypes (aggregated data).
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks

from backend.scrapers.aggregator import build_aggregator
from backend.services.scheduler import sync_scheduler

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/archetypes", tags=["archetypes"])


@router.get("")
async def list_archetypes(
    class_name: Optional[str] = Query(None, description="Filter by class name"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    search: Optional[str] = Query(None, description="Search query"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """
    List all build archetypes.

    Archetypes are aggregated from multiple sources (poe.ninja, Maxroll, etc.)
    and include popularity data, gear recommendations, and playstyle notes.
    """
    builds = build_aggregator.get_all_builds()

    # Apply filters
    if class_name:
        builds = [b for b in builds if b.class_name.lower() == class_name.lower()]

    if tag:
        builds = [b for b in builds if tag.lower() in [t.lower() for t in b.tags]]

    if search:
        search_lower = search.lower()
        builds = [
            b for b in builds
            if search_lower in b.name.lower()
            or search_lower in b.main_skill.lower()
            or search_lower in b.description.lower()
        ]

    total = len(builds)

    # Apply pagination
    builds = builds[offset:offset + limit]

    return {
        "archetypes": [b.to_dict() for b in builds],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/classes")
async def list_classes():
    """Get list of all available classes."""
    builds = build_aggregator.get_all_builds()
    classes = {}

    for build in builds:
        if build.class_name not in classes:
            classes[build.class_name] = {"count": 0, "builds": []}
        classes[build.class_name]["count"] += 1
        if len(classes[build.class_name]["builds"]) < 3:
            classes[build.class_name]["builds"].append(build.name)

    return {
        "classes": [
            {"name": name, "build_count": data["count"], "example_builds": data["builds"]}
            for name, data in sorted(classes.items())
        ]
    }


@router.get("/tags")
async def list_tags():
    """Get list of all tags with counts."""
    builds = build_aggregator.get_all_builds()
    tags = {}

    for build in builds:
        for tag in build.tags:
            tags[tag] = tags.get(tag, 0) + 1

    return {
        "tags": [
            {"name": tag, "count": count}
            for tag, count in sorted(tags.items(), key=lambda x: -x[1])
        ]
    }


@router.get("/popular")
async def get_popular_archetypes(limit: int = Query(10, ge=1, le=50)):
    """Get most popular build archetypes."""
    builds = build_aggregator.get_all_builds()

    # Sort by popularity/build_count
    builds = sorted(builds, key=lambda b: (b.build_count, b.popularity), reverse=True)

    return {
        "archetypes": [b.to_dict() for b in builds[:limit]],
    }


@router.get("/league-starters")
async def get_league_starters(limit: int = Query(10, ge=1, le=50)):
    """Get best league starter builds."""
    builds = build_aggregator.get_all_builds()

    # Sort by league start score
    builds = sorted(builds, key=lambda b: b.league_start_score, reverse=True)

    return {
        "archetypes": [b.to_dict() for b in builds[:limit]],
    }


@router.get("/sync/status")
async def get_sync_status():
    """Get current sync status."""
    return {
        "scheduler": sync_scheduler.get_status(),
        "aggregator": build_aggregator.get_sync_status(),
    }


@router.post("/sync/trigger")
async def trigger_sync(background_tasks: BackgroundTasks, force: bool = False):
    """
    Manually trigger a data sync.

    This will fetch fresh data from all sources.
    """
    async def run_sync():
        await build_aggregator.sync_all_sources(force=force)

    background_tasks.add_task(run_sync)

    return {
        "status": "sync_started",
        "message": "Sync has been triggered in the background",
    }


@router.get("/{archetype_id}")
async def get_archetype(archetype_id: str):
    """Get a specific build archetype by ID."""
    build = build_aggregator.get_build(archetype_id)

    if not build:
        raise HTTPException(status_code=404, detail="Archetype not found")

    return build.to_dict()


@router.get("/{archetype_id}/similar")
async def get_similar_archetypes(
    archetype_id: str,
    limit: int = Query(5, ge=1, le=20),
):
    """Get similar builds to the specified archetype."""
    build = build_aggregator.get_build(archetype_id)

    if not build:
        raise HTTPException(status_code=404, detail="Archetype not found")

    all_builds = build_aggregator.get_all_builds()

    # Score similarity based on class, tags, and skill
    def similarity_score(other):
        if other.id == build.id:
            return -1

        score = 0
        if other.class_name == build.class_name:
            score += 3
        if other.main_skill == build.main_skill:
            score += 2

        common_tags = set(build.tags) & set(other.tags)
        score += len(common_tags)

        return score

    similar = sorted(all_builds, key=similarity_score, reverse=True)

    return {
        "similar": [b.to_dict() for b in similar[:limit]],
    }
