from typing import Iterable

from sqlalchemy.orm import Session

from app.models.school import School
from app.schemas.school import SchoolCreate, SchoolUpdate


def get_school_by_id(db: Session, school_id: int) -> School | None:
    return db.query(School).filter(School.id == school_id).one_or_none()


def get_schools(
    db: Session,
    page: int = 1,
    per_page: int = 20,
    status: str | None = None,
    name: str | None = None,
) -> tuple[Iterable[School], int]:
    query = db.query(School)
    if status:
        query = query.filter(School.status == status)
    if name:
        query = query.filter(School.name.ilike(f"%{name}%"))

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return items, total


def create_school(db: Session, payload: SchoolCreate) -> School:
    school = School(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        address=payload.address,
        status=payload.status or "active",
    )
    db.add(school)
    db.commit()
    db.refresh(school)
    return school


def update_school(db: Session, school: School, payload: SchoolUpdate) -> School:
    if payload.name is not None:
        school.name = payload.name
    if payload.email is not None:
        school.email = payload.email
    if payload.phone is not None:
        school.phone = payload.phone
    if payload.address is not None:
        school.address = payload.address
    if payload.status is not None:
        school.status = payload.status

    db.add(school)
    db.commit()
    db.refresh(school)
    return school


def delete_school(db: Session, school: School) -> None:
    db.delete(school)
    db.commit()
