from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user
from app.schemas.posture import PostureCreateSchema, PostureResponseSchema, PostureListResponseSchema
from app.services.posture_service import PostureService
from app.kafka.producer import publish_posture_created
from app.core.config import settings

router = APIRouter(prefix="/postures", tags=["Postures"])
posture_service = PostureService()


@router.post(
    "/",
    response_model=PostureResponseSchema,
    status_code=201,
    summary="Ajouter une posture manuellement",
)
async def create_posture(
    payload: PostureCreateSchema,
    _: dict = Depends(get_current_user),
):
    from app.websocket.manager import manager

    # Convertir le schema en dict compatible avec save_posture (même format que MQTT)
    data = payload.model_dump()
    data["id"] = data.pop("id")  # save_posture attend la clé "id"

    posture_id, gilet_id, date_key = await posture_service.save_posture(data)

    # Broadcast WebSocket
    await manager.broadcast_to_gilet(gilet_id, {
        "id":         payload.id,
        "activity":   payload.activity,
        "posture":    payload.posture,
        "angle_diff": payload.angle_diff,
        "sensorHigh": payload.sensorHigh.model_dump(),
        "sensorLow":  payload.sensorLow.model_dump(),
    })

    # Kafka → recalcul report
    if settings.KAFKA_ENABLED:
        await publish_posture_created(gilet_id, date_key, posture_id)

    return await posture_service.get_one_posture(posture_id)


@router.get(
    "/",
    response_model=PostureListResponseSchema,
    summary="Récupérer toutes les postures (paginées)",
)
async def get_all_postures(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    gilet_id: Optional[str] = Query(None, description="Filtrer par identifiant de gilet (ex: gilet_01)"),
    date_key: Optional[str] = Query(None, description="Filtrer par date (YYYYMMDD, ex: 20260303)"),
    posture: Optional[str] = Query(None, description="Filtrer par posture (ex: GOOD_POSTURE, BAD_POSTURE)"),
    activity: Optional[str] = Query(None, description="Filtrer par activité (ex: STAND_UP, SIT_DOWN)"),
    _: dict = Depends(get_current_user),
):
    return await posture_service.get_all_postures(
        skip=skip, limit=limit,
        gilet_id=gilet_id, date_key=date_key,
        posture=posture, activity=activity,
    )


@router.get(
    "/{posture_id}",
    response_model=PostureResponseSchema,
    summary="Récupérer une posture par son ID",
)
async def get_one_posture(
    posture_id: str,
    _: dict = Depends(get_current_user),
):
    return await posture_service.get_one_posture(posture_id)