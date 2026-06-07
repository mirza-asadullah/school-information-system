from datetime import datetime

from pydantic import BaseModel, Field


class CourseCreate(BaseModel):
    school_id: int = Field(..., description="Associated school identifier")
    title: str = Field(..., description="Course title")
    code: str = Field(..., description="Course code")
    description: str | None = Field(None, description="Course description")
    status: str | None = Field(None, description="Course status")
    openedx_course_id: str | None = Field(None, description="Open edX course identifier")


class CourseUpdate(BaseModel):
    school_id: int | None = Field(None, description="Associated school identifier")
    title: str | None = Field(None, description="Course title")
    code: str | None = Field(None, description="Course code")
    description: str | None = Field(None, description="Course description")
    status: str | None = Field(None, description="Course status")
    openedx_course_id: str | None = Field(None, description="Open edX course identifier")


class CourseResponse(BaseModel):
    id: int
    school_id: int
    title: str
    code: str
    description: str | None
    status: str
    openedx_course_id: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class CourseListResponse(BaseModel):
    items: list[CourseResponse]
    page: int
    per_page: int
    total: int

    model_config = {
        "from_attributes": True,
    }
