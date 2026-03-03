from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client: AsyncIOMotorClient = None


async def connect_db():
    global client
    client = AsyncIOMotorClient(settings.MONGO_URI)
    print(f"[MongoDB] Connected to '{settings.MONGO_DB_NAME}'")


async def close_db():
    global client
    if client:
        client.close()
        print("[MongoDB] Connection closed")


def get_database():
    return client[settings.MONGO_DB_NAME]