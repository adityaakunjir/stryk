"""Finite weekly schedules. Attendance and invitations remain per match."""
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_
from sqlmodel import select
from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.player import User
from app.models.match import Match, MatchPlayer, MatchInvite
from app.models.recurring import RecurringGame, RecurringOccurrence

router = APIRouter(prefix="/recurring", tags=["recurring"])


class ScheduleCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    location: str = Field(min_length=1, max_length=200)
    turf: str = Field(default="", max_length=100)
    format: Literal["3v3", "5v5", "6v6", "7v7", "11v11"] = "5v5"
    firstLocal: datetime
    timezone: str = Field(max_length=80)
    weeks: int = Field(default=4, ge=2, le=12)
    requestKey: str = Field(min_length=8, max_length=80)


async def player(session, auth):
    result = await session.execute(select(User).where(User.clerkId == auth.get("sub")))
    user = result.scalars().first()
    if not user:
        raise HTTPException(404, "Profile not found")
    return user


def occurrence_times(first, zone_name, weeks):
    if first.tzinfo is not None:
        raise HTTPException(422, "Send the local kickoff time without a UTC offset")
    try:
        zone = ZoneInfo(zone_name)
    except ZoneInfoNotFoundError:
        raise HTTPException(422, "Unknown timezone")
    times = []
    for index in range(weeks):
        local = first + timedelta(weeks=index)
        aware = local.replace(tzinfo=zone)
        utc = aware.astimezone(timezone.utc)
        # Reject skipped/ambiguous wall times instead of quietly shifting kickoff.
        if utc.astimezone(zone).replace(tzinfo=None) != local or aware.utcoffset() != local.replace(tzinfo=zone, fold=1).utcoffset():
            raise HTTPException(422, "A kickoff falls in a daylight-saving clock change; choose another time")
        times.append(utc.replace(tzinfo=None))
    return times


async def serialize(session, series, user_id):
    result = await session.execute(select(Match, RecurringOccurrence.weekIndex)
        .join(RecurringOccurrence, RecurringOccurrence.matchId == Match.id)
        .where(RecurringOccurrence.seriesId == series.id).order_by(RecurringOccurrence.weekIndex))
    occurrences = []
    for match, index in result.all():
        attendees = (await session.execute(select(MatchPlayer).where(MatchPlayer.matchId == match.id))).scalars().all()
        occurrences.append({"id": match.id, "week": index + 1,
            "date": match.matchDate.isoformat() + "Z", "status": match.status,
            "players": len(attendees), "maxPlayers": match.maxPlayers,
            "joined": any(p.userId == user_id for p in attendees)})
    return {"id": series.id, "title": series.title, "location": series.location,
        "timezone": series.timezone, "active": series.active,
        "isHost": series.hostId == user_id, "occurrences": occurrences}


@router.post("", status_code=201)
async def create_schedule(data: ScheduleCreate, auth: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    user = await player(session, auth)
    existing = (await session.execute(select(RecurringGame).where(
        RecurringGame.hostId == user.id, RecurringGame.requestKey == data.requestKey))).scalars().first()
    if existing:
        return await serialize(session, existing, user.id)
    if not data.title.strip() or not data.location.strip():
        raise HTTPException(422, "Title and location are required")
    times = occurrence_times(data.firstLocal, data.timezone, data.weeks)
    if times[0] <= datetime.utcnow():
        raise HTTPException(422, "The first game must be in the future")
    series = RecurringGame(**data.model_dump(), hostId=user.id,
        maxPlayers=int(data.format.split("v")[0]) * 2)
    try:
        session.add(series)
        await session.flush()
        for index, kickoff in enumerate(times):
            match = Match(title=data.title.strip(), location=data.location.strip(), turf=data.turf,
                format=data.format, maxPlayers=series.maxPlayers, matchDate=kickoff, scheduledAt=kickoff,
                hostId=user.id, hostUserId=user.id)
            session.add(match)
            await session.flush()
            match.matchId = match.id
            session.add(RecurringOccurrence(seriesId=series.id, matchId=match.id, weekIndex=index))
            session.add(MatchPlayer(matchId=match.id, userId=user.id))
        await session.commit()
    except IntegrityError:
        await session.rollback()
        existing = (await session.execute(select(RecurringGame).where(
            RecurringGame.hostId == user.id, RecurringGame.requestKey == data.requestKey))).scalars().first()
        if existing:
            return await serialize(session, existing, user.id)
        raise
    return await serialize(session, series, user.id)


@router.get("")
async def my_schedules(auth: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    user = await player(session, auth)
    participating = select(RecurringOccurrence.seriesId).join(MatchPlayer,
        MatchPlayer.matchId == RecurringOccurrence.matchId).where(MatchPlayer.userId == user.id)
    invited = select(RecurringOccurrence.seriesId).join(MatchInvite,
        MatchInvite.matchId == RecurringOccurrence.matchId).where(MatchInvite.receiverId == user.id,
        MatchInvite.status == "pending")
    result = await session.execute(select(RecurringGame).where(or_(RecurringGame.hostId == user.id,
        RecurringGame.id.in_(participating), RecurringGame.id.in_(invited)))
        .order_by(RecurringGame.createdAt.desc()).limit(30))
    return [await serialize(session, series, user.id) for series in result.scalars().all()]


@router.post("/{series_id}/stop")
async def stop_schedule(series_id: str, auth: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    user = await player(session, auth)
    series = (await session.execute(select(RecurringGame).where(RecurringGame.id == series_id).with_for_update())).scalars().first()
    if not series:
        raise HTTPException(404, "Schedule not found")
    if series.hostId != user.id:
        raise HTTPException(403, "Only the host can stop this schedule")
    matches = (await session.execute(select(Match).join(RecurringOccurrence, RecurringOccurrence.matchId == Match.id)
        .where(RecurringOccurrence.seriesId == series.id, Match.matchDate > datetime.utcnow(),
            Match.status.in_(["open", "full"])).with_for_update(of=Match))).scalars().all()
    for match in matches:
        match.status = "cancelled"
        session.add(match)
    series.active = False
    session.add(series)
    await session.commit()
    return await serialize(session, series, user.id)
