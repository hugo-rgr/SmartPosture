from contextlib import asynccontextmanager
from fastapi import FastAPI
from db.mongodb import connect_db, close_db
from controllers.sensor_controller import router as sensor_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="SmartPosture API",
    description="API de détection posturale",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(sensor_router, prefix="/api")


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}