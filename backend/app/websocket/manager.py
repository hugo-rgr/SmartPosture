import json
import logging
from collections import defaultdict
from typing import Dict, List

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Registre en mémoire des connexions WebSocket actives.
    Organisé par gilet_id : plusieurs clients peuvent écouter le même gilet.

    Structure interne :
    {
        "gilet_01": [WebSocket_A, WebSocket_B],
        "gilet_02": [WebSocket_C],
    }
    """

    def __init__(self):
        self._connections: Dict[str, List[WebSocket]] = defaultdict(list)

    async def connect(self, gilet_id: str, websocket: WebSocket):
        await websocket.accept()
        self._connections[gilet_id].append(websocket)
        count = len(self._connections[gilet_id])
        logger.info(f"[WS] Client connecté → gilet={gilet_id} (total: {count})")

    def disconnect(self, gilet_id: str, websocket: WebSocket):
        self._connections[gilet_id].remove(websocket)
        count = len(self._connections[gilet_id])
        logger.info(f"[WS] Client déconnecté → gilet={gilet_id} (restants: {count})")

    async def broadcast_to_gilet(self, gilet_id: str, data: dict):
        """
        Envoie le payload JSON à tous les clients abonnés au gilet_id.
        Retire automatiquement les connexions mortes.
        """
        dead: List[WebSocket] = []
        subscribers = self._connections.get(gilet_id, [])

        if not subscribers:
            return  # personne n'écoute ce gilet, rien à faire

        message = json.dumps(data)
        for ws in subscribers:
            try:
                await ws.send_text(message)
            except Exception:
                logger.warning(f"[WS] Connexion morte détectée pour gilet={gilet_id}, retrait.")
                dead.append(ws)

        for ws in dead:
            self._connections[gilet_id].remove(ws)

    def active_connections_count(self) -> dict:
        return {gid: len(sockets) for gid, sockets in self._connections.items() if sockets}


# Instance singleton partagée dans toute l'application
manager = ConnectionManager()