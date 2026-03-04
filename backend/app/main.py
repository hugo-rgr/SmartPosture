import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import connect_db, close_db
from app.controllers.auth_controller import router as auth_router
from app.controllers.posture_controller import router as posture_router
from app.controllers.report_controller import router as report_router
from app.controllers.ws_controller import router as ws_router
from app.mqtt.client import mqtt, init_mqtt_handlers
from app.services.posture_service import PostureService
from app.services.report_service import ReportService
from app.kafka.producer import start_producer, stop_producer, publish_posture_created
from app.kafka.consumer import start_consumer, stop_consumer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)

posture_service = PostureService()
report_service = ReportService()

mqtt_connected = False
kafka_enabled = False


app = FastAPI(
    title="SafeWear Posture API",
    description="API REST pour la collecte et la consultation des données de posture des gilets SafeWear.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,    prefix="/api/v1")
app.include_router(posture_router, prefix="/api/v1")
app.include_router(report_router,  prefix="/api/v1")
app.include_router(ws_router)


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "service": "SafeWear Posture API"}


@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "healthy",
        "mqtt":   "connected" if mqtt_connected else "disconnected",
        "kafka":  "connected" if kafka_enabled  else "disconnected",
    }


@app.on_event("startup")
async def startup():
    global mqtt_connected, kafka_enabled

    logger.info("Démarrage de l'application SafeWear API...")
    await connect_db()

    if settings.KAFKA_ENABLED:
        try:
            await start_producer()
            await start_consumer(report_service)
            kafka_enabled = True
            logger.info("[Kafka] Producer + Consumer démarrés")
        except Exception as e:
            logger.warning(f"[Kafka] Impossible de démarrer: {e}")
            logger.warning("[Kafka] L'API démarre sans Kafka.")

    if settings.MQTT_ENABLED:
        kafka_fn = publish_posture_created if kafka_enabled else None
        init_mqtt_handlers(posture_service, kafka_producer_fn=kafka_fn)

        await mqtt.mqtt_startup()

        mqtt.init_app(app)

        mqtt_connected = True
        logger.info(f"[MQTT] Connecté à {settings.MQTT_HOST}:{settings.MQTT_PORT}")
    else:
        logger.info("[MQTT] Désactivé (MQTT_ENABLED=False)")


@app.on_event("shutdown")
async def shutdown():
    logger.info("Arrêt de l'application...")
    if mqtt_connected:
        await mqtt.mqtt_shutdown()
    if kafka_enabled:
        await stop_consumer()
        await stop_producer()
    await close_db()