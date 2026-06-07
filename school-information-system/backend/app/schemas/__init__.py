from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.course import CourseCreate, CourseListResponse, CourseResponse, CourseUpdate
from app.schemas.openeducat_config import (
    OpenEduCatActionRequest,
    OpenEduCatActionResponse,
    OpenEduCatConfigCreate,
    OpenEduCatConfigListResponse,
    OpenEduCatConfigResponse,
    OpenEduCatConfigUpdate,
)
from app.schemas.openedx_config import (
    OpenEdxActionRequest,
    OpenEdxActionResponse,
    OpenEdxConfigCreate,
    OpenEdxConfigListResponse,
    OpenEdxConfigResponse,
    OpenEdxConfigUpdate,
    OpenEdxCourseCreateRequest,
)
from app.schemas.enrollment import (
    EnrollmentCreate,
    EnrollmentListResponse,
    EnrollmentResponse,
    EnrollmentUpdate,
)
from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceListResponse,
    AttendanceResponse,
    AttendanceUpdate,
)
from app.schemas.exam import ExamCreate, ExamListResponse, ExamResponse, ExamUpdate
from app.schemas.result import ResultCreate, ResultListResponse, ResultResponse, ResultUpdate
from app.schemas.school import SchoolCreate, SchoolListResponse, SchoolResponse, SchoolUpdate
from app.schemas.student import (
    StudentCreate,
    StudentListResponse,
    StudentResponse,
    StudentUpdate,
)
from app.schemas.user import UserCreate, UserResponse, UserUpdate

__all__ = [
    "LoginRequest",
    "TokenResponse",
    "SchoolCreate",
    "SchoolListResponse",
    "SchoolUpdate",
    "SchoolResponse",
    "CourseCreate",
    "CourseListResponse",
    "CourseResponse",
    "CourseUpdate",
    "OpenEduCatActionRequest",
    "OpenEduCatActionResponse",
    "OpenEduCatConfigCreate",
    "OpenEduCatConfigListResponse",
    "OpenEduCatConfigResponse",
    "OpenEduCatConfigUpdate",
    "OpenEdxActionRequest",
    "OpenEdxActionResponse",
    "OpenEdxConfigCreate",
    "OpenEdxConfigListResponse",
    "OpenEdxConfigResponse",
    "OpenEdxConfigUpdate",
    "OpenEdxCourseCreateRequest",
    "EnrollmentCreate",
    "EnrollmentListResponse",
    "EnrollmentResponse",
    "EnrollmentUpdate",
    "AttendanceCreate",
    "AttendanceListResponse",
    "AttendanceResponse",
    "AttendanceUpdate",
    "ExamCreate",
    "ExamListResponse",
    "ExamResponse",
    "ExamUpdate",
    "ResultCreate",
    "ResultListResponse",
    "ResultResponse",
    "ResultUpdate",
    "StudentCreate",
    "StudentListResponse",
    "StudentResponse",
    "StudentUpdate",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
]
