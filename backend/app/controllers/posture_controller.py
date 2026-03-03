from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user
from app.schemas.posture import PostureResponseSchema, PostureListResponseSchema
from app.services.posture_service import PostureService

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
    gilet_id: Optional[str] = Query(None, description="Filtrer par identifiant de gilet"),
    date_key: Optional[str] = Query(None, description="Filtrer par date (YYYYMMDD)"),
    _: dict = Depends(get_current_user),
):
    return await posture_service.get_all_postures(
        skip=skip, limit=limit, gilet_id=gilet_id, date_key=date_key
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