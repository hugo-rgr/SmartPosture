from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from core.config import settings

client: AsyncIOMotorClient | None = None


async def connect_db() -> None:
    global client
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    await client.admin.command("ping")
    print(f"MongoDB connecté : {settings.MONGODB_URI} / db={settings.MONGODB_DB}")


async def close_db() -> None:
    global client
    if client:
        client.close()
        print("MongoDB déconnecté")


def get_database() -> AsyncIOMotorDatabase:
    if client is None:
        raise RuntimeError("La base de données n'est pas initialisée.")
    return client[settings.MONGODB_DB]