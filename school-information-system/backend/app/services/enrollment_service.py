from typing import Iterable

from sqlalchemy.orm import Session

from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.student import Student
from app.schemas.enrollment import EnrollmentCreate, EnrollmentUpdate


def get_enrollment(db: Session, enrollment_id: int) -> Enrollment | None:
    return db.query(Enrollment).filter(Enrollment.id == enrollment_id).one_or_none()


def list_enrollments(
    db: Session,
    page: int = 1,
    per_page: int = 20,
    student_id: int | None = None,
    course_id: int | None = None,
    status: str | None = None,
    school_id: int | None = None,
) -> tuple[Iterable[Enrollment], int]:
    query = db.query(Enrollment)

    if student_id is not None:
        query = query.filter(Enrollment.student_id == student_id)

    if course_id is not None:
        query = query.filter(Enrollment.course_id == course_id)

    if status:
        query = query.filter(Enrollment.status == status)

    if school_id is not None:
        query = query.join(Enrollment.student).join(Enrollment.course).filter(
            Student.school_id == school_id,
            Course.school_id == school_id,
        )

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return items, total


def create_enrollment(db: Session, payload: EnrollmentCreate) -> Enrollment:
    enrollment = Enrollment(
        student_id=payload.student_id,
        course_id=payload.course_id,
        status=payload.status or "active",
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


def update_enrollment(db: Session, enrollment: Enrollment, payload: EnrollmentUpdate) -> Enrollment:
    if payload.status is not None:
        enrollment.status = payload.status

    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


def delete_enrollment(db: Session, enrollment: Enrollment) -> None:
    db.delete(enrollment)
    db.commit()
