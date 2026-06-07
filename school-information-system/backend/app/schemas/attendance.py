from datetime import date, datetime

from pydantic import BaseModel, Field


class AttendanceCreate(BaseModel):
    student_id: int = Field(..., description="Associated student identifier")
    course_id: int = Field(..., description="Associated course identifier")
    attendance_date: date = Field(..., description="Date of attendance")
    status: str = Field(..., description="Attendance status")
    remarks: str | None = Field(None, description="Optional attendance remarks")


class AttendanceUpdate(BaseModel):
    status: str | None = Field(None, description="Attendance status")
    remarks: str | None = Field(None, description="Optional attendance remarks")


class AttendanceResponse(BaseModel):
    id: int
    student_id: int
    course_id: int
    attendance_date: date
    status: str
    remarks: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class AttendanceListResponse(BaseModel):
    items: list[AttendanceResponse]
    page: int
    per_page: int
    total: int

    model_config = {
        "from_attributes": True,
    }
