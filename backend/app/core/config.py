from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # MongoDB
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "safewear"

    # JWT
    JWT_SECRET_KEY: str = "change-this-secret-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # MQTT
    MQTT_ENABLED: bool = True                      # False = démarre sans MQTT
    MQTT_HOST: str = "broker.hivemq.com"
    MQTT_PORT: int = 1883                          # 1883 sans TLS, 8883 avec TLS
    MQTT_SSL: bool = False                         # True pour HiveMQ Cloud
    MQTT_USERNAME: str = ""
    MQTT_PASSWORD: str = ""
    MQTT_TOPIC: str = "safewear/+/capteurs"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()