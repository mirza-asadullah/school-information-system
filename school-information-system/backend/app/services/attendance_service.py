from datetime import date
from typing import Iterable

from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.course import Course
from app.models.student import Student
from app.schemas.attendance import AttendanceCreate, AttendanceUpdate


def get_attendance(db: Session, attendance_id: int) -> Attendance | None:
    return db.query(Attendance).filter(Attendance.id == attendance_id).one_or_none()


def list_attendance(
    db: Session,
    page: int = 1,
    per_page: int = 20,
    student_id: int | None = None,
    course_id: int | None = None,
    attendance_date: date | None = None,
    status: str | None = None,
    school_id: int | None = None,
) -> tuple[Iterable[Attendance], int]:
    query = db.query(Attendance)

    if student_id is not None:
        query = query.filter(Attendance.student_id == student_id)
    if course_id is not None:
        query = query.filter(Attendance.course_id == course_id)
    if attendance_date is not None:
        query = query.filter(Attendance.attendance_date == attendance_date)
    if status:
        query = query.filter(Attendance.status == status)
    if school_id is not None:
        query = query.join(Attendance.student).join(Attendance.course).filter(
            Student.school_id == school_id,
            Course.school_id == school_id,
        )

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return items, total


def create_attendance(db: Session, payload: AttendanceCreate) -> Attendance:
    attendance = Attendance(
        student_id=payload.student_id,
        course_id=payload.course_id,
        attendance_date=payload.attendance_date,
        status=payload.status,
        remarks=payload.remarks,
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance


def update_attendance(db: Session, attendance: Attendance, payload: AttendanceUpdate) -> Attendance:
    if payload.status is not None:
        attendance.status = payload.status
    if payload.remarks is not None:
        attendance.remarks = payload.remarks

    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance


def delete_attendance(db: Session, attendance: Attendance) -> None:
    db.delete(attendance)
    db.commit()
