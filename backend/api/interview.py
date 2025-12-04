"""Interview and recommendation API endpoints."""

from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models.interview import (
    BuildArchetype,
    BudgetTier,
    INTERVIEW_QUESTIONS,
    BUDGET_TIERS,
)
from backend.services.recommendations import RecommendationEngine

router = APIRouter(prefix="/interview", tags=["interview"])


# Pydantic models
class QuestionOption(BaseModel):
    value: str
    label: str


class InterviewQuestion(BaseModel):
    id: str
    question: str
    type: str
    required: bool
    options: Optional[List[QuestionOption]] = None
    placeholder: Optional[str] = None


class StartSessionResponse(BaseModel):
    session_id: str
    questions: List[Dict[str, Any]]


class UpdateResponsesRequest(BaseModel):
    responses: Dict[str, Any]


class SessionResponse(BaseModel):
    id: str
    responses: Dict[str, Any]
    completed: bool


class ArchetypeResponse(BaseModel):
    id: str
    name: str
    slug: str
    class_name: str
    primary_playstyle: str
    damage_type: str
    tags: List[str]
    mapping_score: int
    bossing_score: int
    league_start_score: int
    complexity: int
    description: Optional[str]
    pros: List[str]
    cons: List[str]


class TierResponse(BaseModel):
    id: str
    tier_name: str
    tier_order: int
    min_budget: float
    max_budget: Optional[float]
    estimated_cost: Optional[float]
    description: Optional[str]
    upgrade_notes: Optional[str]
    items: List[Dict[str, Any]]


class RecommendationResponse(BaseModel):
    archetype: Dict[str, Any]
    score: float
    match_percentage: float
    recommended_tier: Optional[Dict[str, Any]]
    all_tiers: List[Dict[str, Any]]


class RecommendationsResponse(BaseModel):
    session_id: str
    recommendations: List[RecommendationResponse]
    budget_info: Dict[str, Any]


class ArchetypeDetailResponse(BaseModel):
    archetype: Dict[str, Any]
    tiers: List[Dict[str, Any]]


class CreateBuildFromTierRequest(BaseModel):
    tier_id: str
    build_name: Optional[str] = None


class CreateBuildFromTierResponse(BaseModel):
    build_id: str
    message: str


# Endpoints
@router.get("/questions")
async def get_interview_questions():
    """Get all interview questions."""
    return {"questions": INTERVIEW_QUESTIONS}


@router.get("/budget-tiers")
async def get_budget_tiers():
    """Get budget tier definitions."""
    return {"tiers": BUDGET_TIERS}


@router.post("/start", response_model=StartSessionResponse)
async def start_interview(db: Session = Depends(get_db)):
    """Start a new interview session."""
    engine = RecommendationEngine(db)
    session = engine.create_session()

    return StartSessionResponse(
        session_id=session.id,
        questions=INTERVIEW_QUESTIONS,
    )


@router.get("/session/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, db: Session = Depends(get_db)):
    """Get an interview session."""
    engine = RecommendationEngine(db)
    session = engine.get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionResponse(
        id=session.id,
        responses=session.responses,
        completed=session.completed_at is not None,
    )


@router.put("/session/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: str,
    request: UpdateResponsesRequest,
    db: Session = Depends(get_db),
):
    """Update interview responses."""
    engine = RecommendationEngine(db)
    session = engine.update_responses(session_id, request.responses)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionResponse(
        id=session.id,
        responses=session.responses,
        completed=session.completed_at is not None,
    )


@router.get("/session/{session_id}/recommendations", response_model=RecommendationsResponse)
async def get_recommendations(
    session_id: str,
    limit: int = 5,
    db: Session = Depends(get_db),
):
    """Get build recommendations based on interview responses."""
    engine = RecommendationEngine(db)
    session = engine.get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    recommendations = engine.get_recommendations(session_id, limit=limit)

    # Get user's stated budget for context
    user_budget = session.responses.get("budget", "mid")
    budget_info = BUDGET_TIERS.get(user_budget, BUDGET_TIERS["mid"])

    return RecommendationsResponse(
        session_id=session_id,
        recommendations=[
            RecommendationResponse(**r) for r in recommendations
        ],
        budget_info={
            "tier": user_budget,
            **budget_info,
        },
    )


@router.get("/session/{session_id}/recommendations/prices")
async def get_recommendations_with_prices(
    session_id: str,
    limit: int = 3,
    db: Session = Depends(get_db),
):
    """Get recommendations with live price estimates (slower, makes API calls)."""
    engine = RecommendationEngine(db)
    session = engine.get_session(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    recommendations = await engine.get_recommendations_with_prices(session_id, limit=limit)

    user_budget = session.responses.get("budget", "mid")
    budget_info = BUDGET_TIERS.get(user_budget, BUDGET_TIERS["mid"])

    return {
        "session_id": session_id,
        "recommendations": recommendations,
        "budget_info": {
            "tier": user_budget,
            **budget_info,
        },
    }


# Archetype browsing endpoints
@router.get("/archetypes")
async def list_archetypes(
    class_name: Optional[str] = None,
    playstyle: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List all build archetypes with optional filters."""
    query = db.query(BuildArchetype)

    if class_name:
        query = query.filter(BuildArchetype.class_name.ilike(f"%{class_name}%"))
    if playstyle:
        query = query.filter(BuildArchetype.primary_playstyle == playstyle)

    archetypes = query.all()

    return {
        "archetypes": [a.to_dict() for a in archetypes],
        "total": len(archetypes),
    }


@router.get("/archetypes/{archetype_id}", response_model=ArchetypeDetailResponse)
async def get_archetype(archetype_id: str, db: Session = Depends(get_db)):
    """Get full details for an archetype including all budget tiers."""
    engine = RecommendationEngine(db)
    detail = engine.get_archetype_detail(archetype_id)

    if not detail:
        raise HTTPException(status_code=404, detail="Archetype not found")

    return ArchetypeDetailResponse(**detail)


@router.get("/archetypes/by-slug/{slug}")
async def get_archetype_by_slug(slug: str, db: Session = Depends(get_db)):
    """Get archetype by URL-friendly slug."""
    archetype = db.query(BuildArchetype).filter(
        BuildArchetype.slug == slug
    ).first()

    if not archetype:
        raise HTTPException(status_code=404, detail="Archetype not found")

    engine = RecommendationEngine(db)
    detail = engine.get_archetype_detail(archetype.id)

    return detail


@router.post("/create-build", response_model=CreateBuildFromTierResponse)
async def create_build_from_tier(
    request: CreateBuildFromTierRequest,
    db: Session = Depends(get_db),
):
    """Create a Build from a specific budget tier."""
    engine = RecommendationEngine(db)
    build_id = engine.create_build_from_tier(
        tier_id=request.tier_id,
        build_name=request.build_name,
    )

    if not build_id:
        raise HTTPException(status_code=404, detail="Tier not found")

    return CreateBuildFromTierResponse(
        build_id=build_id,
        message="Build created successfully",
    )


# Quick recommendation without full interview
class QuickRecommendRequest(BaseModel):
    class_name: Optional[str] = None
    playstyle: Optional[str] = None
    budget: str = "mid"
    content_focus: Optional[str] = None


@router.post("/quick-recommend")
async def quick_recommend(
    request: QuickRecommendRequest,
    limit: int = 5,
    db: Session = Depends(get_db),
):
    """Get quick recommendations without a full interview."""
    engine = RecommendationEngine(db)

    # Create a temporary session with minimal responses
    session = engine.create_session()
    responses = {
        "class": request.class_name or "any",
        "playstyle": request.playstyle or "any",
        "budget": request.budget,
        "content_focus": request.content_focus or "both",
        "experience": "intermediate",
    }
    engine.update_responses(session.id, responses)

    recommendations = engine.get_recommendations(session.id, limit=limit)

    return {
        "recommendations": recommendations,
        "session_id": session.id,  # In case they want to continue
    }
