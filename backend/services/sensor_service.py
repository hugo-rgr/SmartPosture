from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from models.sensor_model import SensorReadingModel, SensorDataModel
from schemas.sensor_schema import SensorReadingCreateSchema, SensorReadingResponseSchema

COLLECTION = "readings"

def _build_timestamp(arduino_ms: int) -> str:
    now = datetime.now(timezone.utc)
    prefix = now.strftime("%y%m%d%H%M")
    return f"{prefix}{arduino_ms}"

def _schema_to_model(payload: SensorReadingCreateSchema) -> SensorReadingModel:
    return SensorReadingModel(
        timestamp=_build_timestamp(payload.timestamp),
        sensorHigh=SensorDataModel(**payload.sensorHigh.model_dump()),
        sensorLow=SensorDataModel(**payload.sensorLow.model_dump()),
    )

def _doc_to_response(doc: dict) -> SensorReadingResponseSchema:
    doc["_id"] = str(doc["_id"])
    return SensorReadingResponseSchema(**doc)

async def create_reading(db: AsyncIOMotorDatabase, payload: SensorReadingCreateSchema) -> SensorReadingResponseSchema:
    model = _schema_to_model(payload)
    result = await db[COLLECTION].insert_one(model.to_dict())
    created = await db[COLLECTION].find_one({"_id": result.inserted_id})
    return _doc_to_response(created)

async def get_all_readings(db: AsyncIOMotorDatabase, limit: int = 100) -> list:
    cursor = db[COLLECTION].find().sort("_id", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [_doc_to_response(doc) for doc in docs]

async def get_reading_by_id(db: AsyncIOMotorDatabase, reading_id: str):
    doc = await db[COLLECTION].find_one({"_id": ObjectId(reading_id)})
    return None if doc is None else _doc_to_response(doc)