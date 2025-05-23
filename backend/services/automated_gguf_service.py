import os
import logging
import subprocess
import json
from typing import Dict, List, Optional, Tuple, Union
import shutil
import tempfile

# Optional imports with fallbacks
try:
    from huggingface_hub import snapshot_download
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False
    def snapshot_download(*args, **kwargs):
        raise NotImplementedError("huggingface_hub not installed. Install with: pip install huggingface_hub")

try:
    from .model_service import ModelService
    MODEL_SERVICE_AVAILABLE = True
except ImportError:
    MODEL_SERVICE_AVAILABLE = False
    class ModelService:
        def __init__(self):
            pass

logger = logging.getLogger(__name__)

class AutomatedGGUFService:
    """Service for automating GGUF model creation and optimization."""
    
    def __init__(self, cache_dir: str = None, model_service: ModelService = None):
        """Initialize the automated GGUF service.
        
        Args:
            cache_dir: Directory to cache downloaded models
            model_service: Optional model service instance for API calls
        """
        self.cache_dir = cache_dir or os.path.join(os.path.expanduser("~"), ".cache", "aether_ai", "models")
        os.makedirs(self.cache_dir, exist_ok=True)
        self.model_service = model_service or (ModelService() if MODEL_SERVICE_AVAILABLE else None)
        
        # Ensure llama.cpp tools are available
        self._check_llamacpp_tools()
    
    def _check_llamacpp_tools(self):
        """Check if llama.cpp tools are available and accessible."""
        # This would typically check for the convert.py and quantize binaries
        # For now, we'll assume they're correctly installed
        # TODO: Implement proper checks and potential auto-setup
        pass
    
    async def download_base_model(self, model_id: str, revision: str = None) -> str:
        """Download a base model from Hugging Face.
        
        Args:
            model_id: Hugging Face model ID (e.g., "meta-llama/Llama-2-7b-hf")
            revision: Optional specific revision to download
            
        Returns:
            Path to the downloaded model
        """
        logger.info(f"Downloading model {model_id}")
        
        try:
            # Create a subdirectory for this specific model
            model_dir = os.path.join(self.cache_dir, model_id.split("/")[-1])
            os.makedirs(model_dir, exist_ok=True)
            
            # Download the model snapshot
            download_path = snapshot_download(
                repo_id=model_id,
                revision=revision,
                local_dir=model_dir,
                local_dir_use_symlinks=False
            )
            
            logger.info(f"Model downloaded to {download_path}")
            return download_path
        
        except Exception as e:
            logger.error(f"Error downloading model {model_id}: {e}")
            raise
    
    async def convert_to_gguf(self, model_path: str, output_path: str = None, 
                             model_type: str = "llama") -> str:
        """Convert a Hugging Face model to GGUF format.
        
        Args:
            model_path: Path to the downloaded model
            output_path: Optional output path for the GGUF file
            model_type: Model architecture type
            
        Returns:
            Path to the created GGUF file
        """
        logger.info(f"Converting model at {model_path} to GGUF format")
        
        if not output_path:
            # Generate a default output path if none provided
            model_name = os.path.basename(model_path)
            output_path = os.path.join(self.cache_dir, f"{model_name}.gguf")
        
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        try:
            # This would call the llama.cpp convert.py script
            # For demonstration, we'll use a simulated command
            convert_cmd = [
                "python", "/path/to/llama.cpp/convert.py", 
                "--outfile", output_path,
                "--outtype", "f16",
                "--model-type", model_type,
                model_path
            ]
            
            # Run the conversion process
            logger.info(f"Running conversion command: {' '.join(convert_cmd)}")
            result = subprocess.run(convert_cmd, check=True, capture_output=True, text=True)
            
            logger.info(f"Conversion complete. GGUF file created at {output_path}")
            return output_path
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Error converting model to GGUF: {e.stdout}\n{e.stderr}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during GGUF conversion: {e}")
            raise
    
    async def apply_quantization(self, gguf_path: str, quant_type: str = "q4_k_m", 
                               output_path: str = None) -> str:
        """Apply quantization to a GGUF model.
        
        Args:
            gguf_path: Path to the GGUF model
            quant_type: Quantization type (e.g., "q4_k_m", "q5_k_m", "q8_0")
            output_path: Optional output path for the quantized GGUF file
            
        Returns:
            Path to the quantized GGUF file
        """
        logger.info(f"Quantizing GGUF model at {gguf_path} using {quant_type}")
        
        if not output_path:
            # Generate a default output path if none provided
            base, ext = os.path.splitext(gguf_path)
            output_path = f"{base}-{quant_type}{ext}"
        
        try:
            # This would call the llama.cpp quantize tool
            # For demonstration, we'll use a simulated command
            quantize_cmd = [
                "/path/to/llama.cpp/quantize", 
                gguf_path,
                output_path,
                quant_type
            ]
            
            # Run the quantization process
            logger.info(f"Running quantization command: {' '.join(quantize_cmd)}")
            result = subprocess.run(quantize_cmd, check=True, capture_output=True, text=True)
            
            logger.info(f"Quantization complete. Quantized GGUF file created at {output_path}")
            return output_path
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Error quantizing GGUF model: {e.stdout}\n{e.stderr}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during quantization: {e}")
            raise
    
    async def apply_external_quantization(self, model_path: str, quant_method: str = "awq", 
                                       bits: int = 4, output_path: str = None) -> str:
        """Apply external quantization methods like AWQ or GPTQ.
        
        Args:
            model_path: Path to the Hugging Face model
            quant_method: Quantization method ("awq" or "gptq")
            bits: Bit-depth for quantization
            output_path: Optional output path for the quantized model
            
        Returns:
            Path to the quantized model directory
        """
        logger.info(f"Applying {quant_method} ({bits}-bit) quantization to model at {model_path}")
        
        if not output_path:
            # Generate a default output path
            model_name = os.path.basename(model_path)
            output_path = os.path.join(self.cache_dir, f"{model_name}-{quant_method}-{bits}bit")
        
        os.makedirs(output_path, exist_ok=True)
        
        try:
            if quant_method.lower() == "awq":
                # This would use AutoAWQ or similar library
                # For demonstration, we'll simulate the process
                logger.info("Running AWQ quantization")
                # In a real implementation, we'd use the AutoAWQ Python API
                # or call a script that uses it
                
            elif quant_method.lower() == "gptq":
                # This would use AutoGPTQ or similar library
                logger.info("Running GPTQ quantization")
                # In a real implementation, we'd use the AutoGPTQ Python API
                # or call a script that uses it
                
            else:
                raise ValueError(f"Unsupported quantization method: {quant_method}")
            
            logger.info(f"External quantization complete. Model saved at {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Error applying {quant_method} quantization: {e}")
            raise
    
    async def optimize_for_hardware(self, gguf_path: str, hardware_profile: Dict) -> Dict:
        """Generate optimal Modelfile parameters based on hardware profile.
        
        Args:
            gguf_path: Path to the GGUF model
            hardware_profile: Hardware specifications (CPU, GPU, RAM)
            
        Returns:
            Dictionary of recommended Modelfile parameters
        """
        logger.info(f"Optimizing parameters for model at {gguf_path} based on hardware profile")
        
        # Extract relevant hardware information
        gpu_vram = hardware_profile.get("gpu_vram", 0)
        cpu_cores = hardware_profile.get("cpu_cores", 0)
        system_ram = hardware_profile.get("system_ram", 0)
        
        # Determine model size from the GGUF file
        # In a real implementation, we'd analyze the file
        # For demonstration, we'll use a placeholder approach
        model_size_gb = 5  # Placeholder
        
        # Calculate optimal parameters
        # These calculations would be much more sophisticated in a real implementation
        
        # GPU layers (num_gpu)
        if gpu_vram > 0:
            # Simple heuristic: if VRAM > 2x model size, offload all layers
            # Otherwise, calculate a proportion
            if gpu_vram > 2 * model_size_gb:
                num_gpu = 99  # Special value in Ollama meaning "all layers"
            else:
                # Rough estimation
                num_gpu = int((gpu_vram / model_size_gb) * 32)
        else:
            num_gpu = 0
        
        # Context size (num_ctx)
        if gpu_vram > 24:
            num_ctx = 8192
        elif gpu_vram > 16:
            num_ctx = 4096
        elif gpu_vram > 8:
            num_ctx = 2048
        else:
            num_ctx = 1024
        
        # CPU threads (num_thread)
        num_thread = min(cpu_cores, 8)  # Simple heuristic
        
        # Prepare Modelfile parameters
        parameters = {
            "num_gpu": num_gpu,
            "num_ctx": num_ctx,
            "num_thread": num_thread,
            "temperature": 0.7,  # Default
            "top_k": 40,         # Default
            "top_p": 0.9,        # Default
            "repeat_penalty": 1.1  # Default
        }
        
        logger.info(f"Optimized parameters: {parameters}")
        return parameters
    
    async def create_modelfile(self, gguf_path: str, parameters: Dict, 
                            system_prompt: str = None, template: str = None) -> str:
        """Create an Ollama Modelfile for the GGUF model.
        
        Args:
            gguf_path: Path to the GGUF model
            parameters: Dictionary of Modelfile parameters
            system_prompt: Optional system prompt
            template: Optional template
            
        Returns:
            Generated Modelfile content
        """
        logger.info(f"Creating Modelfile for GGUF model at {gguf_path}")
        
        # Start with the FROM directive
        modelfile = f"FROM {gguf_path}\n\n"
        
        # Add parameters
        for key, value in parameters.items():
            if isinstance(value, str):
                modelfile += f'PARAMETER {key} "{value}"\n'
            else:
                modelfile += f"PARAMETER {key} {value}\n"
        
        modelfile += "\n"
        
        # Add system prompt if provided
        if system_prompt:
            modelfile += f'SYSTEM """{system_prompt}"""\n\n'
        
        # Add template if provided
        if template:
            modelfile += f'TEMPLATE """{template}"""\n'
        
        logger.info("Modelfile created successfully")
        return modelfile
    
    async def create_optimized_model(self, model_id: str, task_description: str, 
                                   hardware_profile: Dict, quantization_type: str = "q4_k_m",
                                   system_prompt: str = None) -> Dict:
        """Create a fully optimized model from requirements.
        
        Args:
            model_id: Hugging Face model ID or local path
            task_description: Description of the intended use case
            hardware_profile: Hardware specifications
            quantization_type: Target quantization (q4_k_m, q5_k_m, etc.)
            system_prompt: Optional custom system prompt
            
        Returns:
            Dictionary with optimization results
        """
        logger.info(f"Creating optimized model from {model_id}")
        
        try:
            # For demonstration, return a simulated result
            # In a real implementation, this would:
            # 1. Download/validate the model
            # 2. Convert to GGUF format
            # 3. Apply quantization
            # 4. Generate optimized parameters
            # 5. Create Modelfile
            
            result = {
                "success": True,
                "original_model": model_id,
                "quantized_path": f"{self.cache_dir}/{model_id.replace('/', '_')}_{quantization_type}.gguf",
                "quantization_type": quantization_type,
                "estimated_size_gb": self._estimate_quantized_size(model_id, quantization_type),
                "optimized_parameters": self._generate_optimized_parameters(hardware_profile),
                "modelfile_content": self._generate_modelfile(model_id, system_prompt, hardware_profile),
                "performance_estimate": {
                    "tokens_per_second": self._estimate_performance(model_id, hardware_profile),
                    "memory_usage_gb": self._estimate_memory_usage(model_id, quantization_type),
                    "quality_retention": self._estimate_quality_retention(quantization_type)
                }
            }
            
            logger.info(f"Model optimization completed: {result['quantized_path']}")
            return result
            
        except Exception as e:
            logger.error(f"Error creating optimized model: {e}")
            return {
                "success": False,
                "error": str(e),
                "original_model": model_id
            }
    
    def _estimate_quantized_size(self, model_id: str, quantization_type: str) -> float:
        """Estimate the size of the quantized model in GB."""
        # Simple estimation based on model name and quantization
        if "7b" in model_id.lower() or "8b" in model_id.lower():
            base_size = 13.0  # ~13GB for 7B fp16
        elif "13b" in model_id.lower():
            base_size = 26.0  # ~26GB for 13B fp16
        elif "3b" in model_id.lower():
            base_size = 6.0   # ~6GB for 3B fp16
        else:
            base_size = 10.0  # Default estimate
        
        # Apply quantization reduction
        if "q4" in quantization_type.lower():
            return base_size * 0.3  # 4-bit reduces to ~30% of original
        elif "q5" in quantization_type.lower():
            return base_size * 0.4  # 5-bit reduces to ~40% of original
        elif "q8" in quantization_type.lower():
            return base_size * 0.6  # 8-bit reduces to ~60% of original
        else:
            return base_size * 0.3  # Default to q4 estimate
    
    def _generate_optimized_parameters(self, hardware_profile: Dict) -> Dict:
        """Generate optimal parameters based on hardware."""
        gpu_vram = hardware_profile.get("gpu_vram", 8)
        cpu_cores = hardware_profile.get("cpu_cores", 8)
        
        return {
            "num_gpu": 99 if gpu_vram >= 8 else 0,  # Use GPU if sufficient VRAM
            "num_thread": min(cpu_cores, 16),  # Don't exceed 16 threads
            "num_ctx": 4096 if gpu_vram >= 12 else 2048,  # Context size based on VRAM
            "temperature": 0.7,
            "top_p": 0.9,
            "top_k": 40,
            "repeat_penalty": 1.1
        }
    
    def _generate_modelfile(self, model_id: str, system_prompt: str, hardware_profile: Dict) -> str:
        """Generate an optimized Modelfile."""
        params = self._generate_optimized_parameters(hardware_profile)
        
        # Use provided system prompt or generate a default one
        if not system_prompt:
            system_prompt = "You are a helpful AI assistant. Be concise, accurate, and helpful in your responses."
        
        modelfile = f"""FROM {model_id}

SYSTEM \"\"\"{system_prompt}\"\"\"

PARAMETER num_gpu {params['num_gpu']}
PARAMETER num_thread {params['num_thread']}
PARAMETER num_ctx {params['num_ctx']}
PARAMETER temperature {params['temperature']}
PARAMETER top_p {params['top_p']}
PARAMETER top_k {params['top_k']}
PARAMETER repeat_penalty {params['repeat_penalty']}
"""
        
        return modelfile
    
    def _estimate_performance(self, model_id: str, hardware_profile: Dict) -> float:
        """Estimate tokens per second performance."""
        gpu_vram = hardware_profile.get("gpu_vram", 8)
        
        # Simple performance estimation
        if "7b" in model_id.lower() or "8b" in model_id.lower():
            base_performance = 20.0 if gpu_vram >= 8 else 8.0
        elif "13b" in model_id.lower():
            base_performance = 12.0 if gpu_vram >= 16 else 4.0
        elif "3b" in model_id.lower():
            base_performance = 35.0 if gpu_vram >= 4 else 15.0
        else:
            base_performance = 15.0
        
        return base_performance
    
    def _estimate_memory_usage(self, model_id: str, quantization_type: str) -> float:
        """Estimate memory usage in GB."""
        # This is roughly the same as quantized size plus some overhead
        return self._estimate_quantized_size(model_id, quantization_type) * 1.2
    
    def _estimate_quality_retention(self, quantization_type: str) -> float:
        """Estimate quality retention percentage."""
        if "q4" in quantization_type.lower():
            return 0.95  # 95% quality retention
        elif "q5" in quantization_type.lower():
            return 0.97  # 97% quality retention
        elif "q8" in quantization_type.lower():
            return 0.99  # 99% quality retention
        else:
            return 0.95  # Default to q4 estimate 