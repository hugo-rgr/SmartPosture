from typing import Dict, List, Optional
from pydantic import BaseModel


class ReportResponseSchema(BaseModel):
    id: Optional[str] = None
    gilet_id: str
    date_key: str

    total_postures: int
    good_postures: int
    bad_postures: int
    good_posture_ratio: float
    bad_posture_ratio: float

    angle_diff_mean: float
    angle_diff_max: float
    angle_diff_min: float
    angle_diff_std: float

    activity_counts: Dict[str, int]
    most_common_activity: str

    max_bad_posture_streak: int
    bad_posture_streak_count: int

    last_updated_at: int

    class Config:
        populate_by_name = True


class ReportListResponseSchema(BaseModel):
    total: int
    data: List[ReportResponseSchema]