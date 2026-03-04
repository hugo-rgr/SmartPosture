import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError, jwt

from app.core.config import settings
from app.websocket.manager import manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/posture")
async def websocket_posture(
    websocket: WebSocket,
    token: str = Query(..., description="JWT token pour authentification"),
):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        username = payload.get("sub")
        if not username:
            await websocket.close(code=4001, reason="Token invalide")
            return
    except JWTError:
        await websocket.close(code=4001, reason="Token invalide ou expiré")
        return

    await manager.connect(websocket)
    logger.info(f"[WS] '{username}' connecté (tous gilets)")

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info(f"[WS] '{username}' déconnecté")