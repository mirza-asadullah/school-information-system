from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "School Information System"
    PROJECT_VERSION: str = "0.1.0"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    DATABASE_URL: str
    SUPER_ADMIN_ROLE: str = "super_admin"
    SCHOOL_ADMIN_ROLE: str = "school_admin"
    STUDENT_ROLE: str = "student"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
