import json
import logging
from typing import List

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self._connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self._connections.append(websocket)
        logger.info(f"[WS] Client connecté (total: {len(self._connections)})")

    def disconnect(self, websocket: WebSocket):
        self._connections.remove(websocket)
        logger.info(f"[WS] Client déconnecté (restants: {len(self._connections)})")

    async def broadcast(self, data: dict):
        if not self._connections:
            return

        dead: List[WebSocket] = []
        message = json.dumps(data)

        for ws in self._connections:
            try:
                await ws.send_text(message)
            except Exception:
                logger.warning("[WS] Connexion morte détectée, retrait.")
                dead.append(ws)

        for ws in dead:
            self._connections.remove(ws)

    def active_connections_count(self) -> int:
        return len(self._connections)


manager = ConnectionManager()