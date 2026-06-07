from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import UserRole


class UserCreate(BaseModel):
    full_name: str = Field(..., description="Full name of the user")
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., description="Plaintext password")
    school_id: int | None = Field(None, description="Associated school identifier")
    role: UserRole = Field(..., description="Assigned user role")
    is_active: bool = Field(default=True, description="Active user flag")


class UserUpdate(BaseModel):
    full_name: str | None = Field(None, description="Full name of the user")
    email: EmailStr | None = Field(None, description="Email address")
    password: str | None = Field(None, description="Plaintext password")
    school_id: int | None = Field(None, description="Associated school identifier")
    role: UserRole | None = Field(None, description="Assigned user role")
    is_active: bool | None = Field(None, description="Active user flag")


class UserResponse(BaseModel):
    id: int
    school_id: int | None
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }
