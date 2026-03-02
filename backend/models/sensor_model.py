from dataclasses import dataclass, field


@dataclass
class SensorDataModel:
    accX: float
    accY: float
    accZ: float
    gyrX: float
    gyrY: float
    gyrZ: float

    def to_dict(self) -> dict:
        return {
            "accX": self.accX,
            "accY": self.accY,
            "accZ": self.accZ,
            "gyrX": self.gyrX,
            "gyrY": self.gyrY,
            "gyrZ": self.gyrZ,
        }


@dataclass
class SensorReadingModel:
    timestamp: str
    sensorHigh: SensorDataModel
    sensorLow: SensorDataModel

    def to_dict(self) -> dict:
        return {
            "timestamp": self.timestamp,
            "sensorHigh": self.sensorHigh.to_dict(),
            "sensorLow": self.sensorLow.to_dict(),
        }