from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user
from app.schemas.posture import PostureCreateSchema, PostureResponseSchema, PostureListResponseSchema
from app.services.posture_service import PostureService
from app.kafka.producer import publish_posture_created
from app.core.config import settings

router = APIRouter(prefix="/postures", tags=["Postures"])
posture_service = PostureService()

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

# TEST
@router.post(
    "/",
    response_model=PostureResponseSchema,
    status_code=201,
    summary="Route de test pour alimenter des postures cohérentes",
)
async def create_posture(
    payload: PostureCreateSchema,
    _: dict = Depends(get_current_user),
):
    data = payload.model_dump()
    data["id"] = data.pop("id")

    # mise en bdd, pas de publication kafka ni websocket
    posture_id, gilet_id, date_key = await posture_service.save_posture(data)

    return await posture_service.get_one_posture(posture_id)