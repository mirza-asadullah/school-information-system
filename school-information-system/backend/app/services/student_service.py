from typing import Iterable

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.student import Student
from app.schemas.student import StudentCreate, StudentUpdate


def get_student_by_id(db: Session, student_id: int) -> Student | None:
    return db.query(Student).filter(Student.id == student_id).one_or_none()


def get_students(
    db: Session,
    page: int = 1,
    per_page: int = 20,
    school_id: int | None = None,
    status: str | None = None,
    admission_no: str | None = None,
    name: str | None = None,
) -> tuple[Iterable[Student], int]:
    query = db.query(Student)

    if school_id is not None:
        query = query.filter(Student.school_id == school_id)

    if status:
        query = query.filter(Student.status == status)

    if admission_no:
        query = query.filter(Student.admission_no == admission_no)

    if name:
        search = f"%{name}%"
        query = query.filter(
            or_(
                Student.first_name.ilike(search),
                Student.last_name.ilike(search),
                func.concat(Student.first_name, " ", Student.last_name).ilike(search),
            )
        )

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return items, total


def create_student(db: Session, payload: StudentCreate) -> Student:
    student = Student(
        school_id=payload.school_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone=payload.phone,
        gender=payload.gender,
        date_of_birth=payload.date_of_birth,
        admission_no=payload.admission_no,
        status=payload.status or "active",
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


def update_student(db: Session, student: Student, payload: StudentUpdate) -> Student:
    if payload.school_id is not None:
        student.school_id = payload.school_id
    if payload.first_name is not None:
        student.first_name = payload.first_name
    if payload.last_name is not None:
        student.last_name = payload.last_name
    if payload.email is not None:
        student.email = payload.email
    if payload.phone is not None:
        student.phone = payload.phone
    if payload.gender is not None:
        student.gender = payload.gender
    if payload.date_of_birth is not None:
        student.date_of_birth = payload.date_of_birth
    if payload.admission_no is not None:
        student.admission_no = payload.admission_no
    if payload.status is not None:
        student.status = payload.status

    db.add(student)
    db.commit()
    db.refresh(student)
    return student


def delete_student(db: Session, student: Student) -> None:
    db.delete(student)
    db.commit()
