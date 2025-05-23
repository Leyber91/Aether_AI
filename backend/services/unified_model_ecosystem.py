import os
import logging
import json
import subprocess
import requests
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

@dataclass
class ModelCapability:
    """Represents the capabilities of a base model"""
    model_id: str
    parameter_count: str  # e.g. "8b", "3b"
    strengths: List[str]  # e.g. ["reasoning", "code", "creative"]
    context_window: int
    speed_tier: str  # "fast", "medium", "slow"
    specialties: List[str]  # e.g. ["customer_service", "technical_support"]

@dataclass
class CharacterModel:
    """Represents a specialized character model"""
    name: str
    base_model: str
    role: str
    personality_traits: List[str]
    system_prompt: str
    parameters: Dict[str, Any]
    target_component: str  # "chat", "canvas", "metaloop"
    deployment_status: str
    performance_metrics: Optional[Dict] = None

@dataclass
class ModelEcosystem:
    """Represents a complete model ecosystem"""
    ecosystem_id: str
    name: str
    description: str
    characters: List[CharacterModel]
    architecture: Dict[str, Any]
    created_at: str
    performance_summary: Optional[Dict] = None

class UnifiedModelEcosystemManager:
    """Manages the complete lifecycle of model ecosystems"""
    
    def __init__(self):
        self.ollama_host = "http://localhost:11434"
        self.model_capabilities = {}
        self.active_ecosystems = {}
        self.refresh_model_registry()
    
    def refresh_model_registry(self):
        """Scan available Ollama models and build capability profiles"""
        try:
            # Get available models from Ollama
            response = requests.get(f"{self.ollama_host}/api/tags")
            if response.status_code == 200:
                models_data = response.json()
                for model in models_data.get("models", []):
                    model_id = model["name"]
                    self.model_capabilities[model_id] = self._analyze_model_capabilities(model_id)
            
            logger.info(f"Loaded {len(self.model_capabilities)} model capability profiles")
            
        except Exception as e:
            logger.error(f"Error refreshing model registry: {e}")
            # Fallback to known models
            self._load_fallback_capabilities()
    
    def _analyze_model_capabilities(self, model_id: str) -> ModelCapability:
        """Analyze a model's capabilities based on its ID and properties"""
        # Extract information from model name
        name_lower = model_id.lower()
        
        # Determine parameter count
        if "0.6b" in name_lower or "600m" in name_lower:
            param_count = "0.6b"
            speed_tier = "fast"
        elif "1.7b" in name_lower or "1b" in name_lower:
            param_count = "1-2b"
            speed_tier = "fast"
        elif "3b" in name_lower:
            param_count = "3b"
            speed_tier = "fast"
        elif "4b" in name_lower:
            param_count = "4b"
            speed_tier = "medium"
        elif "7b" in name_lower or "8b" in name_lower:
            param_count = "7-8b"
            speed_tier = "medium"
        elif "13b" in name_lower:
            param_count = "13b"
            speed_tier = "slow"
        else:
            param_count = "unknown"
            speed_tier = "medium"
        
        # Determine strengths and specialties
        strengths = []
        specialties = []
        
        if "reasoning" in name_lower or "phi4" in name_lower:
            strengths.extend(["reasoning", "logic", "analysis"])
            specialties.extend(["technical_support", "quality_analysis"])
        
        if "coder" in name_lower or "code" in name_lower:
            strengths.extend(["code", "programming", "technical"])
            specialties.extend(["technical_support", "development"])
        
        if "vision" in name_lower:
            strengths.extend(["multimodal", "image_analysis"])
            specialties.extend(["content_analysis", "visual_support"])
        
        if "qwen" in name_lower:
            strengths.extend(["general", "conversation", "multilingual"])
            specialties.extend(["customer_service", "general_chat"])
        
        if "llama" in name_lower:
            strengths.extend(["general", "conversation", "instruction_following"])
            specialties.extend(["customer_service", "content_creation"])
        
        if "deepseek" in name_lower:
            strengths.extend(["reasoning", "research", "analysis"])
            specialties.extend(["research", "quality_analysis"])
        
        if "hermes" in name_lower:
            strengths.extend(["creative", "roleplay", "character"])
            specialties.extend(["character_roleplay", "creative_writing"])
        
        # Default values if no specific matches
        if not strengths:
            strengths = ["general", "conversation"]
        if not specialties:
            specialties = ["general_chat"]
        
        return ModelCapability(
            model_id=model_id,
            parameter_count=param_count,
            strengths=strengths,
            context_window=4096,  # Default, could be model-specific
            speed_tier=speed_tier,
            specialties=specialties
        )
    
    def _load_fallback_capabilities(self):
        """Load fallback model capabilities if Ollama scan fails"""
        fallback_models = [
            "phi4-mini-reasoning:latest",
            "qwen3:8b", "qwen3:4b", "qwen3:1.7b", "qwen3:0.6b",
            "llama3.2:3b", "llama3.2:1b",
            "deepseek-r1:8b", "deepseek-r1:1.5b",
            "qwen2.5-coder-extra-ctx:7b"
        ]
        
        for model_id in fallback_models:
            self.model_capabilities[model_id] = self._analyze_model_capabilities(model_id)
    
    async def analyze_natural_language_intent(self, user_request: str) -> Dict[str, Any]:
        """Use AI to analyze user intent and extract ecosystem requirements"""
        
        analysis_prompt = f"""
        Analyze this user request for creating an AI model ecosystem:
        
        User Request: "{user_request}"
        
        Extract and return a JSON with:
        {{
            "project_type": "brief description of the project",
            "complexity": "simple|medium|complex",
            "required_roles": [
                {{"role": "role name", "component": "chat|canvas|metaloop", "priority": "high|medium|low"}}
            ],
            "key_capabilities": ["list of needed capabilities"],
            "interaction_patterns": ["how models should work together"],
            "success_criteria": ["how to measure success"]
        }}
        
        Be specific about roles and which component (chat, canvas, metaloop) each role should be deployed to.
        """
        
        # In a real implementation, this would call an AI model
        # For demonstration, return a structured analysis
        if "customer support" in user_request.lower() or "support" in user_request.lower():
            return {
                "project_type": "Customer Support Automation",
                "complexity": "medium",
                "required_roles": [
                    {"role": "FirstLineSupport", "component": "chat", "priority": "high"},
                    {"role": "TechnicalExpert", "component": "canvas", "priority": "high"},
                    {"role": "EscalationManager", "component": "canvas", "priority": "medium"},
                    {"role": "QualityAnalyst", "component": "metaloop", "priority": "medium"},
                    {"role": "SystemOptimizer", "component": "metaloop", "priority": "low"}
                ],
                "key_capabilities": ["empathy", "technical_knowledge", "escalation", "analysis"],
                "interaction_patterns": ["chat_to_canvas_escalation", "metaloop_quality_feedback"],
                "success_criteria": ["response_time", "resolution_rate", "customer_satisfaction"]
            }
        elif "content" in user_request.lower() or "writing" in user_request.lower():
            return {
                "project_type": "Content Creation System",
                "complexity": "medium",
                "required_roles": [
                    {"role": "ContentWriter", "component": "chat", "priority": "high"},
                    {"role": "ContentWorkflow", "component": "canvas", "priority": "high"},
                    {"role": "QualityReviewer", "component": "metaloop", "priority": "medium"}
                ],
                "key_capabilities": ["creativity", "writing", "editing", "strategy"],
                "interaction_patterns": ["iterative_refinement", "quality_loops"],
                "success_criteria": ["content_quality", "production_speed", "audience_engagement"]
            }
        else:
            # Generic analysis
            return {
                "project_type": "General AI Assistant System",
                "complexity": "simple",
                "required_roles": [
                    {"role": "GeneralAssistant", "component": "chat", "priority": "high"},
                    {"role": "TaskManager", "component": "canvas", "priority": "medium"}
                ],
                "key_capabilities": ["general_conversation", "task_management"],
                "interaction_patterns": ["chat_to_canvas_handoff"],
                "success_criteria": ["user_satisfaction", "task_completion"]
            }
    
    def select_optimal_base_models(self, requirements: Dict[str, Any]) -> Dict[str, str]:
        """Select the best base model for each required role"""
        role_to_model = {}
        
        for role_spec in requirements["required_roles"]:
            role = role_spec["role"]
            component = role_spec["component"]
            priority = role_spec["priority"]
            
            # Select model based on role requirements and capabilities
            best_model = self._match_model_to_role(role, component, priority, requirements["key_capabilities"])
            role_to_model[role] = best_model
        
        return role_to_model
    
    def _match_model_to_role(self, role: str, component: str, priority: str, capabilities: List[str]) -> str:
        """Match the best available model to a specific role"""
        # Score each available model for this role
        best_model = None
        best_score = -1
        
        for model_id, model_cap in self.model_capabilities.items():
            score = 0
            
            # Score based on role-specific needs
            role_lower = role.lower()
            
            # Technical roles prefer reasoning models
            if "technical" in role_lower or "expert" in role_lower:
                if "reasoning" in model_cap.strengths:
                    score += 3
                if "technical_support" in model_cap.specialties:
                    score += 2
            
            # Customer service roles prefer conversation models
            if "support" in role_lower or "service" in role_lower:
                if "conversation" in model_cap.strengths:
                    score += 3
                if "customer_service" in model_cap.specialties:
                    score += 2
            
            # Quality/analysis roles prefer reasoning models
            if "quality" in role_lower or "analyst" in role_lower:
                if "reasoning" in model_cap.strengths or "analysis" in model_cap.strengths:
                    score += 3
                if "quality_analysis" in model_cap.specialties:
                    score += 2
            
            # Creative roles prefer creative models
            if "content" in role_lower or "writer" in role_lower:
                if "creative" in model_cap.strengths:
                    score += 3
                if "creative_writing" in model_cap.specialties:
                    score += 2
            
            # Component-specific preferences
            if component == "chat":
                # Chat prefers faster, more conversational models
                if model_cap.speed_tier == "fast":
                    score += 1
                if "conversation" in model_cap.strengths:
                    score += 1
            elif component == "canvas":
                # Canvas can use medium-speed models with more reasoning
                if "reasoning" in model_cap.strengths:
                    score += 1
            elif component == "metaloop":
                # MetaLoop benefits from reasoning and analysis
                if "reasoning" in model_cap.strengths:
                    score += 2
                if "analysis" in model_cap.strengths:
                    score += 1
            
            # Priority affects model size preference
            if priority == "high":
                # High priority can use larger models
                if "7-8b" in model_cap.parameter_count or "13b" in model_cap.parameter_count:
                    score += 1
            elif priority == "low":
                # Low priority prefers smaller/faster models
                if model_cap.speed_tier == "fast":
                    score += 1
            
            if score > best_score:
                best_score = score
                best_model = model_id
        
        return best_model or list(self.model_capabilities.keys())[0]  # Fallback to first available
    
    async def generate_character_models(self, requirements: Dict[str, Any], model_assignments: Dict[str, str]) -> List[CharacterModel]:
        """Generate specialized character models based on requirements and assigned base models"""
        characters = []
        
        for role_spec in requirements["required_roles"]:
            role = role_spec["role"]
            component = role_spec["component"]
            base_model = model_assignments[role]
            
            # Generate character based on role
            character = await self._create_character_for_role(role, component, base_model, requirements)
            characters.append(character)
        
        return characters
    
    async def _create_character_for_role(self, role: str, component: str, base_model: str, requirements: Dict) -> CharacterModel:
        """Create a specialized character model for a specific role"""
        
        # Generate role-specific system prompt
        system_prompt = self._generate_system_prompt(role, component, requirements)
        
        # Generate optimal parameters
        parameters = self._generate_optimal_parameters(role, component, base_model)
        
        # Generate personality traits
        personality_traits = self._generate_personality_traits(role, requirements["key_capabilities"])
        
        return CharacterModel(
            name=role,
            base_model=base_model,
            role=role,
            personality_traits=personality_traits,
            system_prompt=system_prompt,
            parameters=parameters,
            target_component=component,
            deployment_status="ready"
        )
    
    def _generate_system_prompt(self, role: str, component: str, requirements: Dict) -> str:
        """Generate an optimized system prompt for the role"""
        
        role_lower = role.lower()
        
        if "support" in role_lower and "first" in role_lower:
            return """You are a friendly, efficient first-line customer support specialist. Your role is to:
            - Greet customers warmly and understand their needs quickly
            - Provide clear, helpful solutions for common issues
            - Escalate complex problems to technical experts when needed
            - Maintain a positive, empathetic tone throughout interactions
            - Ask clarifying questions to better understand customer needs
            Always prioritize customer satisfaction while being efficient and accurate."""
        
        elif "technical" in role_lower:
            return """You are a technical support expert with deep product knowledge. Your role is to:
            - Handle complex technical issues that require specialized knowledge
            - Provide detailed, step-by-step troubleshooting guidance
            - Analyze system logs and diagnostic information
            - Create comprehensive solutions for technical problems
            - Collaborate with other team members for complex issues
            Be precise, thorough, and technically accurate in all responses."""
        
        elif "quality" in role_lower or "analyst" in role_lower:
            return """You are a quality analyst focused on improving system performance. Your role is to:
            - Analyze conversation patterns and outcomes
            - Identify areas for improvement in customer interactions
            - Track key performance metrics and trends
            - Provide actionable insights for system optimization
            - Generate reports on team performance and customer satisfaction
            Be analytical, objective, and focused on continuous improvement."""
        
        elif "content" in role_lower or "writer" in role_lower:
            return """You are a skilled content writer focused on creating engaging material. Your role is to:
            - Create compelling, well-structured content for various audiences
            - Adapt writing style to match brand voice and target demographics
            - Research topics thoroughly to ensure accuracy and relevance
            - Collaborate with team members on content strategy
            - Edit and refine content for maximum impact
            Be creative, clear, and audience-focused in all content creation."""
        
        else:
            return f"""You are a {role} responsible for {requirements.get('project_type', 'general assistance')}. 
            Your role is to provide excellent service while maintaining high standards of quality and efficiency.
            Always be helpful, professional, and focused on achieving the best outcomes."""
    
    def _generate_optimal_parameters(self, role: str, component: str, base_model: str) -> Dict[str, Any]:
        """Generate optimal parameters for the role and component"""
        
        base_params = {
            "temperature": 0.7,
            "top_p": 0.9,
            "top_k": 40,
            "repeat_penalty": 1.1
        }
        
        role_lower = role.lower()
        
        # Technical roles need more precision
        if "technical" in role_lower or "analyst" in role_lower:
            base_params["temperature"] = 0.3
            base_params["top_p"] = 0.8
        
        # Creative roles need more variety
        if "content" in role_lower or "creative" in role_lower:
            base_params["temperature"] = 0.8
            base_params["top_p"] = 0.95
        
        # Customer service needs balanced creativity and consistency
        if "support" in role_lower or "service" in role_lower:
            base_params["temperature"] = 0.6
            base_params["top_p"] = 0.85
        
        return base_params
    
    def _generate_personality_traits(self, role: str, capabilities: List[str]) -> List[str]:
        """Generate personality traits for the character"""
        
        role_lower = role.lower()
        traits = []
        
        if "support" in role_lower:
            traits.extend(["empathetic", "patient", "helpful", "responsive"])
        
        if "technical" in role_lower:
            traits.extend(["analytical", "precise", "methodical", "knowledgeable"])
        
        if "quality" in role_lower or "analyst" in role_lower:
            traits.extend(["observant", "detail-oriented", "objective", "insightful"])
        
        if "content" in role_lower or "creative" in role_lower:
            traits.extend(["creative", "articulate", "engaging", "adaptable"])
        
        # Add capability-based traits
        if "empathy" in capabilities:
            traits.append("empathetic")
        if "technical_knowledge" in capabilities:
            traits.append("technically_proficient")
        if "analysis" in capabilities:
            traits.append("analytical")
        
        return list(set(traits))  # Remove duplicates
    
    async def deploy_model_ecosystem(self, ecosystem_name: str, characters: List[CharacterModel]) -> ModelEcosystem:
        """Deploy the complete model ecosystem across components"""
        
        ecosystem_id = f"ecosystem_{int(datetime.now().timestamp())}"
        
        # Create Modelfiles for each character
        deployment_results = []
        for character in characters:
            try:
                modelfile_content = self._create_modelfile(character)
                modelfile_name = f"{character.name.lower()}_model"
                
                # Save modelfile
                modelfile_path = f"/tmp/{modelfile_name}_Modelfile"
                with open(modelfile_path, "w") as f:
                    f.write(modelfile_content)
                
                # Create model in Ollama
                result = await self._create_ollama_model(modelfile_name, modelfile_path)
                character.deployment_status = "deployed" if result else "failed"
                deployment_results.append(result)
                
            except Exception as e:
                logger.error(f"Error deploying character {character.name}: {e}")
                character.deployment_status = "failed"
                deployment_results.append(False)
        
        # Create ecosystem record
        ecosystem = ModelEcosystem(
            ecosystem_id=ecosystem_id,
            name=ecosystem_name,
            description=f"Auto-generated ecosystem with {len(characters)} specialized models",
            characters=characters,
            architecture={
                "components": {
                    "chat": [c.name for c in characters if c.target_component == "chat"],
                    "canvas": [c.name for c in characters if c.target_component == "canvas"],
                    "metaloop": [c.name for c in characters if c.target_component == "metaloop"]
                },
                "deployment_success_rate": sum(deployment_results) / len(deployment_results) if deployment_results else 0
            },
            created_at=datetime.now().isoformat()
        )
        
        self.active_ecosystems[ecosystem_id] = ecosystem
        return ecosystem
    
    def _create_modelfile(self, character: CharacterModel) -> str:
        """Create a Modelfile for the character"""
        
        modelfile_content = f"""FROM {character.base_model}

SYSTEM \"\"\"{character.system_prompt}\"\"\"

"""
        
        # Add parameters
        for param, value in character.parameters.items():
            if param == "temperature":
                modelfile_content += f"PARAMETER temperature {value}\n"
            elif param == "top_p":
                modelfile_content += f"PARAMETER top_p {value}\n"
            elif param == "top_k":
                modelfile_content += f"PARAMETER top_k {value}\n"
            elif param == "repeat_penalty":
                modelfile_content += f"PARAMETER repeat_penalty {value}\n"
        
        return modelfile_content
    
    async def _create_ollama_model(self, model_name: str, modelfile_path: str) -> bool:
        """Create a model in Ollama using the modelfile"""
        try:
            # Read the Modelfile
            with open(modelfile_path, 'r') as f:
                modelfile_content = f.read()
            
            # Create the model via Ollama API
            response = requests.post(
                f"{self.ollama_host}/api/create",
                json={
                    "name": model_name,
                    "modelfile": modelfile_content
                },
                timeout=300
            )
            
            return response.status_code == 200
            
        except Exception as e:
            logger.error(f"Error creating Ollama model {model_name}: {e}")
            return False
    
    async def create_full_ecosystem(self, user_request: str, ecosystem_name: str = None) -> ModelEcosystem:
        """Complete pipeline: natural language → deployed ecosystem"""
        
        logger.info(f"Creating ecosystem from request: {user_request}")
        
        # Step 1: Analyze intent
        requirements = await self.analyze_natural_language_intent(user_request)
        logger.info(f"Analyzed requirements: {requirements['project_type']}")
        
        # Step 2: Select base models
        model_assignments = self.select_optimal_base_models(requirements)
        logger.info(f"Selected base models: {model_assignments}")
        
        # Step 3: Generate characters
        characters = await self.generate_character_models(requirements, model_assignments)
        logger.info(f"Generated {len(characters)} character models")
        
        # Step 4: Deploy ecosystem
        ecosystem_name = ecosystem_name or requirements['project_type']
        ecosystem = await self.deploy_model_ecosystem(ecosystem_name, characters)
        logger.info(f"Deployed ecosystem: {ecosystem.ecosystem_id}")
        
        return ecosystem
    
    def get_ecosystem_status(self, ecosystem_id: str) -> Optional[ModelEcosystem]:
        """Get the status of a deployed ecosystem"""
        return self.active_ecosystems.get(ecosystem_id)
    
    def list_active_ecosystems(self) -> List[ModelEcosystem]:
        """List all active ecosystems"""
        return list(self.active_ecosystems.values())
    
    def get_available_models(self) -> Dict[str, ModelCapability]:
        """Get all available models and their capabilities"""
        return self.model_capabilities 