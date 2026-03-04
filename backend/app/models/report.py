from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId


class ReportModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")

    # Identifiants
    gilet_id: str
    date_key: str          # "20260303"

    # Compteurs de postures
    total_postures: int
    good_postures: int
    bad_postures: int

    # Ratios (0.0 → 1.0)
    good_posture_ratio: float
    bad_posture_ratio: float

    # Angle diff stats
    angle_diff_mean: float
    angle_diff_max: float
    angle_diff_min: float
    angle_diff_std: float      # écart-type

    # Activités (distribution)
    activity_counts: dict      # {"STAND_UP": 12, "SIT_DOWN": 5, ...}
    most_common_activity: str

    # Séquences de mauvaise posture
    max_bad_posture_streak: int    # plus longue série consécutive de mauvaises postures
    bad_posture_streak_count: int  # nombre total de séquences mauvaises

    # Timestamp de dernière mise à jour
    last_updated_at: int       # timestamp Unix

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}