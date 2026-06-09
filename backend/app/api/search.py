"""
STRYK Backend - Search API
"""

from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, or_, and_

from app.core.database import get_session
from app.models.player import User, UserRead

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/", response_model=List[UserRead])
async def search_users(
    q: str = "",
    pos: str = "",
    style: str = "",
    session: AsyncSession = Depends(get_session)
):
    query = q.replace("@", "").strip().lower()
    
    stmt = select(User)
    
    filters = []
    
    if query:
        # Check if username or full name contains query
        # SQLModel / SQLAlchemy uses ilike for case insensitive
        filters.append(
            or_(
                User.username.ilike(f"%{query}%"),
                User.fullName.ilike(f"%{query}%")
            )
        )
        
    if pos:
        filters.append(User.position.ilike(f"%{pos}%"))
        
    if style:
        filters.append(User.playStyle.ilike(f"%{style}%"))
        
    if filters:
        stmt = stmt.where(and_(*filters))
        
    stmt = stmt.limit(50)
    results = await session.execute(stmt)
    return results.scalars().all()
