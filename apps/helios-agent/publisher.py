"""
Oracle Publisher for Helios Risk Oracle
Publishes health scores on-chain using the Aptos SDK
"""

import os
import logging
from typing import Dict, Optional, List
from aptos_sdk.account import Account
from aptos_sdk.client import RestClient
from aptos_sdk.transactions import EntryFunction, TransactionArgument, TransactionPayload
from aptos_sdk.account_address import AccountAddress
import asyncio

logger = logging.getLogger(__name__)

class OraclePublisher:
    def __init__(self):
        self.node_url = os.getenv("APTOS_NODE_URL", "https://fullnode.testnet.aptoslabs.com/v1")
        self.module_address = os.getenv("STRATAFI_ADDR", "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
        self.client = RestClient(self.node_url)
        
        # Initialize account from private key if provided
        private_key = os.getenv("HELIOS_AGENT_PRIVATE_KEY")
        if private_key:
            try:
                self.account = Account.load_key(private_key)
                logger.info(f"Initialized Helios account: {self.account.address()}")
            except Exception as e:
                logger.error(f"Failed to load private key: {str(e)}")
                self.account = None
        else:
            logger.warning("No private key provided - running in mock mode")
            self.account = None
    
    async def check_aptos_connection(self) -> bool:
        """Check if Aptos node is accessible"""
        try:
            ledger_info = self.client.ledger_info()
            return ledger_info is not None
        except:
            return False
    
    async def publish_health_score(
        self, 
        vault_owner: str, 
        score: int,
        risk_factors: Optional[Dict] = None
    ) -> Dict:
        """
        Publish health score on-chain
        """
        if not self.account:
            logger.warning("No account configured - simulating on-chain publication")
            return {
                "status": "simulated",
                "vault_owner": vault_owner,
                "score": score,
                "risk_factors": risk_factors,
                "message": "Running in mock mode - no actual transaction submitted"
            }
        
        try:
            # Prepare the entry function
            if risk_factors:
                # Use the detailed update function with risk factors
                entry_function = EntryFunction.natural(
                    f"{self.module_address}::risk_oracle",
                    "update_health_score_with_factors",
                    [],
                    [
                        TransactionArgument(AccountAddress.from_hex(vault_owner), "address"),
                        TransactionArgument(score, "u64"),
                        TransactionArgument(risk_factors.get("asset_diversity", 50), "u64"),
                        TransactionArgument(risk_factors.get("ltv_ratio", 50), "u64"),
                        TransactionArgument(risk_factors.get("originator_reputation", 50), "u64"),
                        TransactionArgument(risk_factors.get("market_conditions", 50), "u64")
                    ]
                )
            else:
                # Use simple update function
                entry_function = EntryFunction.natural(
                    f"{self.module_address}::risk_oracle",
                    "update_health_score",
                    [],
                    [
                        TransactionArgument(AccountAddress.from_hex(vault_owner), "address"),
                        TransactionArgument(score, "u64")
                    ]
                )
            
            # Create and submit transaction
            payload = TransactionPayload(entry_function)
            signed_txn = self.client.create_bcs_transaction(self.account, payload)
            tx_hash = self.client.submit_bcs_transaction(signed_txn)
            
            # Wait for transaction confirmation
            result = self.client.wait_for_transaction(tx_hash)
            
            logger.info(f"Successfully published health score on-chain: {tx_hash}")
            
            return {
                "status": "success",
                "transaction_hash": tx_hash,
                "vault_owner": vault_owner,
                "score": score,
                "risk_factors": risk_factors,
                "gas_used": result.get("gas_used", 0)
            }
            
        except Exception as e:
            logger.error(f"Failed to publish score on-chain: {str(e)}")
            raise Exception(f"On-chain publication failed: {str(e)}")
    
    async def initialize_vault_oracle(
        self,
        vault_id: int,
        vault_owner: str,
        initial_score: int = 50
    ) -> Dict:
        """
        Initialize the oracle for a new vault
        """
        if not self.account:
            return {
                "status": "simulated",
                "message": "Running in mock mode"
            }
        
        try:
            entry_function = EntryFunction.natural(
                f"{self.module_address}::risk_oracle",
                "init",
                [],
                [
                    TransactionArgument(vault_id, "u64"),
                    TransactionArgument(initial_score, "u64"),
                    TransactionArgument(self.account.address(), "address")  # Set Helios as authorized updater
                ]
            )
            
            payload = TransactionPayload(entry_function)
            signed_txn = self.client.create_bcs_transaction(self.account, payload)
            tx_hash = self.client.submit_bcs_transaction(signed_txn)
            
            result = self.client.wait_for_transaction(tx_hash)
            
            return {
                "status": "success",
                "transaction_hash": tx_hash,
                "vault_id": vault_id,
                "initial_score": initial_score
            }
            
        except Exception as e:
            logger.error(f"Failed to initialize vault oracle: {str(e)}")
            raise
    
    async def batch_publish_scores(
        self,
        scores: List[Dict]
    ) -> List[Dict]:
        """
        Publish multiple scores in batch
        """
        results = []
        
        for score_data in scores:
            try:
                result = await self.publish_health_score(
                    vault_owner=score_data["vault_owner"],
                    score=score_data["score"],
                    risk_factors=score_data.get("risk_factors")
                )
                results.append(result)
                
                # Small delay between transactions to avoid rate limiting
                await asyncio.sleep(0.5)
                
            except Exception as e:
                results.append({
                    "status": "error",
                    "vault_owner": score_data["vault_owner"],
                    "error": str(e)
                })
        
        return results
