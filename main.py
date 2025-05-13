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
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from llama_index.llms.ollama import Ollama
import dotenv

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
os.makedirs(CONVERSATIONS_DIR, exist_ok=True)
os.makedirs(LOOP_CONVERSATIONS_DIR, exist_ok=True)

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
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        logger.debug(f"Saved loop conversation {loop_id}")
        return True
    except Exception as e:
        logger.error(f"Error saving loop conversation {loop_id}: {str(e)}")
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

@app.post("/api/agent/chat")
async def chat_agent(request: Request):
    data = await request.json()
    
    model = data.get("model", "qwen3:1.7b")
    history = data.get("history", [])
    conversation_id = data.get("conversationId")
    user_message = data.get("message", "")
    
    # Initialize Ollama LLM
    llm = Ollama(model=model, temperature=0.7)

    # Compose prompt from history and user message
    prompt = user_message
    if history:
        # Optionally, combine history for context
        prompt = "\n".join([msg.get("content", "") for msg in history if msg.get("role") == "user"] + [user_message])

    try:
        response = llm.complete(prompt)
        return {"content": response}
    except Exception as e:
        logger.error(f"Error chatting with agent: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

def get_groq_api_key():
    # Always reload .env to get the latest value
    dotenv.load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'), override=True)
    return os.environ.get('REACT_APP_GROQ_API_KEY')

@app.get("/api/models/groq")
async def get_groq_models():
    api_key = get_groq_api_key()
    if not api_key:
        return JSONResponse(status_code=500, content={"error": "Groq API key not found in .env"})
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    try:
        import requests
        resp = requests.get("https://api.groq.com/openai/v1/models", headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        # OpenAI-compatible: expect a 'data' key with a list of models
        if 'data' in data:
            models = data['data']
        else:
            models = data.get('models', [])
        return models
    except Exception as e:
        logging.error(f"Failed to fetch Groq models: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/models/ollama")
async def get_ollama_models():
    try:
        import ollama
        models = ollama.list()
        # ollama.list() returns a dict with 'models' key
        return [{
            'name': m.get('name', m.get('model', 'unknown')),
            'size': m.get('size', None),
            'digest': m.get('digest', None)
        } for m in models.get('models', [])]
    except Exception as e:
        logging.error(f"Failed to fetch Ollama models: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})