from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import os

from app.core.config import settings

# Depending on which SDK they actually meant, since they requested `import google.generativeai as genai`
try:
    import google.generativeai as genai
    
    # Use the key they explicitly set in Railway
    api_key = os.getenv("GEMINI_API_KEY") or settings.gemini_api_key or settings.google_api_key
    if api_key:
        genai.configure(api_key=api_key)
except ImportError:
    genai = None

router = APIRouter(tags=["ai"])

# ─── Pydantic Models ────────────────────────────────────────────────

class PlayerAnalysisRequest(BaseModel):
    bio: str
    position: str
    play_style: str

class MatchSummaryRequest(BaseModel):
    match_data: str

class TeamInsightsRequest(BaseModel):
    team_roster: list[str]

# ─── Endpoints ──────────────────────────────────────────────────────

@router.post("/player-analysis")
async def analyze_player(request: PlayerAnalysisRequest):
    """
    Generate an AI analysis of a player based on their bio, position, and play style.
    """
    if not genai:
        raise HTTPException(status_code=500, detail="Gemini SDK not installed.")
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = (
            f"Analyze a football player with the following profile:\n"
            f"Position: {request.position}\n"
            f"Play Style: {request.play_style}\n"
            f"Bio: {request.bio}\n\n"
            "Provide a short, punchy 3-sentence scouting report highlighting their key strengths."
        )
        response = model.generate_content(prompt)
        return {"analysis": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/match-summary")
async def summarize_match(request: MatchSummaryRequest):
    """
    Generate a narrative summary of a match.
    """
    if not genai:
        raise HTTPException(status_code=500, detail="Gemini SDK not installed.")
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = (
            f"Summarize the following match data into a compelling short narrative:\n"
            f"{request.match_data}"
        )
        response = model.generate_content(prompt)
        return {"summary": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/team-insights")
async def team_insights(request: TeamInsightsRequest):
    """
    Generate tactical insights based on a team's roster.
    """
    if not genai:
        raise HTTPException(status_code=500, detail="Gemini SDK not installed.")
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = (
            f"Based on the following player positions and play styles, provide one major tactical recommendation for the team:\n"
            f"{', '.join(request.team_roster)}"
        )
        response = model.generate_content(prompt)
        return {"insights": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
