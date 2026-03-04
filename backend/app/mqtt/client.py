import asyncio
import json
import logging
import time

from fastapi_mqtt import FastMQTT, MQTTConfig

from app.core.config import settings

logger = logging.getLogger(__name__)

mqtt_config = MQTTConfig(
    host=settings.MQTT_HOST,
    port=settings.MQTT_PORT,
    keepalive=60,
    username=settings.MQTT_USERNAME if settings.MQTT_USERNAME else None,
    password=settings.MQTT_PASSWORD if settings.MQTT_PASSWORD else None,
    ssl=settings.MQTT_SSL,
)

mqtt = FastMQTT(config=mqtt_config)

_last_seen: dict[str, float] = {}
GILET_TIMEOUT_SECONDS = 5
_watchdog_task: asyncio.Task = None


async def _watchdog_loop():
    from app.websocket.manager import manager

    while True:
        await asyncio.sleep(1)
        now = time.time()

        for gilet_id, last_seen in list(_last_seen.items()):
            elapsed = now - last_seen
            if elapsed >= GILET_TIMEOUT_SECONDS:
                logger.warning(
                    f"[Watchdog] Gilet '{gilet_id}' silencieux depuis "
                    f"{elapsed:.1f}s → broadcast DISCONNECTED"
                )
                await manager.broadcast({
                    "id":         gilet_id,
                    "status":     "DISCONNECTED",
                    "last_seen":  last_seen,
                    "silent_for": round(elapsed, 1),
                    "timestamp":  None,
                    "activity":   None,
                    "posture":    None,
                    "angle_diff": None,
                    "sensorHigh": None,
                    "sensorLow":  None,
                })


async def start_watchdog():
    global _watchdog_task
    _watchdog_task = asyncio.create_task(_watchdog_loop())
    logger.info(f"[Watchdog] Démarré (timeout={GILET_TIMEOUT_SECONDS}s)")


async def stop_watchdog():
    global _watchdog_task
    if _watchdog_task and not _watchdog_task.done():
        _watchdog_task.cancel()
        try:
            await _watchdog_task
        except asyncio.CancelledError:
            pass
    logger.info("[Watchdog] Arrêté")


def init_mqtt_handlers(posture_service, kafka_producer_fn=None):

    @mqtt.on_connect()
    def on_connect(client, flags, rc, properties):
        logger.info(f"[MQTT] Connecté au broker {settings.MQTT_HOST} (rc={rc})")
        mqtt.client.subscribe(settings.MQTT_TOPIC)
        logger.info(f"[MQTT] Abonné au topic: {settings.MQTT_TOPIC}")

    @mqtt.on_message()
    async def on_message(client, topic, payload, qos, properties):
        from app.websocket.manager import manager

        try:
            data = json.loads(payload.decode("utf-8"))
            gilet_id = data.get("id")
            logger.info(f"[MQTT] Message reçu sur '{topic}': gilet={gilet_id}")

            _last_seen[gilet_id] = time.time()

            posture_id, gilet_id, date_key = await posture_service.save_posture(data)
            logger.info(f"[MQTT] Posture sauvegardée (id={posture_id})")

            ws_payload = {
                "id":         data.get("id"),
                "status":     "CONNECTED",
                "timestamp":  data.get("timestamp"),
                "activity":   data.get("activity"),
                "posture":    data.get("posture"),
                "angle_diff": data.get("angle_diff"),
                "sensorHigh": data.get("sensorHigh"),
                "sensorLow":  data.get("sensorLow"),
            }
            await manager.broadcast(ws_payload)

            if kafka_producer_fn:
                await kafka_producer_fn(gilet_id, date_key, posture_id)

        except json.JSONDecodeError:
            logger.error(f"[MQTT] Payload non-JSON reçu sur '{topic}'")
        except Exception as e:
            logger.error(f"[MQTT] Erreur lors du traitement du message: {e}")

    @mqtt.on_disconnect()
    def on_disconnect(client, packet, exc=None):
        logger.warning(f"[MQTT] Déconnecté du broker (exc={exc})")

    @mqtt.on_subscribe()
    def on_subscribe(client, mid, qos, properties):
        logger.info(f"[MQTT] Souscription confirmée (mid={mid})")