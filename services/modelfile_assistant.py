"""
Modelfile Assistant Service for AetherCreator
Uses Ollama models to generate optimized model configurations
"""

import logging
import json
from typing import Dict, Any, List, Optional
import requests
from pydantic import BaseModel

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelfileRequest(BaseModel):
    """Request for modelfile generation assistance"""
    task_description: str
    base_model: str
    model_type: str = "general"  # general, coding, creative, etc.
    hardware_constraints: Optional[Dict[str, Any]] = None
    additional_requirements: Optional[str] = None

class ModelfileResponse(BaseModel):
    """Response from modelfile generation assistance"""
    success: bool
    message: str
    modelfile: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    system_prompt: Optional[str] = None
    template: Optional[str] = None
    explanation: Optional[str] = None

class ModelfileAssistant:
    """
    Assistant service for generating optimized Modelfiles
    Uses Ollama models to suggest parameters, system prompts, and templates
    """
    
    def __init__(self, assistant_model: str = "qwen3:8b"):
        """Initialize the assistant with a specific model"""
        self.assistant_model = assistant_model
        self.ollama_endpoint = "http://localhost:11434/api"
        
    def _get_parameter_prompt(self, request: ModelfileRequest) -> str:
        """Generate a prompt for parameter optimization"""
        return f"""<meta>
  <role>Ollama Configuration Expert</role>
  <rules>
    Output ONLY valid JSON. No explanation text outside the JSON structure.
    Use best practices for Ollama model configuration.
    Consider the specific task and hardware constraints when suggesting parameters.
    Provide clear technical reasoning for each parameter choice.
  </rules>
</meta>

<task>
  <description>Generate optimal Ollama model parameters for the following use case:</description>
  <details>
    Task Description: {request.task_description}
    Base Model: {request.base_model}
    Model Type: {request.model_type}
    Hardware Constraints: {json.dumps(request.hardware_constraints) if request.hardware_constraints else "None specified"}
    Additional Requirements: {request.additional_requirements or "None specified"}
  </details>
  <output_schema>{{
    "parameters": {{
        "num_ctx": int,
        "num_gpu": int,
        "temperature": float,
        "top_k": int,
        "top_p": float,
        "repeat_penalty": float,
        "mirostat": int,
        "mirostat_eta": float,
        "mirostat_tau": float,
        "num_thread": int,
        "stop_sequences": [string]
    }},
    "reasoning": {{
        "parameter_choices": string,
        "performance_considerations": string,
        "optimization_strategy": string
    }}
  }}</output_schema>
</task>

<final_instruction>Analyze the task requirements and hardware constraints. Output optimized Ollama parameters as valid JSON following the output schema exactly.</final_instruction>"""

    def _get_system_prompt_template(self, request: ModelfileRequest) -> str:
        """Generate a prompt for system prompt and template generation"""
        return f"""<meta>
  <role>Ollama Prompt Engineering Expert</role>
  <rules>
    Output ONLY valid JSON. No explanation text outside the JSON structure.
    Create an optimal system prompt and message template for the specific task.
    Design prompts that maximize the model's performance for the given task.
    Consider the base model's capabilities and limitations.
  </rules>
</meta>

<task>
  <description>Generate an optimal system prompt and chat template for the following use case:</description>
  <details>
    Task Description: {request.task_description}
    Base Model: {request.base_model}
    Model Type: {request.model_type}
    Additional Requirements: {request.additional_requirements or "None specified"}
  </details>
  <output_schema>{{
    "system_prompt": string,
    "template": string,
    "reasoning": {{
        "system_prompt_strategy": string,
        "template_design": string,
        "expected_performance_impact": string
    }}
  }}</output_schema>
</task>

<final_instruction>Design an optimal system prompt and template for the specified task and model. Output as valid JSON following the output schema exactly.</final_instruction>"""

    def _call_ollama(self, prompt: str) -> Dict[str, Any]:
        """Call Ollama API with the specified prompt"""
        try:
            payload = {
                "model": self.assistant_model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,  # Low temperature for more deterministic results
                    "num_predict": 2048  # Allow for longer responses
                }
            }
            
            response = requests.post(
                f"{self.ollama_endpoint}/generate",
                json=payload
            )
            
            if not response.ok:
                logger.error(f"Ollama API error: {response.status_code} {response.text}")
                return {"error": f"Ollama API error: {response.status_code}"}
                
            data = response.json()
            return {"response": data.get("response", "")}
            
        except Exception as e:
            logger.error(f"Error calling Ollama: {str(e)}")
            return {"error": str(e)}
            
    def _parse_json_response(self, response_text: str) -> Dict[str, Any]:
        """Parse JSON from the model response"""
        try:
            # Find JSON content by looking for opening/closing braces
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                logger.error("Failed to find JSON in response")
                return {"error": "Invalid JSON response"}
                
            json_text = response_text[start_idx:end_idx]
            return json.loads(json_text)
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {str(e)}")
            return {"error": f"JSON parsing error: {str(e)}"}
            
    def _generate_modelfile(self, request: ModelfileRequest, parameters: Dict[str, Any], 
                           system_prompt: str, template: str) -> str:
        """Generate the Modelfile content based on parameters and prompts"""
        modelfile = f"FROM {request.base_model}\n\n"
        
        # Add system prompt if provided
        if system_prompt:
            modelfile += f'SYSTEM """{system_prompt}"""\n\n'
            
        # Add template if provided
        if template:
            modelfile += f'TEMPLATE """{template}"""\n\n'
            
        # Add parameters
        for key, value in parameters.items():
            if key == "stop_sequences":
                for stop in value:
                    if stop.strip():
                        # Properly format stop sequences with quotes if they contain spaces
                        formatted_stop = f'"{stop}"' if ' ' in stop else stop
                        modelfile += f"PARAMETER stop {formatted_stop}\n"
            elif key in ["num_ctx", "num_gpu", "temperature", "top_k", "top_p", 
                        "repeat_penalty", "mirostat", "mirostat_eta", "mirostat_tau", 
                        "num_thread"]:
                modelfile += f"PARAMETER {key} {value}\n"
                
        return modelfile
        
    def generate_modelfile(self, request: ModelfileRequest) -> ModelfileResponse:
        """
        Generate an optimized Modelfile based on the request
        
        Args:
            request: The modelfile generation request
            
        Returns:
            ModelfileResponse with success status and generated content
        """
        try:
            # Step 1: Generate optimized parameters
            param_prompt = self._get_parameter_prompt(request)
            param_result = self._call_ollama(param_prompt)
            
            if "error" in param_result:
                return ModelfileResponse(
                    success=False,
                    message=f"Parameter generation failed: {param_result['error']}"
                )
                
            param_data = self._parse_json_response(param_result["response"])
            if "error" in param_data:
                return ModelfileResponse(
                    success=False,
                    message=f"Parameter parsing failed: {param_data['error']}"
                )
                
            # Step 2: Generate system prompt and template
            prompt_template_prompt = self._get_system_prompt_template(request)
            prompt_result = self._call_ollama(prompt_template_prompt)
            
            if "error" in prompt_result:
                return ModelfileResponse(
                    success=False,
                    message=f"Prompt/Template generation failed: {prompt_result['error']}"
                )
                
            prompt_data = self._parse_json_response(prompt_result["response"])
            if "error" in prompt_data:
                return ModelfileResponse(
                    success=False,
                    message=f"Prompt/Template parsing failed: {prompt_data['error']}"
                )
                
            # Step 3: Generate Modelfile
            parameters = param_data.get("parameters", {})
            system_prompt = prompt_data.get("system_prompt", "")
            template = prompt_data.get("template", "")
            
            modelfile = self._generate_modelfile(
                request, parameters, system_prompt, template
            )
            
            # Combine reasoning for explanation
            param_reasoning = param_data.get("reasoning", {})
            prompt_reasoning = prompt_data.get("reasoning", {})
            
            explanation = {
                "parameter_choices": param_reasoning.get("parameter_choices", ""),
                "performance_considerations": param_reasoning.get("performance_considerations", ""),
                "optimization_strategy": param_reasoning.get("optimization_strategy", ""),
                "system_prompt_strategy": prompt_reasoning.get("system_prompt_strategy", ""),
                "template_design": prompt_reasoning.get("template_design", ""),
                "expected_performance_impact": prompt_reasoning.get("expected_performance_impact", "")
            }
            
            return ModelfileResponse(
                success=True,
                message="Successfully generated optimized Modelfile",
                modelfile=modelfile,
                parameters=parameters,
                system_prompt=system_prompt,
                template=template,
                explanation=explanation
            )
            
        except Exception as e:
            logger.error(f"Error generating Modelfile: {str(e)}")
            return ModelfileResponse(
                success=False,
                message=f"Error generating Modelfile: {str(e)}"
            )

# Create singleton instance
modelfile_assistant = ModelfileAssistant()
