from datetime import datetime

from pydantic import BaseModel, Field


class ResultCreate(BaseModel):
    exam_id: int = Field(..., description="Associated exam identifier")
    student_id: int = Field(..., description="Associated student identifier")
    obtained_marks: int = Field(..., ge=0, description="Marks obtained by the student")
    remarks: str | None = Field(None, description="Optional remarks")


class ResultUpdate(BaseModel):
    obtained_marks: int | None = Field(None, ge=0, description="Marks obtained by the student")
    remarks: str | None = Field(None, description="Optional remarks")


class ResultResponse(BaseModel):
    id: int
    exam_id: int
    student_id: int
    obtained_marks: int
    grade: str
    remarks: str | None
    status: str
    percentage: float
    exam_title: str
    student_name: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class ResultListResponse(BaseModel):
    items: list[ResultResponse]
    page: int
    per_page: int
    total: int

    model_config = {
        "from_attributes": True,
    }
