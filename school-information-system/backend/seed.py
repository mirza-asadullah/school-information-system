from app.database.session import get_db
from app.services.user_service import create_super_admin_if_missing


def run_seed() -> None:
    db = next(get_db())
    try:
        create_super_admin_if_missing(db, "admin@school.com", "Admin@123")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
