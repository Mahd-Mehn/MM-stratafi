from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
import asyncio
import os
from datetime import datetime
import logging
import requests
from sqlalchemy import text, func

from ingestion import DataIngestionAgent
from modeling import RiskModelingEngine
from publisher import OraclePublisher
from db import init_db, get_session, HealthScoreModel, engine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Helios Risk Oracle",
    description="AI-powered risk assessment for StrataFi RWA vaults",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB and agents
init_db()
ingestion_agent = DataIngestionAgent()
modeling_engine = RiskModelingEngine()
oracle_publisher = OraclePublisher()

DEFAULT_RISK_FACTORS = {
    "asset_diversity": 50,
    "ltv_ratio": 50,
    "originator_reputation": 50,
    "market_conditions": 50,
}

class HealthScore(BaseModel):
    vault_id: int = Field(..., description="Unique identifier for the vault")
    score: int = Field(..., ge=0, le=100, description="Health score from 0-100")
    risk_factors: Optional[Dict] = Field(None, description="Detailed risk factors")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now)
    
class RiskAssessmentRequest(BaseModel):
    vault_id: int
    vault_owner: str
    force_update: bool = False

@app.get("/", response_model=dict)
async def root():
    """Health check endpoint"""
    return {
        "service": "Helios Risk Oracle",
        "status": "operational",
        "version": "1.0.0"
    }

@app.get("/api/v1/status", response_model=dict)
@app.get("/api/status", response_model=dict)
@app.get("/status", response_model=dict)
async def status():
    """Detailed service status, SDK and DB connectivity"""
    sdk_available = getattr(oracle_publisher, "_sdk_available", False)
    use_async = getattr(oracle_publisher, "_use_async", False)
    has_private_key = bool(os.getenv("HELIOS_AGENT_PRIVATE_KEY"))
    node_url = os.getenv("APTOS_NODE_URL", "https://fullnode.testnet.aptoslabs.com/v1")

    # DB connectivity and aggregates
    db_connected = False
    total_vaults_monitored = 0
    average_health_score = None
    last_health_check = None
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_connected = True
        session = get_session()
        try:
            total_vaults_monitored = session.query(func.count(HealthScoreModel.vault_id)).scalar() or 0
            avg_score = session.query(func.avg(HealthScoreModel.score)).scalar()
            average_health_score = float(avg_score) if avg_score is not None else None
            last_health_check = session.query(func.max(HealthScoreModel.timestamp)).scalar()
        finally:
            session.close()
    except Exception:
        db_connected = False

    # Chain ID via REST and Aptos connectivity
    chain_id = None
    try:
        r = requests.get(node_url.rstrip('/') + '/', timeout=5)
        if r.ok:
            data = r.json()
            chain_id = data.get("chain_id")
    except Exception:
        pass
    aptos_connected = chain_id is not None

    # Nodit connectivity
    try:
        nodit_connected = await ingestion_agent.check_nodit_connection()
    except Exception:
        nodit_connected = False

    # Derive helios_status and simple load
    if aptos_connected and db_connected:
        helios_status = "healthy"
    elif aptos_connected or db_connected:
        helios_status = "warning"
    else:
        helios_status = "error"
    system_load = 20

    return {
        # Original fields
        "service": "Helios Risk Oracle",
        "version": "1.0.0",
        "sdk_available": sdk_available,
        "sdk_mode": ("async" if use_async else ("sync" if sdk_available else "unavailable")),
        "has_private_key": has_private_key,
        "db_connected": db_connected,
        "node_url": node_url,
        "chain_id": chain_id,
        "time": datetime.now().isoformat(),
        # Frontend health-monitor fields
        "aptos_connected": aptos_connected,
        "nodit_connected": nodit_connected,
        "helios_status": helios_status,
        "total_vaults_monitored": total_vaults_monitored,
        "last_health_check": last_health_check.isoformat() if last_health_check else None,
        "average_health_score": average_health_score,
        "system_load": system_load,
    }

@app.get("/api/v1/vaults", response_model=List[int])
async def list_monitored_vaults():
    """Return list of vault IDs with stored health scores"""
    try:
        session = get_session()
        ids = [row[0] for row in session.query(HealthScoreModel.vault_id).all()]
        return ids
    finally:
        try:
            session.close()
        except Exception:
            pass

@app.get("/api/v1/vaults/{vault_id}/health", response_model=HealthScore)
async def get_health_score(vault_id: int):
    """Get the current health score for a vault"""
    try:
        session = get_session()
        rec = session.query(HealthScoreModel).filter(HealthScoreModel.vault_id == vault_id).first()
        if rec is None:
            return HealthScore(vault_id=vault_id, score=50, risk_factors=DEFAULT_RISK_FACTORS)
        return HealthScore(
            vault_id=rec.vault_id,
            score=rec.score,
            risk_factors=rec.risk_factors,
            timestamp=rec.timestamp,
        )
    finally:
        try:
            session.close()
        except Exception:
            pass

@app.post("/api/v1/vaults/{vault_id}/assess", response_model=HealthScore)
async def assess_vault_risk(
    vault_id: int,
    request: RiskAssessmentRequest,
    background_tasks: BackgroundTasks
):
    """Trigger a risk assessment for a vault"""
    
    try:
        # Step 1: Ingest data
        logger.info(f"Ingesting data for vault {vault_id}")
        vault_data = await ingestion_agent.fetch_vault_data(
            vault_id=vault_id,
            owner_address=request.vault_owner
        )
        
        # Step 2: Run risk modeling
        logger.info(f"Running risk model for vault {vault_id}")
        risk_assessment = await modeling_engine.calculate_health_score(vault_data)
        
        # Step 3: Store result (Postgres)
        session = get_session()
        try:
            rec = session.query(HealthScoreModel).filter(HealthScoreModel.vault_id == vault_id).first()
            now_ts = datetime.now()
            if rec is None:
                rec = HealthScoreModel(
                    vault_id=vault_id,
                    score=risk_assessment["score"],
                    risk_factors=risk_assessment["risk_factors"],
                    timestamp=now_ts,
                )
                session.add(rec)
            else:
                rec.score = risk_assessment["score"]
                rec.risk_factors = risk_assessment["risk_factors"]
                rec.timestamp = now_ts
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
        
        # Step 4: Schedule background task to publish on-chain
        background_tasks.add_task(
            oracle_publisher.publish_health_score,
            request.vault_owner,
            risk_assessment["score"],
            risk_assessment["risk_factors"]
        )
        
        return HealthScore(
            vault_id=vault_id,
            score=risk_assessment["score"],
            risk_factors=risk_assessment["risk_factors"],
            timestamp=datetime.now(),
        )
        
    except Exception as e:
        logger.error(f"Error assessing vault {vault_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
