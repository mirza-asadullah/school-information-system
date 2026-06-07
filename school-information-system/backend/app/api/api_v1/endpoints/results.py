from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.exam import Exam
from app.models.result import Result
from app.models.student import Student
from app.schemas.result import (
    ResultCreate,
    ResultListResponse,
    ResultResponse,
    ResultUpdate,
)
from app.services.result_service import (
    create_result,
    delete_result,
    get_result,
    list_results,
    update_result,
)

router = APIRouter()


def require_manage_results(current_user: dict[str, Any], school_id: int | None = None) -> None:
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


def can_view_result(current_user: dict[str, Any], result: Result) -> None:
    role = current_user.get("role")
    if role == "SUPER_ADMIN":
        return
    if role == "SCHOOL_ADMIN":
        if result.student.school_id != current_user.get("school_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient privileges to view this result",
            )
        return
    if role == "STUDENT":
        if result.student.email != current_user.get("email"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students may only view their own results",
            )
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient privileges",
    )


@router.post("", response_model=ResultResponse, status_code=status.HTTP_201_CREATED)
def create_result_endpoint(
    payload: ResultCreate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ResultResponse:
    if current_user.get("role") == "SCHOOL_ADMIN":
        user_school_id = current_user.get("school_id")
        if user_school_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="School administrator has no associated school",
            )
        student = db.query(Student).filter(Student.id == payload.student_id).one_or_none()
        exam = db.query(Exam).filter(Exam.id == payload.exam_id).one_or_none()
        if not student or not exam:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student or exam not found",
            )
        if student.school_id != user_school_id or exam.school_id != user_school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient privileges to create this result",
            )

    require_manage_results(current_user, school_id=current_user.get("school_id") if current_user.get("role") == "SCHOOL_ADMIN" else None)
    return create_result(db, payload)


@router.get("", response_model=ResultListResponse)
def list_results_endpoint(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Results per page"),
    exam_id: int | None = Query(None, description="Filter by exam identifier"),
    student_id: int | None = Query(None, description="Filter by student identifier"),
    status: str | None = Query(None, description="Filter by result status"),
    grade: str | None = Query(None, description="Filter by grade"),
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ResultListResponse:
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
            return ResultListResponse(items=[], page=page, per_page=per_page, total=0)
        if student_id is not None and student_id != student.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Students may only view their own results",
            )
        student_id = student.id
        school_id = student.school_id

    items, total = list_results(
        db,
        page=page,
        per_page=per_page,
        exam_id=exam_id,
        student_id=student_id,
        status=status,
        grade=grade,
        school_id=school_id,
    )
    return ResultListResponse(items=items, page=page, per_page=per_page, total=total)


@router.get("/{result_id}", response_model=ResultResponse)
def get_result_endpoint(
    result_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ResultResponse:
    result = get_result(db, result_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Result not found")
    can_view_result(current_user, result)
    return result


@router.put("/{result_id}", response_model=ResultResponse)
def update_result_endpoint(
    result_id: int,
    payload: ResultUpdate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ResultResponse:
    result = get_result(db, result_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Result not found")

    require_manage_results(current_user, school_id=result.student.school_id)
    if current_user.get("role") == "SCHOOL_ADMIN" and result.student.school_id != current_user.get("school_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges to update this result",
        )

    return update_result(db, result, payload)


@router.delete("/{result_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_result_endpoint(
    result_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> None:
    result = get_result(db, result_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Result not found")

    require_manage_results(current_user, school_id=result.student.school_id)
    delete_result(db, result)
    return None
