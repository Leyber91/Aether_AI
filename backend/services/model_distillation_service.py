import os
import json
import logging
import asyncio
import tempfile
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime

# Optional imports with fallbacks
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    def requests_get(*args, **kwargs):
        raise NotImplementedError("requests not installed. Install with: pip install requests")

logger = logging.getLogger(__name__)

@dataclass
class DistillationExample:
    """A training example for knowledge distillation."""
    input_prompt: str
    teacher_response: str
    reasoning_steps: Optional[List[str]] = None
    confidence_score: Optional[float] = None
    domain: Optional[str] = None

@dataclass
class DistillationConfig:
    """Configuration for model distillation process."""
    teacher_model: str
    student_model: str
    num_examples: int = 1000
    max_context_length: int = 4096
    temperature: float = 0.7
    domains: List[str] = None
    reasoning_focused: bool = False
    quality_threshold: float = 0.8

class ModelDistillationService:
    """
    Service for knowledge distillation from teacher models to student models.
    Inspired by DeepSeek's approach of using larger models to train smaller ones.
    """
    
    def __init__(self, ollama_host: str = "http://localhost:11434"):
        """Initialize the distillation service.
        
        Args:
            ollama_host: Ollama server host URL
        """
        self.ollama_host = ollama_host
        self.examples_cache = {}
        
    async def generate_distillation_dataset(self, config: DistillationConfig) -> List[DistillationExample]:
        """
        Generate a dataset for knowledge distillation by prompting the teacher model.
        
        Args:
            config: Distillation configuration
            
        Returns:
            List of distillation examples
        """
        logger.info(f"Generating distillation dataset: {config.teacher_model} -> {config.student_model}")
        
        examples = []
        
        # Define diverse prompt categories based on domains
        prompt_categories = self._get_prompt_categories(config.domains)
        
        examples_per_category = config.num_examples // len(prompt_categories)
        
        for category, prompt_templates in prompt_categories.items():
            logger.info(f"Generating {examples_per_category} examples for domain: {category}")
            
            category_examples = await self._generate_category_examples(
                config, category, prompt_templates, examples_per_category
            )
            examples.extend(category_examples)
            
            # Avoid overwhelming the model
            await asyncio.sleep(0.1)
        
        # Filter examples by quality
        high_quality_examples = self._filter_by_quality(examples, config.quality_threshold)
        
        logger.info(f"Generated {len(high_quality_examples)} high-quality examples from {len(examples)} total")
        return high_quality_examples
    
    async def _generate_category_examples(self, 
                                        config: DistillationConfig, 
                                        category: str, 
                                        prompt_templates: List[str], 
                                        num_examples: int) -> List[DistillationExample]:
        """Generate examples for a specific category."""
        examples = []
        
        for i in range(num_examples):
            # Select a random template and customize it
            template = prompt_templates[i % len(prompt_templates)]
            customized_prompt = self._customize_prompt(template, category)
            
            try:
                # Get teacher model response
                teacher_response = await self._query_teacher_model(
                    config.teacher_model, 
                    customized_prompt,
                    config.temperature,
                    config.reasoning_focused
                )
                
                if teacher_response:
                    # Extract reasoning steps if available
                    reasoning_steps = self._extract_reasoning_steps(teacher_response)
                    
                    # Estimate confidence based on response characteristics
                    confidence = self._estimate_confidence(teacher_response)
                    
                    example = DistillationExample(
                        input_prompt=customized_prompt,
                        teacher_response=teacher_response,
                        reasoning_steps=reasoning_steps,
                        confidence_score=confidence,
                        domain=category
                    )
                    examples.append(example)
                    
            except Exception as e:
                logger.error(f"Error generating example {i} for {category}: {e}")
                continue
        
        return examples
    
    async def _query_teacher_model(self, 
                                 model: str, 
                                 prompt: str, 
                                 temperature: float = 0.7,
                                 reasoning_focused: bool = False) -> Optional[str]:
        """Query the teacher model for a response."""
        if not REQUESTS_AVAILABLE:
            logger.error("requests library not available")
            return None
            
        try:
            # Format prompt for reasoning if requested
            if reasoning_focused:
                prompt = f"Think step by step and explain your reasoning.\n\nQuery: {prompt}\n\nResponse:"
            
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": 2048,
                    "top_k": 40,
                    "top_p": 0.9
                }
            }
            
            response = requests.post(
                f"{self.ollama_host}/api/generate",
                json=payload,
                timeout=120
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("response", "").strip()
            else:
                logger.error(f"Ollama API error: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error querying teacher model: {e}")
            return None
    
    def _get_prompt_categories(self, domains: Optional[List[str]]) -> Dict[str, List[str]]:
        """Get prompt templates organized by category."""
        
        # Default comprehensive prompt categories
        default_categories = {
            "reasoning": [
                "Solve this step by step: {}",
                "What would happen if {}? Explain your reasoning.",
                "Compare and contrast {} and {}. What are the key differences?",
                "Why is {} important? Provide detailed reasoning.",
                "How does {} work? Break it down into steps."
            ],
            "coding": [
                "Write a Python function that {}",
                "Debug this code and explain the issue: {}",
                "How would you optimize this algorithm: {}",
                "Explain this code concept with examples: {}",
                "Create a {} using best practices"
            ],
            "creative": [
                "Write a short story about {}",
                "Create a poem inspired by {}",
                "Describe {} in a creative and engaging way",
                "What if {} were different? Explore this idea creatively.",
                "Tell me about {} as if you were {}"
            ],
            "analytical": [
                "Analyze the pros and cons of {}",
                "What are the implications of {}?",
                "How does {} affect {}? Provide a detailed analysis.",
                "What trends do you see in {}?",
                "Evaluate the effectiveness of {}"
            ],
            "educational": [
                "Explain {} to a beginner",
                "What are the key concepts of {}?",
                "How do you teach {} effectively?",
                "What common mistakes do people make with {}?",
                "Create a learning plan for {}"
            ],
            "conversational": [
                "What do you think about {}?",
                "Can you help me understand {}?",
                "I'm curious about {}, can you tell me more?",
                "What's your opinion on {}?",
                "How would you approach {}?"
            ]
        }
        
        if domains:
            # Filter categories based on specified domains
            return {k: v for k, v in default_categories.items() if k in domains}
        
        return default_categories
    
    def _customize_prompt(self, template: str, category: str) -> str:
        """Customize a prompt template with relevant content."""
        
        # Topic pools for different categories
        topics = {
            "reasoning": [
                "the trolley problem", "climate change solutions", "artificial intelligence ethics",
                "quantum computing", "space exploration", "renewable energy", "genetic engineering"
            ],
            "coding": [
                "calculates fibonacci numbers", "sorts an array efficiently", "implements a binary tree",
                "handles API requests", "processes text data", "manages database connections"
            ],
            "creative": [
                "a time traveler", "an AI becoming conscious", "the last library on Earth",
                "dreams becoming reality", "a world without gravity", "talking animals"
            ],
            "analytical": [
                "remote work", "social media", "cryptocurrency", "automation", "education reform",
                "healthcare systems", "urban planning", "environmental policies"
            ],
            "educational": [
                "machine learning", "photosynthesis", "the water cycle", "democratic systems",
                "economic principles", "scientific method", "critical thinking"
            ],
            "conversational": [
                "the future of technology", "your favorite books", "effective communication",
                "work-life balance", "learning new skills", "staying motivated"
            ]
        }
        
        # Select appropriate topics
        category_topics = topics.get(category, topics["conversational"])
        
        import random
        
        # Handle different template formats
        if "{}" in template:
            if template.count("{}") == 1:
                topic = random.choice(category_topics)
                return template.format(topic)
            elif template.count("{}") == 2:
                topic1, topic2 = random.sample(category_topics, 2)
                return template.format(topic1, topic2)
        
        return template
    
    def _extract_reasoning_steps(self, response: str) -> Optional[List[str]]:
        """Extract reasoning steps from a response."""
        # Look for step-by-step patterns
        steps = []
        
        # Common step indicators
        step_patterns = [
            "Step 1:", "Step 2:", "Step 3:",
            "First,", "Second,", "Third,", "Finally,",
            "1.", "2.", "3.", "4.", "5.",
            "Initially,", "Then,", "Next,", "Subsequently,"
        ]
        
        lines = response.split('\n')
        current_step = ""
        
        for line in lines:
            line = line.strip()
            if any(pattern in line for pattern in step_patterns):
                if current_step:
                    steps.append(current_step.strip())
                current_step = line
            elif current_step and line:
                current_step += " " + line
        
        if current_step:
            steps.append(current_step.strip())
        
        return steps if steps else None
    
    def _estimate_confidence(self, response: str) -> float:
        """Estimate confidence score based on response characteristics."""
        confidence = 0.5  # Base confidence
        
        # Factors that increase confidence
        if len(response) > 100:  # Detailed response
            confidence += 0.1
        
        if any(word in response.lower() for word in ["because", "therefore", "thus", "since"]):
            confidence += 0.1  # Logical reasoning
        
        if any(word in response.lower() for word in ["step", "first", "second", "then"]):
            confidence += 0.1  # Structured thinking
        
        # Factors that decrease confidence
        if any(phrase in response.lower() for phrase in ["i'm not sure", "maybe", "possibly", "might be"]):
            confidence -= 0.2  # Uncertainty indicators
        
        if len(response) < 50:  # Too brief
            confidence -= 0.1
        
        return max(0.1, min(1.0, confidence))
    
    def _filter_by_quality(self, examples: List[DistillationExample], threshold: float) -> List[DistillationExample]:
        """Filter examples by quality threshold."""
        return [ex for ex in examples if ex.confidence_score and ex.confidence_score >= threshold]
    
    async def create_training_dataset(self, 
                                    examples: List[DistillationExample], 
                                    output_format: str = "jsonl") -> str:
        """
        Create a training dataset file from distillation examples.
        
        Args:
            examples: List of distillation examples
            output_format: Output format ("jsonl", "json", "csv")
            
        Returns:
            Path to the created dataset file
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"distillation_dataset_{timestamp}.{output_format}"
        output_path = os.path.join(tempfile.gettempdir(), filename)
        
        if output_format == "jsonl":
            with open(output_path, 'w', encoding='utf-8') as f:
                for example in examples:
                    data = {
                        "input": example.input_prompt,
                        "output": example.teacher_response,
                        "domain": example.domain,
                        "confidence": example.confidence_score
                    }
                    if example.reasoning_steps:
                        data["reasoning_steps"] = example.reasoning_steps
                    
                    f.write(json.dumps(data) + '\n')
        
        elif output_format == "json":
            dataset = []
            for example in examples:
                data = {
                    "input": example.input_prompt,
                    "output": example.teacher_response,
                    "domain": example.domain,
                    "confidence": example.confidence_score
                }
                if example.reasoning_steps:
                    data["reasoning_steps"] = example.reasoning_steps
                dataset.append(data)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(dataset, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Created training dataset: {output_path}")
        return output_path
    
    async def run_full_distillation_pipeline(self, 
                                           teacher_model: str,
                                           student_model: str,
                                           num_examples: int = 1000,
                                           domains: List[str] = None,
                                           reasoning_focused: bool = False) -> Dict[str, Any]:
        """
        Run the complete distillation pipeline.
        
        Args:
            teacher_model: Teacher model name
            student_model: Student model name  
            num_examples: Number of examples to generate
            domains: Specific domains to focus on
            reasoning_focused: Whether to focus on reasoning capabilities
            
        Returns:
            Results dictionary with dataset path and statistics
        """
        logger.info(f"Starting distillation pipeline: {teacher_model} -> {student_model}")
        
        config = DistillationConfig(
            teacher_model=teacher_model,
            student_model=student_model,
            num_examples=num_examples,
            domains=domains,
            reasoning_focused=reasoning_focused
        )
        
        try:
            # Generate examples
            examples = await self.generate_distillation_dataset(config)
            
            # Create training dataset
            dataset_path = await self.create_training_dataset(examples)
            
            # Calculate statistics
            domain_counts = {}
            total_confidence = 0
            reasoning_examples = 0
            
            for example in examples:
                domain_counts[example.domain] = domain_counts.get(example.domain, 0) + 1
                total_confidence += example.confidence_score or 0
                if example.reasoning_steps:
                    reasoning_examples += 1
            
            avg_confidence = total_confidence / len(examples) if examples else 0
            
            results = {
                "success": True,
                "teacher_model": teacher_model,
                "student_model": student_model,
                "dataset_path": dataset_path,
                "total_examples": len(examples),
                "domain_distribution": domain_counts,
                "average_confidence": avg_confidence,
                "reasoning_examples": reasoning_examples,
                "reasoning_percentage": (reasoning_examples / len(examples)) * 100 if examples else 0
            }
            
            logger.info(f"Distillation pipeline completed successfully: {len(examples)} examples generated")
            return results
            
        except Exception as e:
            logger.error(f"Error in distillation pipeline: {e}")
            return {
                "success": False,
                "error": str(e),
                "teacher_model": teacher_model,
                "student_model": student_model
            } 