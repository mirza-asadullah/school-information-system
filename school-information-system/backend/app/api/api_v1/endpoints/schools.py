from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.database.session import get_db
from app.schemas.school import (
    SchoolCreate,
    SchoolListResponse,
    SchoolResponse,
    SchoolUpdate,
)
from app.services.school_service import (
    create_school,
    delete_school,
    get_school_by_id,
    get_schools,
    update_school,
)

router = APIRouter()


@router.post(
    "",
    response_model=SchoolResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new school",
)
def create_school_endpoint(
    payload: SchoolCreate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(require_roles("SUPER_ADMIN")),
) -> SchoolResponse:
    return create_school(db, payload)


@router.get("", response_model=SchoolListResponse, summary="List schools")
def list_schools(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Results per page"),
    status: str | None = Query(None, description="Filter by school status"),
    name: str | None = Query(None, description="Search by school name"),
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> SchoolListResponse:
    items, total = get_schools(db, page=page, per_page=per_page, status=status, name=name)
    return SchoolListResponse(items=items, page=page, per_page=per_page, total=total)


@router.get("/{school_id}", response_model=SchoolResponse, summary="Get school details")
def get_school(
    school_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> SchoolResponse:
    school = get_school_by_id(db, school_id)
    if not school:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found")
    return school


@router.put("/{school_id}", response_model=SchoolResponse, summary="Update a school")
def update_school_endpoint(
    school_id: int,
    payload: SchoolUpdate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> SchoolResponse:
    school = get_school_by_id(db, school_id)
    if not school:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found")

    if current_user["role"] != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges to update school",
        )

    return update_school(db, school, payload)


@router.delete("/{school_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a school")
def delete_school_endpoint(
    school_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(require_roles("SUPER_ADMIN")),
) -> None:
    school = get_school_by_id(db, school_id)
    if not school:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found")
    delete_school(db, school)
    return None
