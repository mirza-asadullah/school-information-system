from typing import Any

from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.attendance import Attendance
from app.models.course import Course
from app.models.student import Student
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceListResponse,
    AttendanceResponse,
    AttendanceUpdate,
)
from app.services.attendance_service import (
    create_attendance,
    delete_attendance,
    get_attendance,
    list_attendance,
    update_attendance,
)

router = APIRouter()


def require_manage_attendance(current_user: dict[str, Any], school_id: int | None = None) -> None:
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


def can_view_attendance(current_user: dict[str, Any], attendance: Attendance) -> None:
    role = current_user.get("role")
    if role == "SUPER_ADMIN":
        return
    if role == "SCHOOL_ADMIN":
        if attendance.course.school_id != current_user.get("school_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient privileges to view this attendance record",
            )
        return
    if role == "STUDENT":
        if attendance.student.email != current_user.get("email"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students may only view their own attendance records",
            )
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient privileges",
    )


@router.post("", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def create_attendance_endpoint(
    payload: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> AttendanceResponse:
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
                detail="Insufficient privileges to create attendance for this student or course",
            )

    require_manage_attendance(current_user, school_id=current_user.get("school_id") if current_user.get("role") == "SCHOOL_ADMIN" else None)
    return create_attendance(db, payload)


@router.get("", response_model=AttendanceListResponse)
def list_attendance_endpoint(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Results per page"),
    student_id: int | None = Query(None, description="Filter by student identifier"),
    course_id: int | None = Query(None, description="Filter by course identifier"),
    attendance_date: str | None = Query(None, description="Filter by attendance date"),
    status: str | None = Query(None, description="Filter by attendance status"),
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> AttendanceListResponse:
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
            return AttendanceListResponse(items=[], page=page, per_page=per_page, total=0)
        if student_id is not None and student_id != student.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students may only view their own attendance records",
            )
        student_id = student.id
        school_id = student.school_id

    items, total = list_attendance(
        db,
        page=page,
        per_page=per_page,
        student_id=student_id,
        course_id=course_id,
        attendance_date=attendance_date,
        status=status,
        school_id=school_id,
    )
    return AttendanceListResponse(items=items, page=page, per_page=per_page, total=total)


@router.get("/{attendance_id}", response_model=AttendanceResponse)
def get_attendance_endpoint(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> AttendanceResponse:
    attendance = get_attendance(db, attendance_id)
    if not attendance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance not found")
    can_view_attendance(current_user, attendance)
    return attendance


@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance_endpoint(
    attendance_id: int,
    payload: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> AttendanceResponse:
    attendance = get_attendance(db, attendance_id)
    if not attendance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance not found")

    require_manage_attendance(current_user, school_id=attendance.course.school_id)
    return update_attendance(db, attendance, payload)


@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance_endpoint(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> None:
    attendance = get_attendance(db, attendance_id)
    if not attendance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance not found")

    require_manage_attendance(current_user, school_id=attendance.course.school_id)
    delete_attendance(db, attendance)
    return None
