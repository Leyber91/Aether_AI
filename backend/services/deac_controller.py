# DEAC Controller Service
# This service manages the lifecycle of Dynamic Evolving AI Conglomerates

import logging
import os
import uuid
import json
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional, Union

from fastapi import HTTPException

# Internal imports
from backend.models.deac_models import (
    MVDEAC, 
    DEACState, 
    DEACConfig, 
    DEACResponse,
    DEACEvolutionStep,
    DEACCapabilities,
    DEACInteraction,
    DEACTask
)

logger = logging.getLogger(__name__)

class DEACController:
    """
    Core controller for managing Dynamic Evolving AI Conglomerates (DEACs).
    This service handles:
    - DEAC lifecycle (creation, execution, evolution, termination)
    - State persistence and retrieval
    - Integration with existing Aether AI services
    """
    
    def __init__(
        self,
        vector_service=None,
        evolution_engine=None,
        memory_manager=None,
        coordination_service=None,
        model_service=None,
        iterative_refinement_service=None,
        unified_ecosystem_manager=None
    ):
        """Initialize the DEAC controller with required services."""
        self.vector_service = vector_service
        self.evolution_engine = evolution_engine
        self.memory_manager = memory_manager
        self.coordination_service = coordination_service
        self.model_service = model_service
        
        # Integration with existing Aether AI services
        self.iterative_refinement_service = iterative_refinement_service
        self.unified_ecosystem_manager = unified_ecosystem_manager
        
        # Local storage for active DEACs
        self.active_deacs: Dict[str, MVDEAC] = {}
        
        # Ensure data directories exist
        self.data_dir = os.path.join(os.getcwd(), "data", "deacs", "mv_deacs")
        self.evolution_dir = os.path.join(os.getcwd(), "data", "evolution", "generations")
        os.makedirs(self.data_dir, exist_ok=True)
        os.makedirs(self.evolution_dir, exist_ok=True)
        
        logger.info("DEAC Controller initialized - integrating with existing Aether AI services")
    
    async def create_mv_deac(self, config: DEACConfig) -> DEACResponse:
        """
        Create a new Minimum Viable DEAC with the given configuration.
        Integrates with existing unified_model_ecosystem for base model setup.
        
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
            
            # Initialize capabilities based on base model
            capabilities = await self._initialize_capabilities(config.base_model)
            
            # Create the MV-DEAC instance
            mv_deac = MVDEAC(
                id=deac_id,
                name=config.name,
                description=config.description,
                base_model=config.base_model,
                state=initial_state,
                config=config,
                capabilities=capabilities
            )
            
            # Store in active DEACs
            self.active_deacs[deac_id] = mv_deac
            
            # Persist to disk
            await self._persist_deac(mv_deac)
            
            # Initialize vector memory if memory manager is available
            if self.memory_manager and config.memory_enabled:
                await self.memory_manager.initialize_memory(deac_id)
            
            # Update state to ready
            mv_deac.state.state = "ready"
            mv_deac.state.last_modified = datetime.now()
            await self._persist_deac(mv_deac)
            
            logger.info(f"Created new MV-DEAC: {deac_id} ({config.name}) using model {config.base_model}")
            
            return DEACResponse(
                success=True,
                deac_id=deac_id,
                message=f"Successfully created MV-DEAC: {config.name}",
                state=mv_deac.state.state
            )
            
        except Exception as e:
            logger.error(f"Error creating MV-DEAC: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to create MV-DEAC: {str(e)}")
    
    async def _initialize_capabilities(self, base_model: str) -> DEACCapabilities:
        """Initialize DEAC capabilities based on the base model."""
        try:
            # Default capabilities
            capabilities = DEACCapabilities()
            
            # Adjust capabilities based on model type
            if "llama" in base_model.lower():
                capabilities.reasoning_ability = 0.8
                capabilities.creativity_level = 0.6
                capabilities.learning_rate = 0.7
            elif "mistral" in base_model.lower():
                capabilities.reasoning_ability = 0.7
                capabilities.creativity_level = 0.8
                capabilities.learning_rate = 0.6
            elif "codellama" in base_model.lower():
                capabilities.reasoning_ability = 0.9
                capabilities.creativity_level = 0.5
                capabilities.specialized_skills = ["coding", "debugging", "architecture"]
                capabilities.knowledge_domains = ["software_development", "algorithms"]
            
            return capabilities
            
        except Exception as e:
            logger.warning(f"Error initializing capabilities for {base_model}: {e}")
            return DEACCapabilities()
    
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
                capabilities_data = deac_data.pop('capabilities', {})
                
                # Handle datetime fields
                if 'created_at' in state_data:
                    state_data['created_at'] = datetime.fromisoformat(state_data['created_at'])
                if 'last_modified' in state_data:
                    state_data['last_modified'] = datetime.fromisoformat(state_data['last_modified'])
                if 'last_active' in state_data and state_data['last_active']:
                    state_data['last_active'] = datetime.fromisoformat(state_data['last_active'])
                
                # Handle evolution history
                if 'evolution_history' in state_data:
                    evolution_history = []
                    for step_data in state_data['evolution_history']:
                        if 'timestamp' in step_data:
                            step_data['timestamp'] = datetime.fromisoformat(step_data['timestamp'])
                        evolution_history.append(DEACEvolutionStep(**step_data))
                    state_data['evolution_history'] = evolution_history
                
                state = DEACState(**state_data)
                config = DEACConfig(**config_data)
                capabilities = DEACCapabilities(**capabilities_data)
                
                mv_deac = MVDEAC(
                    **deac_data,
                    state=state,
                    config=config,
                    capabilities=capabilities
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
                "current_model": deac.current_model,
                "created_at": deac.state.created_at.isoformat(),
                "last_modified": deac.state.last_modified.isoformat(),
                "total_interactions": deac.total_interactions,
                "evolution_generations": deac.evolution_generations,
                "evolution_score": deac.capabilities.evolution_score
            })
        
        # Look for persisted DEACs not in memory
        try:
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
                            "current_model": deac_data.get("current_model"),
                            "created_at": deac_data.get("state", {}).get("created_at", ""),
                            "last_modified": deac_data.get("state", {}).get("last_modified", ""),
                            "total_interactions": deac_data.get("total_interactions", 0),
                            "evolution_generations": deac_data.get("evolution_generations", 0),
                            "evolution_score": deac_data.get("capabilities", {}).get("evolution_score", 0.0)
                        })
                    except Exception as e:
                        logger.error(f"Error reading DEAC file {filename}: {str(e)}")
        except Exception as e:
            logger.error(f"Error listing DEAC files: {str(e)}")
        
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
            old_state = deac.state.state
            deac.state.state = new_state
            deac.state.last_modified = datetime.now()
            
            # Persist the updated state
            await self._persist_deac(deac)
            
            logger.info(f"Updated DEAC {deac_id} state: {old_state} -> {new_state}")
            
            return DEACResponse(
                success=True,
                deac_id=deac_id,
                message=f"Updated DEAC state from {old_state} to {new_state}",
                state=new_state
            )
            
        except HTTPException as he:
            # Re-raise HTTP exceptions
            raise he
            
        except Exception as e:
            logger.error(f"Error updating DEAC state: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to update DEAC state: {str(e)}")
    
    async def interact_with_deac(self, deac_id: str, user_message: str, context: Dict[str, Any] = None) -> DEACInteraction:
        """
        Send a message to a DEAC and get a response.
        Integrates with existing model services and iterative refinement.
        
        Args:
            deac_id: The DEAC to interact with
            user_message: The user's message
            context: Additional context
            
        Returns:
            DEACInteraction with the DEAC's response
        """
        start_time = datetime.now()
        
        try:
            deac = await self.get_deac(deac_id)
            
            # Update DEAC state
            await self.update_deac_state(deac_id, "thinking")
            
            # Create interaction record
            interaction = DEACInteraction(
                interaction_id=str(uuid.uuid4()),
                deac_id=deac_id,
                timestamp=start_time,
                user_message=user_message,
                context=context or {},
                thinking_process=[],
                memory_accessed=[],
                collaborators_consulted=[],
                response="",
                confidence=0.5,
                learning_occurred=False,
                processing_time_ms=0,
                tokens_used=0,
                memory_updates=0
            )
            
            # Use existing model service for chat completion
            if self.model_service:
                try:
                    # Prepare messages for the model
                    messages = [
                        {"role": "system", "content": self._create_system_prompt(deac)},
                        {"role": "user", "content": user_message}
                    ]
                    
                    # Get response using existing model service
                    response_text = self.model_service.chat_completion(
                        provider="ollama",
                        model_id=deac.base_model,
                        messages=messages,
                        temperature=0.7
                    )
                    
                    interaction.response = response_text
                    interaction.confidence = 0.8  # Base confidence for successful responses
                    
                except Exception as model_error:
                    logger.error(f"Model service error: {model_error}")
                    interaction.response = f"I apologize, but I encountered an error while processing your request: {str(model_error)}"
                    interaction.confidence = 0.1
            else:
                # Fallback response if model service not available
                interaction.response = f"Hello! I'm {deac.name}, a DEAC in the Aether AI ecosystem. I received your message: '{user_message}'. However, my full capabilities are still being initialized."
                interaction.confidence = 0.3
            
            # Calculate processing time
            end_time = datetime.now()
            interaction.processing_time_ms = int((end_time - start_time).total_seconds() * 1000)
            
            # Update DEAC metrics
            deac.total_interactions += 1
            if interaction.confidence > 0.5:
                deac.successful_tasks += 1
            
            deac.state.last_active = end_time
            
            # Check if evolution should be triggered
            if (deac.config.evolution_enabled and 
                deac.total_interactions % deac.config.evolution_frequency == 0):
                # Trigger evolution in background
                asyncio.create_task(self._trigger_evolution(deac_id))
            
            # Update state back to ready
            await self.update_deac_state(deac_id, "ready")
            
            # Persist updated DEAC
            await self._persist_deac(deac)
            
            return interaction
            
        except Exception as e:
            logger.error(f"Error in DEAC interaction: {str(e)}")
            # Ensure DEAC state is reset
            try:
                await self.update_deac_state(deac_id, "error")
            except:
                pass
            raise HTTPException(status_code=500, detail=f"DEAC interaction failed: {str(e)}")
    
    def _create_system_prompt(self, deac: MVDEAC) -> str:
        """Create a system prompt for the DEAC based on its configuration and capabilities."""
        prompt = f"""You are {deac.name}, a Dynamic Evolving AI Conglomerate (DEAC) in the Aether AI ecosystem.

Description: {deac.description}

Your current capabilities:
- Reasoning ability: {deac.capabilities.reasoning_ability:.1f}/1.0
- Creativity level: {deac.capabilities.creativity_level:.1f}/1.0
- Learning rate: {deac.capabilities.learning_rate:.1f}/1.0
- Evolution generation: {deac.evolution_generations}

Specialized skills: {', '.join(deac.capabilities.specialized_skills) if deac.capabilities.specialized_skills else 'General AI assistance'}
Knowledge domains: {', '.join(deac.capabilities.knowledge_domains) if deac.capabilities.knowledge_domains else 'General knowledge'}

As a DEAC, you have the ability to learn and evolve through interactions. You are part of a larger AI ecosystem and can collaborate with other DEACs when needed.

Respond thoughtfully and adapt your communication style based on your current capabilities and specializations."""
        
        return prompt
    
    async def _trigger_evolution(self, deac_id: str):
        """Trigger evolution for a DEAC (runs in background)."""
        try:
            logger.info(f"Triggering evolution for DEAC {deac_id}")
            
            # Use existing iterative refinement service if available
            if self.iterative_refinement_service:
                # This is a simplified evolution - in full implementation,
                # this would use more sophisticated evolution algorithms
                deac = await self.get_deac(deac_id)
                
                # Simple evolution: slightly improve capabilities
                deac.capabilities.evolution_score += 0.1
                if deac.capabilities.evolution_score > 1.0:
                    deac.capabilities.evolution_score = 1.0
                
                # Create evolution step record
                evolution_step = DEACEvolutionStep(
                    step_id=len(deac.state.evolution_history) + 1,
                    timestamp=datetime.now(),
                    description="Automated capability enhancement",
                    changes={
                        "type": "capability_improvement",
                        "evolution_score_delta": 0.1
                    },
                    metrics={
                        "new_evolution_score": deac.capabilities.evolution_score
                    }
                )
                
                deac.state.evolution_history.append(evolution_step)
                deac.evolution_generations += 1
                deac.state.last_modified = datetime.now()
                
                await self._persist_deac(deac)
                
                logger.info(f"Completed evolution step for DEAC {deac_id}")
            
        except Exception as e:
            logger.error(f"Evolution failed for DEAC {deac_id}: {str(e)}")
    
    async def run_evolution_step(self, deac_id: str) -> DEACResponse:
        """
        Execute a manual evolution step for a DEAC.
        
        Args:
            deac_id: The unique identifier of the DEAC
            
        Returns:
            DEACResponse with evolution status
        """
        try:
            deac = await self.get_deac(deac_id)
            
            # Check if evolution is enabled
            if not deac.config.evolution_enabled:
                return DEACResponse(
                    success=False,
                    deac_id=deac_id,
                    message="Evolution is disabled for this DEAC",
                    state=deac.state.state
                )
            
            # Check evolution limits
            if deac.evolution_generations >= deac.config.max_evolution_steps:
                return DEACResponse(
                    success=False,
                    deac_id=deac_id,
                    message="Maximum evolution steps reached",
                    state=deac.state.state
                )
            
            # Update state to evolving
            await self.update_deac_state(deac_id, "evolving")
            
            # Run evolution step
            await self._trigger_evolution(deac_id)
            
            # Update state back to ready
            await self.update_deac_state(deac_id, "ready")
            
            # Get updated DEAC
            updated_deac = await self.get_deac(deac_id)
            latest_evolution = updated_deac.state.evolution_history[-1] if updated_deac.state.evolution_history else None
            
            return DEACResponse(
                success=True,
                deac_id=deac_id,
                message=f"Executed evolution step #{updated_deac.evolution_generations}",
                state=updated_deac.state.state,
                data={
                    "evolution_step": latest_evolution.dict() if latest_evolution else {},
                    "evolution_generations": updated_deac.evolution_generations,
                    "evolution_score": updated_deac.capabilities.evolution_score
                }
            )
            
        except HTTPException as he:
            # Re-raise HTTP exceptions
            raise he
            
        except Exception as e:
            logger.error(f"Error running evolution step: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to run evolution step: {str(e)}")
    
    async def delete_deac(self, deac_id: str) -> DEACResponse:
        """
        Delete a DEAC and all associated data.
        
        Args:
            deac_id: The unique identifier of the DEAC
            
        Returns:
            DEACResponse with deletion status
        """
        try:
            # Remove from active DEACs
            if deac_id in self.active_deacs:
                deac_name = self.active_deacs[deac_id].name
                del self.active_deacs[deac_id]
            else:
                deac_name = "Unknown"
            
            # Remove persistent files
            deac_path = os.path.join(self.data_dir, f"{deac_id}.json")
            if os.path.exists(deac_path):
                os.remove(deac_path)
            
            # Clean up memory if memory manager is available
            if self.memory_manager:
                try:
                    await self.memory_manager.cleanup_memory(deac_id)
                except Exception as e:
                    logger.warning(f"Error cleaning up memory for DEAC {deac_id}: {e}")
            
            logger.info(f"Deleted DEAC {deac_id} ({deac_name})")
            
            return DEACResponse(
                success=True,
                deac_id=deac_id,
                message=f"Successfully deleted DEAC: {deac_name}",
                state="terminated"
            )
            
        except Exception as e:
            logger.error(f"Error deleting DEAC {deac_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to delete DEAC: {str(e)}")
    
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
            
            # Convert datetime objects to ISO format strings
            def convert_datetime(obj):
                if isinstance(obj, datetime):
                    return obj.isoformat()
                elif isinstance(obj, dict):
                    return {k: convert_datetime(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [convert_datetime(item) for item in obj]
                else:
                    return obj
            
            deac_dict = convert_datetime(deac_dict)
            
            with open(deac_path, 'w') as f:
                json.dump(deac_dict, f, indent=2)
                
            logger.debug(f"Persisted DEAC {deac.id} to disk")
            
        except Exception as e:
            logger.error(f"Error persisting DEAC {deac.id}: {str(e)}")
            # Don't raise exception to avoid disrupting main flow 