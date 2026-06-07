import base64
import json
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

from sqlalchemy.orm import Session

from app.models.openedx_config import OpenEdxConfig
from app.schemas.openedx_config import OpenEdxConfigCreate, OpenEdxConfigUpdate
from app.utils.encryption import decrypt_string, encrypt_string


def get_openedx_config(db: Session, config_id: int) -> OpenEdxConfig | None:
    return db.query(OpenEdxConfig).filter(OpenEdxConfig.id == config_id).one_or_none()


def list_openedx_configs(
    db: Session,
    page: int = 1,
    per_page: int = 20,
    school_id: int | None = None,
    is_active: bool | None = None,
) -> tuple[Iterable[OpenEdxConfig], int]:
    query = db.query(OpenEdxConfig)

    if school_id is not None:
        query = query.filter(OpenEdxConfig.school_id == school_id)
    if is_active is not None:
        query = query.filter(OpenEdxConfig.is_active == is_active)

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return items, total


def create_openedx_config(db: Session, payload: OpenEdxConfigCreate) -> OpenEdxConfig:
    config = OpenEdxConfig(
        school_id=payload.school_id,
        base_url=payload.base_url,
        client_id=payload.client_id,
        client_secret=encrypt_string(payload.client_secret),
        access_token=encrypt_string(payload.access_token) if payload.access_token is not None else None,
        refresh_token=encrypt_string(payload.refresh_token) if payload.refresh_token is not None else None,
        is_active=payload.is_active if payload.is_active is not None else True,
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


def update_openedx_config(db: Session, config: OpenEdxConfig, payload: OpenEdxConfigUpdate) -> OpenEdxConfig:
    if payload.school_id is not None:
        config.school_id = payload.school_id
    if payload.base_url is not None:
        config.base_url = payload.base_url
    if payload.client_id is not None:
        config.client_id = payload.client_id
    if payload.client_secret is not None:
        config.client_secret = encrypt_string(payload.client_secret)
    if payload.access_token is not None:
        config.access_token = encrypt_string(payload.access_token) if payload.access_token is not None else None
    if payload.refresh_token is not None:
        config.refresh_token = encrypt_string(payload.refresh_token) if payload.refresh_token is not None else None
    if payload.is_active is not None:
        config.is_active = payload.is_active

    db.add(config)
    db.commit()
    db.refresh(config)
    return config


def delete_openedx_config(db: Session, config: OpenEdxConfig) -> None:
    db.delete(config)
    db.commit()


def _decrypt_token(value: str | None) -> str | None:
    if value is None:
        return None
    return decrypt_string(value)


def _build_headers(config: OpenEdxConfig, content_type: str | None = None) -> dict[str, str]:
    headers = {"Accept": "application/json"}
    access_token = _decrypt_token(config.access_token)
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    if content_type:
        headers["Content-Type"] = content_type
    return headers


def _execute_request(
    url: str,
    headers: dict[str, str] | None = None,
    data: bytes | None = None,
    method: str | None = None,
    timeout: int = 10,
) -> tuple[int, bytes]:
    request = Request(url, data=data, headers=headers or {}, method=method)
    try:
        with urlopen(request, timeout=timeout) as response:
            status_code = getattr(response, "status", None) or response.getcode()
            return status_code, response.read()
    except HTTPError as exc:
        raise ValueError(f"Open edX server returned HTTP {exc.code}: {exc.reason}") from exc
    except URLError as exc:
        raise ValueError(f"Unable to connect to Open edX server: {exc.reason}") from exc


def _build_remote_url(config: OpenEdxConfig, path: str) -> str:
    base_url = config.base_url.rstrip("/") + "/"
    return urljoin(base_url, path.lstrip("/"))


def test_openedx_connection(config: OpenEdxConfig) -> dict[str, object]:
    url = _build_remote_url(config, "api/user/v1/me")
    status_code, _ = _execute_request(url, headers=_build_headers(config), method="GET")
    return {
        "success": status_code < 400,
        "message": "Connection successful" if status_code < 400 else "Connection returned an error",
        "details": f"HTTP {status_code}",
    }


def create_openedx_course(config: OpenEdxConfig, course_payload: dict[str, object]) -> dict[str, object]:
    url = _build_remote_url(config, "api/course/v1/courses/")
    body = json.dumps(course_payload).encode("utf-8")
    status_code, raw_response = _execute_request(
        url,
        headers=_build_headers(config, content_type="application/json"),
        data=body,
        method="POST",
    )
    try:
        payload = json.loads(raw_response.decode("utf-8"))
    except ValueError as exc:
        raise ValueError("Open edX response was not valid JSON") from exc
    return {
        "success": status_code < 400,
        "message": "Course created in Open edX" if status_code < 400 else "Failed to create course",
        "details": json.dumps(payload),
    }


def _fetch_remote_list(config: OpenEdxConfig, path: str) -> list[dict[str, object]]:
    url = _build_remote_url(config, path)
    status_code, raw_response = _execute_request(url, headers=_build_headers(config), method="GET")
    if status_code >= 400:
        raise ValueError(f"Open edX server returned HTTP {status_code}")

    try:
        payload = json.loads(raw_response.decode("utf-8"))
    except ValueError as exc:
        raise ValueError("Open edX response was not valid JSON") from exc

    if isinstance(payload, dict):
        if isinstance(payload.get("results"), list):
            return payload["results"]
        if isinstance(payload.get("courses"), list):
            return payload["courses"]
        if isinstance(payload.get("data"), list):
            return payload["data"]
        raise ValueError("Open edX response JSON did not contain a list of items")
    if isinstance(payload, list):
        return payload

    raise ValueError("Open edX response JSON did not contain a list of items")


def sync_openedx_courses(config: OpenEdxConfig) -> dict[str, object]:
    courses = _fetch_remote_list(config, "api/courses/v1/courses/?page_size=100")
    return {
        "success": True,
        "message": "Fetched course records from Open edX",
        "synced_count": len(courses),
    }


def sync_openedx_enrollments(config: OpenEdxConfig) -> dict[str, object]:
    enrollments = _fetch_remote_list(config, "api/enrollment/v1/enrollments/?page_size=100")
    return {
        "success": True,
        "message": "Fetched enrollment records from Open edX",
        "synced_count": len(enrollments),
    }


def sync_openedx_learners(config: OpenEdxConfig) -> dict[str, object]:
    learners = _fetch_remote_list(config, "api/user/v1/accounts/?page_size=100")
    return {
        "success": True,
        "message": "Fetched learner records from Open edX",
        "synced_count": len(learners),
    }
