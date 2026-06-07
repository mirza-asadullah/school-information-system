from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.course import Course
from app.models.exam import Exam
from app.schemas.exam import (
    ExamCreate,
    ExamListResponse,
    ExamResponse,
    ExamUpdate,
)
from app.services.exam_service import (
    create_exam,
    delete_exam,
    get_exam,
    list_exams,
    update_exam,
)

router = APIRouter()


def require_manage_exams(current_user: dict[str, Any], school_id: int | None = None) -> None:
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


def can_view_exam(current_user: dict[str, Any], exam: Exam) -> None:
    role = current_user.get("role")
    if role == "SUPER_ADMIN":
        return
    if role == "SCHOOL_ADMIN":
        if exam.school_id != current_user.get("school_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient privileges to view this exam",
            )
        return
    if role == "STUDENT":
        if exam.school_id != current_user.get("school_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students may only view exams for their own school",
            )
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient privileges",
    )


@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam_endpoint(
    payload: ExamCreate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ExamResponse:
    require_manage_exams(current_user, school_id=payload.school_id)
    return create_exam(db, payload)


@router.get("", response_model=ExamListResponse)
def list_exams_endpoint(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Results per page"),
    school_id: int | None = Query(None, description="Filter by school identifier"),
    course_id: int | None = Query(None, description="Filter by course identifier"),
    exam_type: str | None = Query(None, description="Filter by exam type"),
    status: str | None = Query(None, description="Filter by exam status"),
    exam_date: date | None = Query(None, description="Filter by exam date"),
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ExamListResponse:
    role = current_user.get("role")

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

    if role == "STUDENT":
        user_school_id = current_user.get("school_id")
        if user_school_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Student has no associated school",
            )
        if school_id is not None and school_id != user_school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students may only view exams for their own school",
            )
        school_id = user_school_id

    items, total = list_exams(
        db,
        page=page,
        per_page=per_page,
        school_id=school_id,
        course_id=course_id,
        exam_type=exam_type,
        status=status,
        exam_date=exam_date,
    )
    return ExamListResponse(items=items, page=page, per_page=per_page, total=total)


@router.get("/{exam_id}", response_model=ExamResponse)
def get_exam_endpoint(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ExamResponse:
    exam = get_exam(db, exam_id)
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")
    can_view_exam(current_user, exam)
    return exam


@router.put("/{exam_id}", response_model=ExamResponse)
def update_exam_endpoint(
    exam_id: int,
    payload: ExamUpdate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ExamResponse:
    exam = get_exam(db, exam_id)
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

    require_manage_exams(current_user, school_id=payload.school_id or exam.school_id)
    if current_user.get("role") == "SCHOOL_ADMIN" and exam.school_id != current_user.get("school_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges to update this exam",
        )

    return update_exam(db, exam, payload)


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam_endpoint(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> None:
    exam = get_exam(db, exam_id)
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found")

    require_manage_exams(current_user, school_id=exam.school_id)
    if current_user.get("role") == "SCHOOL_ADMIN" and exam.school_id != current_user.get("school_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges to delete this exam",
        )

    delete_exam(db, exam)
    return None
