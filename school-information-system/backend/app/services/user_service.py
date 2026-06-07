from sqlalchemy.orm import Session

from app.auth.password import get_password_hash
from app.models.enums import UserRole
from app.models.user import User


def create_super_admin_if_missing(db: Session, email: str, password: str) -> User:
    existing_user = db.query(User).filter(User.email == email).one_or_none()
    if existing_user:
        return existing_user

    user = User(
        full_name="System Administrator",
        email=email,
        password_hash=get_password_hash(password),
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
