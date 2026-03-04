import json
import logging

from aiokafka import AIOKafkaProducer

from app.core.config import settings

logger = logging.getLogger(__name__)

_producer: AIOKafkaProducer = None


async def start_producer():
    global _producer
    _producer = AIOKafkaProducer(
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
    )
    await _producer.start()
    logger.info(f"[Kafka Producer] Démarré → {settings.KAFKA_BOOTSTRAP_SERVERS}")


async def stop_producer():
    global _producer
    if _producer:
        await _producer.stop()
        logger.info("[Kafka Producer] Arrêté")


async def publish_posture_created(gilet_id: str, date_key: str, posture_id: str):
    """
    Publie un événement 'posture.created' sur le topic Kafka.
    Le consumer déclenchera le recalcul du report pour (gilet_id, date_key).
    """
    if _producer is None:
        logger.warning("[Kafka Producer] Non initialisé, événement ignoré")
        return

    event = {
        "event":      "posture.created",
        "gilet_id":   gilet_id,
        "date_key":   date_key,
        "posture_id": posture_id,
    }
    await _producer.send_and_wait(settings.KAFKA_TOPIC_POSTURE, event)
    logger.info(f"[Kafka Producer] Événement publié: gilet={gilet_id} date={date_key}")