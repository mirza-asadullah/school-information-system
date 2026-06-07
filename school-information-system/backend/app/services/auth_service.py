from typing import Any

from app.auth.jwt import build_token_payload, create_access_token
from app.models.user import User


def create_token_payload_for_user(user: User) -> dict[str, Any]:
    return build_token_payload(
        user_id=user.id,
        email=user.email,
        role=user.role.value,
        school_id=user.school_id,
    )


def create_access_token_for_user(user: User) -> str:
    payload = create_token_payload_for_user(user)
    return create_access_token(subject=str(user.id), data=payload)
