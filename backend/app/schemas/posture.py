from typing import List, Optional
from pydantic import BaseModel


class SensorDataSchema(BaseModel):
    accX: float
    accY: float
    accZ: float
    gyrX: float
    gyrY: float
    gyrZ: float


class PostureCreateSchema(BaseModel):
    id: str
    activity: str
    posture: str
    angle_diff: float
    sensorHigh: SensorDataSchema
    sensorLow: SensorDataSchema


class PostureResponseSchema(BaseModel):
    id: Optional[str] = None
    gilet_id: str
    timestamp: int
    date_key: str
    activity: str
    posture: str
    angle_diff: float
    sensorHigh: SensorDataSchema
    sensorLow: SensorDataSchema

    class Config:
        populate_by_name = True


class PostureListResponseSchema(BaseModel):
    total: int
    data: List[PostureResponseSchema]