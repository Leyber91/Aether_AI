# DEAC Controller Service
# This service manages the lifecycle of Dynamic Evolving AI Conglomerates

import logging
import os
import uuid
import json
from datetime import datetime
from typing import List, Dict, Any, Optional, Union

from fastapi import HTTPException
import asyncio

# Internal imports - these will be implemented progressively
from backend.models.deac_models import (
    MVDEAC, 
    DEACState, 
    DEACConfig, 
    DEACResponse,
    DEACEvolutionStep
)

logger = logging.getLogger(__name__)

class DEACController:
    """
    Core controller for managing Dynamic Evolving AI Conglomerates (DEACs).
    This service handles:
    - DEAC lifecycle (creation, execution, evolution, termination)
    - State persistence and retrieval
    - Integration with other services (evolution, memory, etc.)
    """
    
    def __init__(
        self,
        vector_service=None,
        evolution_engine=None,
        memory_manager=None,
        coordination_service=None,
        model_service=None
    ):
        """Initialize the DEAC controller with required services."""
        self.vector_service = vector_service
        self.evolution_engine = evolution_engine
        self.memory_manager = memory_manager
        self.coordination_service = coordination_service
        self.model_service = model_service
        
        # Local storage for active DEACs
        self.active_deacs: Dict[str, MVDEAC] = {}
        
        # Ensure data directory exists
        self.data_dir = os.path.join(os.getcwd(), "data", "deacs", "mv_deacs")
        os.makedirs(self.data_dir, exist_ok=True)
        
        logger.info("DEAC Controller initialized")
    
    async def create_mv_deac(self, config: DEACConfig) -> DEACResponse:
        """
        Create a new Minimum Viable DEAC with the given configuration.
        
        Args:
            config: Configuration parameters for the new DEAC
            
        Returns:
            DEACResponse with creation status and DEAC ID
        """
        try:
            # Generate unique ID for the DEAC
            deac_id = str(uuid.uuid4())
            
            # Create initial state
            initial_state = DEACState(
                state="initializing",
                current_task=None,
                memory_snapshot={},
                evolution_history=[],
                created_at=datetime.now(),
                last_modified=datetime.now()
            )
            
            # Create the MV-DEAC instance
            mv_deac = MVDEAC(
                id=deac_id,
                name=config.name,
                description=config.description,
                base_model=config.base_model,
                state=initial_state,
                config=config
            )
            
            # Store in active DEACs
            self.active_deacs[deac_id] = mv_deac
            
            # Persist to disk
            await self._persist_deac(mv_deac)
            
            # Initialize vector memory if memory manager is available
            if self.memory_manager:
                await self.memory_manager.initialize_memory(deac_id)
            
            logger.info(f"Created new MV-DEAC: {deac_id} ({config.name})")
            
            return DEACResponse(
                success=True,
                deac_id=deac_id,
                message=f"Successfully created MV-DEAC: {config.name}",
                state=mv_deac.state.state
            )
            
        except Exception as e:
            logger.error(f"Error creating MV-DEAC: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to create MV-DEAC: {str(e)}")
    
    async def get_deac(self, deac_id: str) -> MVDEAC:
        """
        Retrieve a DEAC by ID, either from active DEACs or from storage.
        
        Args:
            deac_id: The unique identifier of the DEAC
            
        Returns:
            The MVDEAC instance
            
        Raises:
            HTTPException: If DEAC not found
        """
        # Check active DEACs first
        if deac_id in self.active_deacs:
            return self.active_deacs[deac_id]
        
        # Try to load from disk
        deac_path = os.path.join(self.data_dir, f"{deac_id}.json")
        if os.path.exists(deac_path):
            try:
                with open(deac_path, 'r') as f:
                    deac_data = json.load(f)
                
                # Convert from dict to MVDEAC object
                state_data = deac_data.pop('state', {})
                config_data = deac_data.pop('config', {})
                
                state = DEACState(**state_data)
                config = DEACConfig(**config_data)
                
                mv_deac = MVDEAC(
                    **deac_data,
                    state=state,
                    config=config
                )
                
                # Add to active DEACs
                self.active_deacs[deac_id] = mv_deac
                return mv_deac
                
            except Exception as e:
                logger.error(f"Error loading DEAC {deac_id}: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error loading DEAC: {str(e)}")
        
        # DEAC not found
        raise HTTPException(status_code=404, detail=f"DEAC not found: {deac_id}")
    
    async def list_deacs(self) -> List[Dict[str, Any]]:
        """
        List all available DEACs with summary information.
        
        Returns:
            List of DEAC summaries
        """
        deacs = []
        
        # Add all active DEACs
        for deac_id, deac in self.active_deacs.items():
            deacs.append({
                "id": deac.id,
                "name": deac.name,
                "description": deac.description,
                "state": deac.state.state,
                "base_model": deac.base_model,
                "created_at": deac.state.created_at.isoformat(),
                "last_modified": deac.state.last_modified.isoformat()
            })
        
        # Look for persisted DEACs not in memory
        for filename in os.listdir(self.data_dir):
            if filename.endswith('.json'):
                deac_id = filename.replace('.json', '')
                
                # Skip if already in active DEACs
                if deac_id in self.active_deacs:
                    continue
                
                try:
                    with open(os.path.join(self.data_dir, filename), 'r') as f:
                        deac_data = json.load(f)
                    
                    deacs.append({
                        "id": deac_data.get("id", "unknown"),
                        "name": deac_data.get("name", "unknown"),
                        "description": deac_data.get("description", ""),
                        "state": deac_data.get("state", {}).get("state", "unknown"),
                        "base_model": deac_data.get("base_model", "unknown"),
                        "created_at": deac_data.get("state", {}).get("created_at", ""),
                        "last_modified": deac_data.get("state", {}).get("last_modified", "")
                    })
                except Exception as e:
                    logger.error(f"Error reading DEAC file {filename}: {str(e)}")
        
        return deacs
    
    async def update_deac_state(self, deac_id: str, new_state: str) -> DEACResponse:
        """
        Update the state of a DEAC.
        
        Args:
            deac_id: The unique identifier of the DEAC
            new_state: The new state to set
            
        Returns:
            DEACResponse with update status
        """
        try:
            deac = await self.get_deac(deac_id)
            deac.state.state = new_state
            deac.state.last_modified = datetime.now()
            
            # Persist the updated state
            await self._persist_deac(deac)
            
            return DEACResponse(
                success=True,
                deac_id=deac_id,
                message=f"Updated DEAC state to: {new_state}",
                state=new_state
            )
            
        except HTTPException as he:
            # Re-raise HTTP exceptions
            raise he
            
        except Exception as e:
            logger.error(f"Error updating DEAC state: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to update DEAC state: {str(e)}")
    
    async def run_evolution_step(self, deac_id: str) -> DEACResponse:
        """
        Execute a single evolution step for a DEAC.
        This is a placeholder that will be fully implemented with the evolution engine.
        
        Args:
            deac_id: The unique identifier of the DEAC
            
        Returns:
            DEACResponse with evolution status
        """
        try:
            deac = await self.get_deac(deac_id)
            
            # Check if evolution engine is available
            if not self.evolution_engine:
                return DEACResponse(
                    success=False,
                    deac_id=deac_id,
                    message="Evolution engine not available",
                    state=deac.state.state
                )
            
            # Update state to evolving
            deac.state.state = "evolving"
            
            # Placeholder for evolution step
            # This will be replaced with actual evolution logic
            evolution_step = DEACEvolutionStep(
                step_id=len(deac.state.evolution_history) + 1,
                timestamp=datetime.now(),
                description="Basic evolution step",
                changes={
                    "type": "placeholder",
                    "details": "Evolution engine not fully implemented yet"
                },
                metrics={
                    "performance_delta": 0.05,
                    "complexity_increase": 0.02
                }
            )
            
            # Add to evolution history
            deac.state.evolution_history.append(evolution_step)
            deac.state.last_modified = datetime.now()
            
            # Persist the updated state
            await self._persist_deac(deac)
            
            # Update state to ready
            deac.state.state = "ready"
            await self._persist_deac(deac)
            
            return DEACResponse(
                success=True,
                deac_id=deac_id,
                message=f"Executed evolution step #{evolution_step.step_id}",
                state=deac.state.state,
                data={
                    "evolution_step": evolution_step.dict()
                }
            )
            
        except HTTPException as he:
            # Re-raise HTTP exceptions
            raise he
            
        except Exception as e:
            logger.error(f"Error running evolution step: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to run evolution step: {str(e)}")
    
    async def _persist_deac(self, deac: MVDEAC) -> None:
        """
        Persist a DEAC to disk.
        
        Args:
            deac: The MVDEAC instance to persist
        """
        deac_path = os.path.join(self.data_dir, f"{deac.id}.json")
        
        try:
            # Convert to dict and save as JSON
            deac_dict = deac.dict()
            
            with open(deac_path, 'w') as f:
                json.dump(deac_dict, f, indent=2, default=str)
                
            logger.debug(f"Persisted DEAC {deac.id} to disk")
            
        except Exception as e:
            logger.error(f"Error persisting DEAC {deac.id}: {str(e)}")
            # Don't raise exception to avoid disrupting main flow