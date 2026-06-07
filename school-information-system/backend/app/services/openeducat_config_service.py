import base64
import json
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

from sqlalchemy.orm import Session

from app.models.openeducat_config import OpenEduCatConfig
from app.schemas.openeducat_config import OpenEduCatConfigCreate, OpenEduCatConfigUpdate
from app.utils.encryption import decrypt_string, encrypt_string


def get_openeducat_config(db: Session, config_id: int) -> OpenEduCatConfig | None:
    return db.query(OpenEduCatConfig).filter(OpenEduCatConfig.id == config_id).one_or_none()


def list_openeducat_configs(
    db: Session,
    page: int = 1,
    per_page: int = 20,
    school_id: int | None = None,
    is_active: bool | None = None,
) -> tuple[Iterable[OpenEduCatConfig], int]:
    query = db.query(OpenEduCatConfig)

    if school_id is not None:
        query = query.filter(OpenEduCatConfig.school_id == school_id)
    if is_active is not None:
        query = query.filter(OpenEduCatConfig.is_active == is_active)

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return items, total


def create_openeducat_config(db: Session, payload: OpenEduCatConfigCreate) -> OpenEduCatConfig:
    config = OpenEduCatConfig(
        school_id=payload.school_id,
        base_url=payload.base_url,
        database_name=payload.database_name,
        username=payload.username,
        password=encrypt_string(payload.password),
        is_active=payload.is_active if payload.is_active is not None else True,
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


def update_openeducat_config(db: Session, config: OpenEduCatConfig, payload: OpenEduCatConfigUpdate) -> OpenEduCatConfig:
    if payload.school_id is not None:
        config.school_id = payload.school_id
    if payload.base_url is not None:
        config.base_url = payload.base_url
    if payload.database_name is not None:
        config.database_name = payload.database_name
    if payload.username is not None:
        config.username = payload.username
    if payload.password is not None:
        config.password = encrypt_string(payload.password)
    if payload.is_active is not None:
        config.is_active = payload.is_active

    db.add(config)
    db.commit()
    db.refresh(config)
    return config


def delete_openeducat_config(db: Session, config: OpenEduCatConfig) -> None:
    db.delete(config)
    db.commit()


def _build_auth_headers(config: OpenEduCatConfig) -> dict[str, str]:
    credentials = f"{config.username}:{decrypt_string(config.password)}".encode("utf-8")
    token = base64.b64encode(credentials).decode("utf-8")
    return {
        "Authorization": f"Basic {token}",
        "Accept": "application/json",
    }


def _execute_request(url: str, headers: dict[str, str] | None = None, timeout: int = 10) -> tuple[int, bytes]:
    request = Request(url, headers=headers or {})
    try:
        with urlopen(request, timeout=timeout) as response:
            status_code = getattr(response, "status", None) or response.getcode()
            return status_code, response.read()
    except HTTPError as exc:
        raise ValueError(f"OpenEduCat server returned HTTP {exc.code}: {exc.reason}") from exc
    except URLError as exc:
        raise ValueError(f"Unable to connect to OpenEduCat server: {exc.reason}") from exc


def _build_remote_url(config: OpenEduCatConfig, path: str) -> str:
    base_url = config.base_url.rstrip("/") + "/"
    return urljoin(base_url, path.lstrip("/"))


def test_openeducat_connection(config: OpenEduCatConfig) -> dict[str, object]:
    status_code, _ = _execute_request(config.base_url, headers=_build_auth_headers(config))
    return {
        "success": status_code < 400,
        "message": "Connection successful" if status_code < 400 else "Connection returned an error",
        "details": f"HTTP {status_code}",
    }


def _fetch_remote_list(config: OpenEduCatConfig, path: str) -> list[dict[str, object]]:
    url = _build_remote_url(config, path)
    status_code, raw_response = _execute_request(url, headers=_build_auth_headers(config))
    if status_code >= 400:
        raise ValueError(f"OpenEduCat server returned HTTP {status_code}")

    try:
        payload = json.loads(raw_response.decode("utf-8"))
    except ValueError as exc:
        raise ValueError("OpenEduCat response was not valid JSON") from exc

    if isinstance(payload, dict):
        if isinstance(payload.get("data"), list):
            return payload["data"]
        if isinstance(payload.get("items"), list):
            return payload["items"]
        raise ValueError("OpenEduCat response JSON did not contain a list of items")
    if isinstance(payload, list):
        return payload

    raise ValueError("OpenEduCat response JSON did not contain a list of items")


def sync_openeducat_schools(config: OpenEduCatConfig) -> dict[str, object]:
    schools = _fetch_remote_list(config, "api/schools")
    return {
        "success": True,
        "message": "Fetched school records from OpenEduCat",
        "synced_count": len(schools),
    }


def sync_openeducat_students(config: OpenEduCatConfig) -> dict[str, object]:
    students = _fetch_remote_list(config, "api/students")
    return {
        "success": True,
        "message": "Fetched student records from OpenEduCat",
        "synced_count": len(students),
    }


def sync_openeducat_courses(config: OpenEduCatConfig) -> dict[str, object]:
    courses = _fetch_remote_list(config, "api/courses")
    return {
        "success": True,
        "message": "Fetched course records from OpenEduCat",
        "synced_count": len(courses),
    }


def sync_openeducat_enrollments(config: OpenEduCatConfig) -> dict[str, object]:
    enrollments = _fetch_remote_list(config, "api/enrollments")
    return {
        "success": True,
        "message": "Fetched enrollment records from OpenEduCat",
        "synced_count": len(enrollments),
    }
