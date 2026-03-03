import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.database import connect_db, close_db
from app.controllers.auth_controller import router as auth_router
from app.controllers.posture_controller import router as posture_router
from app.mqtt.client import mqtt, init_mqtt_handlers
from app.services.posture_service import PostureService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)

posture_service = PostureService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Démarrage de l'application SafeWear API...")
    await connect_db()
    init_mqtt_handlers(posture_service)
    await mqtt.mqtt_startup()
    logger.info("MQTT démarré.")

    yield

    # Shutdown
    logger.info("Arrêt de l'application...")
    await mqtt.mqtt_shutdown()
    await close_db()


app = FastAPI(
    title="SafeWear Posture API",
    description="API REST pour la collecte et la consultation des données de posture des gilets SafeWear.",
    version="1.0.0",
    lifespan=lifespan,
)

# Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(posture_router, prefix="/api/v1")


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "service": "SafeWear Posture API"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}