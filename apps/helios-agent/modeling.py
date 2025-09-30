"""
Risk Modeling Engine for Helios Oracle
Implements sophisticated risk assessment algorithms for RWA vaults
"""

import numpy as np
from typing import Dict, List, Optional
from datetime import datetime
import logging
import asyncio

logger = logging.getLogger(__name__)

class RiskModelingEngine:
    def __init__(self):
        # Weights for the comprehensive risk model
        self.weights = {
            "asset_diversity": 0.20,
            "ltv_ratio": 0.30,
            "originator_reputation": 0.15,
            "market_conditions": 0.15,
            "payment_history": 0.10,
            "concentration_risk": 0.10
        }
        
        # Risk thresholds
        self.thresholds = {
            "high_risk": 40,
            "medium_risk": 60,
            "low_risk": 80
        }
    
    async def calculate_health_score(self, vault_data: Dict) -> Dict:
        """
        Calculate comprehensive health score from vault data
        """
        try:
            # Extract relevant data
            composition = vault_data.get("composition", {})
            off_chain = vault_data.get("off_chain", {})
            
            # Calculate individual risk scores
            diversity_score = self._calculate_diversity_score(composition)
            ltv_score = self._calculate_ltv_score(off_chain)
            reputation_score = self._calculate_reputation_score(off_chain)
            market_score = self._calculate_market_score(off_chain)
            
            # Weighted average calculation
            weighted_scores = {
                "asset_diversity": diversity_score * self.weights["asset_diversity"],
                "ltv_ratio": ltv_score * self.weights["ltv_ratio"],
                "originator_reputation": reputation_score * self.weights["originator_reputation"],
                "market_conditions": market_score * self.weights["market_conditions"]
            }
            
            # Calculate final score
            final_score = sum(weighted_scores.values())
            final_score = max(0, min(100, int(final_score)))
            
            # Determine risk level
            risk_level = self._determine_risk_level(final_score)
            
            return {
                "score": final_score,
                "risk_factors": {
                    "asset_diversity": int(diversity_score),
                    "ltv_ratio": int(ltv_score),
                    "originator_reputation": int(reputation_score),
                    "market_conditions": int(market_score)
                },
                "risk_level": risk_level,
                "recommendation": self._generate_recommendation(final_score, risk_level),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error calculating health score: {str(e)}")
            return {
                "score": 50,
                "risk_factors": {
                    "asset_diversity": 50,
                    "ltv_ratio": 50,
                    "originator_reputation": 50,
                    "market_conditions": 50
                },
                "risk_level": "MEDIUM",
                "recommendation": "Unable to calculate precise score",
                "error": str(e)
            }
    
    def _calculate_diversity_score(self, composition: Dict) -> float:
        """Calculate asset diversity score"""
        assets = composition.get("assets", [])
        if not assets:
            return 50.0
        
        total_value = composition.get("total_value", 1)
        if total_value == 0:
            return 50.0
            
        # Simple diversity calculation
        unique_types = len(set(asset.get("type", "unknown") for asset in assets))
        diversity_score = min(100, 50 + (unique_types * 10))
        
        return diversity_score
    
    def _calculate_ltv_score(self, off_chain: Dict) -> float:
        """Calculate LTV ratio score"""
        ltv_ratio = off_chain.get("weighted_ltv_ratio", 50)
        
        if ltv_ratio <= 50:
            return 100
        elif ltv_ratio <= 65:
            return 85
        elif ltv_ratio <= 75:
            return 70
        elif ltv_ratio <= 85:
            return 50
        else:
            return max(0, 100 - ltv_ratio)
    
    def _calculate_reputation_score(self, off_chain: Dict) -> float:
        """Calculate originator reputation score"""
        return off_chain.get("originator_reputation", 50)
    
    def _calculate_market_score(self, off_chain: Dict) -> float:
        """Calculate market conditions score"""
        market_conditions = off_chain.get("market_conditions", {})
        
        score = 70
        
        if market_conditions.get("interest_rate_environment") == "rising":
            score -= 10
        elif market_conditions.get("interest_rate_environment") == "falling":
            score += 5
        
        if market_conditions.get("default_rate_trend") == "increasing":
            score -= 15
        elif market_conditions.get("default_rate_trend") == "decreasing":
            score += 10
        
        return min(100, max(0, score))
    
    def _determine_risk_level(self, score: int) -> str:
        """Determine risk level based on score"""
        if score >= self.thresholds["low_risk"]:
            return "LOW"
        elif score >= self.thresholds["medium_risk"]:
            return "MEDIUM"
        else:
            return "HIGH"
    
    def _generate_recommendation(self, score: int, risk_level: str) -> str:
        """Generate investment recommendation"""
        if risk_level == "LOW":
            return "Strong investment opportunity with minimal risk."
        elif risk_level == "MEDIUM":
            return "Balanced risk-reward profile."
        else:
            return "Higher risk profile detected."
