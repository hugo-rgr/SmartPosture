from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId


class SensorData(BaseModel):
    accX: float
    accY: float
    accZ: float
    gyrX: float
    gyrY: float
    gyrZ: float


class PostureModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    gilet_id: str
    timestamp: int
    date_key: str      # "20260303" — clé de jointure avec le report
    activity: str
    posture: str
    angle_diff: float
    sensorHigh: SensorData
    sensorLow: SensorData

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}