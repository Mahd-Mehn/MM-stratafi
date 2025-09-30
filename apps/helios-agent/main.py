from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
import asyncio
import os
from datetime import datetime
import logging

from ingestion import DataIngestionAgent
from modeling import RiskModelingEngine
from publisher import OraclePublisher

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
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agents
ingestion_agent = DataIngestionAgent()
modeling_engine = RiskModelingEngine()
oracle_publisher = OraclePublisher()

# In-memory storage for health scores
health_scores_db: Dict[int, Dict] = {}

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

@app.get("/api/v1/vaults/{vault_id}/health", response_model=HealthScore)
async def get_health_score(vault_id: int):
    """Get the current health score for a vault"""
    if vault_id not in health_scores_db:
        # Return default score if not found
        return HealthScore(
            vault_id=vault_id,
            score=50,
            risk_factors={
                "asset_diversity": 50,
                "ltv_ratio": 50,
                "originator_reputation": 50,
                "market_conditions": 50
            }
        )
    
    data = health_scores_db[vault_id]
    return HealthScore(**data)

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
        
        # Step 3: Store result
        health_score_data = {
            "vault_id": vault_id,
            "score": risk_assessment["score"],
            "risk_factors": risk_assessment["risk_factors"],
            "timestamp": datetime.now()
        }
        health_scores_db[vault_id] = health_score_data
        
        # Step 4: Schedule background task to publish on-chain
        background_tasks.add_task(
            oracle_publisher.publish_health_score,
            request.vault_owner,
            risk_assessment["score"],
            risk_assessment["risk_factors"]
        )
        
        return HealthScore(**health_score_data)
        
    except Exception as e:
        logger.error(f"Error assessing vault {vault_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
