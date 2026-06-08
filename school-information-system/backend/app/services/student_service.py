import secrets
from typing import Iterable

from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.auth.password import get_password_hash
from app.models.enums import UserRole
from app.models.student import Student
from app.models.user import User
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
    # 1. Prevent duplicate email in students table
    existing_student_email = db.query(Student).filter(Student.email == payload.email).first()
    if existing_student_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this email already exists",
        )
    
    # 2. Prevent duplicate email in users table
    existing_user_email = db.query(User).filter(User.email == payload.email).first()
    if existing_user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    # 3. Prevent duplicate admission number in students table
    existing_student_adm = db.query(Student).filter(Student.admission_no == payload.admission_no).first()
    if existing_student_adm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this admission number already exists",
        )

    # 4. Generate password or use provided password
    password = payload.password
    if not password:
        password = secrets.token_hex(4)  # 8 character hex password
    
    # 5. Create corresponding User record
    user = User(
        school_id=payload.school_id,
        full_name=f"{payload.first_name} {payload.last_name}",
        email=payload.email,
        password_hash=get_password_hash(password),
        role=UserRole.STUDENT,
        is_active=True,
    )
    db.add(user)

    # 6. Create Student record
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

    # 7. Temporarily attach plaintext password to student object for serialization
    student.password = password
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
    # Deactivate corresponding user account by email
    user = db.query(User).filter(User.email == student.email).first()
    if user:
        user.is_active = False
        db.add(user)
    
    db.delete(student)
    db.commit()
