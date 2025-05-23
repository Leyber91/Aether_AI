"""
Unified Model Service for Aether AI
Provides standardized access to models across different providers.
"""

import os
import json
import logging
import requests
import time
from typing import List, Dict, Any, Optional, Callable, Generator, Union
from pydantic import BaseModel

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelInfo(BaseModel):
    """Model information structure"""
    id: str
    name: str
    provider: str
    size: Optional[int] = None
    quantization: Optional[str] = None
    context_length: Optional[int] = None
    parameters: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class ModelResponse(BaseModel):
    """Standard response from model operations"""
    success: bool
    message: str
    data: Optional[Any] = None
    error: Optional[str] = None

class UnifiedModelService:
    """
    Unified service for model operations across providers.
    Handles model listing, querying, and interaction.
    """
    
    def __init__(self):
        self.ollama_endpoint = "http://localhost:11434/api"
        self.cache_duration = 300  # Cache model lists for 5 minutes
        self._model_cache = {}
        self._model_cache_timestamp = {}
        self.groq_api_key = os.environ.get("GROQ_API_KEY", "")
        
    def _get_ollama_models(self) -> List[ModelInfo]:
        """Get available models from Ollama"""
        try:
            # Check cache first
            if "ollama" in self._model_cache and (self._model_cache_timestamp.get("ollama", 0) + self.cache_duration) > time.time():
                logger.debug("Using cached Ollama models")
                return self._model_cache["ollama"]
                
            response = requests.get(f"{self.ollama_endpoint}/tags")
            if not response.ok:
                logger.error(f"Failed to get Ollama models: {response.status_code} {response.text}")
                return []
                
            data = response.json()
            models = []
            
            for model in data.get("models", []):
                model_info = ModelInfo(
                    id=model["name"],
                    name=model["name"],
                    provider="ollama",
                    size=model.get("size"),
                    metadata={
                        "modified_at": model.get("modified_at"),
                        "digest": model.get("digest")
                    }
                )
                models.append(model_info)
                
            # Update cache
            self._model_cache["ollama"] = models
            self._model_cache_timestamp["ollama"] = time.time()
            
            return models
        except Exception as e:
            logger.error(f"Error fetching Ollama models: {str(e)}")
            return []
            
    def _get_groq_models(self) -> List[ModelInfo]:
        """Get available models from Groq"""
        try:
            # Check cache first
            if "groq" in self._model_cache and (self._model_cache_timestamp.get("groq", 0) + self.cache_duration) > time.time():
                logger.debug("Using cached Groq models")
                return self._model_cache["groq"]
                
            if not self.groq_api_key:
                logger.warning("Groq API key not set")
                return []
                
            response = requests.get(
                "https://api.groq.com/v1/models",
                headers={"Authorization": f"Bearer {self.groq_api_key}"}
            )
            
            if not response.ok:
                logger.error(f"Failed to get Groq models: {response.status_code} {response.text}")
                return []
                
            data = response.json()
            models = []
            
            for model in data.get("data", []):
                model_info = ModelInfo(
                    id=model["id"],
                    name=model.get("name", model["id"]),
                    provider="groq",
                    context_length=model.get("context_length"),
                    metadata={
                        "created": model.get("created"),
                        "owned_by": model.get("owned_by")
                    }
                )
                models.append(model_info)
                
            # Update cache
            self._model_cache["groq"] = models
            self._model_cache_timestamp["groq"] = time.time()
            
            return models
        except Exception as e:
            logger.error(f"Error fetching Groq models: {str(e)}")
            return []
    
    def get_models(self, provider: Optional[str] = None) -> List[ModelInfo]:
        """
        Get available models, optionally filtered by provider
        
        Args:
            provider: Optional provider name to filter by ("ollama" or "groq")
            
        Returns:
            List of ModelInfo objects
        """
        if provider == "ollama":
            return self._get_ollama_models()
        elif provider == "groq":
            return self._get_groq_models()
        else:
            # Return all models from all providers
            ollama_models = self._get_ollama_models()
            groq_models = self._get_groq_models()
            return ollama_models + groq_models
            
    def get_model_info(self, model_id: str, provider: str) -> Optional[ModelInfo]:
        """
        Get detailed information about a specific model
        
        Args:
            model_id: The ID of the model to get info for
            provider: The provider name ("ollama" or "groq")
            
        Returns:
            ModelInfo object if found, None otherwise
        """
        models = self.get_models(provider)
        for model in models:
            if model.id == model_id:
                return model
        return None
        
    def chat_completion(
        self, 
        provider: str, 
        model_id: str, 
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        stream_callback: Optional[Callable[[str], None]] = None
    ) -> Union[str, Generator[str, None, None]]:
        """
        Generate a chat completion using the specified model
        
        Args:
            provider: Provider name ("ollama" or "groq")
            model_id: Model ID to use
            messages: List of message objects with "role" and "content"
            system_prompt: Optional system prompt to prepend
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens to generate
            stream: Whether to stream the response
            stream_callback: Callback function for streamed tokens
            
        Returns:
            Generated text or generator if streaming
        """
        if provider == "ollama":
            return self._ollama_chat_completion(
                model_id, messages, system_prompt, temperature, 
                max_tokens, stream, stream_callback
            )
        elif provider == "groq":
            return self._groq_chat_completion(
                model_id, messages, system_prompt, temperature,
                max_tokens, stream, stream_callback
            )
        else:
            raise ValueError(f"Unsupported provider: {provider}")
            
    def _ollama_chat_completion(
        self,
        model_id: str,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        stream_callback: Optional[Callable[[str], None]] = None
    ) -> Union[str, Generator[str, None, None]]:
        """Generate chat completion with Ollama"""
        try:
            # Prepare chat messages - add system prompt if provided
            chat_messages = messages.copy()
            if system_prompt:
                # Check if there's already a system message
                has_system = any(msg.get("role") == "system" for msg in chat_messages)
                if not has_system:
                    chat_messages.insert(0, {"role": "system", "content": system_prompt})
            
            payload = {
                "model": model_id,
                "messages": chat_messages,
                "stream": stream,
                "options": {
                    "temperature": temperature
                }
            }
            
            if max_tokens:
                payload["options"]["num_predict"] = max_tokens
                
            if stream:
                return self._ollama_streaming_request(payload, stream_callback)
            else:
                response = requests.post(
                    f"{self.ollama_endpoint}/chat",
                    json=payload
                )
                
                if not response.ok:
                    logger.error(f"Ollama API error: {response.status_code} {response.text}")
                    raise Exception(f"Ollama API error: {response.status_code}")
                    
                data = response.json()
                return data.get("message", {}).get("content", "")
                
        except Exception as e:
            logger.error(f"Error in Ollama chat completion: {str(e)}")
            raise
            
    def _ollama_streaming_request(
        self,
        payload: Dict[str, Any],
        callback: Optional[Callable[[str], None]] = None
    ) -> Generator[str, None, None]:
        """Handle streaming request to Ollama"""
        response = requests.post(
            f"{self.ollama_endpoint}/chat",
            json=payload,
            stream=True
        )
        
        if not response.ok:
            logger.error(f"Ollama streaming API error: {response.status_code}")
            raise Exception(f"Ollama streaming API error: {response.status_code}")
            
        for line in response.iter_lines():
            if not line:
                continue
                
            try:
                data = json.loads(line)
                content = data.get("message", {}).get("content", "")
                
                if callback and content:
                    callback(content)
                    
                yield content
                
                if data.get("done", False):
                    break
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse Ollama streaming response: {line}")
                
    def _groq_chat_completion(
        self,
        model_id: str,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        stream_callback: Optional[Callable[[str], None]] = None
    ) -> Union[str, Generator[str, None, None]]:
        """Generate chat completion with Groq"""
        try:
            if not self.groq_api_key:
                raise ValueError("Groq API key not set")
                
            # Prepare chat messages - add system prompt if provided
            chat_messages = messages.copy()
            if system_prompt:
                # Check if there's already a system message
                has_system = any(msg.get("role") == "system" for msg in chat_messages)
                if not has_system:
                    chat_messages.insert(0, {"role": "system", "content": system_prompt})
            
            payload = {
                "model": model_id,
                "messages": chat_messages,
                "temperature": temperature,
                "stream": stream
            }
            
            if max_tokens:
                payload["max_tokens"] = max_tokens
                
            headers = {
                "Authorization": f"Bearer {self.groq_api_key}",
                "Content-Type": "application/json"
            }
            
            if stream:
                return self._groq_streaming_request(payload, headers, stream_callback)
            else:
                response = requests.post(
                    "https://api.groq.com/v1/chat/completions",
                    json=payload,
                    headers=headers
                )
                
                if not response.ok:
                    logger.error(f"Groq API error: {response.status_code} {response.text}")
                    raise Exception(f"Groq API error: {response.status_code}")
                    
                data = response.json()
                return data.get("choices", [{}])[0].get("message", {}).get("content", "")
                
        except Exception as e:
            logger.error(f"Error in Groq chat completion: {str(e)}")
            raise
            
    def _groq_streaming_request(
        self,
        payload: Dict[str, Any],
        headers: Dict[str, str],
        callback: Optional[Callable[[str], None]] = None
    ) -> Generator[str, None, None]:
        """Handle streaming request to Groq"""
        response = requests.post(
            "https://api.groq.com/v1/chat/completions",
            json=payload,
            headers=headers,
            stream=True
        )
        
        if not response.ok:
            logger.error(f"Groq streaming API error: {response.status_code}")
            raise Exception(f"Groq streaming API error: {response.status_code}")
            
        for line in response.iter_lines():
            if not line or line.strip() == b'data: [DONE]':
                continue
                
            try:
                # Remove the "data: " prefix that Groq adds
                if line.startswith(b'data: '):
                    line = line[6:]
                    
                data = json.loads(line)
                content = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                
                if callback and content:
                    callback(content)
                    
                yield content
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse Groq streaming response: {line}")

    def import_hf_model(
        self, 
        hf_model_id: str, 
        quantization_type: str = "Q4_K_M",
        progress_callback: Optional[Callable[[int], None]] = None
    ) -> ModelResponse:
        """
        Import a model from Hugging Face and convert to GGUF
        
        Args:
            hf_model_id: Hugging Face model ID
            quantization_type: GGUF quantization type
            progress_callback: Optional callback for progress updates
            
        Returns:
            ModelResponse with success status and results
        """
        # TODO: Implement actual HF model import logic
        # This is a placeholder implementation
        try:
            logger.info(f"Importing model {hf_model_id} with quantization {quantization_type}")
            
            # Simulate progress updates
            if progress_callback:
                for i in range(0, 101, 10):
                    progress_callback(i)
                    time.sleep(0.5)
                    
            # Simulate successful import
            gguf_path = f"/path/to/models/{hf_model_id.replace('/', '_')}.{quantization_type}.gguf"
            
            return ModelResponse(
                success=True,
                message=f"Successfully imported {hf_model_id} as {quantization_type}",
                data={"gguf_path": gguf_path}
            )
        except Exception as e:
            logger.error(f"Error importing HF model: {str(e)}")
            return ModelResponse(
                success=False,
                message="Failed to import model",
                error=str(e)
            )
            
    def start_qlora_finetune(
        self,
        base_model_id: str,
        dataset_path: str,
        rank: int = 8,
        alpha: int = 16,
        target_modules: str = "q_proj,v_proj",
        learning_rate: float = 0.0002,
        epochs: int = 3,
        batch_size: int = 1,
        progress_callback: Optional[Callable[[int], None]] = None
    ) -> ModelResponse:
        """
        Start QLoRA fine-tuning on a base model
        
        Args:
            base_model_id: Base model ID (HF or local path)
            dataset_path: Path to dataset
            rank: QLoRA rank
            alpha: QLoRA alpha
            target_modules: Target modules for QLoRA
            learning_rate: Learning rate
            epochs: Number of epochs
            batch_size: Batch size
            progress_callback: Optional callback for progress updates
            
        Returns:
            ModelResponse with success status and results
        """
        # TODO: Implement actual QLoRA fine-tuning logic
        # This is a placeholder implementation
        try:
            logger.info(f"Starting QLoRA fine-tuning for {base_model_id} with dataset {dataset_path}")
            logger.info(f"Parameters: rank={rank}, alpha={alpha}, target_modules={target_modules}")
            logger.info(f"Training: lr={learning_rate}, epochs={epochs}, batch_size={batch_size}")
            
            # Simulate progress updates
            if progress_callback:
                for i in range(0, 101, 5):
                    progress_callback(i)
                    time.sleep(1)
                    
            # Simulate successful fine-tuning
            adapter_path = f"/path/to/adapters/{base_model_id.replace('/', '_')}_finetune.bin"
            
            return ModelResponse(
                success=True,
                message=f"Successfully fine-tuned {base_model_id}",
                data={"adapter_path": adapter_path}
            )
        except Exception as e:
            logger.error(f"Error in QLoRA fine-tuning: {str(e)}")
            return ModelResponse(
                success=False,
                message="Failed to fine-tune model",
                error=str(e)
            )

# Create a singleton instance
model_service = UnifiedModelService()
