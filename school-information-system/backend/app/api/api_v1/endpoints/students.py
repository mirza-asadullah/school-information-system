from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.student import Student
from app.schemas.student import (
    StudentCreate,
    StudentListResponse,
    StudentResponse,
    StudentUpdate,
)
from app.services.student_service import (
    create_student,
    delete_student,
    get_student_by_id,
    get_students,
    update_student,
)

router = APIRouter()


def require_manage_students(current_user: dict[str, Any], school_id: int | None = None) -> None:
    role = current_user.get("role")
    if role == "SUPER_ADMIN":
        return

    if role == "SCHOOL_ADMIN":
        user_school_id = current_user.get("school_id")
        if user_school_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="School administrator has no associated school",
            )
        if school_id is not None and school_id != user_school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient privileges for the requested school",
            )
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient privileges",
    )


def can_view_student(current_user: dict[str, Any], student: Student) -> None:
    role = current_user.get("role")
    if role == "SUPER_ADMIN":
        return
    if role == "SCHOOL_ADMIN":
        if student.school_id != current_user.get("school_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient privileges to view this student",
            )
        return
    if role == "STUDENT":
        if student.email != current_user.get("email"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students may only view their own profile",
            )
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient privileges",
    )


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student_endpoint(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> StudentResponse:
    require_manage_students(current_user, school_id=payload.school_id)
    return create_student(db, payload)


@router.get("", response_model=StudentListResponse)
def list_students(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Results per page"),
    school_id: int | None = Query(None, description="Filter by school identifier"),
    status: str | None = Query(None, description="Filter by student status"),
    admission_no: str | None = Query(None, description="Filter by admission number"),
    name: str | None = Query(None, description="Search by student name"),
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> StudentListResponse:
    role = current_user.get("role")

    if role == "STUDENT":
        student = db.query(Student).filter(Student.email == current_user.get("email")).one_or_none()
        if not student:
            return StudentListResponse(items=[], page=page, per_page=per_page, total=0)
        if page != 1:
            return StudentListResponse(items=[], page=page, per_page=per_page, total=1)
        return StudentListResponse(items=[student], page=page, per_page=per_page, total=1)

    if role == "SCHOOL_ADMIN":
        user_school_id = current_user.get("school_id")
        if user_school_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="School administrator has no associated school",
            )
        if school_id is not None and school_id != user_school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient privileges for the requested school",
            )
        school_id = user_school_id

    items, total = get_students(
        db,
        page=page,
        per_page=per_page,
        school_id=school_id,
        status=status,
        admission_no=admission_no,
        name=name,
    )
    return StudentListResponse(items=items, page=page, per_page=per_page, total=total)


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> StudentResponse:
    student = get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    can_view_student(current_user, student)
    return student


@router.put("/{student_id}", response_model=StudentResponse)
def update_student_endpoint(
    student_id: int,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> StudentResponse:
    student = get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    require_manage_students(current_user, school_id=payload.school_id or student.school_id)

    if current_user.get("role") == "SCHOOL_ADMIN" and student.school_id != current_user.get("school_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges to update this student",
        )

    return update_student(db, student, payload)


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student_endpoint(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> None:
    student = get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    require_manage_students(current_user, school_id=student.school_id)

    if current_user.get("role") == "SCHOOL_ADMIN" and student.school_id != current_user.get("school_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges to delete this student",
        )

    delete_student(db, student)
    return None
