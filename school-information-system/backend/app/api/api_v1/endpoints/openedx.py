from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.openedx_config import OpenEdxConfig
from app.schemas.openedx_config import (
    OpenEdxActionRequest,
    OpenEdxActionResponse,
    OpenEdxConfigCreate,
    OpenEdxConfigListResponse,
    OpenEdxConfigResponse,
    OpenEdxConfigUpdate,
    OpenEdxCourseCreateRequest,
)
from app.services.openedx_config_service import (
    create_openedx_config,
    create_openedx_course,
    delete_openedx_config,
    get_openedx_config,
    list_openedx_configs,
    sync_openedx_courses,
    sync_openedx_enrollments,
    sync_openedx_learners,
    test_openedx_connection,
    update_openedx_config,
)

router = APIRouter()


def require_manage_openedx(current_user: dict[str, Any], school_id: int | None = None) -> None:
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


def can_view_openedx_config(current_user: dict[str, Any], config: OpenEdxConfig) -> None:
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


@router.post("", response_model=OpenEdxConfigResponse, status_code=status.HTTP_201_CREATED)
def create_openedx_config_endpoint(
    payload: OpenEdxConfigCreate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> OpenEdxConfig:
    require_manage_openedx(current_user, school_id=payload.school_id)
    return create_openedx_config(db, payload)


@router.get("", response_model=OpenEdxConfigListResponse)
def list_openedx_configs_endpoint(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Results per page"),
    school_id: int | None = Query(None, description="Filter by school identifier"),
    is_active: bool | None = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> OpenEdxConfigListResponse:
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

    items, total = list_openedx_configs(
        db,
        page=page,
        per_page=per_page,
        school_id=school_id,
        is_active=is_active,
    )
    return OpenEdxConfigListResponse(items=items, page=page, per_page=per_page, total=total)


@router.get("/{config_id}", response_model=OpenEdxConfigResponse)
def get_openedx_config_endpoint(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> OpenEdxConfig:
    config = get_openedx_config(db, config_id)
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Open edX configuration not found")
    can_view_openedx_config(current_user, config)
    return config


@router.put("/{config_id}", response_model=OpenEdxConfigResponse)
def update_openedx_config_endpoint(
    config_id: int,
    payload: OpenEdxConfigUpdate,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> OpenEdxConfig:
    config = get_openedx_config(db, config_id)
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Open edX configuration not found")
    require_manage_openedx(current_user, school_id=payload.school_id or config.school_id)
    if current_user.get("role") == "SCHOOL_ADMIN" and config.school_id != current_user.get("school_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges to update this configuration",
        )
    return update_openedx_config(db, config, payload)


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_openedx_config_endpoint(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> None:
    config = get_openedx_config(db, config_id)
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Open edX configuration not found")
    require_manage_openedx(current_user, school_id=config.school_id)
    if current_user.get("role") == "SCHOOL_ADMIN" and config.school_id != current_user.get("school_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient privileges to delete this configuration",
        )
    delete_openedx_config(db, config)
    return None


@router.post("/test-connection", response_model=OpenEdxActionResponse)
def test_connection_endpoint(
    payload: OpenEdxActionRequest,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> OpenEdxActionResponse:
    config = get_openedx_config(db, payload.config_id)
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Open edX configuration not found")
    can_view_openedx_config(current_user, config)
    result = test_openedx_connection(config)
    return OpenEdxActionResponse(**result)


@router.post("/sync/courses", response_model=OpenEdxActionResponse)
def sync_courses_endpoint(
    payload: OpenEdxActionRequest,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> OpenEdxActionResponse:
    config = get_openedx_config(db, payload.config_id)
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Open edX configuration not found")
    can_view_openedx_config(current_user, config)
    result = sync_openedx_courses(config)
    return OpenEdxActionResponse(**result)


@router.post("/sync/enrollments", response_model=OpenEdxActionResponse)
def sync_enrollments_endpoint(
    payload: OpenEdxActionRequest,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> OpenEdxActionResponse:
    config = get_openedx_config(db, payload.config_id)
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Open edX configuration not found")
    can_view_openedx_config(current_user, config)
    result = sync_openedx_enrollments(config)
    return OpenEdxActionResponse(**result)


@router.post("/sync/learners", response_model=OpenEdxActionResponse)
def sync_learners_endpoint(
    payload: OpenEdxActionRequest,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> OpenEdxActionResponse:
    config = get_openedx_config(db, payload.config_id)
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Open edX configuration not found")
    can_view_openedx_config(current_user, config)
    result = sync_openedx_learners(config)
    return OpenEdxActionResponse(**result)


@router.post("/create-course", response_model=OpenEdxActionResponse)
def create_course_endpoint(
    payload: OpenEdxCourseCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> OpenEdxActionResponse:
    config = get_openedx_config(db, payload.config_id)
    if not config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Open edX configuration not found")
    can_view_openedx_config(current_user, config)
    payload_data = {
        "course_name": payload.course_name,
        "course_number": payload.course_number,
        "organization": payload.organization,
        "run": payload.run,
        "display_name": payload.display_name,
        "marketing_slug": payload.marketing_slug,
    }
    result = create_openedx_course(config, payload_data)
    return OpenEdxActionResponse(**result)
