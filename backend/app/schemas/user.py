from pydantic import BaseModel, EmailStr


class UserRegisterSchema(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLoginSchema(BaseModel):
    username: str
    password: str


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponseSchema(BaseModel):
    username: str
    email: str