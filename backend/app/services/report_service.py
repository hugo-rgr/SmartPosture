import math
import time
from typing import Optional, List

from fastapi import HTTPException, status

from app.core.database import get_database
from app.schemas.report import ReportResponseSchema, ReportListResponseSchema


def _serialize(doc: dict) -> ReportResponseSchema:
    doc["id"] = str(doc.pop("_id"))
    return ReportResponseSchema(**doc)


def _compute_std(values: List[float], mean: float) -> float:
    if len(values) < 2:
        return 0.0
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    return round(math.sqrt(variance), 4)


def _compute_streaks(postures: List[str]) -> tuple[int, int]:
    max_streak = 0
    streak_count = 0
    current = 0
    in_streak = False

    for p in postures:
        if p != "GOOD_POSTURE":
            current += 1
            if not in_streak:
                streak_count += 1
                in_streak = True
            max_streak = max(max_streak, current)
        else:
            current = 0
            in_streak = False

    return max_streak, streak_count


class ReportService:
    @staticmethod
    def _col_report():
        return get_database()["report"]

    @staticmethod
    def _col_posture():
        return get_database()["posture"]

    async def compute_and_save_report(self, gilet_id: str, date_key: str) -> ReportResponseSchema:
        col_p = self._col_posture()
        col_r = self._col_report()

        cursor = col_p.find(
            {"gilet_id": gilet_id, "date_key": date_key},
            {"posture": 1, "angle_diff": 1, "activity": 1, "_id": 0}
        ).sort("timestamp", 1)
        docs = await cursor.to_list(length=None)

        if not docs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Aucune posture pour gilet={gilet_id} date={date_key}"
            )

        postures      = [d["posture"] for d in docs]
        angle_diffs   = [d["angle_diff"] for d in docs]
        activities    = [d["activity"] for d in docs]

        total         = len(postures)
        good          = sum(1 for p in postures if p == "GOOD_POSTURE")
        bad           = total - good

        angle_mean    = round(sum(angle_diffs) / total, 4)
        angle_max     = round(max(angle_diffs), 4)
        angle_min     = round(min(angle_diffs), 4)
        angle_std     = _compute_std(angle_diffs, angle_mean)

        activity_counts: dict = {}
        for a in activities:
            activity_counts[a] = activity_counts.get(a, 0) + 1
        most_common = max(activity_counts, key=activity_counts.get)

        max_streak, streak_count = _compute_streaks(postures)

        report_doc = {
            "gilet_id":               gilet_id,
            "date_key":               date_key,
            "total_postures":         total,
            "good_postures":          good,
            "bad_postures":           bad,
            "good_posture_ratio":     round(good / total, 4),
            "bad_posture_ratio":      round(bad / total, 4),
            "angle_diff_mean":        angle_mean,
            "angle_diff_max":         angle_max,
            "angle_diff_min":         angle_min,
            "angle_diff_std":         angle_std,
            "activity_counts":        activity_counts,
            "most_common_activity":   most_common,
            "max_bad_posture_streak": max_streak,
            "bad_posture_streak_count": streak_count,
            "last_updated_at":        int(time.time()),
        }

        result = await col_r.find_one_and_replace(
            {"gilet_id": gilet_id, "date_key": date_key},
            report_doc,
            upsert=True,
            return_document=True,
        )

        saved = await col_r.find_one({"gilet_id": gilet_id, "date_key": date_key})
        return _serialize(saved)

    async def get_all_reports(
        self,
        gilet_id: Optional[str] = None,
        date_key: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> ReportListResponseSchema:
        col = self._col_report()
        query = {}
        if gilet_id:
            query["gilet_id"] = gilet_id
        if date_key:
            query["date_key"] = date_key

        total = await col.count_documents(query)
        cursor = col.find(query).skip(skip).limit(limit).sort("date_key", -1)
        docs = await cursor.to_list(length=limit)
        return ReportListResponseSchema(
            total=total,
            data=[_serialize(d) for d in docs],
        )

    async def get_one_report(self, gilet_id: str, date_key: str) -> ReportResponseSchema:
        col = self._col_report()
        doc = await col.find_one({"gilet_id": gilet_id, "date_key": date_key})
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report introuvable pour gilet={gilet_id} date={date_key}"
            )
        return _serialize(doc)