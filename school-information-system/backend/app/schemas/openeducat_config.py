from datetime import datetime

from pydantic import BaseModel, Field


class OpenEduCatConfigCreate(BaseModel):
    school_id: int = Field(..., description="Associated school identifier")
    base_url: str = Field(..., description="OpenEduCat base URL")
    database_name: str = Field(..., description="OpenEduCat database name")
    username: str = Field(..., description="OpenEduCat username")
    password: str = Field(..., description="OpenEduCat password")
    is_active: bool | None = Field(True, description="Whether the integration is active")


class OpenEduCatConfigUpdate(BaseModel):
    school_id: int | None = Field(None, description="Associated school identifier")
    base_url: str | None = Field(None, description="OpenEduCat base URL")
    database_name: str | None = Field(None, description="OpenEduCat database name")
    username: str | None = Field(None, description="OpenEduCat username")
    password: str | None = Field(None, description="OpenEduCat password")
    is_active: bool | None = Field(None, description="Whether the integration is active")


class OpenEduCatConfigResponse(BaseModel):
    id: int
    school_id: int
    base_url: str
    database_name: str
    username: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class OpenEduCatConfigListResponse(BaseModel):
    items: list[OpenEduCatConfigResponse]
    page: int
    per_page: int
    total: int

    model_config = {
        "from_attributes": True,
    }


class OpenEduCatActionRequest(BaseModel):
    config_id: int = Field(..., description="OpenEduCat configuration identifier")


class OpenEduCatActionResponse(BaseModel):
    success: bool
    message: str
    synced_count: int | None = None
    details: str | None = None

    model_config = {
        "from_attributes": True,
    }
