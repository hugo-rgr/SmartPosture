from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException, status
from bson import ObjectId

from app.core.database import get_database
from app.schemas.posture import PostureResponseSchema, PostureListResponseSchema


def _build_timestamp() -> tuple[int, str]:
    now = datetime.now(timezone.utc)
    date_key = now.strftime("%Y%m%d")
    timestamp = int(now.timestamp())
    return timestamp, date_key


def _serialize(doc: dict) -> PostureResponseSchema:
    doc["id"] = str(doc.pop("_id"))
    return PostureResponseSchema(**doc)


class PostureService:
    @staticmethod
    def _collection():
        return get_database()["posture"]

    async def save_posture(self, payload: dict) -> tuple[str, str, str]:
        col = self._collection()

        timestamp, date_key = _build_timestamp()

        doc = {
            "gilet_id":   payload.get("id"),
            "timestamp":  timestamp,
            "date_key":   date_key,
            "activity":   payload.get("activity"),
            "posture":    payload.get("posture"),
            "angle_diff": payload.get("angle_diff"),
            "sensorHigh": payload.get("sensorHigh"),
            "sensorLow":  payload.get("sensorLow"),
        }
        result = await col.insert_one(doc)
        return str(result.inserted_id), doc["gilet_id"], date_key

    async def get_all_postures(
        self,
        skip: int = 0,
        limit: int = 50,
        gilet_id: Optional[str] = None,
        date_key: Optional[str] = None,
        posture: Optional[str] = None,
        activity: Optional[str] = None,
    ) -> PostureListResponseSchema:
        col = self._collection()
        query = {}
        if gilet_id:
            query["gilet_id"] = gilet_id
        if date_key:
            query["date_key"] = date_key
        if posture:
            query["posture"] = posture
        if activity:
            query["activity"] = activity

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