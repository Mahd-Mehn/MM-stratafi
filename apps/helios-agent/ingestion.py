"""
Data Ingestion Agent for Helios Risk Oracle
Integrates with Nodit API for on-chain data and simulates off-chain data sources
"""

import os
import requests
import json
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
from aptos_sdk.client import RestClient

logger = logging.getLogger(__name__)

class DataIngestionAgent:
    def __init__(self):
        self.nodit_api_key = os.getenv("NODIT_API_KEY", "demo_key")
        self.aptos_node_url = os.getenv("APTOS_NODE_URL", "https://fullnode.testnet.aptoslabs.com/v1")
        self.nodit_base_url = "https://aptos-testnet.nodit.io/v1"
        self.aptos_client = RestClient(self.aptos_node_url)
        
        # Initialize headers for Nodit API
        self.headers = {
            "X-API-KEY": self.nodit_api_key,
            "Content-Type": "application/json"
        }
    
    async def check_nodit_connection(self) -> bool:
        """Check if Nodit API is accessible"""
        try:
            response = requests.get(
                f"{self.nodit_base_url}/accounts/0x1",
                headers=self.headers,
                timeout=5
            )
            return response.status_code == 200
        except:
            return False
    
    async def fetch_vault_data(self, vault_id: int, owner_address: str) -> Dict:
        """Fetch comprehensive vault data from multiple sources"""
        try:
            # Fetch on-chain data
            on_chain_data = await self.fetch_onchain_data(owner_address, vault_id)
            
            # Fetch vault events from Nodit
            events = await self.fetch_vault_events(owner_address, vault_id)
            
            # Fetch asset composition
            composition = await self.fetch_vault_composition(vault_id, owner_address)
            
            # Simulate off-chain data
            off_chain_data = await self.fetch_offchain_data(vault_id)
            
            return {
                "vault_id": vault_id,
                "owner_address": owner_address,
                "on_chain": on_chain_data,
                "events": events,
                "composition": composition,
                "off_chain": off_chain_data,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error fetching vault data: {str(e)}")
            # Return mock data if real fetching fails
            return self._get_mock_vault_data(vault_id, owner_address)
    
    async def fetch_onchain_data(self, address: str, vault_id: int) -> Dict:
        """Fetch on-chain vault data from Aptos"""
        try:
            # Get account resources
            resources = self.aptos_client.account_resources(address)
            
            vault_data = {}
            for resource in resources:
                if "Vault" in resource["type"]:
                    vault_data["vault"] = resource["data"]
                elif "TrancheVault" in resource["type"]:
                    vault_data["tranches"] = resource["data"]
                elif "YieldState" in resource["type"]:
                    vault_data["yield_state"] = resource["data"]
            
            return vault_data
        except Exception as e:
            logger.warning(f"Could not fetch on-chain data: {str(e)}")
            return {}
    
    async def fetch_vault_events(self, address: str, vault_id: int) -> List[Dict]:
        """Fetch vault-related events from Nodit Indexer"""
        try:
            # Use Nodit's event API
            endpoint = f"{self.nodit_base_url}/accounts/{address}/events"
            
            response = requests.get(
                endpoint,
                headers=self.headers,
                params={
                    "limit": 100,
                    "offset": 0
                }
            )
            
            if response.status_code == 200:
                events = response.json().get("data", [])
                # Filter for vault-related events
                vault_events = [
                    event for event in events
                    if "vault" in event.get("type", "").lower()
                ]
                return vault_events
            else:
                logger.warning(f"Nodit API returned status {response.status_code}")
                return []
                
        except Exception as e:
            logger.warning(f"Could not fetch events from Nodit: {str(e)}")
            # Return mock events for demo
            return [
                {
                    "type": "VaultCreated",
                    "data": {"vault_id": vault_id, "owner": address},
                    "timestamp": datetime.now().isoformat()
                },
                {
                    "type": "RWAAdded", 
                    "data": {"vault_id": vault_id, "value": 1000000},
                    "timestamp": datetime.now().isoformat()
                }
            ]
    
    async def fetch_vault_composition(self, vault_id: int, address: str) -> Dict:
        """Get current asset composition of a vault"""
        try:
            # Try to get real data from chain
            resources = self.aptos_client.account_resources(address)
            
            for resource in resources:
                if "Vault" in resource["type"]:
                    vault_data = resource["data"]
                    if vault_data.get("id") == str(vault_id):
                        return {
                            "vault_id": vault_id,
                            "total_value": int(vault_data.get("total_value", 0)),
                            "assets": vault_data.get("assets", []),
                            "created_ts": vault_data.get("created_ts", 0)
                        }
        except:
            pass
        
        # Return mock data for demo
        return {
            "vault_id": vault_id,
            "total_value": 5000000,
            "assets": [
                {
                    "id": 1,
                    "type": "invoice_financing",
                    "value": 2000000,
                    "originator": "0xabc123",
                    "risk_rating": "A"
                },
                {
                    "id": 2,
                    "type": "real_estate_bridge",
                    "value": 3000000,
                    "originator": "0xdef456",
                    "risk_rating": "BB"
                }
            ],
            "asset_diversity": 0.6  # Diversity score
        }
    
    async def fetch_offchain_data(self, vault_id: int) -> Dict:
        """Simulate fetching off-chain credit scores, valuations etc."""
        # In production, this would connect to real credit bureaus, 
        # property valuation APIs, etc.
        
        # Simulate API delay
        await asyncio.sleep(0.1)
        
        # Mock off-chain data with realistic values
        return {
            "average_credit_score": 720,
            "weighted_ltv_ratio": 65,  # 65%
            "payment_history_score": 85,  # out of 100
            "originator_reputation": 75,  # out of 100
            "market_conditions": {
                "interest_rate_environment": "rising",
                "credit_spread_index": 120,
                "default_rate_trend": "stable"
            },
            "external_ratings": {
                "moodys_equivalent": "Baa2",
                "sp_equivalent": "BBB"
            }
        }
    
    def _get_mock_vault_data(self, vault_id: int, owner_address: str) -> Dict:
        """Return mock vault data for testing"""
        return {
            "vault_id": vault_id,
            "owner_address": owner_address,
            "on_chain": {
                "vault": {
                    "id": vault_id,
                    "total_value": 5000000,
                    "created_ts": 1700000000
                },
                "tranches": {
                    "senior_supply": 3000000,
                    "mezz_supply": 1500000,
                    "junior_supply": 500000
                }
            },
            "events": [
                {"type": "VaultCreated", "data": {"vault_id": vault_id}},
                {"type": "TranchesMinted", "data": {"amounts": [3000000, 1500000, 500000]}}
            ],
            "composition": {
                "vault_id": vault_id,
                "total_value": 5000000,
                "assets": [
                    {"type": "invoice", "value": 2000000},
                    {"type": "real_estate", "value": 3000000}
                ]
            },
            "off_chain": {
                "average_credit_score": 720,
                "weighted_ltv_ratio": 65,
                "payment_history_score": 85,
                "originator_reputation": 75
            },
            "timestamp": datetime.now().isoformat()
        }
    
    async def monitor_vault_changes(self, vault_id: int, callback):
        """Monitor a vault for changes (WebSocket or polling)"""
        # For hackathon, use simple polling
        while True:
            try:
                data = await self.fetch_vault_data(vault_id, "")
                await callback(data)
                await asyncio.sleep(30)  # Poll every 30 seconds
            except Exception as e:
                logger.error(f"Error monitoring vault {vault_id}: {str(e)}")
                await asyncio.sleep(60)  # Back off on error
