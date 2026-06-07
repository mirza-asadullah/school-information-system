from datetime import date
from typing import Iterable

from sqlalchemy.orm import Session

from app.models.exam import Exam
from app.schemas.exam import ExamCreate, ExamUpdate


def get_exam(db: Session, exam_id: int) -> Exam | None:
    return db.query(Exam).filter(Exam.id == exam_id).one_or_none()


def list_exams(
    db: Session,
    page: int = 1,
    per_page: int = 20,
    school_id: int | None = None,
    course_id: int | None = None,
    exam_type: str | None = None,
    status: str | None = None,
    exam_date: date | None = None,
) -> tuple[Iterable[Exam], int]:
    query = db.query(Exam)

    if school_id is not None:
        query = query.filter(Exam.school_id == school_id)
    if course_id is not None:
        query = query.filter(Exam.course_id == course_id)
    if exam_type is not None:
        query = query.filter(Exam.exam_type == exam_type)
    if status is not None:
        query = query.filter(Exam.status == status)
    if exam_date is not None:
        query = query.filter(Exam.exam_date == exam_date)

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return items, total


def create_exam(db: Session, payload: ExamCreate) -> Exam:
    exam = Exam(
        school_id=payload.school_id,
        course_id=payload.course_id,
        title=payload.title,
        exam_type=payload.exam_type,
        total_marks=payload.total_marks,
        passing_marks=payload.passing_marks,
        exam_date=payload.exam_date,
        status=payload.status,
        description=payload.description,
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


def update_exam(db: Session, exam: Exam, payload: ExamUpdate) -> Exam:
    if payload.school_id is not None:
        exam.school_id = payload.school_id
    if payload.course_id is not None:
        exam.course_id = payload.course_id
    if payload.title is not None:
        exam.title = payload.title
    if payload.exam_type is not None:
        exam.exam_type = payload.exam_type
    if payload.total_marks is not None:
        exam.total_marks = payload.total_marks
    if payload.passing_marks is not None:
        exam.passing_marks = payload.passing_marks
    if payload.exam_date is not None:
        exam.exam_date = payload.exam_date
    if payload.status is not None:
        exam.status = payload.status
    if payload.description is not None:
        exam.description = payload.description

    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


def delete_exam(db: Session, exam: Exam) -> None:
    db.delete(exam)
    db.commit()
