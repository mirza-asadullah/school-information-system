from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field


class StudentCreate(BaseModel):
    school_id: int = Field(..., description="Associated school identifier")
    first_name: str = Field(..., description="Student first name")
    last_name: str = Field(..., description="Student last name")
    email: EmailStr = Field(..., description="Student email address")
    phone: str | None = Field(None, description="Student phone number")
    gender: str | None = Field(None, description="Student gender")
    date_of_birth: date | None = Field(None, description="Student date of birth")
    admission_no: str = Field(..., description="Admission number")
    status: str | None = Field(None, description="Student status")
    password: str | None = Field(None, description="Password for the user account")


class StudentUpdate(BaseModel):
    school_id: int | None = Field(None, description="Associated school identifier")
    first_name: str | None = Field(None, description="Student first name")
    last_name: str | None = Field(None, description="Student last name")
    email: EmailStr | None = Field(None, description="Student email address")
    phone: str | None = Field(None, description="Student phone number")
    gender: str | None = Field(None, description="Student gender")
    date_of_birth: date | None = Field(None, description="Student date of birth")
    admission_no: str | None = Field(None, description="Admission number")
    status: str | None = Field(None, description="Student status")


class StudentResponse(BaseModel):
    id: int
    school_id: int
    first_name: str
    last_name: str
    email: EmailStr
    phone: str | None
    gender: str | None
    date_of_birth: date | None
    admission_no: str
    status: str
    created_at: datetime
    updated_at: datetime
    password: str | None = None

    model_config = {
        "from_attributes": True,
    }


class StudentListResponse(BaseModel):
    items: list[StudentResponse]
    page: int
    per_page: int
    total: int

    model_config = {
        "from_attributes": True,
    }
