from fastapi import HTTPException, status

from app.core.database import get_database
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.user import UserRegisterSchema, UserLoginSchema, TokenSchema, UserResponseSchema


class AuthService:
    @staticmethod
    def _collection():
        return get_database()["users"]

    async def register(self, payload: UserRegisterSchema) -> UserResponseSchema:
        col = self._collection()

        existing = await col.find_one({
            "$or": [{"username": payload.username}, {"email": payload.email}]
        })
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username ou email déjà utilisé",
            )

        user_doc = {
            "username": payload.username,
            "email": payload.email,
            "hashed_password": hash_password(payload.password),
        }
        await col.insert_one(user_doc)
        return UserResponseSchema(username=payload.username, email=payload.email)

    async def login(self, payload: UserLoginSchema) -> TokenSchema:
        col = self._collection()

        user = await col.find_one({"username": payload.username})
        if not user or not verify_password(payload.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Identifiants incorrects",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token = create_access_token(data={"sub": user["username"]})
        return TokenSchema(access_token=token)