import asyncio
import json
import logging

from aiokafka import AIOKafkaConsumer

from app.core.config import settings

logger = logging.getLogger(__name__)

_consumer_task: asyncio.Task = None


async def _consume_loop(report_service):
    consumer = AIOKafkaConsumer(
        settings.KAFKA_TOPIC_POSTURE,
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id=settings.KAFKA_CONSUMER_GROUP,
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
        auto_offset_reset="earliest",
        enable_auto_commit=True,
    )
    await consumer.start()
    logger.info(
        f"[Kafka Consumer] Démarré — topic={settings.KAFKA_TOPIC_POSTURE} "
        f"group={settings.KAFKA_CONSUMER_GROUP}"
    )

    try:
        async for msg in consumer:
            event = msg.value
            gilet_id = event.get("gilet_id")
            date_key = event.get("date_key")

            if not gilet_id or not date_key:
                logger.warning(f"[Kafka Consumer] Événement malformé: {event}")
                continue

            logger.info(
                f"[Kafka Consumer] Reçu posture.created — "
                f"gilet={gilet_id} date={date_key}"
            )

            try:
                report = await report_service.compute_and_save_report(gilet_id, date_key)
                logger.info(
                    f"[Kafka Consumer] Report mis à jour — "
                    f"gilet={gilet_id} date={date_key} "
                    f"total={report.total_postures} good_ratio={report.good_posture_ratio}"
                )
            except Exception as e:
                logger.error(f"[Kafka Consumer] Erreur lors du calcul du report: {e}")

    except asyncio.CancelledError:
        logger.info("[Kafka Consumer] Boucle annulée")
    finally:
        await consumer.stop()
        logger.info("[Kafka Consumer] Arrêté")


async def start_consumer(report_service):
    global _consumer_task
    _consumer_task = asyncio.create_task(_consume_loop(report_service))
    logger.info("[Kafka Consumer] Tâche démarrée en arrière-plan")


async def stop_consumer():
    global _consumer_task
    if _consumer_task and not _consumer_task.done():
        _consumer_task.cancel()
        try:
            await _consumer_task
        except asyncio.CancelledError:
            pass
    logger.info("[Kafka Consumer] Tâche arrêtée")