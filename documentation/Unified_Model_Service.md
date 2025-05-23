# Unified Model Service

**Version:** 1.0
**Date:** May 22, 2025
**Status:** Implemented

## 1. Overview

The Unified Model Service is a core backend component that standardizes interactions with different model providers (Ollama, Groq) across the Aether AI Suite. It provides a consistent interface for retrieving available models, obtaining model information, and generating completions, regardless of the underlying provider. This service enables the AI-assisted Modelfile configuration feature and lays the foundation for future model-related functionality.

## 2. Key Features

### 2.1. Unified Provider Interface

- **Provider Abstraction:** Abstract away provider-specific API differences behind a standardized interface.
- **Multi-Provider Support:** Currently supports Ollama and Groq models with a design that allows for easy addition of new providers.
- **Consistent Error Handling:** Standardized error handling and reporting across different model providers.

### 2.2. Model Discovery and Information

- **Model Listing:** Retrieve available models from all supported providers or filter by specific provider.
- **Caching:** Efficiently cache model lists to reduce API calls and improve performance.
- **Model Details:** Obtain detailed information about specific models, including capabilities and parameters.

### 2.3. Completion Generation

- **Chat Completions:** Generate text completions for chat-style interactions with configurable parameters.
- **Streaming Support:** Stream responses for real-time output in user interfaces.
- **Parameter Standardization:** Normalize parameters across different providers for consistent behavior.

### 2.4. Modelfile Generation Support

- **Optimized Parameters:** Generate suggested parameters based on model capabilities and user requirements.
- **System Prompt Engineering:** Create effective system prompts tailored to specific use cases.
- **Template Suggestions:** Provide appropriate templates based on model architecture.

## 3. Technical Architecture

### 3.1. Core Components

- **Model Service Class:** Central class that handles all model-related operations.
- **Provider-Specific Adapters:** Adapters for each supported model provider (Ollama, Groq).
- **Caching Layer:** In-memory cache with TTL for frequently accessed data.
- **Response Models:** Pydantic models for type-safe data handling and validation.

### 3.2. Dependency Management

- **Required Dependencies:**
  - `requests`: For API communication
  - `pydantic`: For data validation and response models
  - `python-dotenv`: For environment variable management
  - `groq`: Official Groq Python client (when using Groq models)

### 3.3. Configuration

- **Environment Variables:**
  - `GROQ_API_KEY`: API key for accessing Groq models
  - `OLLAMA_BASE_URL`: Base URL for Ollama API (defaults to http://localhost:11434)
  - `MODEL_CACHE_TTL`: Time-to-live for model cache in seconds (defaults to 300)

## 4. Implementation Details

### 4.1. Core Methods

#### `get_models(provider: Optional[str] = None) -> List[ModelInfo]`
- **Purpose:** Retrieve a list of available models
- **Parameters:**
  - `provider`: Optional filter for specific provider (ollama, groq)
- **Returns:** List of ModelInfo objects containing model details
- **Caching:** Results are cached to improve performance

#### `get_model_info(model_name: str, provider: Optional[str] = None) -> ModelInfo`
- **Purpose:** Get detailed information about a specific model
- **Parameters:**
  - `model_name`: Name of the model to retrieve information for
  - `provider`: Optional provider specification (inferred from model name if not provided)
- **Returns:** ModelInfo object with detailed model information

#### `generate_chat_completion(request: ChatCompletionRequest) -> ChatCompletionResponse`
- **Purpose:** Generate a completion for a chat conversation
- **Parameters:**
  - `request`: ChatCompletionRequest object containing messages and parameters
- **Returns:** ChatCompletionResponse containing the generated text

#### `generate_streaming_chat_completion(request: ChatCompletionRequest) -> Generator`
- **Purpose:** Generate a streaming completion for real-time UI updates
- **Parameters:**
  - `request`: ChatCompletionRequest object containing messages and parameters
- **Returns:** Generator yielding chunks of the response as they become available

### 4.2. Provider-Specific Implementation

#### Ollama Provider

- **Model Listing:** Uses the `/api/tags` endpoint to retrieve available models
- **Chat Completion:** Uses the `/api/chat` endpoint for generating completions
- **Streaming:** Implements chunked response handling for streaming

#### Groq Provider

- **Model Listing:** Uses the Groq API client to list available models
- **Chat Completion:** Uses the Groq Chat Completions API
- **Authentication:** Requires GROQ_API_KEY for all operations

### 4.3. Error Handling

- **Connection Errors:** Handled gracefully with informative error messages
- **Authentication Errors:** Clear indication of authentication issues
- **Rate Limiting:** Detection and appropriate handling of rate limit errors
- **Model Availability:** Proper handling when requested models are unavailable

## 5. Integration with Other Components

### 5.1. Modelfile Assistant Service

- Provides model access for the Modelfile Assistant to generate optimized configurations
- Supplies model capabilities information to inform parameter suggestions
- Handles completion generation for system prompt and template creation

### 5.2. Frontend Integration

- Provides model lists for dropdown selectors in the UI
- Supports chat completions for interactive components
- Enables streaming responses for real-time feedback

### 5.3. Future Integration Points

- Will serve as the foundation for the model registry
- Can be extended to support model benchmarking functionality
- Will facilitate model sharing and discovery features

## 6. Usage Examples

### Example 1: Getting Available Models

```python
from services.model_service import ModelService

# Initialize the service
model_service = ModelService()

# Get all available models
all_models = model_service.get_models()
print(f"Found {len(all_models)} models")

# Get only Ollama models
ollama_models = model_service.get_models(provider="ollama")
print(f"Found {len(ollama_models)} Ollama models")
```

### Example 2: Generating a Chat Completion

```python
from services.model_service import ModelService, ChatCompletionRequest, ChatMessage

# Initialize the service
model_service = ModelService()

# Create a request
request = ChatCompletionRequest(
    model="llama3:8b",
    messages=[
        ChatMessage(role="system", content="You are a helpful assistant."),
        ChatMessage(role="user", content="What is the capital of France?")
    ],
    temperature=0.7,
    max_tokens=500
)

# Generate a completion
response = model_service.generate_chat_completion(request)
print(response.choices[0].message.content)
```

### Example 3: Streaming a Chat Completion

```python
from services.model_service import ModelService, ChatCompletionRequest, ChatMessage

# Initialize the service
model_service = ModelService()

# Create a request
request = ChatCompletionRequest(
    model="llama3:8b",
    messages=[
        ChatMessage(role="system", content="You are a helpful assistant."),
        ChatMessage(role="user", content="Write a short poem about AI.")
    ],
    temperature=0.7,
    max_tokens=500,
    stream=True
)

# Stream the completion
for chunk in model_service.generate_streaming_chat_completion(request):
    print(chunk.choices[0].delta.content, end="", flush=True)
```

## 7. Performance Considerations

### 7.1. Caching Strategy

- Model lists are cached with a default TTL of 5 minutes
- Cache invalidation occurs automatically on TTL expiry
- Manual cache invalidation can be triggered when needed

### 7.2. Resource Usage

- Minimal memory footprint for the service itself
- Network calls are the primary performance bottleneck
- Consider connection pooling for high-volume deployments

### 7.3. Scaling Considerations

- Service is stateless and can be horizontally scaled
- Cache can be moved to Redis or similar for distributed deployments
- Consider implementing request queuing for high-traffic scenarios

## 8. Future Enhancements

### 8.1. Near-Term Improvements

- Add support for additional model providers (e.g., Anthropic, OpenAI)
- Implement more sophisticated caching with distributed cache support
- Add detailed model capability detection for better parameter suggestions

### 8.2. Long-Term Vision

- Develop a comprehensive model registry with versioning
- Implement model performance analytics and comparison tools
- Create a model recommendation system based on task requirements

## 9. Troubleshooting and FAQs

### Common Issues

#### "Cannot connect to Ollama service"
- Ensure Ollama is running locally or specify the correct OLLAMA_BASE_URL
- Check firewall settings if connecting to a remote Ollama instance

#### "Authentication failed for Groq API"
- Verify that GROQ_API_KEY is set correctly in environment variables
- Ensure the API key has not expired or been revoked

#### "Model not found"
- Verify the model name is correct and the model is installed (for Ollama)
- Check if the model is available in the provider's catalog

## 10. Additional Resources

- **API Documentation:** Detailed API reference for the Model Service
- **Provider Documentation:**
  - [Ollama API Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md)
  - [Groq API Documentation](https://console.groq.com/docs/quickstart)
- **Related Components:**
  - [Modelfile Assistant Documentation](./AIAssisted_Modelfile_Configuration.md)
  - [AetherCreator Development Plan](./AetherCreator_Development_Plan.md)

---

This document will be updated as the Unified Model Service evolves and new capabilities are added.
