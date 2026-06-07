from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.course import Course
from app.schemas.course import (
    CourseCreate,
    CourseListResponse,
    CourseResponse,
    CourseUpdate,
)
from app.services.course_service import (
    create_course,
    delete_course,
    get_course,
    list_courses,
    update_course,
)

router = APIRouter()


def require_manage_courses(current_user: dict[str, Any], school_id: int | None = None) -> None:
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


def can_view_course(current_user: dict[str, Any], course: Course) -> None:
    role = current_user.get("role")
    if role == "SUPER_ADMIN":
        return
    if role == "SCHOOL_ADMIN":
        if course.school_id != current_user.get("school_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient privileges to view this course",
            )
        return
    if role == "STUDENT":
        if course.school_id != current_user.get("school_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students may only view courses for their own school",
            )
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient privileges",
    )


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course_endpoint(
    payload: CourseCreate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> CourseResponse:
    require_manage_courses(current_user, school_id=payload.school_id)
    return create_course(db, payload)


@router.get("", response_model=CourseListResponse)
def list_courses_endpoint(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Results per page"),
    school_id: int | None = Query(None, description="Filter by school identifier"),
    status: str | None = Query(None, description="Filter by course status"),
    title: str | None = Query(None, description="Search by course title"),
    code: str | None = Query(None, description="Search by course code"),
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> CourseListResponse:
    role = current_user.get("role")

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
        school_id = user_school_id

    if role == "STUDENT":
        user_school_id = current_user.get("school_id")
        if user_school_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Student has no associated school",
            )
        if school_id is not None and school_id != user_school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students may only view courses for their own school",
            )
        school_id = user_school_id

    items, total = list_courses(
        db,
        page=page,
        per_page=per_page,
        school_id=school_id,
        status=status,
        title=title,
        code=code,
    )
    return CourseListResponse(items=items, page=page, per_page=per_page, total=total)


@router.get("/{course_id}", response_model=CourseResponse)
def get_course_endpoint(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> CourseResponse:
    course = get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    can_view_course(current_user, course)
    return course


@router.put("/{course_id}", response_model=CourseResponse)
def update_course_endpoint(
    course_id: int,
    payload: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> CourseResponse:
    course = get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    require_manage_courses(current_user, school_id=payload.school_id or course.school_id)

    if current_user.get("role") == "SCHOOL_ADMIN" and course.school_id != current_user.get("school_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges to update this course",
        )

    return update_course(db, course, payload)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course_endpoint(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> None:
    course = get_course(db, course_id)
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    require_manage_courses(current_user, school_id=course.school_id)

    if current_user.get("role") == "SCHOOL_ADMIN" and course.school_id != current_user.get("school_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges to delete this course",
        )

    delete_course(db, course)
    return None
