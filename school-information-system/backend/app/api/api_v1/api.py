from fastapi import APIRouter

from app.api.api_v1.endpoints import auth, schools, students, courses, exams, enrollments, attendance, results, openeducat, openedx

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
# api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(schools.router, prefix="/schools", tags=["Schools"])
api_router.include_router(students.router, prefix="/students", tags=["Students"])
api_router.include_router(courses.router, prefix="/courses", tags=["Courses"])
api_router.include_router(exams.router, prefix="/exams", tags=["Exams"])
api_router.include_router(enrollments.router, prefix="/enrollments", tags=["Enrollments"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
api_router.include_router(results.router, prefix="/results", tags=["Results"])
api_router.include_router(openeducat.router, prefix="/openeducat", tags=["OpenEduCat"])
api_router.include_router(openedx.router, prefix="/openedx", tags=["Open edX"])
