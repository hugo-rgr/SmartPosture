from pydantic import BaseModel, Field

class SensorDataSchema(BaseModel):
    accX: float
    accY: float
    accZ: float
    gyrX: float
    gyrY: float
    gyrZ: float

class SensorReadingCreateSchema(BaseModel):
    timestamp: int = Field(..., description="Timestamp Arduino en millisecondes")
    sensorHigh: SensorDataSchema
    sensorLow: SensorDataSchema

class SensorReadingResponseSchema(BaseModel):
    id: str = Field(..., alias="_id")
    timestamp: str = Field(..., description="Timestamp enrichi : yymmddhhmm+timestamp_arduino")
    sensorHigh: SensorDataSchema
    sensorLow: SensorDataSchema

    class Config:
        populate_by_name = True