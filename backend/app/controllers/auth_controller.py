from fastapi import APIRouter

from app.schemas.user import UserRegisterSchema, UserLoginSchema, TokenSchema, UserResponseSchema
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])
auth_service = AuthService()


@router.post(
    "/register",
    response_model=UserResponseSchema,
    status_code=201,
    summary="Créer un nouveau compte",
)
async def register(payload: UserRegisterSchema):
    return await auth_service.register(payload)


@router.post(
    "/login",
    response_model=TokenSchema,
    summary="Se connecter et obtenir un JWT",
)
async def login(payload: UserLoginSchema):
    return await auth_service.login(payload)