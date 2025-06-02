# DEAC Data Models
# Pydantic models for Dynamic Evolving AI Conglomerates

from datetime import datetime
from typing import Dict, List, Any, Optional, Union
from enum import Enum

from pydantic import BaseModel, Field

class DEACStateEnum(str, Enum):
    """Possible states for a DEAC during its lifecycle."""
    INITIALIZING = "initializing"
    READY = "ready"
    THINKING = "thinking"
    EVOLVING = "evolving"
    LEARNING = "learning"
    COLLABORATING = "collaborating"
    ERROR = "error"
    PAUSED = "paused"
    TERMINATED = "terminated"

class DEACEvolutionStep(BaseModel):
    """Represents a single step in DEAC evolution."""
    step_id: int = Field(..., description="Sequential step identifier")
    timestamp: datetime = Field(..., description="When this evolution step occurred")
    description: str = Field(..., description="Human-readable description of changes")
    changes: Dict[str, Any] = Field(..., description="Detailed changes made during evolution")
    metrics: Dict[str, float] = Field(default_factory=dict, description="Performance metrics after evolution")
    success: bool = Field(default=True, description="Whether evolution step was successful")

class DEACMemorySnapshot(BaseModel):
    """Snapshot of DEAC memory at a specific point in time."""
    timestamp: datetime = Field(..., description="When this snapshot was taken")
    vector_count: int = Field(default=0, description="Number of vectors in memory")
    memory_usage_mb: float = Field(default=0.0, description="Memory usage in megabytes")
    concepts: List[str] = Field(default_factory=list, description="Key concepts stored")
    associations: Dict[str, List[str]] = Field(default_factory=dict, description="Concept associations")

class DEACState(BaseModel):
    """Current state and status of a DEAC."""
    state: str = Field(..., description="Current DEAC state")
    current_task: Optional[str] = Field(None, description="Current task being executed")
    memory_snapshot: Dict[str, Any] = Field(default_factory=dict, description="Current memory state")
    evolution_history: List[DEACEvolutionStep] = Field(default_factory=list, description="Evolution history")
    created_at: datetime = Field(..., description="When the DEAC was created")
    last_modified: datetime = Field(..., description="Last modification timestamp")
    last_active: Optional[datetime] = Field(None, description="Last time DEAC was active")
    error_message: Optional[str] = Field(None, description="Error message if in error state")

class DEACConfig(BaseModel):
    """Configuration parameters for a DEAC."""
    name: str = Field(..., description="Human-readable name for the DEAC")
    description: str = Field(..., description="Description of DEAC's purpose")
    base_model: str = Field(..., description="Base AI model to use (e.g., 'llama3:8b')")
    
    # Evolution settings
    evolution_enabled: bool = Field(default=True, description="Whether evolution is enabled")
    evolution_frequency: int = Field(default=100, description="Evolution frequency in interactions")
    max_evolution_steps: int = Field(default=50, description="Maximum evolution steps allowed")
    
    # Memory settings
    memory_enabled: bool = Field(default=True, description="Whether memory is enabled")
    max_memory_size: int = Field(default=10000, description="Maximum memory vectors")
    memory_consolidation_threshold: float = Field(default=0.8, description="When to consolidate memory")
    
    # Collaboration settings
    collaboration_enabled: bool = Field(default=False, description="Whether this DEAC can collaborate")
    max_collaborators: int = Field(default=5, description="Maximum number of collaborators")
    
    # Performance settings
    response_timeout: int = Field(default=30, description="Response timeout in seconds")
    max_concurrent_tasks: int = Field(default=3, description="Maximum concurrent tasks")
    
    # Specialization settings
    specialization_domains: List[str] = Field(default_factory=list, description="Domains for specialization")
    specialization_threshold: float = Field(default=0.7, description="Threshold for triggering specialization")

class DEACCapabilities(BaseModel):
    """Capabilities and characteristics of a DEAC."""
    reasoning_ability: float = Field(default=0.5, description="Reasoning capability (0-1)")
    creativity_level: float = Field(default=0.5, description="Creativity level (0-1)")
    learning_rate: float = Field(default=0.5, description="Learning adaptation rate (0-1)")
    collaboration_affinity: float = Field(default=0.5, description="Collaboration preference (0-1)")
    
    specialized_skills: List[str] = Field(default_factory=list, description="Specialized skills")
    knowledge_domains: List[str] = Field(default_factory=list, description="Knowledge domains")
    
    performance_metrics: Dict[str, float] = Field(default_factory=dict, description="Performance metrics")
    evolution_score: float = Field(default=0.0, description="Overall evolution progress")

class MVDEAC(BaseModel):
    """
    Minimum Viable Dynamic Evolving AI Conglomerate.
    This is the core DEAC entity that can think, learn, and evolve.
    """
    # Core identification
    id: str = Field(..., description="Unique identifier for this DEAC")
    name: str = Field(..., description="Human-readable name")
    description: str = Field(..., description="Description of purpose and capabilities")
    
    # AI model configuration
    base_model: str = Field(..., description="Base AI model being used")
    current_model: Optional[str] = Field(None, description="Current model if evolved from base")
    
    # State and lifecycle
    state: DEACState = Field(..., description="Current state and status")
    config: DEACConfig = Field(..., description="Configuration parameters")
    capabilities: DEACCapabilities = Field(default_factory=DEACCapabilities, description="Current capabilities")
    
    # Relationships
    parent_deac_id: Optional[str] = Field(None, description="Parent DEAC if this is evolved/spawned")
    child_deac_ids: List[str] = Field(default_factory=list, description="Child DEACs spawned from this one")
    collaborator_ids: List[str] = Field(default_factory=list, description="Current collaborators")
    
    # Metrics and analytics
    total_interactions: int = Field(default=0, description="Total number of interactions")
    successful_tasks: int = Field(default=0, description="Number of successful tasks")
    evolution_generations: int = Field(default=0, description="Number of evolution steps taken")
    
    class Config:
        """Pydantic configuration."""
        use_enum_values = True
        arbitrary_types_allowed = True

class DEACResponse(BaseModel):
    """Standard response format for DEAC operations."""
    success: bool = Field(..., description="Whether the operation was successful")
    deac_id: str = Field(..., description="DEAC identifier")
    message: str = Field(..., description="Human-readable status message")
    state: str = Field(..., description="Current DEAC state")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional response data")
    error: Optional[str] = Field(None, description="Error message if operation failed")

class DEACInteraction(BaseModel):
    """Represents an interaction with a DEAC."""
    interaction_id: str = Field(..., description="Unique interaction identifier")
    deac_id: str = Field(..., description="DEAC that handled the interaction")
    timestamp: datetime = Field(..., description="When the interaction occurred")
    
    # Input
    user_message: str = Field(..., description="User's input message")
    context: Dict[str, Any] = Field(default_factory=dict, description="Additional context")
    
    # Processing
    thinking_process: List[str] = Field(default_factory=list, description="DEAC's thinking steps")
    memory_accessed: List[str] = Field(default_factory=list, description="Memory items accessed")
    collaborators_consulted: List[str] = Field(default_factory=list, description="Other DEACs consulted")
    
    # Output
    response: str = Field(..., description="DEAC's response")
    confidence: float = Field(default=0.5, description="Confidence in response (0-1)")
    learning_occurred: bool = Field(default=False, description="Whether learning occurred")
    
    # Metrics
    processing_time_ms: int = Field(..., description="Processing time in milliseconds")
    tokens_used: int = Field(default=0, description="Tokens consumed")
    memory_updates: int = Field(default=0, description="Number of memory updates")

class DEACTask(BaseModel):
    """Represents a task that can be executed by a DEAC."""
    task_id: str = Field(..., description="Unique task identifier")
    deac_id: str = Field(..., description="DEAC assigned to this task")
    title: str = Field(..., description="Task title")
    description: str = Field(..., description="Detailed task description")
    
    # Task parameters
    priority: int = Field(default=1, description="Task priority (1-10)")
    complexity: float = Field(default=0.5, description="Estimated complexity (0-1)")
    expected_duration: Optional[int] = Field(None, description="Expected duration in minutes")
    
    # Task state
    status: str = Field(default="pending", description="Task status")
    progress: float = Field(default=0.0, description="Task progress (0-1)")
    started_at: Optional[datetime] = Field(None, description="When task execution started")
    completed_at: Optional[datetime] = Field(None, description="When task was completed")
    
    # Results
    result: Optional[str] = Field(None, description="Task result")
    artifacts: List[str] = Field(default_factory=list, description="Generated artifacts")
    learning_outcomes: List[str] = Field(default_factory=list, description="What was learned")

class DEACCollaboration(BaseModel):
    """Represents a collaboration between multiple DEACs."""
    collaboration_id: str = Field(..., description="Unique collaboration identifier")
    participants: List[str] = Field(..., description="DEAC IDs participating")
    initiator_id: str = Field(..., description="DEAC that initiated the collaboration")
    
    # Collaboration details
    purpose: str = Field(..., description="Purpose of the collaboration")
    shared_goal: str = Field(..., description="Shared goal or objective")
    coordination_protocol: str = Field(default="consensus", description="How decisions are made")
    
    # State
    status: str = Field(default="active", description="Collaboration status")
    created_at: datetime = Field(..., description="When collaboration started")
    ended_at: Optional[datetime] = Field(None, description="When collaboration ended")
    
    # Results
    shared_knowledge: Dict[str, Any] = Field(default_factory=dict, description="Knowledge shared between DEACs")
    collective_insights: List[str] = Field(default_factory=list, description="Insights generated collectively")
    outcomes: List[str] = Field(default_factory=list, description="Collaboration outcomes")

# Stem Conglomerate Models (for advanced multi-DEAC systems)

class DEACNode(BaseModel):
    """Represents a specialized node within a Stem Conglomerate."""
    node_id: str = Field(..., description="Unique node identifier")
    deac_id: str = Field(..., description="DEAC powering this node")
    specialization: str = Field(..., description="Node's area of specialization")
    
    # Node characteristics
    expertise_level: float = Field(default=0.5, description="Expertise in specialization (0-1)")
    connectivity: List[str] = Field(default_factory=list, description="Connected node IDs")
    processing_load: float = Field(default=0.0, description="Current processing load (0-1)")
    
    # Performance
    efficiency_score: float = Field(default=0.5, description="Node efficiency (0-1)")
    collaboration_score: float = Field(default=0.5, description="Collaboration effectiveness (0-1)")

class StemConglomerate(BaseModel):
    """
    A collection of specialized DEACs working together as an integrated system.
    This represents the advanced form of DEAC evolution.
    """
    conglomerate_id: str = Field(..., description="Unique conglomerate identifier")
    name: str = Field(..., description="Conglomerate name")
    description: str = Field(..., description="Purpose and capabilities")
    
    # Structure
    nodes: List[DEACNode] = Field(default_factory=list, description="Specialized nodes")
    coordinator_deac_id: Optional[str] = Field(None, description="Main coordinator DEAC")
    
    # Organization
    hierarchy_type: str = Field(default="mesh", description="Organizational structure")
    decision_protocol: str = Field(default="consensus", description="Decision-making protocol")
    
    # State
    status: str = Field(default="forming", description="Conglomerate status")
    created_at: datetime = Field(..., description="Creation timestamp")
    last_restructure: Optional[datetime] = Field(None, description="Last structural change")
    
    # Performance
    collective_intelligence: float = Field(default=0.5, description="Overall intelligence score")
    efficiency_rating: float = Field(default=0.5, description="System efficiency")
    adaptability_score: float = Field(default=0.5, description="Adaptation capability")