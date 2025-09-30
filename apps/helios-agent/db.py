import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("NEXT_DATABASE_URL", "postgresql://username:password@localhost:5432/nextjs")

engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()

class HealthScoreModel(Base):
    __tablename__ = "agent_health_scores"
    id = Column(Integer, primary_key=True, index=True)
    vault_id = Column(Integer, unique=True, index=True, nullable=False)
    score = Column(Integer, nullable=False)
    risk_factors = Column(JSONB)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def get_session() -> Session:
    return SessionLocal()
