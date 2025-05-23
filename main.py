from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
import os
import requests
import uuid
from datetime import datetime
import json
from typing import List, Dict, Any, Optional, Callable
from pydantic import BaseModel
from llama_index.llms.ollama import Ollama
import dotenv
import subprocess
import platform
import shutil
import tempfile

# Import our services with fallbacks
try:
    from services.model_service import model_service, ModelInfo, ModelResponse
    MODEL_SERVICE_AVAILABLE = True
except ImportError:
    MODEL_SERVICE_AVAILABLE = False
    model_service = None
    class ModelInfo: pass
    class ModelResponse: pass

try:
    from services.modelfile_assistant import modelfile_assistant, ModelfileRequest, ModelfileResponse
    MODELFILE_ASSISTANT_AVAILABLE = True
except ImportError:
    MODELFILE_ASSISTANT_AVAILABLE = False
    modelfile_assistant = None
    class ModelfileRequest: pass
    class ModelfileResponse: pass

try:
    from backend.services.automated_gguf_service import AutomatedGGUFService
    GGUF_SERVICE_AVAILABLE = True
except ImportError:
    GGUF_SERVICE_AVAILABLE = False
    class AutomatedGGUFService:
        def __init__(self): pass

try:
    from backend.services.qlora_service import QLoRAService
    QLORA_SERVICE_AVAILABLE = True
except ImportError:
    QLORA_SERVICE_AVAILABLE = False
    class QLoRAService:
        def __init__(self): pass

try:
    from backend.services.iterative_refinement_service import IterativeRefinementService
    REFINEMENT_SERVICE_AVAILABLE = True
except ImportError:
    REFINEMENT_SERVICE_AVAILABLE = False
    class IterativeRefinementService:
        def __init__(self): pass

try:
    from backend.services.model_distillation_service import ModelDistillationService
    DISTILLATION_SERVICE_AVAILABLE = True
except ImportError:
    DISTILLATION_SERVICE_AVAILABLE = False
    class ModelDistillationService:
        def __init__(self): pass

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize new services
automated_gguf_service = AutomatedGGUFService()
qlora_service = QLoRAService()
iterative_refinement_service = IterativeRefinementService()
distillation_service = ModelDistillationService()

# Initialize unified ecosystem manager
try:
    from backend.services.unified_model_ecosystem import UnifiedModelEcosystemManager
    ecosystem_manager = UnifiedModelEcosystemManager()
    ECOSYSTEM_MANAGER_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Ecosystem manager not available: {e}")
    ECOSYSTEM_MANAGER_AVAILABLE = False
    class UnifiedModelEcosystemManager:
        def __init__(self): pass
        def create_full_ecosystem(self, *args, **kwargs): 
            return {"error": "Ecosystem manager not available"}
        def list_active_ecosystems(self): 
            return []
        def get_ecosystem_status(self, ecosystem_id): 
            return None
        def get_available_models(self): 
            return {}
        def refresh_model_registry(self): 
            pass
    ecosystem_manager = UnifiedModelEcosystemManager()

# Direct file operations endpoint
@app.get("/api/files")
async def list_files(dir_path: str = ""):
    logger.info(f"API /api/files called with dir_path='{dir_path}'")
    try:
        target_dir = os.path.join(DATA_DIR, dir_path) if dir_path else DATA_DIR
        logger.info(f"Resolved target_dir: {target_dir}")

        if not os.path.abspath(target_dir).startswith(os.path.abspath(DATA_DIR)):
            logger.warning("Access denied: Path outside allowed directory")
            return JSONResponse(status_code=403, content={"error": "Access denied: Path outside allowed directory"})

        if not os.path.exists(target_dir) or not os.path.isdir(target_dir):
            logger.warning(f"Directory not found: {target_dir}")
            return JSONResponse(status_code=404, content={"error": f"Directory not found: {dir_path}"})

        file_items = []
        for item in os.listdir(target_dir):
            item_path = os.path.join(target_dir, item)
            is_dir = os.path.isdir(item_path)
            try:
                stat_info = os.stat(item_path)
                size = stat_info.st_size if not is_dir else None
                modified = datetime.fromtimestamp(stat_info.st_mtime).isoformat()
            except Exception as stat_err:
                logger.error(f"Failed to stat {item_path}: {stat_err}")
                size = None
                modified = None
            file_items.append({
                "name": item,
                "path": os.path.join(dir_path, item) if dir_path else item,
                "type": "directory" if is_dir else "file",
                "size": size,
                "modified": modified
            })
        logger.info(f"Listed {len(file_items)} items in {target_dir}")
        return {"files": file_items, "dir_path": dir_path}
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/file")
async def get_file_content(file_path: str):
    """Directly read file content without using LLM or MCP."""
    try:
        # Ensure we only access within the data directory
        target_file = os.path.join(DATA_DIR, file_path)
        
        # Security check - ensure path doesn't escape data directory
        if not os.path.abspath(target_file).startswith(os.path.abspath(DATA_DIR)):
            return JSONResponse(status_code=403, content={"error": "Access denied: Path outside allowed directory"})
        
        # Check if file exists
        if not os.path.exists(target_file) or not os.path.isfile(target_file):
            return JSONResponse(status_code=404, content={"error": f"File not found: {file_path}"})
        
        # Read file content
        with open(target_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        return {"content": content, "file_path": file_path}
    except Exception as e:
        logger.error(f"Error reading file: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

# File system paths
CONVERSATIONS_DIR = os.path.join(os.path.dirname(__file__), "data", "project-alpha", "conversations")
LOOP_CONVERSATIONS_DIR = os.path.join(os.path.dirname(__file__), "data", "project-alpha", "loop_conversations")
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
REFLECTOR_MEMORY_FILE = os.path.join(DATA_DIR, "reflectorMemory.json")

logger.info(f"Data directory configured: {DATA_DIR}")
logger.info(f"Reflector memory file path: {REFLECTOR_MEMORY_FILE}")
logger.info(f"Conversations directory: {CONVERSATIONS_DIR}")
logger.info(f"Loop conversations directory: {LOOP_CONVERSATIONS_DIR}")

try:
    os.makedirs(DATA_DIR, exist_ok=True)
    logger.info(f"Ensured DATA_DIR exists: {DATA_DIR}")
    os.makedirs(CONVERSATIONS_DIR, exist_ok=True)
    logger.info(f"Ensured CONVERSATIONS_DIR exists: {CONVERSATIONS_DIR}")
    os.makedirs(LOOP_CONVERSATIONS_DIR, exist_ok=True)
    logger.info(f"Ensured LOOP_CONVERSATIONS_DIR exists: {LOOP_CONVERSATIONS_DIR}")
except Exception as e:
    logger.error(f"CRITICAL: Failed to create data directories: {e}")

# --- Reflector Memory Endpoints ---
from fastapi import status

@app.get("/api/reflector_memory")
def get_reflector_memory():
    try:
        if not os.path.exists(REFLECTOR_MEMORY_FILE):
            # Return empty structure if not found
            return JSONResponse(content={}, status_code=status.HTTP_200_OK)
        with open(REFLECTOR_MEMORY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return JSONResponse(content=data, status_code=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Failed to load reflector memory: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

@app.put("/api/reflector_memory")
async def put_reflector_memory(request: Request):
    try:
        data = await request.json()
        with open(REFLECTOR_MEMORY_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return JSONResponse(content={"success": True}, status_code=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Failed to save reflector memory: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

async def list_conversations():
    """List all conversation files."""
    try:
        logger.debug(f"Listing conversations from: {CONVERSATIONS_DIR}")
        files = [f for f in os.listdir(CONVERSATIONS_DIR) if f.endswith(".json")]
        return [f.replace(".json", "") for f in files]
    except Exception as e:
        logger.error(f"Error listing conversations: {str(e)}")
        return []

async def read_conversation(conv_id: str):
    """Read a conversation file."""
    try:
        file_path = os.path.join(CONVERSATIONS_DIR, f"{conv_id}.json")
        logger.debug(f"Reading conversation from: {file_path}")
        
        if not os.path.exists(file_path):
            logger.error(f"Conversation file not found: {file_path}")
            return None
            
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading conversation {conv_id}: {str(e)}")
        return None

async def save_conversation(conv_id: str, data: dict):
    """Save a conversation file."""
    try:
        file_path = os.path.join(CONVERSATIONS_DIR, f"{conv_id}.json")
        logger.debug(f"Saving conversation to: {file_path}")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
            
        logger.debug(f"Saved conversation {conv_id}")
        return True
    except Exception as e:
        logger.error(f"Error saving conversation {conv_id}: {str(e)}")
        return False

async def delete_conversation(conv_id: str):
    """Delete a conversation file."""
    try:
        file_path = os.path.join(CONVERSATIONS_DIR, f"{conv_id}.json")
        logger.debug(f"Deleting conversation: {file_path}")
        
        if not os.path.exists(file_path):
            logger.error(f"Conversation file not found: {file_path}")
            return False
            
        os.remove(file_path)
        logger.debug(f"Deleted conversation {conv_id}")
        return True
    except Exception as e:
        logger.error(f"Error deleting conversation {conv_id}: {str(e)}")
        return False

async def save_loop_conversation(loop_id: str, data: dict):
    try:
        file_path = os.path.join(LOOP_CONVERSATIONS_DIR, f"{loop_id}.json")
        logger.info(f"Attempting to write loop conversation to: {file_path}")
        # Ensure directory exists one last time, just in case.
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        logger.info(f"Successfully wrote loop conversation {loop_id} to {file_path}")
        return True
    except Exception as e:
        logger.error(f"Failed to write loop conversation {loop_id} to {file_path}. Error: {str(e)}")
        return False

async def list_loop_conversations():
    """List all loop conversation files."""
    try:
        logger.debug(f"Listing loop conversations from: {LOOP_CONVERSATIONS_DIR}")
        files = [f for f in os.listdir(LOOP_CONVERSATIONS_DIR) if f.endswith(".json")]
        return [f.replace(".json", "") for f in files]
    except Exception as e:
        logger.error(f"Error listing loop conversations: {str(e)}")
        return []

@app.get("/api/conversations")
async def list_conversations_endpoint():
    # Use file system to list conversation files
    try:
        logger.debug("Attempting to list conversation files...")
        conversations = await list_conversations()
        logger.debug(f"Found conversations: {conversations}")
        return {"conversations": conversations}
    except Exception as e:
        logger.error(f"Error listing conversations: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/conversations/{conv_id}")
async def get_conversation(conv_id: str):
    # Use file system to read the conversation file
    try:
        logger.debug(f"Attempting to read conversation file: {conv_id}.json")
        conversation = await read_conversation(conv_id)
        if conversation is None:
            logger.error(f"Conversation file not found: {conv_id}.json")
            raise HTTPException(status_code=404, detail="Conversation not found")
        return conversation
    except Exception as e:
        logger.error(f"Error reading conversation file: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/conversations/{conv_id}")
async def save_conversation_endpoint(conv_id: str, request: Request):
    data = await request.json()
    try:
        logger.debug(f"Attempting to save conversation file: {conv_id}.json")
        success = await save_conversation(conv_id, data)
        if success:
            logger.debug(f"Saved conversation file: {conv_id}.json")
            return {"success": True}
        else:
            logger.error(f"Error saving conversation file: {conv_id}.json")
            return JSONResponse(status_code=500, content={"error": "Failed to save conversation"})
    except Exception as e:
        logger.error(f"Error saving conversation file: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.delete("/api/conversations/{conv_id}")
async def delete_conversation_endpoint(conv_id: str):
    try:
        logger.debug(f"Attempting to delete conversation file: {conv_id}.json")
        success = await delete_conversation(conv_id)
        if success:
            logger.debug(f"Deleted conversation file: {conv_id}.json")
            return {"success": True}
        else:
            logger.error(f"Error deleting conversation file: {conv_id}.json")
            return JSONResponse(status_code=500, content={"error": "Failed to delete conversation"})
    except Exception as e:
        logger.error(f"Error deleting conversation file: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/loop_conversations/{loop_id}")
async def save_loop_conversation_endpoint(loop_id: str, request: Request):
    data = await request.json()
    try:
        logger.debug(f"Attempting to save loop conversation file: {loop_id}.json")
        success = await save_loop_conversation(loop_id, data)
        if success:
            logger.debug(f"Saved loop conversation file: {loop_id}.json")
            return {"success": True}
        else:
            logger.error(f"Error saving loop conversation file: {loop_id}.json")
            return JSONResponse(status_code=500, content={"error": "Failed to save loop conversation"})
    except Exception as e:
        logger.error(f"Error saving loop conversation file: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/loop_conversations")
async def list_loop_conversations_endpoint():
    try:
        logger.debug("Attempting to list loop conversation files...")
        conversations = await list_loop_conversations()
        logger.debug(f"Found loop conversations: {conversations}")
        return {"conversations": conversations}
    except Exception as e:
        logger.error(f"Error listing loop conversations: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/models/ollama")
async def get_ollama_models():
    """Get list of models from Ollama using the unified model service"""
    try:
        # Use our unified model service to get Ollama models
        models = model_service.get_models(provider="ollama")
        
        # Convert ModelInfo objects to dictionaries for JSON response
        ollama_models = [model.dict() for model in models]
        
        logger.info(f"Found {len(ollama_models)} Ollama models")
        return ollama_models
    except Exception as e:
        logger.error(f"Error fetching Ollama models: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Error fetching Ollama models: {str(e)}"}
        )

@app.post("/api/chat_agent")
async def chat_agent(request: Request):
    """API endpoint for chat messages using the unified model service"""
    try:
        data = await request.json()
        provider = data.get("provider", "ollama").lower()
        model_id = data.get("model", "")
        input_text = data.get("input", "")
        history = data.get("history", [])
        system_prompt = data.get("systemPrompt", "")
        temperature = data.get("temperature", 0.7)
        max_tokens = data.get("max_tokens")
        
        logger.info(f"Chat request - Provider: {provider}, Model: {model_id}, History Length: {len(history)}")
        
        if not model_id or not input_text:
            return JSONResponse(status_code=400, content={"error": "Model and input text are required"})
        
        # Validate provider
        if provider not in ["ollama", "groq"]:
            return JSONResponse(status_code=400, content={"error": f"Unsupported provider: {provider}"})
        
        # Format message to add user input
        messages = history.copy()
        messages.append({"role": "user", "content": input_text})
        
        try:
            # Use unified model service for chat completion
            response_text = model_service.chat_completion(
                provider=provider,
                model_id=model_id,
                messages=messages,
                system_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            # Special processing for Modelfile generation requests
            if "Ollama Modelfile generator" in input_text:
                response_text = clean_modelfile_response(response_text)
            
            return {"response": response_text}
        except Exception as e:
            logger.error(f"Error in model service chat completion: {str(e)}")
            return JSONResponse(status_code=500, content={"error": f"Model error: {str(e)}"})
            
    except Exception as e:
        logger.error(f"Error in chat agent: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

def clean_modelfile_response(response_text):
    """Clean up AI response to extract just the Modelfile content."""
    try:
        # Remove code block markers if present
        import re
        code_block_match = re.search(r'```(?:modelfile)?\n([\s\S]*?)\n```', response_text)
        if code_block_match:
            response_text = code_block_match.group(1)
        
        # Find the start of the actual Modelfile (should start with FROM)
        from_match = re.search(r'(FROM[\s\S]*)', response_text)
        if from_match:
            response_text = from_match.group(1)
        
        # Clean up by removing any trailing explanatory text after the template
        lines = response_text.split('\n')
        clean_lines = []
        in_template = False
        template_depth = 0
        
        for line in lines:
            if line.startswith('TEMPLATE '):
                in_template = True
                template_depth = len(re.findall(r'"""', line))
            
            clean_lines.append(line)
            
            if in_template:
                template_depth += len(re.findall(r'"""', line))
                if template_depth >= 2:  # Template opening and closing quotes found
                    break
        
        return '\n'.join(clean_lines).strip()
    
    except Exception as e:
        logger.warning(f"Error cleaning modelfile response: {e}")
        return response_text

def get_groq_api_key():
    # Always reload .env to get the latest value
    dotenv.load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'), override=True)
    return os.environ.get('REACT_APP_GROQ_API_KEY')

@app.get("/api/models/groq")
async def get_groq_models():
    """Get list of models from Groq using the unified model service"""
    try:
        # Use our unified model service to get Groq models
        models = model_service.get_models(provider="groq")
        
        # If no models returned, could be due to missing API key
        if not models and not model_service.groq_api_key:
            return JSONResponse(
                status_code=401,
                content={"error": "Groq API key not set. Please set GROQ_API_KEY environment variable."}
            )
        
        # Convert ModelInfo objects to dictionaries for JSON response
        groq_models = [model.dict() for model in models]
        
        logger.info(f"Found {len(groq_models)} Groq models")
        return groq_models
    except Exception as e:
        logger.error(f"Error fetching Groq models: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Error fetching Groq models: {str(e)}"}
        )

# New Pydantic model for AetherCreator Tier 2 requests
class HFModelImportRequest(BaseModel):
    hf_model_id: str
    target_quantization: str
    # output_gguf_name: Optional[str] = None # Can be added later

# New Pydantic model for AetherCreator QLoRA Fine-Tuning requests
class QLoRAFineTuneRequest(BaseModel):
    base_model_id: str
    dataset: str # Path or ID to the dataset
    rank: int
    alpha: int
    target_modules: List[str]
    learning_rate: float
    epochs: int
    # output_adapter_name: Optional[str] = None # Can be added later

@app.post("/api/aether_creator/import_hf_model")
async def ac_import_hf_model(request_data: HFModelImportRequest):
    """
    Import a Hugging Face model and convert to GGUF format
    Uses the unified model service
    """
    hf_model_id = request_data.hf_model_id
    quantization = request_data.target_quantization
    
    logger.info(f"AetherCreator: Import HF model request - Model: {hf_model_id}, Quantization: {quantization}")
    
    # Use our unified model service for HF model import
    result = model_service.import_hf_model(
        hf_model_id=hf_model_id,
        quantization_type=quantization
    )
    
    # Return the result directly (unified format from ModelResponse)
    return result.dict()

@app.post("/api/aether_creator/start_qlora_finetune")
async def ac_start_qlora_finetune(request_data: QLoRAFineTuneRequest):
    """
    Start QLoRA fine-tuning on a base model
    Uses the unified model service
    """
    logger.info(f"AetherCreator: QLoRA finetune request - Model: {request_data.base_model_id}")
    
    # Parse target_modules as a string, as expected by our model service
    target_modules_str = ",".join(request_data.target_modules) if isinstance(request_data.target_modules, list) else request_data.target_modules
    
    # Use our unified model service for QLoRA fine-tuning
    result = model_service.start_qlora_finetune(
        base_model_id=request_data.base_model_id,
        dataset_path=request_data.dataset,
        rank=request_data.rank,
        alpha=request_data.alpha,
        target_modules=target_modules_str,
        learning_rate=request_data.learning_rate,
        epochs=request_data.epochs,
        batch_size=request_data.batch_size
    )
    
    # Return the result directly (unified format from ModelResponse)
    return result.dict()

# --- AetherCreator AI Assistant Endpoints ---
@app.post("/api/aether_creator/generate_modelfile")
async def generate_modelfile(request_data: ModelfileRequest):
    """
    Generate an optimized Modelfile based on user requirements
    Uses AI to suggest parameters, system prompts, and templates
    """
    logger.info(f"AetherCreator: Generate Modelfile request - Task: {request_data.task_description}, Base Model: {request_data.base_model}")
    
    try:
        # Use our modelfile assistant service
        result = modelfile_assistant.generate_modelfile(request_data)
        
        # Return the result directly
        return result.dict()
    except Exception as e:
        logger.error(f"Error generating Modelfile: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Error generating Modelfile: {str(e)}"
            }
        )

@app.post("/api/model/analyze_task")
async def analyze_model_task(request: Request):
    """Analyze task requirements and recommend optimal model configuration."""
    try:
        data = await request.json()
        task_description = data.get("taskDescription", "")
        domain = data.get("domain", "general")
        hardware_profile = data.get("hardwareProfile", {})
        
        if not task_description:
            return JSONResponse(
                status_code=400,
                content={"error": "Task description is required"}
            )
        
        # Use AI to analyze the task and recommend configuration
        analysis_prompt = f"""
        Analyze this task and recommend the best base model and optimization strategy:
        
        Task: {task_description}
        Domain: {domain}
        Hardware: {hardware_profile}
        
        Recommend:
        1. Best base model (with parameter count)
        2. Optimization strategy steps
        3. Expected performance metrics
        
        Format as JSON with: recommendedModel, optimizationStrategy, expectedPerformance
        """
        
        # Get AI recommendation
        response = await model_service.chat_completion(
            messages=[{"role": "user", "content": analysis_prompt}],
            model="llama3:8b"
        )
        
        # Parse response (in a real implementation, this would be more sophisticated)
        # For demonstration, return a structured response
        result = {
            "recommendedModel": {
                "name": "Llama-3-8B-Instruct",
                "parameterCount": "8B parameters",
                "description": "Balanced model offering good performance for general tasks with efficient resource usage."
            },
            "optimizationStrategy": [
                "Download and convert base model to GGUF format",
                "Apply Q4_K_M quantization for optimal size/quality balance",
                "Configure hardware-optimized runtime parameters",
                "Generate task-specific system prompt and template",
                "Apply iterative refinement based on performance metrics"
            ],
            "expectedPerformance": {
                "vramUsage": f"{hardware_profile.get('gpu_vram', 16) * 0.3:.1f} GB",
                "tokensPerSecond": "15-25 t/s",
                "qualityPreservation": "95%"
            }
        }
        
        return JSONResponse(content=result)
        
    except Exception as e:
        logger.error(f"Error analyzing task: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.post("/api/model/create_optimized")
async def create_optimized_model(request: Request):
    """Create a fully optimized model from task requirements."""
    try:
        data = await request.json()
        model_id = data.get("modelId", "")
        task_description = data.get("taskDescription", "")
        hardware_profile = data.get("hardwareProfile", {})
        quantization_type = data.get("quantizationType", "q4_k_m")
        system_prompt = data.get("systemPrompt")
        
        if not model_id or not task_description:
            return JSONResponse(
                status_code=400,
                content={"error": "Model ID and task description are required"}
            )
        
        # Run the full optimization pipeline
        result = await automated_gguf_service.create_optimized_model(
            model_id=model_id,
            task_description=task_description,
            hardware_profile=hardware_profile,
            quantization_type=quantization_type,
            system_prompt=system_prompt
        )
        
        return JSONResponse(content=result)
        
    except Exception as e:
        logger.error(f"Error creating optimized model: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.post("/api/model/fine_tune_qlora")
async def fine_tune_qlora(request: Request):
    """Run QLoRA fine-tuning on a base model."""
    try:
        data = await request.json()
        base_model = data.get("baseModel", "")
        dataset = data.get("dataset", "")
        format_type = data.get("formatType", "json")
        training_args = data.get("trainingArgs", {})
        lora_config = data.get("loraConfig", {})
        hardware_profile = data.get("hardwareProfile", {})
        
        if not base_model or not dataset:
            return JSONResponse(
                status_code=400,
                content={"error": "Base model and dataset are required"}
            )
        
        # Run the QLoRA pipeline
        result = await qlora_service.full_qlora_pipeline(
            base_model=base_model,
            dataset=dataset,
            format_type=format_type,
            training_args=training_args,
            lora_config=lora_config,
            hardware_profile=hardware_profile
        )
        
        return JSONResponse(content=result)
        
    except Exception as e:
        logger.error(f"Error running QLoRA fine-tuning: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.post("/api/model/iterative_refinement")
async def run_iterative_refinement(request: Request):
    """Run iterative model refinement using IMPROVE methodology."""
    try:
        data = await request.json()
        model_path = data.get("modelPath", "")
        test_dataset = data.get("testDataset", [])
        hardware_profile = data.get("hardwareProfile", {})
        max_iterations = data.get("maxIterations", 5)
        target_efficiency = data.get("targetEfficiency", 0.9)
        
        if not model_path:
            return JSONResponse(
                status_code=400,
                content={"error": "Model path is required"}
            )
        
        # Run iterative refinement
        result = await iterative_refinement_service.iterative_refinement_pipeline(
            initial_model_path=model_path,
            test_dataset=test_dataset,
            hardware_profile=hardware_profile,
            max_iterations=max_iterations,
            target_efficiency=target_efficiency
        )
        
        return JSONResponse(content=result)
        
    except Exception as e:
        logger.error(f"Error running iterative refinement: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/api/model/performance_metrics/{model_path:path}")
async def get_performance_metrics(model_path: str, hardware_profile: str = "{}"):
    """Get performance metrics for a specific model."""
    try:
        # Parse hardware profile from query parameter
        import json
        hw_profile = json.loads(hardware_profile) if hardware_profile else {}
        
        # Evaluate model performance
        metrics = await iterative_refinement_service.evaluate_baseline(
            model_path=model_path,
            test_dataset=[],  # Empty for quick evaluation
            hardware_profile=hw_profile
        )
        
        return JSONResponse(content=metrics.to_dict())
        
    except Exception as e:
        logger.error(f"Error getting performance metrics: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/api/model/refinement_suggestions")
async def get_refinement_suggestions(request: Request):
    """Get AI-powered suggestions for model improvements."""
    try:
        # Parse query parameters
        model_path = request.query_params.get("modelPath", "")
        hardware_profile_str = request.query_params.get("hardwareProfile", "{}")
        
        if not model_path:
            return JSONResponse(
                status_code=400,
                content={"error": "Model path is required"}
            )
        
        import json
        hardware_profile = json.loads(hardware_profile_str)
        
        # Get current metrics
        current_metrics = await iterative_refinement_service.evaluate_baseline(
            model_path=model_path,
            test_dataset=[],
            hardware_profile=hardware_profile
        )
        
        # Get improvement suggestions
        suggestions = await iterative_refinement_service.identify_components_for_improvement(
            current_metrics=current_metrics,
            hardware_profile=hardware_profile
        )
        
        return JSONResponse(content={
            "currentMetrics": current_metrics.to_dict(),
            "suggestions": suggestions
        })
        
    except Exception as e:
        logger.error(f"Error getting refinement suggestions: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/api/hardware/profile")
async def get_hardware_profile():
    """Get current hardware profile information."""
    try:
        # In a real implementation, this would detect actual hardware
        # For demonstration, return simulated profile
        profile = {
            "cpu_cores": 16,
            "gpu_vram": 24,  # GB
            "system_ram": 32,  # GB
            "gpu_model": "RTX 4090",
            "cpu_model": "Ryzen 9 9950X"
        }
        
        return JSONResponse(content=profile)
        
    except Exception as e:
        logger.error(f"Error getting hardware profile: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

# Unified Model Ecosystem Endpoints
@app.post("/api/ecosystem/create")
async def create_model_ecosystem(request: Request):
    """Create a complete model ecosystem from natural language description."""
    try:
        if not ECOSYSTEM_MANAGER_AVAILABLE:
            return JSONResponse(
                status_code=503,
                content={
                    "error": "Ecosystem manager not available. Missing dependencies.",
                    "message": "Install required packages: pip install requests"
                }
            )
            
        data = await request.json()
        user_request = data.get("userRequest", "")
        ecosystem_name = data.get("ecosystemName")
        
        if not user_request.strip():
            return JSONResponse(
                status_code=400,
                content={"error": "User request is required"}
            )
        
        # Create the complete ecosystem
        ecosystem = await ecosystem_manager.create_full_ecosystem(
            user_request=user_request,
            ecosystem_name=ecosystem_name
        )
        
        # Convert dataclass to dict for JSON response
        ecosystem_dict = {
            "ecosystem_id": ecosystem.ecosystem_id,
            "name": ecosystem.name,
            "description": ecosystem.description,
            "characters": [
                {
                    "name": char.name,
                    "base_model": char.base_model,
                    "role": char.role,
                    "personality_traits": char.personality_traits,
                    "system_prompt": char.system_prompt,
                    "parameters": char.parameters,
                    "target_component": char.target_component,
                    "deployment_status": char.deployment_status
                }
                for char in ecosystem.characters
            ],
            "architecture": ecosystem.architecture,
            "created_at": ecosystem.created_at
        }
        
        return JSONResponse(content=ecosystem_dict)
        
    except Exception as e:
        logger.error(f"Error creating ecosystem: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/api/ecosystem/list")
async def list_ecosystems():
    """List all active model ecosystems."""
    try:
        ecosystems = ecosystem_manager.list_active_ecosystems()
        
        ecosystems_dict = [
            {
                "ecosystem_id": eco.ecosystem_id,
                "name": eco.name,
                "description": eco.description,
                "character_count": len(eco.characters),
                "architecture": eco.architecture,
                "created_at": eco.created_at
            }
            for eco in ecosystems
        ]
        
        return JSONResponse(content={"ecosystems": ecosystems_dict})
        
    except Exception as e:
        logger.error(f"Error listing ecosystems: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/api/ecosystem/{ecosystem_id}")
async def get_ecosystem_details(ecosystem_id: str):
    """Get detailed information about a specific ecosystem."""
    try:
        ecosystem = ecosystem_manager.get_ecosystem_status(ecosystem_id)
        
        if not ecosystem:
            return JSONResponse(
                status_code=404,
                content={"error": f"Ecosystem {ecosystem_id} not found"}
            )
        
        ecosystem_dict = {
            "ecosystem_id": ecosystem.ecosystem_id,
            "name": ecosystem.name,
            "description": ecosystem.description,
            "characters": [
                {
                    "name": char.name,
                    "base_model": char.base_model,
                    "role": char.role,
                    "personality_traits": char.personality_traits,
                    "system_prompt": char.system_prompt,
                    "parameters": char.parameters,
                    "target_component": char.target_component,
                    "deployment_status": char.deployment_status,
                    "performance_metrics": char.performance_metrics
                }
                for char in ecosystem.characters
            ],
            "architecture": ecosystem.architecture,
            "created_at": ecosystem.created_at,
            "performance_summary": ecosystem.performance_summary
        }
        
        return JSONResponse(content=ecosystem_dict)
        
    except Exception as e:
        logger.error(f"Error getting ecosystem details: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/api/models/capabilities")
async def get_model_capabilities():
    """Get capabilities of all available models."""
    try:
        capabilities = ecosystem_manager.get_available_models()
        
        capabilities_dict = {
            model_id: {
                "model_id": cap.model_id,
                "parameter_count": cap.parameter_count,
                "strengths": cap.strengths,
                "context_window": cap.context_window,
                "speed_tier": cap.speed_tier,
                "specialties": cap.specialties
            }
            for model_id, cap in capabilities.items()
        }
        
        return JSONResponse(content=capabilities_dict)
        
    except Exception as e:
        logger.error(f"Error getting model capabilities: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.post("/api/models/refresh")
async def refresh_model_registry():
    """Refresh the model registry by scanning Ollama."""
    try:
        ecosystem_manager.refresh_model_registry()
        capabilities = ecosystem_manager.get_available_models()
        
        return JSONResponse(content={
            "message": f"Model registry refreshed. Found {len(capabilities)} models.",
            "models": list(capabilities.keys())
        })
        
    except Exception as e:
        logger.error(f"Error refreshing model registry: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

# Model Distillation Endpoints (inspired by DeepSeek's approach)
@app.post("/api/distillation/create_dataset")
async def create_distillation_dataset(request: Request):
    """Create a knowledge distillation dataset using a teacher model."""
    try:
        if not DISTILLATION_SERVICE_AVAILABLE:
            return JSONResponse(
                status_code=503,
                content={
                    "error": "Distillation service not available. Missing dependencies.",
                    "message": "Install required packages: pip install requests"
                }
            )
            
        data = await request.json()
        teacher_model = data.get("teacherModel", "")
        student_model = data.get("studentModel", "")
        num_examples = data.get("numExamples", 500)
        domains = data.get("domains", [])
        reasoning_focused = data.get("reasoningFocused", False)
        
        if not teacher_model:
            return JSONResponse(
                status_code=400,
                content={"error": "Teacher model is required"}
            )
        
        # Run the distillation pipeline
        results = await distillation_service.run_full_distillation_pipeline(
            teacher_model=teacher_model,
            student_model=student_model or "student-model",
            num_examples=num_examples,
            domains=domains,
            reasoning_focused=reasoning_focused
        )
        
        return JSONResponse(content=results)
        
    except Exception as e:
        logger.error(f"Error creating distillation dataset: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/api/distillation/available_teachers")
async def get_available_teacher_models():
    """Get list of models suitable for use as teachers in distillation."""
    try:
        # Get Ollama models and filter for larger, capable models
        ollama_models = model_service.get_models(provider="ollama") if MODEL_SERVICE_AVAILABLE else []
        
        # Filter for models likely to be good teachers
        teacher_candidates = []
        for model in ollama_models:
            model_name = model.id.lower()
            # Look for larger models that make good teachers
            if any(size in model_name for size in ["7b", "8b", "13b", "14b", "32b", "70b"]):
                if any(type_name in model_name for type_name in ["instruct", "chat", "coder", "reasoning"]):
                    teacher_candidates.append({
                        "id": model.id,
                        "name": model.name,
                        "suitable_for": [],  # Could analyze model capabilities
                        "estimated_quality": "high" if any(x in model_name for x in ["llama3", "qwen", "deepseek"]) else "medium"
                    })
        
        return JSONResponse(content={
            "teacher_models": teacher_candidates,
            "total_count": len(teacher_candidates)
        })
        
    except Exception as e:
        logger.error(f"Error getting teacher models: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

# Ollama Management Endpoints
@app.post("/api/ollama/create_model")
async def create_ollama_model(request: Request):
    """Create an Ollama model from a Modelfile with full automation."""
    try:
        data = await request.json()
        modelfile_content = data.get("modelfile", "")
        model_name = data.get("modelName", "")
        
        if not modelfile_content or not model_name:
            return JSONResponse(
                status_code=400,
                content={"error": "Modelfile content and model name are required"}
            )
        
        # Step 1: Detect Ollama installation
        ollama_path = detect_ollama_installation()
        if not ollama_path:
            return JSONResponse(
                status_code=404,
                content={
                    "error": "Ollama installation not found",
                    "message": "Please ensure Ollama is installed and available in PATH"
                }
            )
        
        # Step 2: Create temporary Modelfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.modelfile', delete=False) as tmp_file:
            tmp_file.write(modelfile_content)
            modelfile_path = tmp_file.name
        
        logger.info(f"Created temporary Modelfile: {modelfile_path}")
        
        # Step 3: Execute ollama create command
        try:
            result = subprocess.run(
                [ollama_path, "create", model_name, "-f", modelfile_path],
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            # Step 4: Verify model creation
            if result.returncode == 0:
                # Check if model actually exists
                verify_result = subprocess.run(
                    [ollama_path, "list"],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                model_exists = model_name in verify_result.stdout if verify_result.returncode == 0 else False
                
                if model_exists:
                    return JSONResponse(content={
                        "success": True,
                        "message": f"Model '{model_name}' created successfully",
                        "modelName": model_name,
                        "ollamaPath": ollama_path,
                        "output": result.stdout,
                        "verified": True
                    })
                else:
                    return JSONResponse(content={
                        "success": False,
                        "error": "Model creation reported success but model not found in list",
                        "output": result.stdout,
                        "stderr": result.stderr,
                        "verified": False
                    })
            else:
                return JSONResponse(content={
                    "success": False,
                    "error": f"Ollama create command failed with code {result.returncode}",
                    "output": result.stdout,
                    "stderr": result.stderr,
                    "verified": False
                })
                
        finally:
            # Step 5: Cleanup temporary file
            try:
                os.unlink(modelfile_path)
                logger.info(f"Cleaned up temporary file: {modelfile_path}")
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup temporary file: {cleanup_error}")
        
    except subprocess.TimeoutExpired:
        return JSONResponse(
            status_code=408,
            content={
                "error": "Model creation timed out",
                "message": "The model creation process took too long. Please try again or check Ollama status."
            }
        )
    except Exception as e:
        logger.error(f"Error creating Ollama model: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/api/ollama/detect")
async def detect_ollama():
    """Detect Ollama installation and return system information."""
    try:
        ollama_path = detect_ollama_installation()
        
        if not ollama_path:
            return JSONResponse(content={
                "found": False,
                "message": "Ollama not found in PATH or common locations"
            })
        
        # Get Ollama version
        try:
            version_result = subprocess.run(
                [ollama_path, "--version"],
                capture_output=True,
                text=True,
                timeout=10
            )
            version = version_result.stdout.strip() if version_result.returncode == 0 else "Unknown"
        except:
            version = "Unknown"
        
        # Get available models
        try:
            list_result = subprocess.run(
                [ollama_path, "list"],
                capture_output=True,
                text=True,
                timeout=30
            )
            models = parse_ollama_list_output(list_result.stdout) if list_result.returncode == 0 else []
        except:
            models = []
        
        return JSONResponse(content={
            "found": True,
            "path": ollama_path,
            "version": version,
            "platform": platform.system(),
            "availableModels": models,
            "modelCount": len(models)
        })
        
    except Exception as e:
        logger.error(f"Error detecting Ollama: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.delete("/api/ollama/models/{model_name}")
async def delete_ollama_model(model_name: str):
    """Delete an Ollama model."""
    try:
        ollama_path = detect_ollama_installation()
        if not ollama_path:
            return JSONResponse(
                status_code=404,
                content={"error": "Ollama installation not found"}
            )
        
        result = subprocess.run(
            [ollama_path, "rm", model_name],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            return JSONResponse(content={
                "success": True,
                "message": f"Model '{model_name}' deleted successfully",
                "output": result.stdout
            })
        else:
            return JSONResponse(content={
                "success": False,
                "error": f"Failed to delete model '{model_name}'",
                "stderr": result.stderr
            })
            
    except Exception as e:
        logger.error(f"Error deleting Ollama model: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

def detect_ollama_installation():
    """Detect Ollama installation across different platforms."""
    
    # First, try to find ollama in PATH
    ollama_path = shutil.which("ollama")
    if ollama_path:
        return ollama_path
    
    # Platform-specific common locations
    system = platform.system().lower()
    common_paths = []
    
    if system == "windows":
        common_paths = [
            r"C:\Users\{}\AppData\Local\Programs\Ollama\ollama.exe".format(os.environ.get("USERNAME", "")),
            r"C:\Program Files\Ollama\ollama.exe",
            r"C:\Program Files (x86)\Ollama\ollama.exe",
            r"C:\ollama\ollama.exe"
        ]
    elif system == "darwin":  # macOS
        common_paths = [
            "/usr/local/bin/ollama",
            "/opt/homebrew/bin/ollama",
            "/Applications/Ollama.app/Contents/Resources/ollama",
            f"/Users/{os.environ.get('USER', '')}/ollama"
        ]
    elif system == "linux":
        common_paths = [
            "/usr/local/bin/ollama",
            "/usr/bin/ollama",
            "/opt/ollama/ollama",
            f"/home/{os.environ.get('USER', '')}/ollama",
            f"/home/{os.environ.get('USER', '')}/bin/ollama"
        ]
    
    # Check common locations
    for path in common_paths:
        if os.path.exists(path) and os.access(path, os.X_OK):
            return path
    
    return None

def parse_ollama_list_output(output):
    """Parse the output of 'ollama list' command."""
    models = []
    lines = output.strip().split('\n')
    
    # Skip header line
    for line in lines[1:]:
        if line.strip():
            parts = line.split()
            if len(parts) >= 3:
                name = parts[0]
                model_id = parts[1] if len(parts) > 1 else ""
                size = parts[2] if len(parts) > 2 else ""
                modified = " ".join(parts[3:]) if len(parts) > 3 else ""
                
                models.append({
                    "name": name,
                    "id": model_id,
                    "size": size,
                    "modified": modified
                })
    
    return models

# The main block for running the app, if any, should be at the very end.
# if __name__ == "__main__":
#     uvicorn.run(app, host="0.0.0.0", port=8000)