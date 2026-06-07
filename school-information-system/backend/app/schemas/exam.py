from datetime import date, datetime

from pydantic import BaseModel, Field, model_validator


class ExamCreate(BaseModel):
    school_id: int = Field(..., description="Associated school identifier")
    course_id: int = Field(..., description="Associated course identifier")
    title: str = Field(..., description="Exam title")
    exam_type: str = Field(
        ...,
        description="Exam type (quiz, assignment, midterm, final)"
    )
    total_marks: int = Field(..., gt=0, description="Total exam marks")
    passing_marks: int = Field(..., ge=0, description="Passing marks")
    exam_date: date = Field(..., description="Scheduled exam date")
    status: str = Field(..., description="Exam status")
    description: str | None = Field(
        None,
        description="Exam description"
    )

    @model_validator(mode="after")
    def validate_passing_marks(self):
        if self.passing_marks > self.total_marks:
            raise ValueError(
                "passing_marks cannot be greater than total_marks"
            )
        return self


class ExamUpdate(BaseModel):
    school_id: int | None = Field(
        None,
        description="Associated school identifier"
    )
    course_id: int | None = Field(
        None,
        description="Associated course identifier"
    )
    title: str | None = Field(
        None,
        description="Exam title"
    )
    exam_type: str | None = Field(
        None,
        description="Exam type"
    )
    total_marks: int | None = Field(
        None,
        gt=0,
        description="Total exam marks"
    )
    passing_marks: int | None = Field(
        None,
        ge=0,
        description="Passing marks"
    )
    exam_date: date | None = Field(
        None,
        description="Scheduled exam date"
    )
    status: str | None = Field(
        None,
        description="Exam status"
    )
    description: str | None = Field(
        None,
        description="Exam description"
    )

    @model_validator(mode="after")
    def validate_passing_marks(self):
        if (
            self.total_marks is not None
            and self.passing_marks is not None
            and self.passing_marks > self.total_marks
        ):
            raise ValueError(
                "passing_marks cannot be greater than total_marks"
            )
        return self


class ExamResponse(BaseModel):
    id: int
    school_id: int
    course_id: int
    title: str
    exam_type: str
    total_marks: int
    passing_marks: int
    exam_date: date
    status: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }


class ExamListResponse(BaseModel):
    items: list[ExamResponse]
    page: int
    per_page: int
    total: int

    model_config = {
        "from_attributes": True,
    }