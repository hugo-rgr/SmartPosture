from typing import Optional
from fastapi import HTTPException, status
from bson import ObjectId
from datetime import datetime

from app.core.database import get_database
from app.schemas.posture import PostureResponseSchema, PostureListResponseSchema


def _serialize(doc: dict) -> PostureResponseSchema:
    doc["id"] = str(doc.pop("_id"))
    return PostureResponseSchema(**doc)


class PostureService:
    @staticmethod
    def _collection():
        return get_database()["posture"]

    async def save_posture(self, payload: dict):
        col = self._collection()

        gilet_id = payload.get("id")
        date_key = datetime.now().strftime("%Y-%m-%d")

        doc = {
            "gilet_id": gilet_id,
            "timestamp": payload.get("timestamp"),
            "activity": payload.get("activity"),
            "posture": payload.get("posture"),
            "angle_diff": payload.get("angle_diff"),
            "sensorHigh": payload.get("sensorHigh"),
            "sensorLow": payload.get("sensorLow"),
        }

        result = await col.insert_one(doc)
        posture_id = str(result.inserted_id)

        return posture_id, gilet_id, date_key

    async def get_all_postures(
        self,
        skip: int = 0,
        limit: int = 50,
        gilet_id: Optional[str] = None,
    ) -> PostureListResponseSchema:
        col = self._collection()
        query = {}
        if gilet_id:
            query["gilet_id"] = gilet_id

        total = await col.count_documents(query)
        cursor = col.find(query).skip(skip).limit(limit).sort("timestamp", -1)
        docs = await cursor.to_list(length=limit)
        return PostureListResponseSchema(
            total=total,
            data=[_serialize(doc) for doc in docs],
        )

    async def get_one_posture(self, posture_id: str) -> PostureResponseSchema:
        col = self._collection()
        if not ObjectId.is_valid(posture_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID invalide")

        doc = await col.find_one({"_id": ObjectId(posture_id)})
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Posture introuvable")

        return _serialize(doc)