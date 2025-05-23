# AetherCreator: Development Plan

**Version:** 1.1
**Date:** May 22, 2025
**Status:** Phase 1.2 In Progress (AI-assisted Modelfile generation implemented)

## 1. Vision & Core Objectives

AetherCreator aims to be a comprehensive, user-friendly component within the Aether AI Suite dedicated to the creation, optimization, and management of superefficient Ollama Modelfiles and their underlying GGUF model assets. It will empower users to:

*   Easily generate Ollama Modelfiles with optimized parameters for existing GGUF models.
*   Understand and leverage advanced quantization techniques (GGUF native, GPTQ, AWQ) and Parameter-Efficient Fine-Tuning (PEFT) methods like QLoRA.
*   Automate parts of the GGUF creation and optimization pipeline.
*   Benchmark and compare the performance and efficiency of different model configurations.
*   Tailor models for specific tasks and hardware profiles (initially focusing on Ryzen 9 CPUs, GeForce RTX GPUs, and 32GB RAM systems).
*   Demystify the process of local LLM optimization, making it accessible to a broader range of users.

The ultimate goal is to provide a powerful workbench for crafting LLMs that are not just functional but "superefficient" – delivering optimal inference speed, minimized resource consumption, and high task performance.

## 2. Key Features (Tiered Approach)

This tiered approach allows for progressive development, delivering value at each stage.

### Tier 1: Modelfile Generation for Existing GGUFs

*   **Objective:** Allow users to quickly generate Modelfiles for their existing GGUF models by configuring common runtime parameters.
*   **Core Features:**
    *   **GGUF Model Path Input:** User specifies the local path to their `.gguf` model file.
    *   **Parameter Configuration UI:** Intuitive controls (text inputs, number inputs, sliders, dropdowns) for key Modelfile `PARAMETER` directives:
        *   `num_ctx` (Context Window Size)
        *   `num_gpu` (GPU Layers)
        *   `num_thread` (CPU Threads)
        *   `temperature`
        *   `top_k`
        *   `top_p`
        *   `min_p` (Placeholder for future)
        *   `tfs_z` (Placeholder for future)
        *   `repeat_penalty`
        *   `stop` (Initially one, expandable to multiple)
        *   `mirostat`, `mirostat_eta`, `mirostat_tau`
    *   **Instruction Configuration UI:**
        *   `SYSTEM` prompt input (textarea).
        *   `TEMPLATE` definition input (textarea, potentially with validation or presets).
        *   `ADAPTER` path input (for applying existing LoRA/QLoRA adapters).
    *   **Modelfile Display:** Real-time display of the generated Modelfile text as parameters are adjusted.
    *   **Output Options:**
        *   Copy generated Modelfile text to clipboard.
        *   Download generated Modelfile as a `.txt` or `.Modelfile` file.
        *   Display the corresponding `ollama create -f <ModelfileName> <NewModelName>` command.
*   **UI/UX Focus:** Simplicity, clarity, immediate feedback. Tooltips explaining each parameter.

### Tier 2: Advanced GGUF Creation & Optimization Assistance

*   **Objective:** Guide users through the process of creating optimized GGUF models from base Hugging Face models, incorporating quantization and PEFT.
*   **Core Features (Frontend UI with Backend Orchestration):**
    *   **Base Model Selection (Hugging Face):** Input for Hugging Face model ID.
    *   **PEFT Configuration (QLoRA Focus initially):**
        *   Dataset selection/upload for fine-tuning.
        *   Configuration of QLoRA parameters (rank, alpha, target modules, learning rate, epochs).
        *   UI to trigger and monitor (via backend) the QLoRA fine-tuning process.
        *   Option to merge adapter into base model.
    *   **Quantization Configuration:**
        *   Selection of target GGUF quantization type (e.g., Q4_K_M, Q5_K_M, Q8_0).
        *   (Future) Options for external quantization methods like AWQ/GPTQ before GGUF conversion, if backend supports orchestrating these.
    *   **Automated Pipeline Execution (Orchestrated by Backend):**
        *   Downloading base model.
        *   Running QLoRA fine-tuning (if configured).
        *   Converting model to FP16 GGUF.
        *   Quantizing FP16 GGUF to target GGUF type.
    *   **Output:**
        *   Download link for the newly created optimized GGUF model.
        *   Generated Modelfile (Tier 1 UI pre-filled with new GGUF path and suggested parameters).
*   **UI/UX Focus:** Guided workflow, progress indicators, clear explanations of each step.

### Tier 3: Benchmarking, Comparison, and Testing Suite

*   **Objective:** Enable users to empirically evaluate and compare the performance and efficiency of different models and Modelfile configurations.
*   **Core Features:**
    *   **Test Definition UI:**
        *   Define a suite of test prompts (e.g., for coding, summarization, Q&A).
        *   Specify evaluation criteria (e.g., perplexity, task-specific metrics if applicable, latency, tokens/sec).
    *   **Model Configuration Selection for Test:**
        *   Select one or more GGUF models/Modelfile configurations to include in a test run.
        *   Ability to easily compare a base model vs. its fine-tuned (QLoRA) version.
    *   **Test Execution Engine (Backend):**
        *   Runs the selected models against the defined test prompts.
        *   Collects performance metrics (TPS, TTFT, resource usage) and model outputs.
    *   **Results Visualization & Comparison:**
        *   Tabular and graphical display of benchmark results.
        *   Side-by-side comparison of model outputs for qualitative analysis.
        *   Metrics for VRAM/RAM usage during tests.
*   **UI/UX Focus:** Clear result presentation, easy comparison, ability to save and share test results.

## 3. UI/UX Considerations (General)

*   **Intuitive Workflow:** Guide users logically from basic to advanced operations.
*   **Captivating Design:** Modern, clean interface consistent with the Aether AI Suite aesthetic. Use of visual cues and iconography.
*   **Responsiveness:** Primarily desktop-focused, but consider responsive elements where practical.
*   **Clarity and Education:**
    *   Tooltips and helper text for all parameters and options, explaining their purpose and impact.
    *   Links to relevant documentation or sections of `model_creator.md`.
    *   Visual feedback for ongoing processes (e.g., model generation, benchmarking).
*   **Error Handling:** Graceful error messages and guidance for common issues (e.g., invalid GGUF path, VRAM limitations).
*   **Accessibility:** Adhere to WCAG guidelines.

## 4. Technical Implementation Details (Frontend - `AetherCreator.js` initially)

*   **State Management (React `useState` initially, consider `useReducer` or context for complexity):
    *   `ggufPath`: string
    *   `parameters`: object (e.g., `{ num_ctx: 2048, num_gpu: 99, temperature: 0.7, ... }`)
    *   `systemPrompt`: string
    *   `template`: string
    *   `adapterPath`: string
    *   `generatedModelfile`: string
    *   (For Tier 2/3) State for HF model ID, QLoRA config, quantization settings, test definitions, benchmark results.
*   **Modelfile Generation Logic (`handleGenerateModelfile` function):
    *   Constructs the Modelfile string based on current state values.
    *   Properly formats `PARAMETER` lines, including quoting for `stop` sequences.
*   **Component Structure (Initial Tier 1):
    *   `AetherCreator.js` (Main container)
    *   Sub-components for parameter groups (e.g., `SamplingParameters.js`, `ResourceParameters.js`).
    *   `ModelfileDisplay.js` (Textarea for generated content).
*   **Backend Interaction (Future for Tier 2/3):
    *   Define API endpoints for:
        *   Listing available base models (curated GGUFs or Hugging Face query).
        *   Orchestrating GGUF creation (download, PEFT, quantize) - this will be a complex backend service.
        *   Running benchmark tests and retrieving results.
    *   Use `apiService.js` for frontend-backend communication.

## 5. Phased Development Roadmap

### Phase 1.0: Core Tier 1 Functionality (Target: Next 1-2 Sprints) ✅ COMPLETED

*   **Objective:** Deliver a functional Modelfile generator for existing GGUFs.
*   **Tasks:**
    1.  **Implement UI for GGUF Path and Core Parameters:** ✅
        *   Input for `ggufPath`. ✅
        *   Inputs for `num_ctx`, `num_gpu`, `temperature`, `stop` (single), `repeat_penalty`. ✅
    2.  **Implement `handleGenerateModelfile` Logic:** Basic string construction for the above parameters. ✅
    3.  **Implement Modelfile Display Area:** Textarea to show generated content. ✅
    4.  **Implement "Copy to Clipboard" and "Download Modelfile" functionality.** ✅
    5.  **Basic Styling:** Ensure usability and a clean look (can be refined later). ✅
    6.  **Add Inputs for `SYSTEM` and `TEMPLATE` directives.** ✅
    7.  **Add Input for `ADAPTER` path.** ✅
*   **Success Metrics:** Users can input a GGUF path, configure key parameters, and generate a valid Modelfile text. ✅

### Phase 1.1: Tier 1 Enhancements (Target: Following 1-2 Sprints) ✅ COMPLETED

*   **Objective:** Improve usability and expand parameter coverage for Tier 1.
*   **Tasks:**
    1.  **Add UI for Remaining Tier 1 Parameters:** `top_k`, `top_p`, `num_thread`, `mirostat` settings. ✅
    2.  **Support for Multiple `stop` sequences.** ✅
    3.  **Implement Tooltips/Info Icons for all parameters.** ✅
    4.  **Basic Input Validation.** ✅
    5.  **Develop Presets:** Implement a mechanism to select predefined sets of parameters (e.g., "Coding Focus," "Creative Writing," "Max Speed"). ✅
    6.  **Initial CSS Module (`AetherCreator.module.css`):** Apply consistent styling. ✅
*   **Success Metrics:** All Tier 1 parameters are configurable. Presets simplify common configurations. ✅

### Phase 1.2: AI-Assisted Configuration (Target: May 2025) ✅ COMPLETED

*   **Objective:** Implement an AI assistant to help users generate optimized Modelfiles based on their specific requirements.
*   **Tasks:**
    1.  **Create Backend Services:** ✅
        *   Implement `model_service.py` for unified model interactions. ✅
        *   Develop `modelfile_assistant.py` for AI-driven configuration generation. ✅
        *   Create API endpoint for generating Modelfiles. ✅
    2.  **Implement Frontend Components:** ✅
        *   Design and implement `AIAssistConfig.js` component. ✅
        *   Create premium UI with advanced animations and styling. ✅
        *   Integrate with existing AetherCreator tabs. ✅
    3.  **User Experience Enhancements:** ✅
        *   Add task description-based configuration. ✅
        *   Implement hardware profile selection. ✅
        *   Create one-click application of suggestions. ✅
        *   Add explanation components for educational purposes. ✅
*   **Success Metrics:** Users can describe their requirements in natural language and receive optimized model configurations that can be applied with one click. ✅

### Phase 2.0: Tier 2 Scaffolding - GGUF Creation (Target: Mid-Term)

*   **Objective:** Begin UI and backend planning for GGUF creation pipeline.
*   **Tasks:**
    1.  **Design UI for Base Model Selection (HF ID) and Quantization Choice.**
    2.  **Design UI for basic QLoRA configuration (dataset, key parameters).**
    3.  **Develop Backend API Stubs:** Define API contracts for triggering download, quantization, and PEFT (without full implementation yet).
    4.  **Frontend UI to call these stubbed APIs and display placeholder progress.**
*   **Success Metrics:** UI mockups and API contracts for Tier 2 are defined.

### Phase 2.x & 3.x: Full Tier 2 & Tier 3 Implementation (Target: Long-Term)

*   **Objective:** Fully implement advanced GGUF creation, optimization, benchmarking, and comparison.
*   **Tasks:** (Broad strokes, to be detailed per sprint)
    *   Full backend implementation for GGUF pipeline orchestration.
    *   Robust QLoRA fine-tuning integration.
    *   Implementation of AWQ/GPTQ conversion pathways (if feasible).
    *   Development of the benchmarking engine and results visualization UI.
*   **Success Metrics:** Users can create custom optimized GGUFs and benchmark them within AetherCreator.

## 6. Current Enhancements & Integration Points

### 6.1. AI-Assisted Modelfile Configuration (Implemented)

*   **Feature Description:** An AI-powered assistant that helps users generate optimized Modelfiles based on their specific requirements.
*   **Key Capabilities:**
    *   Analyzes user requirements and hardware constraints to suggest optimal model parameters.
    *   Generates tailored system prompts and templates that enhance model performance for specific tasks.
    *   Provides detailed explanations of parameter choices to educate users about model optimization.
    *   Automatically applies configuration to the AetherCreator interface for seamless workflow.
*   **Technical Implementation:**
    *   Frontend component (`AIAssistConfig.js`) with premium UI design.
    *   Backend service (`modelfile_assistant.py`) leveraging Ollama models to generate optimized configurations.
    *   Unified Model Service (`model_service.py`) for standardized model interactions across providers.
*   **User Experience:**
    *   Task-oriented interface where users describe what they want the model to do.
    *   Hardware profile selection to optimize for user's specific system capabilities.
    *   One-click application of AI-generated settings to the main interface.
    *   Educational explanations that help users understand parameter impacts.

### 6.2. Future Integration Points

*   **Integration with `MetaLoopLab`:** Use `AetherCreator` to design/optimize models that are then used in `MetaLoopLab` scapes.
*   **Integration with `AetherCanvas`:** Optimized models from `AetherCreator` can be easily selected for `AgentNode`s in `AetherCanvas`.
*   **Shared Model Registry:** A centralized place (potentially part of `Unified Model Management Service`) where models created/configured by `AetherCreator` can be registered and accessed by other suite components.
*   **Advanced AI-Driven Optimizations:** Expand the AI assistant to include:
    *   Adaptive learning from user preferences and successful configurations.
    *   A/B testing of different configurations to empirically determine optimal settings.
    *   Integration with benchmarking tools to validate and refine AI suggestions.
*   **Community Sharing:** Allow users to share their successful Modelfile configurations or even GGUF optimization recipes.

This document will be updated as development progresses and new insights are gained. 