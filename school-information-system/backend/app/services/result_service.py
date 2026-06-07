from typing import Iterable

from sqlalchemy.orm import Session

from app.models.exam import Exam
from app.models.result import Result, calculate_grade
from app.models.student import Student
from app.schemas.result import ResultCreate, ResultUpdate


def get_result(db: Session, result_id: int) -> Result | None:
    return db.query(Result).filter(Result.id == result_id).one_or_none()


def list_results(
    db: Session,
    page: int = 1,
    per_page: int = 20,
    exam_id: int | None = None,
    student_id: int | None = None,
    status: str | None = None,
    grade: str | None = None,
    school_id: int | None = None,
) -> tuple[Iterable[Result], int]:
    query = db.query(Result)

    if exam_id is not None:
        query = query.filter(Result.exam_id == exam_id)
    if student_id is not None:
        query = query.filter(Result.student_id == student_id)
    if status is not None:
        query = query.filter(Result.status == status)
    if grade is not None:
        query = query.filter(Result.grade == grade)
    if school_id is not None:
        query = query.join(Result.exam).join(Result.student).filter(
            Exam.school_id == school_id,
            Student.school_id == school_id,
        )

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return items, total


def calculate_result(exam: Exam, obtained_marks: int) -> tuple[int, str, str]:
    if obtained_marks > exam.total_marks:
        raise ValueError("obtained_marks cannot exceed exam total_marks")
    percentage = 0 if exam.total_marks == 0 else round((obtained_marks / exam.total_marks) * 100, 2)
    grade = calculate_grade(percentage)
    status = "pass" if obtained_marks >= exam.passing_marks else "fail"
    return percentage, grade, status


def create_result(db: Session, payload: ResultCreate) -> Result:
    exam = db.query(Exam).filter(Exam.id == payload.exam_id).one_or_none()
    if not exam:
        raise ValueError("Exam not found")
    percentage, grade, status = calculate_result(exam, payload.obtained_marks)
    result = Result(
        exam_id=payload.exam_id,
        student_id=payload.student_id,
        obtained_marks=payload.obtained_marks,
        grade=grade,
        remarks=payload.remarks,
        status=status,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


def update_result(db: Session, result: Result, payload: ResultUpdate) -> Result:
    if payload.obtained_marks is not None:
        exam = db.query(Exam).filter(Exam.id == result.exam_id).one_or_none()
        if not exam:
            raise ValueError("Exam not found")
        percentage, grade, status = calculate_result(exam, payload.obtained_marks)
        result.obtained_marks = payload.obtained_marks
        result.grade = grade
        result.status = status
    if payload.remarks is not None:
        result.remarks = payload.remarks

    db.add(result)
    db.commit()
    db.refresh(result)
    return result


def delete_result(db: Session, result: Result) -> None:
    db.delete(result)
    db.commit()
