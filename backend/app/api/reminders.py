"""Account-scoped reminder settings and Web Push subscriptions."""
import base64
from urllib.parse import urlparse
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.api.recurring import player
from app.core.auth import get_current_user
from app.core.database import get_session
from app.core.config import settings
from app.models.reminder import ReminderPreference, PushDevice, MatchReminder

router = APIRouter(prefix="/reminders", tags=["reminders"])

class PreferenceInput(BaseModel):
    enabled: bool

class SubscriptionInput(BaseModel):
    endpoint: str = Field(max_length=2048)
    keys: dict[str, str]

def validate_subscription(data):
    try:
        url = urlparse(data.endpoint)
        port = url.port
    except ValueError:
        raise HTTPException(422, "Invalid push endpoint")
    host = url.hostname or ""
    allowed = host in {"fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"} or host.endswith(".notify.windows.com")
    if not allowed or url.scheme != "https" or url.username or url.password or port not in (None, 443):
        raise HTTPException(422, "Unsupported push service endpoint")
    try:
        for key, size in (("p256dh", 65), ("auth", 16)):
            value = data.keys[key]
            decoded = base64.b64decode(value + "=" * (-len(value) % 4), altchars=b"-_", validate=True)
            if len(decoded) != size:
                raise ValueError()
    except (KeyError, ValueError):
        raise HTTPException(422, "Invalid push subscription keys")

@router.get("")
async def inbox(auth: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    user = await player(session, auth)
    preference = await session.get(ReminderPreference, user.id)
    reminders = (await session.execute(select(MatchReminder).where(MatchReminder.userId == user.id)
        .order_by(MatchReminder.createdAt.desc()).limit(50))).scalars().all()
    return {"enabled": bool(preference and preference.enabled),
        "pushAvailable": bool(settings.vapid_public_key and settings.vapid_private_key),
        "publicKey": settings.vapid_public_key,
        "items": [{"id": r.id, "matchId": r.matchId, "kind": r.kind, "message": r.message,
            "read": r.read, "createdAt": r.createdAt.isoformat() + "Z"} for r in reminders]}

@router.patch("/preferences")
async def preferences(data: PreferenceInput, auth: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    user = await player(session, auth)
    preference = await session.get(ReminderPreference, user.id) or ReminderPreference(userId=user.id)
    preference.enabled = data.enabled
    session.add(preference)
    await session.commit()
    return {"enabled": preference.enabled}

@router.post("/devices")
async def subscribe(data: SubscriptionInput, auth: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    user = await player(session, auth)
    if not settings.vapid_public_key or not settings.vapid_private_key:
        raise HTTPException(503, "Phone notifications are not configured yet")
    validate_subscription(data)
    device = (await session.execute(select(PushDevice).where(PushDevice.endpoint == data.endpoint))).scalars().first()
    # A shared phone can switch accounts: the endpoint belongs only to its latest subscriber.
    if not device:
        device = PushDevice(userId=user.id, endpoint=data.endpoint, p256dh=data.keys["p256dh"], auth=data.keys["auth"])
    device.userId = user.id
    device.p256dh = data.keys["p256dh"]
    device.auth = data.keys["auth"]
    device.active = True
    session.add(device)
    await session.commit()
    return {"success": True}

@router.post("/devices/disable")
async def disable(data: SubscriptionInput, auth: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    user = await player(session, auth)
    device = (await session.execute(select(PushDevice).where(PushDevice.endpoint == data.endpoint, PushDevice.userId == user.id))).scalars().first()
    if device:
        device.active = False
        session.add(device)
        await session.commit()
    return {"success": True}

@router.post("/{reminder_id}/read")
async def mark_read(reminder_id: str, auth: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    user = await player(session, auth)
    reminder = await session.get(MatchReminder, reminder_id)
    if not reminder or reminder.userId != user.id:
        raise HTTPException(404, "Reminder not found")
    reminder.read = True
    session.add(reminder)
    await session.commit()
    return {"success": True}
