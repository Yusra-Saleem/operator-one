"""Supabase PostgreSQL connection and health management."""

from collections.abc import Generator

from sqlalchemy import Engine, create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.logger import logger


engine: Engine = create_engine(
    settings.database_url.get_secret_value(),
    pool_pre_ping=True,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_recycle=1800,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class DatabaseManager:
    """Small SQLAlchemy manager for Supabase PostgreSQL."""

    def check_connection(self) -> bool:
        try:
            with engine.connect() as connection:
                connection.execute(text("select 1"))
            return True
        except Exception:
            logger.exception("Supabase database health check failed")
            return False

    def get_db_status(self) -> dict[str, object]:
        connected = self.check_connection()
        return {
            "status": "connected" if connected else "disconnected",
            "provider": "Supabase PostgreSQL",
            "pool_size": settings.db_pool_size,
        }


db_manager = DatabaseManager()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
