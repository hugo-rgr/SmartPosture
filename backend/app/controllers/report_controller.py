from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user
from app.schemas.report import ReportResponseSchema, ReportListResponseSchema
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])
report_service = ReportService()


@router.get(
    "/",
    response_model=ReportListResponseSchema,
    summary="Récupérer tous les reports (filtrables par gilet et/ou date)",
)
async def get_all_reports(
    gilet_id: Optional[str] = Query(None, description="Filtrer par gilet"),
    date_key: Optional[str] = Query(None, description="Filtrer par date (YYYYMMDD)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: dict = Depends(get_current_user),
):
    return await report_service.get_all_reports(
        gilet_id=gilet_id, date_key=date_key, skip=skip, limit=limit
    )


@router.get(
    "/{gilet_id}/{date_key}",
    response_model=ReportResponseSchema,
    summary="Récupérer le report d'un gilet pour un jour donné (YYYYMMDD)",
)
async def get_one_report(
    gilet_id: str,
    date_key: str,
    _: dict = Depends(get_current_user),
):
    return await report_service.get_one_report(gilet_id, date_key)


@router.post(
    "/{gilet_id}/{date_key}/recompute",
    response_model=ReportResponseSchema,
    summary="Forcer le recalcul du report pour un gilet et une date",
)
async def recompute_report(
    gilet_id: str,
    date_key: str,
    _: dict = Depends(get_current_user),
):
    return await report_service.compute_and_save_report(gilet_id, date_key)