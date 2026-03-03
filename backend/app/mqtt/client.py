import json
import logging

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


def init_mqtt_handlers(posture_service, kafka_producer_fn=None):

    @mqtt.on_connect()
    def on_connect(client, flags, rc, properties):
        logger.info(f"[MQTT] Connecté au broker {settings.MQTT_HOST} (rc={rc})")
        mqtt.client.subscribe(settings.MQTT_TOPIC)
        logger.info(f"[MQTT] Abonné au topic: {settings.MQTT_TOPIC}")

    @mqtt.on_message()
    async def on_message(client, topic, payload, qos, properties):
        try:
            data = json.loads(payload.decode("utf-8"))
            logger.info(f"[MQTT] Message reçu sur '{topic}': gilet={data.get('id')}")
            posture_id, gilet_id, date_key = await posture_service.save_posture(data)
            logger.info(f"[MQTT] Posture sauvegardée (id={posture_id})")
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