from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId


class UserModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    username: str
    email: str
    hashed_password: str

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}