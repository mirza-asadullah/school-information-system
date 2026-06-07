from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.student import Student
from app.schemas.enrollment import (
    EnrollmentCreate,
    EnrollmentListResponse,
    EnrollmentResponse,
    EnrollmentUpdate,
)
from app.services.enrollment_service import (
    create_enrollment,
    delete_enrollment,
    get_enrollment,
    list_enrollments,
    update_enrollment,
)

router = APIRouter()


def require_manage_enrollments(current_user: dict[str, Any], school_id: int | None = None) -> None:
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


def can_view_enrollment(current_user: dict[str, Any], enrollment: Enrollment) -> None:
    role = current_user.get("role")
    if role == "SUPER_ADMIN":
        return
    if role == "SCHOOL_ADMIN":
        if enrollment.course.school_id != current_user.get("school_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient privileges to view this enrollment",
            )
        return
    if role == "STUDENT":
        if enrollment.student.email != current_user.get("email"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students may only view their own enrollments",
            )
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient privileges",
    )


@router.post("", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
def create_enrollment_endpoint(
    payload: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> EnrollmentResponse:
    if current_user.get("role") == "SCHOOL_ADMIN":
        user_school_id = current_user.get("school_id")
        if user_school_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="School administrator has no associated school",
            )
        student = db.query(Student).filter(Student.id == payload.student_id).one_or_none()
        course = db.query(Course).filter(Course.id == payload.course_id).one_or_none()
        if not student or not course:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student or course not found",
            )
        if student.school_id != user_school_id or course.school_id != user_school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient privileges to enroll this student or course",
            )

    require_manage_enrollments(current_user, school_id=current_user.get("school_id") if current_user.get("role") == "SCHOOL_ADMIN" else None)
    return create_enrollment(db, payload)


@router.get("", response_model=EnrollmentListResponse)
def list_enrollments_endpoint(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Results per page"),
    student_id: int | None = Query(None, description="Filter by student identifier"),
    course_id: int | None = Query(None, description="Filter by course identifier"),
    status: str | None = Query(None, description="Filter by enrollment status"),
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> EnrollmentListResponse:
    role = current_user.get("role")
    school_id = None

    if role == "SCHOOL_ADMIN":
        user_school_id = current_user.get("school_id")
        if user_school_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="School administrator has no associated school",
            )
        school_id = user_school_id

    if role == "STUDENT":
        student = db.query(Student).filter(Student.email == current_user.get("email")).one_or_none()
        if not student:
            return EnrollmentListResponse(items=[], page=page, per_page=per_page, total=0)
        if student_id is not None and student_id != student.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students may only view their own enrollments",
            )
        student_id = student.id
        school_id = student.school_id

    items, total = list_enrollments(
        db,
        page=page,
        per_page=per_page,
        student_id=student_id,
        course_id=course_id,
        status=status,
        school_id=school_id,
    )
    return EnrollmentListResponse(items=items, page=page, per_page=per_page, total=total)


@router.get("/{enrollment_id}", response_model=EnrollmentResponse)
def get_enrollment_endpoint(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> EnrollmentResponse:
    enrollment = get_enrollment(db, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
    can_view_enrollment(current_user, enrollment)
    return enrollment


@router.put("/{enrollment_id}", response_model=EnrollmentResponse)
def update_enrollment_endpoint(
    enrollment_id: int,
    payload: EnrollmentUpdate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> EnrollmentResponse:
    enrollment = get_enrollment(db, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")

    require_manage_enrollments(current_user, school_id=enrollment.course.school_id)

    return update_enrollment(db, enrollment, payload)


@router.delete("/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_enrollment_endpoint(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> None:
    enrollment = get_enrollment(db, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enrollment not found")

    require_manage_enrollments(current_user, school_id=enrollment.course.school_id)
    delete_enrollment(db, enrollment)
    return None
