from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.openeducat_config import OpenEduCatConfig
from app.schemas.openeducat_config import (
    OpenEduCatActionRequest,
    OpenEduCatActionResponse,
    OpenEduCatConfigCreate,
    OpenEduCatConfigListResponse,
    OpenEduCatConfigResponse,
    OpenEduCatConfigUpdate,
)
from app.services.openeducat_config_service import (
    create_openeducat_config,
    delete_openeducat_config,
    get_openeducat_config,
    list_openeducat_configs,
    sync_openeducat_courses,
    sync_openeducat_enrollments,
    sync_openeducat_schools,
    sync_openeducat_students,
    test_openeducat_connection,
    update_openeducat_config,
)

router = APIRouter()


def require_manage_openeducat(current_user: dict[str, Any], school_id: int | None = None) -> None:
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


def can_view_openeducat_config(current_user: dict[str, Any], config: OpenEduCatConfig) -> None:
    role = current_user.get("role")
    if role == "SUPER_ADMIN":
        return
    if role == "SCHOOL_ADMIN":
        if config.school_id != current_user.get("school_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient privileges to view this configuration",
            )
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient privileges",
    )


@router.post("", response_model=OpenEduCatConfigResponse, status_code=status.HTTP_201_CREATED)
def create_openeducat_config_endpoint(
    payload: OpenEduCatConfigCreate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> OpenEduCatConfig:
    require_manage_openeducat(current_user, school_id=payload.school_id)
    return create_openeducat_config(db, payload)


@router.get("", response_model=OpenEduCatConfigListResponse)
def list_openeducat_configs_endpoint(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Results per page"),
    school_id: int | None = Query(None, description="Filter by school identifier"),
    is_active: bool | None = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> OpenEduCatConfigListResponse:
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

    items, total = list_openeducat_configs(
        db,
        page=page,
        per_page=per_page,
        school_id=school_id,
        is_active=is_active,
    )
    return OpenEduCatConfigListResponse(items=items, page=page, per_page=per_page, total=total)


@router.get("/{config_id}", response_model=OpenEduCatConfigResponse)
def get_openeducat_config_endpoint(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> OpenEduCatConfig:
    config = get_openeducat_config(db, config_id)
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="OpenEduCat configuration not found")
    can_view_openeducat_config(current_user, config)
    return config


@router.put("/{config_id}", response_model=OpenEduCatConfigResponse)
def update_openeducat_config_endpoint(
    config_id: int,
    payload: OpenEduCatConfigUpdate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> OpenEduCatConfig:
    config = get_openeducat_config(db, config_id)
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="OpenEduCat configuration not found")
    require_manage_openeducat(current_user, school_id=payload.school_id or config.school_id)
    if current_user.get("role") == "SCHOOL_ADMIN" and config.school_id != current_user.get("school_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges to update this configuration",
        )
    return update_openeducat_config(db, config, payload)


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_openeducat_config_endpoint(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> None:
    config = get_openeducat_config(db, config_id)
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="OpenEduCat configuration not found")
    require_manage_openeducat(current_user, school_id=config.school_id)
    if current_user.get("role") == "SCHOOL_ADMIN" and config.school_id != current_user.get("school_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges to delete this configuration",
        )
    delete_openeducat_config(db, config)
    return None


@router.post("/test-connection", response_model=OpenEduCatActionResponse)
def test_connection_endpoint(
    payload: OpenEduCatActionRequest,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> OpenEduCatActionResponse:
    config = get_openeducat_config(db, payload.config_id)
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="OpenEduCat configuration not found")
    can_view_openeducat_config(current_user, config)
    result = test_openeducat_connection(config)
    return OpenEduCatActionResponse(**result)


@router.post("/sync/schools", response_model=OpenEduCatActionResponse)
def sync_schools_endpoint(
    payload: OpenEduCatActionRequest,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> OpenEduCatActionResponse:
    config = get_openeducat_config(db, payload.config_id)
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="OpenEduCat configuration not found")
    can_view_openeducat_config(current_user, config)
    result = sync_openeducat_schools(config)
    return OpenEduCatActionResponse(**result)


@router.post("/sync/students", response_model=OpenEduCatActionResponse)
def sync_students_endpoint(
    payload: OpenEduCatActionRequest,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> OpenEduCatActionResponse:
    config = get_openeducat_config(db, payload.config_id)
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="OpenEduCat configuration not found")
    can_view_openeducat_config(current_user, config)
    result = sync_openeducat_students(config)
    return OpenEduCatActionResponse(**result)


@router.post("/sync/courses", response_model=OpenEduCatActionResponse)
def sync_courses_endpoint(
    payload: OpenEduCatActionRequest,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> OpenEduCatActionResponse:
    config = get_openeducat_config(db, payload.config_id)
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="OpenEduCat configuration not found")
    can_view_openeducat_config(current_user, config)
    result = sync_openeducat_courses(config)
    return OpenEduCatActionResponse(**result)


@router.post("/sync/enrollments", response_model=OpenEduCatActionResponse)
def sync_enrollments_endpoint(
    payload: OpenEduCatActionRequest,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> OpenEduCatActionResponse:
    config = get_openeducat_config(db, payload.config_id)
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="OpenEduCat configuration not found")
    can_view_openeducat_config(current_user, config)
    result = sync_openeducat_enrollments(config)
    return OpenEduCatActionResponse(**result)
