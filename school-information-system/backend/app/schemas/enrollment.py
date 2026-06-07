from datetime import datetime

from pydantic import BaseModel, Field


class EnrollmentCreate(BaseModel):
    student_id: int = Field(..., description="Associated student identifier")
    course_id: int = Field(..., description="Associated course identifier")
    status: str | None = Field(None, description="Enrollment status")


class EnrollmentUpdate(BaseModel):
    status: str | None = Field(None, description="Enrollment status")


class EnrollmentResponse(BaseModel):
    id: int
    student_id: int
    course_id: int
    status: str
    enrolled_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class EnrollmentListResponse(BaseModel):
    items: list[EnrollmentResponse]
    page: int
    per_page: int
    total: int

    model_config = {
        "from_attributes": True,
    }
