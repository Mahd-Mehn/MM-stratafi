"""
Oracle Publisher for Helios Risk Oracle
Publishes health scores on-chain using the Aptos SDK when available.
Falls back to simulated mode if SDK is unavailable or no private key is provided.
"""

import os
import logging
from typing import Dict, Optional, List
from dotenv import load_dotenv
import asyncio

load_dotenv()

logger = logging.getLogger(__name__)

class OraclePublisher:
    def __init__(self):
        self.node_url = os.getenv("APTOS_NODE_URL", "https://fullnode.testnet.aptoslabs.com/v1")
        self.module_address = os.getenv("STRATAFI_ADDR", "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
        self._sdk_available = False
        self._use_async = False
        self.client = None
        self.Account = None
        self.EntryFunction = None
        self.TransactionArgument = None
        self.TransactionPayload = None
        self.AccountAddress = None

        # Attempt to import Aptos SDK lazily (prefer async client)
        try:
            from aptos_sdk.account import Account as _Account
            from aptos_sdk.transactions import EntryFunction as _EntryFunction, TransactionArgument as _TransactionArgument, TransactionPayload as _TransactionPayload
            from aptos_sdk.account_address import AccountAddress as _AccountAddress

            # Try async client first
            try:
                from aptos_sdk.async_client import RestClient as _AsyncRestClient
                self.client = _AsyncRestClient(self.node_url)
                self._use_async = True
            except Exception:
                from aptos_sdk.client import RestClient as _RestClient
                self.client = _RestClient(self.node_url)
                self._use_async = False

            self.Account = _Account
            self.EntryFunction = _EntryFunction
            self.TransactionArgument = _TransactionArgument
            self.TransactionPayload = _TransactionPayload
            self.AccountAddress = _AccountAddress
            self._sdk_available = True
        except Exception as e:
            logging.getLogger(__name__).warning(f"Aptos SDK not available; running in mock mode. Details: {e}")
        
        # Initialize account from private key if provided
        private_key = os.getenv("HELIOS_AGENT_PRIVATE_KEY")
        if not self._sdk_available:
            if private_key:
                logger.warning("Aptos SDK unavailable; private key provided but running in mock mode")
            else:
                logger.warning("Aptos SDK unavailable; running in mock mode")
            self.account = None
        elif not private_key:
            logger.warning("HELIOS_AGENT_PRIVATE_KEY not set - running in mock mode")
            self.account = None
        else:
            try:
                self.account = self.Account.load_key(private_key)
                logger.info(f"Initialized Helios account: {self.account.address()}")
            except Exception as e:
                logger.error(f"Failed to load private key: {str(e)}")
                self.account = None
    
    async def check_aptos_connection(self) -> bool:
        """Check if Aptos node is accessible"""
        if not self._sdk_available or not self.client:
            return False
        try:
            if self._use_async:
                # chain_id is a simple readiness check
                cid = await self.client.chain_id()
                return cid is not None
            else:
                ledger_info = self.client.ledger_info()
                return ledger_info is not None
        except Exception:
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
        if not self.account or not self._sdk_available or not self.client:
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
                entry_function = self.EntryFunction.natural(
                    f"{self.module_address}::risk_oracle",
                    "update_health_score_with_factors",
                    [],
                    [
                        self.TransactionArgument(self.AccountAddress.from_hex(vault_owner), "address"),
                        self.TransactionArgument(score, "u64"),
                        self.TransactionArgument(risk_factors.get("asset_diversity", 50), "u64"),
                        self.TransactionArgument(risk_factors.get("ltv_ratio", 50), "u64"),
                        self.TransactionArgument(risk_factors.get("originator_reputation", 50), "u64"),
                        self.TransactionArgument(risk_factors.get("market_conditions", 50), "u64")
                    ]
                )
            else:
                # Use simple update function
                entry_function = self.EntryFunction.natural(
                    f"{self.module_address}::risk_oracle",
                    "update_health_score",
                    [],
                    [
                        self.TransactionArgument(self.AccountAddress.from_hex(vault_owner), "address"),
                        self.TransactionArgument(score, "u64")
                    ]
                )
            
            # Create and submit transaction
            payload = self.TransactionPayload(entry_function)
            if self._use_async:
                signed_txn = await self.client.create_bcs_transaction(self.account, payload)
                tx_hash = await self.client.submit_bcs_transaction(signed_txn)
                await self.client.wait_for_transaction(tx_hash)
                # Fetch result for details
                result = await self.client.transaction_by_hash(tx_hash)
            else:
                signed_txn = self.client.create_bcs_transaction(self.account, payload)
                tx_hash = self.client.submit_bcs_transaction(signed_txn)
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
            if not self._sdk_available or not self.client:
                return {"status": "simulated", "message": "SDK unavailable"}

            entry_function = self.EntryFunction.natural(
                f"{self.module_address}::risk_oracle",
                "init",
                [],
                [
                    self.TransactionArgument(vault_id, "u64"),
                    self.TransactionArgument(initial_score, "u64"),
                    self.TransactionArgument(self.account.address(), "address")  # Set Helios as authorized updater
                ]
            )
            
            payload = self.TransactionPayload(entry_function)
            if self._use_async:
                signed_txn = await self.client.create_bcs_transaction(self.account, payload)
                tx_hash = await self.client.submit_bcs_transaction(signed_txn)
                await self.client.wait_for_transaction(tx_hash)
            else:
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
