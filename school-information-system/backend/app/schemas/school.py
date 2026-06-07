from datetime import datetime

from pydantic import BaseModel, Field


class SchoolCreate(BaseModel):
    name: str = Field(..., description="School name")
    email: str = Field(..., description="School contact email")
    phone: str | None = Field(None, description="Contact phone number")
    address: str | None = Field(None, description="School address")
    status: str | None = Field(None, description="School status")


class SchoolUpdate(BaseModel):
    name: str | None = Field(None, description="School name")
    email: str | None = Field(None, description="School contact email")
    phone: str | None = Field(None, description="Contact phone number")
    address: str | None = Field(None, description="School address")
    status: str | None = Field(None, description="School status")


class SchoolResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None
    address: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class SchoolListResponse(BaseModel):
    items: list[SchoolResponse]
    page: int
    per_page: int
    total: int

    model_config = {
        "from_attributes": True,
    }
