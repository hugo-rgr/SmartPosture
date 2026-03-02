from fastapi import APIRouter, HTTPException, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from db.mongodb import get_database
from schemas.sensor_schema import SensorReadingCreateSchema, SensorReadingResponseSchema
from services import sensor_service

router = APIRouter(prefix="/sensors", tags=["Sensors"])


@router.post(
    "/readings",
    response_model=SensorReadingResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Enregistrer une lecture capteur",
)
async def post_reading(
    payload: SensorReadingCreateSchema,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await sensor_service.create_reading(db, payload)


@router.get(
    "/readings",
    response_model=list[SensorReadingResponseSchema],
    summary="Lister les dernières lectures",
)
async def list_readings(
    limit: int = 100,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await sensor_service.get_all_readings(db, limit)


@router.get(
    "/readings/{reading_id}",
    response_model=SensorReadingResponseSchema,
    summary="Récupérer une lecture par ID",
)
async def get_reading(
    reading_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    reading = await sensor_service.get_reading_by_id(db, reading_id)
    if reading is None:
        raise HTTPException(status_code=404, detail="Lecture introuvable")
    return reading