from typing import Iterable

from sqlalchemy.orm import Session

from app.models.course import Course
from app.schemas.course import CourseCreate, CourseUpdate


def get_course(db: Session, course_id: int) -> Course | None:
    return db.query(Course).filter(Course.id == course_id).one_or_none()


def list_courses(
    db: Session,
    page: int = 1,
    per_page: int = 20,
    school_id: int | None = None,
    status: str | None = None,
    title: str | None = None,
    code: str | None = None,
) -> tuple[Iterable[Course], int]:
    query = db.query(Course)

    if school_id is not None:
        query = query.filter(Course.school_id == school_id)
    if status:
        query = query.filter(Course.status == status)
    if title:
        query = query.filter(Course.title.ilike(f"%{title}%"))
    if code:
        query = query.filter(Course.code.ilike(f"%{code}%"))

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return items, total


def create_course(db: Session, payload: CourseCreate) -> Course:
    course = Course(
        school_id=payload.school_id,
        title=payload.title,
        code=payload.code,
        description=payload.description,
        status=payload.status or "active",
        openedx_course_id=payload.openedx_course_id,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def update_course(db: Session, course: Course, payload: CourseUpdate) -> Course:
    if payload.school_id is not None:
        course.school_id = payload.school_id
    if payload.title is not None:
        course.title = payload.title
    if payload.code is not None:
        course.code = payload.code
    if payload.description is not None:
        course.description = payload.description
    if payload.status is not None:
        course.status = payload.status
    if payload.openedx_course_id is not None:
        course.openedx_course_id = payload.openedx_course_id

    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def delete_course(db: Session, course: Course) -> None:
    db.delete(course)
    db.commit()
