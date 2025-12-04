"""Build CRUD API endpoints."""

import json
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models.build import Build, BuildItem
from backend.config import ITEM_SLOTS

router = APIRouter(prefix="/builds", tags=["builds"])


# Pydantic models for request/response
class BuildItemCreate(BaseModel):
    slot: str = Field(..., description="Item slot (weapon, body, etc.)")
    item_name: str = Field(..., description="Item name")
    item_type: Optional[str] = Field(None, description="Base type for API queries")
    is_unique: bool = Field(True, description="Whether this is a unique item")
    required: bool = Field(True, description="Whether this item is required")
    priority: int = Field(1, ge=1, le=3, description="Priority level (1=core, 2=important, 3=luxury)")
    variant: Optional[str] = Field(None, description="Item variant (e.g., tribute type)")
    min_stats: Optional[Dict[str, Any]] = Field(None, description="Minimum stat requirements for rare items")


class BuildItemResponse(BaseModel):
    id: str
    build_id: str
    slot: str
    item_name: str
    item_type: Optional[str]
    is_unique: bool
    required: bool
    priority: int
    variant: Optional[str]
    min_stats: Optional[Dict[str, Any]]


class BuildCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    class_name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    items: List[BuildItemCreate] = Field(default_factory=list)


class BuildUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    class_name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None


class BuildResponse(BaseModel):
    id: str
    name: str
    class_name: Optional[str]
    description: Optional[str]
    created_at: str
    updated_at: str
    items: List[BuildItemResponse]


class BuildListResponse(BaseModel):
    builds: List[BuildResponse]
    total: int


@router.get("", response_model=BuildListResponse)
async def list_builds(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """List all builds."""
    builds = db.query(Build).offset(skip).limit(limit).all()
    total = db.query(Build).count()

    return BuildListResponse(
        builds=[
            BuildResponse(
                id=b.id,
                name=b.name,
                class_name=b.class_name,
                description=b.description,
                created_at=b.created_at.isoformat() if b.created_at else "",
                updated_at=b.updated_at.isoformat() if b.updated_at else "",
                items=[
                    BuildItemResponse(
                        id=i.id,
                        build_id=i.build_id,
                        slot=i.slot,
                        item_name=i.item_name,
                        item_type=i.item_type,
                        is_unique=i.is_unique,
                        required=i.required,
                        priority=i.priority,
                        variant=i.variant,
                        min_stats=i.min_stats,
                    )
                    for i in b.items
                ],
            )
            for b in builds
        ],
        total=total,
    )


@router.post("", response_model=BuildResponse, status_code=201)
async def create_build(build_data: BuildCreate, db: Session = Depends(get_db)):
    """Create a new build."""
    # Validate slots
    for item in build_data.items:
        if item.slot not in ITEM_SLOTS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid slot '{item.slot}'. Valid slots: {ITEM_SLOTS}",
            )

    # Create the build
    build = Build(
        name=build_data.name,
        class_name=build_data.class_name,
        description=build_data.description,
    )
    db.add(build)
    db.flush()  # Get the ID

    # Create items
    for item_data in build_data.items:
        item = BuildItem(
            build_id=build.id,
            slot=item_data.slot,
            item_name=item_data.item_name,
            item_type=item_data.item_type,
            is_unique=item_data.is_unique,
            required=item_data.required,
            priority=item_data.priority,
            variant=item_data.variant,
        )
        if item_data.min_stats:
            item.min_stats = item_data.min_stats
        db.add(item)

    db.commit()
    db.refresh(build)

    return BuildResponse(
        id=build.id,
        name=build.name,
        class_name=build.class_name,
        description=build.description,
        created_at=build.created_at.isoformat() if build.created_at else "",
        updated_at=build.updated_at.isoformat() if build.updated_at else "",
        items=[
            BuildItemResponse(
                id=i.id,
                build_id=i.build_id,
                slot=i.slot,
                item_name=i.item_name,
                item_type=i.item_type,
                is_unique=i.is_unique,
                required=i.required,
                priority=i.priority,
                variant=i.variant,
                min_stats=i.min_stats,
            )
            for i in build.items
        ],
    )


@router.get("/{build_id}", response_model=BuildResponse)
async def get_build(build_id: str, db: Session = Depends(get_db)):
    """Get a specific build by ID."""
    build = db.query(Build).filter(Build.id == build_id).first()
    if not build:
        raise HTTPException(status_code=404, detail="Build not found")

    return BuildResponse(
        id=build.id,
        name=build.name,
        class_name=build.class_name,
        description=build.description,
        created_at=build.created_at.isoformat() if build.created_at else "",
        updated_at=build.updated_at.isoformat() if build.updated_at else "",
        items=[
            BuildItemResponse(
                id=i.id,
                build_id=i.build_id,
                slot=i.slot,
                item_name=i.item_name,
                item_type=i.item_type,
                is_unique=i.is_unique,
                required=i.required,
                priority=i.priority,
                variant=i.variant,
                min_stats=i.min_stats,
            )
            for i in build.items
        ],
    )


@router.put("/{build_id}", response_model=BuildResponse)
async def update_build(
    build_id: str, build_data: BuildUpdate, db: Session = Depends(get_db)
):
    """Update a build's basic info."""
    build = db.query(Build).filter(Build.id == build_id).first()
    if not build:
        raise HTTPException(status_code=404, detail="Build not found")

    if build_data.name is not None:
        build.name = build_data.name
    if build_data.class_name is not None:
        build.class_name = build_data.class_name
    if build_data.description is not None:
        build.description = build_data.description

    db.commit()
    db.refresh(build)

    return BuildResponse(
        id=build.id,
        name=build.name,
        class_name=build.class_name,
        description=build.description,
        created_at=build.created_at.isoformat() if build.created_at else "",
        updated_at=build.updated_at.isoformat() if build.updated_at else "",
        items=[
            BuildItemResponse(
                id=i.id,
                build_id=i.build_id,
                slot=i.slot,
                item_name=i.item_name,
                item_type=i.item_type,
                is_unique=i.is_unique,
                required=i.required,
                priority=i.priority,
                variant=i.variant,
                min_stats=i.min_stats,
            )
            for i in build.items
        ],
    )


@router.delete("/{build_id}", status_code=204)
async def delete_build(build_id: str, db: Session = Depends(get_db)):
    """Delete a build."""
    build = db.query(Build).filter(Build.id == build_id).first()
    if not build:
        raise HTTPException(status_code=404, detail="Build not found")

    db.delete(build)
    db.commit()


# Item management within a build
@router.post("/{build_id}/items", response_model=BuildItemResponse, status_code=201)
async def add_item_to_build(
    build_id: str, item_data: BuildItemCreate, db: Session = Depends(get_db)
):
    """Add an item to a build."""
    build = db.query(Build).filter(Build.id == build_id).first()
    if not build:
        raise HTTPException(status_code=404, detail="Build not found")

    if item_data.slot not in ITEM_SLOTS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid slot '{item_data.slot}'. Valid slots: {ITEM_SLOTS}",
        )

    # Check if slot is already filled
    existing = (
        db.query(BuildItem)
        .filter(BuildItem.build_id == build_id, BuildItem.slot == item_data.slot)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Slot '{item_data.slot}' already has an item. Delete it first.",
        )

    item = BuildItem(
        build_id=build_id,
        slot=item_data.slot,
        item_name=item_data.item_name,
        item_type=item_data.item_type,
        is_unique=item_data.is_unique,
        required=item_data.required,
        priority=item_data.priority,
        variant=item_data.variant,
    )
    if item_data.min_stats:
        item.min_stats = item_data.min_stats

    db.add(item)
    db.commit()
    db.refresh(item)

    return BuildItemResponse(
        id=item.id,
        build_id=item.build_id,
        slot=item.slot,
        item_name=item.item_name,
        item_type=item.item_type,
        is_unique=item.is_unique,
        required=item.required,
        priority=item.priority,
        variant=item.variant,
        min_stats=item.min_stats,
    )


@router.put("/{build_id}/items/{item_id}", response_model=BuildItemResponse)
async def update_build_item(
    build_id: str,
    item_id: str,
    item_data: BuildItemCreate,
    db: Session = Depends(get_db),
):
    """Update an item in a build."""
    item = (
        db.query(BuildItem)
        .filter(BuildItem.id == item_id, BuildItem.build_id == build_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item_data.slot not in ITEM_SLOTS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid slot '{item_data.slot}'. Valid slots: {ITEM_SLOTS}",
        )

    item.slot = item_data.slot
    item.item_name = item_data.item_name
    item.item_type = item_data.item_type
    item.is_unique = item_data.is_unique
    item.required = item_data.required
    item.priority = item_data.priority
    item.variant = item_data.variant
    if item_data.min_stats:
        item.min_stats = item_data.min_stats

    db.commit()
    db.refresh(item)

    return BuildItemResponse(
        id=item.id,
        build_id=item.build_id,
        slot=item.slot,
        item_name=item.item_name,
        item_type=item.item_type,
        is_unique=item.is_unique,
        required=item.required,
        priority=item.priority,
        variant=item.variant,
        min_stats=item.min_stats,
    )


@router.delete("/{build_id}/items/{item_id}", status_code=204)
async def delete_build_item(
    build_id: str, item_id: str, db: Session = Depends(get_db)
):
    """Delete an item from a build."""
    item = (
        db.query(BuildItem)
        .filter(BuildItem.id == item_id, BuildItem.build_id == build_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(item)
    db.commit()


# Export/Import
@router.get("/{build_id}/export")
async def export_build(build_id: str, db: Session = Depends(get_db)):
    """Export a build as JSON."""
    build = db.query(Build).filter(Build.id == build_id).first()
    if not build:
        raise HTTPException(status_code=404, detail="Build not found")

    export_data = {
        "name": build.name,
        "class_name": build.class_name,
        "description": build.description,
        "items": [
            {
                "slot": i.slot,
                "item_name": i.item_name,
                "item_type": i.item_type,
                "is_unique": i.is_unique,
                "required": i.required,
                "priority": i.priority,
                "variant": i.variant,
                "min_stats": i.min_stats,
            }
            for i in build.items
        ],
    }

    return JSONResponse(
        content=export_data,
        headers={
            "Content-Disposition": f'attachment; filename="{build.name}.json"'
        },
    )


@router.post("/import", response_model=BuildResponse, status_code=201)
async def import_build(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Import a build from JSON file."""
    try:
        content = await file.read()
        data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")

    # Validate required fields
    if "name" not in data:
        raise HTTPException(status_code=400, detail="Missing 'name' field")

    # Create build using the create endpoint logic
    build_data = BuildCreate(
        name=data.get("name"),
        class_name=data.get("class_name"),
        description=data.get("description"),
        items=[
            BuildItemCreate(
                slot=i.get("slot", "weapon"),
                item_name=i.get("item_name", "Unknown"),
                item_type=i.get("item_type"),
                is_unique=i.get("is_unique", True),
                required=i.get("required", True),
                priority=i.get("priority", 1),
                variant=i.get("variant"),
                min_stats=i.get("min_stats"),
            )
            for i in data.get("items", [])
        ],
    )

    return await create_build(build_data, db)
