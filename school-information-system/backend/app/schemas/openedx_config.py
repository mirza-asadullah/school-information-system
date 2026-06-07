from datetime import datetime

from pydantic import BaseModel, Field


class OpenEdxConfigCreate(BaseModel):
    school_id: int = Field(..., description="Associated school identifier")
    base_url: str = Field(..., description="Open edX base URL")
    client_id: str = Field(..., description="Open edX client identifier")
    client_secret: str = Field(..., description="Open edX client secret")
    access_token: str | None = Field(None, description="Open edX access token")
    refresh_token: str | None = Field(None, description="Open edX refresh token")
    is_active: bool | None = Field(True, description="Whether the integration is active")


class OpenEdxConfigUpdate(BaseModel):
    school_id: int | None = Field(None, description="Associated school identifier")
    base_url: str | None = Field(None, description="Open edX base URL")
    client_id: str | None = Field(None, description="Open edX client identifier")
    client_secret: str | None = Field(None, description="Open edX client secret")
    access_token: str | None = Field(None, description="Open edX access token")
    refresh_token: str | None = Field(None, description="Open edX refresh token")
    is_active: bool | None = Field(None, description="Whether the integration is active")


class OpenEdxConfigResponse(BaseModel):
    id: int
    school_id: int
    base_url: str
    client_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class OpenEdxConfigListResponse(BaseModel):
    items: list[OpenEdxConfigResponse]
    page: int
    per_page: int
    total: int

    model_config = {
        "from_attributes": True,
    }


class OpenEdxActionRequest(BaseModel):
    config_id: int = Field(..., description="Open edX configuration identifier")


class OpenEdxActionResponse(BaseModel):
    success: bool
    message: str
    synced_count: int | None = None
    details: str | None = None

    model_config = {
        "from_attributes": True,
    }


class OpenEdxCourseCreateRequest(BaseModel):
    config_id: int = Field(..., description="Open edX configuration identifier")
    course_name: str = Field(..., description="Course name")
    course_number: str = Field(..., description="Course number")
    organization: str = Field(..., description="Course organization")
    run: str = Field(..., description="Course run identifier")
    display_name: str | None = Field(None, description="Course display name")
    marketing_slug: str | None = Field(None, description="Course marketing slug")
