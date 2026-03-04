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
    MQTT_ENABLED: bool = True
    MQTT_HOST: str = "broker.hivemq.com"
    MQTT_PORT: int = 1883
    MQTT_SSL: bool = False
    MQTT_USERNAME: str = ""
    MQTT_PASSWORD: str = ""
    MQTT_TOPIC: str = "safewear/+/capteurs"

    # Kafka
    KAFKA_ENABLED: bool = True
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_TOPIC_POSTURE: str = "posture.created"
    KAFKA_CONSUMER_GROUP: str = "report-consumer-group"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()