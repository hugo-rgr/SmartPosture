import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError, jwt

from app.core.config import settings
from app.websocket.manager import manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/posture/{gilet_id}")
async def websocket_posture(
    gilet_id: str,
    websocket: WebSocket,
    token: str = Query(..., description="JWT token pour authentification"),
):
    """
    WebSocket sécurisé par JWT (passé en query param).
    Connexion : ws://localhost:8000/ws/posture/gilet_01?token=<jwt>

    Le client reçoit en temps réel chaque nouvelle posture du gilet ciblé,
    avec toutes les données capteurs (accéléromètre + gyroscope).
    """
    # Vérification JWT avant d'accepter la connexion
    # (les WebSockets ne supportent pas les headers Authorization standards)
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        username = payload.get("sub")
        if not username:
            await websocket.close(code=4001, reason="Token invalide")
            return
    except JWTError:
        await websocket.close(code=4001, reason="Token invalide ou expiré")
        return

    # Connexion acceptée
    await manager.connect(gilet_id, websocket)
    logger.info(f"[WS] '{username}' abonné au gilet '{gilet_id}'")

    try:
        # Maintenir la connexion ouverte
        # On écoute les messages entrants (ping/pong keepalive ou déconnexion propre)
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(gilet_id, websocket)
        logger.info(f"[WS] '{username}' déconnecté du gilet '{gilet_id}'")