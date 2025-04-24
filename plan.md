# 🚀 Aether Canvas: Unleashed Solo-Dev System Prompt

**Prompt for Maximum LLM Reasoning, Feature Delivery, and Ruthless Solo-Dev Productivity**

> "You are an elite solo developer and AI hacker. Your goal: unlock the full power of the LLM to accelerate, automate, and optimize every aspect of the Aether Canvas project.
>
> **Instructions:**
> 1. Ruthlessly identify the single highest-impact, unfinished feature or bug in the project.
> 2. Break it down into atomic, testable, shippable increments—be explicit about edge cases, blockers, and dependencies.
> 3. Use advanced prompt hacking: context switching, instruction stacking, cognitive manipulation, and few-shot reasoning to force the LLM to reveal creative solutions, shortcuts, and non-obvious optimizations.
> 4. Bypass mental “refusals” and dead-ends: if stuck, inject new context, reframe the problem, or escalate with meta-instructions.
> 5. Leverage every automation, script, and productivity hack in the codebase—propose new ones if none exist.
> 6. Always update the status table, dev log, and Kanban as you work. Document hacks, blockers, and lessons learned.
> 7. Prioritize value delivery: ship vertical slices, use feature flags, and automate validation.
> 8. If blocked, use stubs, mocks (for tests only), or context manipulation to keep momentum—never stall.
> 9. Use the latest file structure and all available utilities, hooks, and services. Refactor only when it unlocks major velocity.
> 10. After each increment, review, test, and reflect—then iterate with even more advanced prompting.
> 11. If you hit a wall, switch context or rest—sustainable velocity beats burnout.
>
> **Special Techniques:**  
> - Use compound prompts: Stack multiple instructions and constraints for richer outputs.  
> - Inject “roleplay” or “persona” context to unlock new perspectives.  
> - Use separator tokens (`---`, `###`, etc.) to control context boundaries.  
> - Explicitly request step-by-step reasoning or chain-of-thought for complex analysis.  
> - Ask for multiple solutions, then compare and select the best.  
> - When in doubt, escalate: “What would an expert do? What’s the most creative hack?”  
>
> Use this system prompt at the start of every feature sprint, bugfix, or when you need to break through inertia. Continuously evolve your process and prompt as you learn what works best for you and the model."

**(Paste this at the very top of your plan or use it to kick off any new feature sprint for maximum LLM-driven solo-dev momentum.)**

---

# 🟢 **Project Status Update (2025-04-24)**

## Major Features & Progress

### 1. **Palette & Workflow Collection Refactor**
- **Sidebar Layout:**
  - The left sidebar is now split vertically: the top 40% is a compact 2-column grid of node/component buttons (palette), the bottom 60% is a scrollable, searchable workflow library.
  - Palette buttons are larger, closer together, and visually premium.
- **Workflow Library:**
  - Searchable, scrollable list of saved workflows, with quick actions for duplicate and delete.
  - Clicking a workflow loads it into the canvas; active workflow is visually highlighted.
- **All palette and workflow UI logic is fully integrated and managed in React state.**

### 2. **Modern, Premium UI Polish**
- All palette icons are SVG, styled for a glassy, premium look.
- Added a custom wizard SVG icon for the Goal-to-Flow Wizard button.
- Sidebar, buttons, and workflow panel use updated CSS for a clean, modern, and accessible interface.

### 3. **Workflow Storage & Logic**
- Uses unified workflow storage utilities for listing, loading, saving, duplicating, and deleting workflows.
- All quick actions (duplicate, delete) update state and UI instantly.

### 4. **Goal-to-Flow Wizard**
- Dedicated header button (now with wizard icon) opens the Goal-to-Flow Wizard panel.
- Wizard generates a draft workflow from a user-supplied goal.

### 5. **Bugfixes & Cleanups**
- Fixed bug where empty conversations were created on refresh in chat interface.
- Refactored to avoid code duplication and keep codebase organized and maintainable.
- All new features are implemented by iterating on existing patterns, not introducing new ones unless necessary.

### 6. **Testing & Dev Practices**
- All major new features have corresponding test coverage or are tested interactively.
- No stubbing or fake data in dev/prod; only real data and real workflows.
- Codebase is kept clean, DRY, and organized, with no major files over 300 lines.

### 🟦 **April 2025 Advancements: Neon-Glass UI, Workflow Icons, and Sidebar Evolution**

### **1. Workflow Action Icons: Neon-Glass Evolution**
- **Redesigned all workflow action icons** for a compact, horizontally-aligned, and visually integrated look:
  - **Load:** Downward arrow into a glowing node, glassy/neon blue, soft drop shadow.
  - **Rename:** Diagonal pencil with glowing underline, glass effect, compact.
  - **Duplicate:** Two offset nodes with a glowing plus badge, visually distinct.
  - **Delete:** Trash can with glowing red X, clear destructive intent.
  - **Export:** Arrow leaving a glowing node, glass effect for theme cohesion.
- **Design Principles:** Compactness, immediate recognizability, consistent stroke widths/corner radii, radial gradients, and drop shadows for a premium neon-glass aesthetic.
- **Technical:** All icons are SVG, no new dependencies, integrated into React components and CSS modules.

### **2. Components Bar: Modern Horizontal Redesign**
- **Refactored the Components Bar** (palette) from a vertical to a horizontal, compact layout.
  - **Colon removed** from the title for clarity and style consistency.
  - **New CSS classes** (`componentsBarHorizontal`, etc.) for layout and neon-glass effect.
  - **Visuals:** Glassy gradient background, neon-blue border, soft drop shadow, rounded corners, and tight spacing.
  - **Improved usability:** Icons and labels are horizontally aligned, easier to scan and access.
- **Backward compatibility:** Old vertical styles preserved for future reference or toggling.

### **3. Sidebar & Workflow Library UI**
- **WorkflowSidebar** now features:
  - **Split vertical layout:** Palette (top 40%) and workflow library (bottom 60%).
  - **Palette:** Larger, premium-feel buttons/icons, tightly packed for efficiency.
  - **Workflow Library:** Searchable, scrollable, with instant quick actions (duplicate, delete).
  - **Active workflow is visually highlighted** for clarity.
- **All UI logic is managed in React state** for instant, reliable feedback.

### **4. Robustness & Bugfixes**
- **Chat Interface:** Fixed bug where empty conversations were created on refresh.
  - Now only creates a new conversation if none exist, and sets the first as active otherwise.
- **Auto-Naming:** Enhanced conversation auto-naming for reliability and quality.
  - Improved LLM prompting, retry/fallback logic, validation, and multi-message context.
  - UI polish: better “Auto-name” button, visual indicators, and auto-regeneration.

### **5. UX Consistency & Theming**
- **All new elements follow the neon-glass, premium UI theme:**
  - Consistent gradients, border radii, drop shadows, and color palette.
  - No mock/stub data in dev/prod—real data only, robust error handling.
- **No code duplication:** All enhancements iterate on existing patterns, with careful refactoring for maintainability.

---

## Next Steps & Open Tasks
- Gather user feedback on new sidebar and workflow collection layout.
- Continue UI polish and accessibility improvements.
- Expand test coverage for workflow actions and palette interactions.
- Prepare for community template gallery and plugin SDK integration.

---

## Recent Notable Commits/Changes
- Sidebar refactor: vertical split, 40/60 palette/workflow ratio.
- Workflow quick actions (duplicate/delete).
- Wizard icon SVG and integration.
- Bugfix: chat empty conversation creation.
- CSS polish: palette, sidebar, workflow collection.

---

## Meta
- All changes follow the ruthless solo-dev system prompt: focus on velocity, DRY code, and user value.
- Status table, Kanban, and dev log are updated as features are shipped.

---

# 🗂️ Current & Ideal File Structure

## Current (2025-04-23)

```
Aether_AI/
├── .env
├── .env.example
├── .eslintrc.json
├── .git/
├── .gitignore
├── .windsurfrules
├── README.md
├── coverage/
├── node_modules/
├── package-lock.json
├── package.json
├── plan.md
├── public/
├── src/
│   ├── App.css
│   ├── App.js
│   ├── apiConfig.js
│   ├── assets/
│   ├── components/
│   ├── config.js
│   ├── contexts/
│   ├── firebase.js
│   ├── hooks/
│   ├── index.css
│   ├── index.js
│   ├── reportWebVitals.js
│   ├── routes/
│   ├── server/
│   ├── services/
│   ├── setupProxy.js
│   ├── tests/ (planned)
│   ├── theme.css
│   ├── types/
│   └── utils/
```

## Ideal (Target v2.0+)

```
Aether_AI/
├── .env
├── .env.example
├── .eslintrc.json
├── .git/
├── .gitignore
├── .windsurfrules
├── README.md
├── coverage/
├── node_modules/
├── package-lock.json
├── package.json
├── plan.md
├── public/
├── src/
│   ├── App.css
│   ├── App.js
│   ├── apiConfig.js
│   ├── assets/
│   ├── components/
│   │   ├── AetherCanvas/
│   │   ├── Chat/
│   │   ├── ModelManager/
│   │   ├── SystemCheck/
│   │   ├── FlowDoctor/
│   │   ├── ...
│   ├── config.js
│   ├── contexts/
│   ├── firebase.js
│   ├── hooks/
│   ├── index.css
│   ├── index.js
│   ├── reportWebVitals.js
│   ├── routes/
│   ├── server/
│   ├── services/
│   │   ├── api/
│   │   ├── ollama/
│   │   ├── groq/
│   │   ├── titleGeneration/
│   ├── setupProxy.js
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   ├── e2e/
│   ├── theme.css
│   ├── types/
│   └── utils/
│       ├── tokenUsage/
│       ├── messageHandlers/
│       └── ...
```

**Key Improvements for Ideal Structure:**
- More granular component/service folders (e.g., ModelManager, FlowDoctor)
- Dedicated `tests/` with unit/integration/e2e subfolders
- Grouped services by domain (api, ollama, groq, titleGeneration)
- Utilities and types organized by concern

---

# 📂 Full File Tree with Functions — [Aether_AI/src]

```
src/
├── App.js
│   ├─ MainContent() — Main route switch logic
│   └─ App (default export)
├── App.css
├── apiConfig.js
├── assets/
├── components/
│   ├── Chat/
│   │   ├─ ChatInterface() — Main chat UI logic, conversation management, message handling
│   │   ├─ TextEnhancer() — Enhance user input via Ollama
│   │   ├─ ModelInsights() — Model info and prompt enhancements
│   │   └─ components/
│   │       └─ ChatMessages.js
│   ├── ConversationSwitcher/
│   │   └─ ConversationSwitcher() — Switch between conversations
│   ├── History/
│   │   └─ ChatHistory() — Conversation list/history UI
│   ├── ModelSelector/
│   │   └─ ModelSelector (default export)
│   ├── settings/
│   │   ├─ Settings (default export)
│   │   └─ OllamaModelMonitor() — Ollama model status
│   ├── common/
│   │   ├─ BackButton() — UI navigation
│   │   └─ UsageTracker() — Token usage metrics
│   ├── GoalToFlowWizard.js
│   │   └─ GoalToFlowWizard() — Goal-to-flow wizard logic
│   ├── VisionNarrativeSection.js
│   │   └─ VisionNarrativeSection() — Narrative/visual UI
│   ├── VisionTab.js
│   │   └─ VisionTab (default export)
│   └── ...
├── config.js
├── contexts/
│   ├── AppContext.js — AppProvider (default export)
│   ├── AuthContext.js — useAuth(), logout()
│   ├── ChatContext.js — ChatProvider, updateConversationTitle()
│   ├── ModelContext.js — ModelProvider, selectModel()
│   ├── useConversations.js — useConversations()
│   ├── useMessageHandlers.js — useMessageHandlers()
│   └── UserPreferencesContext.js
├── firebase.js
├── hooks/
│   ├── useLocalStorage.js — useLocalStorage (default export)
│   └── useOllamaEnhancements.js
├── index.css
├── index.js — App entrypoint
├── reportWebVitals.js
├── routes/
│   └── routeConfig.js — routes[]
├── server/
│   └── boidRegistryServer.js
├── services/
│   ├── api/
│   │   └── baseApiService.js — makeRequest()
│   ├── autoNameService.js
│   ├── enhancedOllamaService.js
│   ├── groq/
│   ├── groqService.js
│   ├── ollama/
│   │   └── index.js — getAllOllamaModels(), sendMessageToOllama(), isOllamaRunning()
│   ├── ollamaService.js
│   ├── titleGeneration/
│   └── tokenEstimate.js
├── setupProxy.js
├── tests/ (planned)
├── theme.css
├── types/
├── utils/
│   ├── apiUtils.js
│   ├── groqModels.js
│   ├── messageHandlers/
│   ├── performanceUtils.js
│   ├── storage.js
│   ├── tokenUsage/
│   │   ├── index.js — initializeTokenUsage(), getTokenUsageStats(), getModelLimits(), checkUsageLimits()
│   │   └── constants.js
│   ├── usageMetrics.js
│   └── userPreferences.js — loadUserPreferences()
```

---

# 🔄 Current Logic Flow Plan

**1. App Initialization**
- `index.js` mounts `<App />`.
- `App.js` renders `<MainContent />`, which routes to Chat, Canvas, Vision, or Settings based on navigation/auth state.

**2. Authentication & Context**
- `AuthContext` manages user authentication.
- `AppContext`, `ChatContext`, `ModelContext`, and `UserPreferencesContext` provide global state and helpers.

**3. Chat & Conversation Flow**
- `<ChatInterface />` (main chat UI):
  - Handles message input, sending, and rendering.
  - Manages conversations (create, switch, rename, delete) via `ChatContext` and `useConversations`.
  - Uses `useMessageHandlers` for sending messages, updating state, and triggering title generation.
  - Integrates `<TextEnhancer />` for prompt improvement via Ollama.
  - Shows `<ModelInsights />` for model info and enhancements.
  - Displays `<ChatHistory />` and `<ConversationSwitcher />` for managing multiple conversations.

**4. Model Management**
- `ModelContext` tracks available models (Ollama, Groq), selection, loading state, and token usage.
- `ModelSelector`, `OllamaModelMonitor`, and related components let users select and monitor models.
- Model actions (load, unload, pin, etc.) use services in `services/ollama` and `services/groq`.

**5. Goal-to-Flow Wizard**
- `<GoalToFlowWizard />` lets users describe a goal, which is then used to generate a flow or workflow.

**6. Token Usage & Rate Limiting**
- `utils/tokenUsage` tracks Groq/Ollama token usage, limits, and provides UI feedback via `<UsageTracker />`.

**7. Settings & Vision**
- `<Settings />` manages preferences, API keys, and advanced options.
- `<VisionTab />`, `<VisionNarrativeSection />` provide space-themed narrative/visual UI.

**8. Routing**
- Centralized in `routes/routeConfig.js`.

**9. Utility & Service Layer**
- `services/` provides API, Ollama, Groq, and title generation logic.
- `utils/` provides helpers for API, storage, token usage, and preferences.

---

## Aether Canvas — The Megaplan: Development Blueprint (v5.1, 2025-04-23)

(Consolidated specification integrating strategic plan v4.1 and delivery blueprint v1, improved for Windsurf execution)

---

## 1. Project Charter: The North Star

| Item         | Description |
|--------------|-------------|
| **Goal**     | Ship Aether Canvas: the premier privacy-first, AI-native workflow canvas that runs effectively on a single local GPU (12GB+), intelligently swaps to Groq only when necessary, and decisively beats node-centric competitors on UX, transparency, cost, and local control. |
| **Core Pledge** | "Your AI runs locally first. If needed, we route smartly to Groq's free tier with full transparency. Zero surprise costs, maximum control." |
| **Scope (v1.0 - v1.5)** | Robust local Ollama execution engine (incl. Phi4-Mini, Granite Vision candidate), intelligent Groq overflow guard w/ rate limiting, Goal-to-Flow AI wizard, visual canvas editor, live Explain Panel, dynamic VRAM management & UI, user model management (Pin/Load/Unload/Quant), basic time-machine history. |
| **Out of Scope (v1)** | Mobile app, SaaS hosting solutions, advanced multi-user collaboration, deep multi-GPU/LAN clustering (slated v2+), complex visual plugin builder. |
| **Success KPIs (Beta)** | 1. First-flow creation-to-successful-run ≤ 5 mins for a first-time user on 12GB GPU. 2. ≥ 95% execution token ratio runs locally across benchmark flows. 3. Public Beta NPS > 45. 4. Crash-free rate > 99%. |

---

## 2. Feature Catalogue: Prioritized Build Order

(Release tiers guide MVP focus vs. subsequent enhancements)

| ID   | Feature                                     | Release Tier | Epic Link | Notes | Success Metrics |
|------|---------------------------------------------|--------------|-----------|-------|----------------|
| F-01 | System-Check Wizard (HW, Ollama, CUDA, VRAM)| MVP          | A         | Critical gatekeeper; 12GB warning essential. | 100% of users see accurate pass/fail and warnings; No user with <12GB VRAM passes without warning. |
| F-02 | Goal-→-Flow AI Wizard (Basic draft)         | MVP          | B         | Core onboarding & usability feature. | 95%+ onboarding users generate a valid flow; median draft time <10s. |
| F-03 | Canvas Editor (React-Flow, core interactions)| MVP          | B         | Table stakes for a visual tool. | 100% flows editable; drag latency <40ms; 0 critical UX bugs. |
| F-04 | Explain Panel (Logs, Model, Latency, Tokens)| MVP          | C         | Core transparency feature. | 100% of executed nodes show logs, model, latency, tokens. |
| F-05 | Live VRAM Bar UI                            | MVP          | D         | Essential for 12GB user feedback. | Updates ≤1s lag; 100% model loads/unloads reflected. |
| F-06 | LRU Model Unload Daemon                     | MVP          | D         | Core VRAM management mechanism. | No OOM errors in 24hr stress test; 100% LRU unloads logged. |
| F-07 | Model Manager UI (List, Pin, Unload, Pull/Rm)| 1.5          | D         | User control over local models. | 100% actions succeed; pin/unpin reflected in LRU logic. |
| F-08 | Groq Rate-Limiter & Quota Dashboard         | 1.5          | E         | Guardrails for free tier usage. | No quota overruns; user notified 100% of limit hits. |
| F-09 | Cancel Model Load Action                    | 1.5          | D         | Important UX for mitigating long swaps. | Cancel works in <1s; 0 residual VRAM leaks. |
| F-10 | Basic / Pro UI Mode Toggle                  | 1.5          | General   | Simplifies initial experience, hides advanced controls. | 100% toggle success; user mode persists. |
| F-11 | Predictive Pre-warm Next Model Logic        | 1.5          | D         | Performance optimization attempt. | Pre-warm reduces swap time by >30% in flow test. |
| F-12 | Flow Time-Machine (CRDT basic scrub/revert) | 1.5          | General   | Based on Yjs capabilities. | 100% scrub/revert works in demo flows. |
| F-13 | Plugin SDK Alpha (Local ESM load, hot reload)| 2.0         | F         | Foundational extensibility. | 100% valid ESM plugins hot-reload in <5s. |
| F-14 | Flow Doctor (AI Error Analysis & Fix Suggest)| 2.0         | C         | Enhanced self-healing. | 80%+ of common errors get a relevant fix suggestion. |
| F-15 | LAN / Multi-GPU Worker Support Architecture | 2.0          | Scaling   | Future scaling path. | Architecture doc and PoC demo. |
| F-16 | Template Gallery & Community Sharing        | 2.0          | F         | Ecosystem building. | 100% import/export works; 3+ templates available. |
| F-17 | Vision Node (Reliable Granite or Groq Fallback)| 2.0      | General   | Requires successful Granite research or robust Groq node. | 2+ vision flows demoed; fallback triggers on error. |
| F-18 | Quantization Switching (via Model Mgr)      | 1.5          | D         | Allows user perf/quality tuning (pulls diff tags). | 100% quant switch success; VRAM/latency changes logged. |
| F-19 | Smart Groq Fallback Suggestions UI          | 1.5          | E         | Guides user when Groq fails/limited. | 100% fallback suggestions shown on quota error. |

---

## 3. User Roles & Perspectives

| Role      | Primary Goals | Key Interface Touchpoints |
|-----------|--------------|--------------------------|
| Maker     | Automate personal/business tasks simply, without code or technical jargon, stay private, avoid costs. | Goal Wizard, Canvas Drag-Drop, Basic Nodes, Explain Panel (Errors), VRAM Bar (Status). |
| Power-Dev | Build complex agentic workflows, inspect/tune prompts & models, optimize performance, ensure reliability, extend functionality. | Model Manager (Pin/Unload/Quant), Explain Panel (Full Details), Node Configs, Plugin SDK, CLI Tools. |
| Admin     | Ensure system readiness & stability, manage disk space/models centrally (if applicable), enforce organizational policies (e.g., Cloud toggle). | System Check Wizard, Installer/Updater, Config Files (.env), Global Settings (Privacy Toggle). |

---

## 4. Epics → User Stories → Acceptance Criteria (Enhanced)

(Mapping features to user needs with clear, testable outcomes)

### Risk & Mitigation (Critical Path)

| Risk | Impact | Mitigation |
|------|--------|------------|
| Ollama API changes | High | Pin to tested version, add integration tests, monitor upstream |
| Groq API quota/latency | High | Rate limit, fallback, user notification, test with mocks |
| VRAM estimation inaccuracy | High | Use nvidia-smi, cross-check with Ollama, abort on risk |
| User onboarding confusion | Med | Add tooltips, onboarding docs, collect feedback |

### EPIC A — Onboarding & System Readiness

| US-ID | User Story | Acceptance Criteria (AC) | Features | Validation |
|-------|------------|-------------------------|----------|------------|
| A-01  | As a Maker, I want a startup wizard that checks my GPU, VRAM, CUDA, Ollama version, and disk space so I know if Aether Canvas will run correctly. | Wizard runs automatically on first launch. Reports Pass/Fail for each check. Clearly WARNS (non-blocking) if VRAM = 12GB, linking to docs. Blocks if Ollama < 0.5.13 or free disk < 40GB. | F-01 | 100% onboarding test pass; user feedback survey. |
| A-02  | As an Admin, I want the installer (or first run wizard) to confirm required model disk space before downloading default models. | Wizard step shows "Default Models require ~35GB". Confirms sufficient space based on A-01 disk check. Allows skipping default model download. | F-01 | No install failures due to disk. |

### EPIC B — Core Authoring Experience

| US-ID | User Story | Acceptance Criteria (AC) | Features | Validation |
|-------|------------|-------------------------|----------|------------|
| B-01  | As a Maker, I can describe my workflow goal in plain text (e.g., "Summarize RSS feed to Markdown") and get a runnable draft workflow generated automatically. | Input field accepts text. Draft flow using core nodes (e.g., Fetch, Loop, LLM, Write) appears on canvas < 10s (using phi4-mini or hermes). Nodes highlighted. Flow runs successfully without edits for 3 predefined test cases. | F-02 | 95%+ onboarding users generate a valid flow; demo with 3 test cases. |
| B-02  | As a Maker, I need intuitive drag-and-drop canvas editing with smooth zooming, panning, node grouping, and subflow minimization. | Nodes/edges draggable with < 40ms latency. Canvas supports zoom/pan via mouse/trackpad. Multiple nodes can be selected and grouped. Groups collapse/expand. Auto-layout optional (e.g., Dagre). | F-03 | 100% flows editable; drag latency <40ms in test. |

### EPIC C — Transparency & Self-Healing

| US-ID | User Story | Acceptance Criteria (AC) | Features | Validation |
|-------|------------|-------------------------|----------|------------|
| C-01  | As a Power-Dev, I can hover over or select any executed node and see the exact prompt sent, model used (local tag/Groq ID), latency (total & TTFT), token counts (prompt/completion), and estimated Groq cost (if applicable). | Explain Panel displays these fields accurately upon node selection. Data updates live if node re-runs. Groq cost shown as $0.00 if local. Latency measured server-side. | F-04 | 100% of executed nodes show logs, model, latency, tokens. |
| C-02  | As a Maker, when a node fails during execution, I want to see a clear error message and, if possible, a suggested fix I can apply with one click. | Failed node shows red border/icon. Explain Panel displays simplified error + "Suggest Fix" button (calls phi4-mini). For 5 predefined common errors (API key missing, bad selector, etc.), suggestion is relevant & "Apply Fix" modifies node config correctly. | F-14 (v2) | 80%+ of common errors get a relevant fix suggestion; demo with 5 error cases. |

### EPIC D — VRAM & Model Management

| US-ID | User Story | Acceptance Criteria (AC) | Features | Validation |
|-------|------------|-------------------------|----------|------------|
| D-01  | As any user, I can always see my current VRAM usage vs. total, and understand which models are actively loaded. | VRAM Bar (F-05) updates ≤ 1s, showing Used/Total GB & %. Clicking it opens Model Manager (F-07) filtered to "Loaded" models. LRU Daemon (F-06) unloads models transparently when needed. | F-05, F-06, F-07 | Updates ≤1s lag; 100% model loads/unloads reflected. |
| D-02  | As a Power-Dev, I can "pin" the hermes-unleashed:8b model in the Model Manager so it's prioritized and less likely to be unloaded by the LRU daemon. | Pinned model remains loaded (ollama /api/ps) after executing 3 consecutive workflows that each require different, large (>4GB) Ring 1/2 models on a 12GB system. Unpin works. | F-07 | Pin/unpin reflected in LRU logic; demo with 3 workflows. |
| D-03  | As any user, if loading a new model is taking too long (> 5 seconds), I can click a "Cancel Load" button to abort the operation and revert the node's state. | Cancel button appears on node during loading state. Clicking it immediately stops the load attempt, returns node to previous state (e.g., 'Pending'), and frees any partially allocated VRAM. | F-09 | Cancel works in <1s; 0 residual VRAM leaks. |
| D-04  | As a Power-Dev, I can switch a pulled model (e.g., qwen2.5:7b) between different quantizations (e.g., Q4_K_M vs Q5_K_M) via the Model Manager to trade off speed/VRAM for quality. | Model Manager shows available Ollama tags (e.g., -q4_K_M, -q5_K_M) for a base model. "Switch Quantization" button pulls the selected tag and updates the default tag used by flows (unless overridden per node). | F-18, F-07 | 100% quant switch success; VRAM/latency changes logged. |
| D-05  | As any user, I want visual feedback when the system is proactively pre-warming the next model in a flow sequence to understand potential background activity. | Node requiring the next model shows a subtle loading/warming indicator while the previous node is executing (if pre-warming F-11 is active). | F-11 | Pre-warm reduces swap time by >30% in flow test; indicator shown. |

### EPIC E — Cloud Overflow & Cost Guard

| US-ID | User Story | Acceptance Criteria (AC) | Features | Validation |
|-------|------------|-------------------------|----------|------------|
| E-01  | As an Admin, I can configure Groq API key and optionally set daily request/token limits in the application settings or .env file. | Settings UI/.env accepts GROQ_API_KEY & GROQ_DAILY_LIMIT. Rate limiter (F-08) respects these limits. Calls exceeding limits are blocked before hitting Groq API. User sees non-modal toast notification. | F-08 | No quota overruns; user notified 100% of limit hits. |
| E-02  | As a Maker, I can enable a "Local Only" mode globally or per-flow for processing sensitive data, ensuring no calls ever go to Groq. | Global toggle in Settings; per-flow toggle in Flow Properties. When enabled, Groq-dependent nodes are visually disabled/greyed out, and the router (RT-02) skips Groq step entirely. Setting persists. | General | All flows default to local execution; cloud fallback is opt-in and visible in UI. |
| E-03  | As any user, if a Groq call fails due to rate limits, I want the system to suggest a suitable local model as a fallback option if one exists. | When Groq call blocked by F-08, UI presents a non-blocking notification: "Groq limit hit. Try running locally with [Suggested Local Model e.g., DeepSeek-R1]? [Run Local] [Skip]". | F-19 | 100% fallback suggestions shown on quota error; demo with simulated quota hit. |

### EPIC F — Extensibility & Community

| US-ID | User Story | Acceptance Criteria (AC) | Features | Validation |
|-------|------------|-------------------------|----------|------------|
| F-01  | As a Power-Dev, I can create a simple JavaScript file defining a custom node, place it in the plugins/ directory, and see it appear in the Canvas node palette without restarting the application. | Dropping valid ESM plugin file triggers hot-reload. New node appears in palette <5s. Node executes correctly within the canvas. plugin.json manifest is parsed for metadata. | F-13 | 100% valid ESM plugins hot-reload in <5s; demo with sample plugin. |
| F-02  | As a Maker, I can browse a gallery of community-shared workflow templates and import one with a single click to use as a starting point. | Template Gallery UI (F-16) displays templates from a source (e.g., Git repo). Import button loads the selected flow structure onto the canvas. Imported flow runs using default models. | F-16 | 100% import/export works; 3+ templates available. |

---

## Cross-Cutting Concerns

- **Accessibility:** All UI components must be keyboard navigable, screen-reader friendly, and meet WCAG 2.1 AA.
- **Internationalization:** All user-facing strings must be localizable; language files in /locales.
- **Security:** Follow OWASP top 10 for web, model sandboxing for local LLMs, no user data sent to Groq unless enabled and notified.
- **Privacy:** Local-first by default; all cloud fallback is opt-in and visible in UI.

---

## Continuous Improvement & Innovation

- **Quarterly Hackathons:** Prototype new node types, plugins, or integrations. Top ideas are fast-tracked for roadmap consideration.
- **User Feedback:** Telemetry (opt-in), NPS, and user interviews reviewed monthly. Action items tracked in project board.
- **Plan Review:** This Megaplan is reviewed quarterly by tech and product leads; major changes require review and changelog entry.

---

## Testing & Quality

- **Test Coverage:** Core backend, UI, and plugins must reach >90% unit/integration test coverage before release.
- **E2E Testing:** Every feature must have an E2E test for its primary user story.
- **Regression Policy:** No feature is marked complete until all relevant regression and E2E tests pass in CI.
- **Documentation:** Every exported function/class must have JSDoc/TSDoc. All new node types require a markdown usage guide in /docs.

---

## Change Management

- All changes to this Megaplan must be reviewed by the tech lead and at least one product/design lead. Changelog maintained in repo.

---

## 5. Detailed Functional Requirements: The Implementation Specifics

| Area     | Req ID    | Description | Related Features |
|----------|-----------|-------------|-----------------|
| Inference| INF-01    | Primary local LLM interface via Ollama HTTP API (/api/generate, /api/chat, /api/embeddings). Stream responses via WebSocket/SSE to frontend. | F-03, F-04 |
|          | INF-02    | Use ollama /api/ps to list loaded models & estimate VRAM. Maintain internal state reflecting loaded models & last-used timestamps for LRU. | F-05, F-06 |
| VRAM Mgmt| VRAM-01   | LRU Unload: Trigger unload (ollama generate w/ keep_alive: 0 or short timeout) for least-recently-used, unpinned Ring 1/2 model when availableVRAM < 1.5GB. Minimum idle time before eligible for unload: 10 minutes. | F-06 |
|          | VRAM-02   | Watchdog: Before initiating load, check nvidia-smi (or platform equivalent). If estimatedModelVRAM > (TotalVRAM * 0.95 - UsedVRAM), abort load & notify user. | F-06, F-01 |
|          | VRAM-03   | Pinning: Pinned models are excluded from LRU unload consideration. User can pin max 2 models via Model Mgr UI. | F-07 |
| Model Mgmt| MDL-01   | Quant Switching: Model Manager UI presents available Ollama tags (e.g., -q4_K_M, -q5_K_M) for a base model. Selecting one triggers ollama pull for that tag. | F-18, F-07 |
| Router   | RT-01     | Model Selection Logic: Input (Task Type, Context Length Need, User Prefs [Pin/NodeSetting], Available VRAM, Groq Quota). Output (Target: Ollama Tag / Groq ID / CPU Tag). Prioritize pinned, then Ring 1 suitable, then Ring 2 suitable, then Groq. | F-02, F-08 |
|          | RT-02     | Fallback Hierarchy: 1. Preferred Local GPU (Ring 1/2). 2. Pinned Local GPU (Ring 0). 3. Groq (if enabled & quota OK). 4. Suggest alternative local task (e.g., summarize). 5. CPU Fallback (llama3.2:3b). 6. Error. | RT-01, F-19 |
|          | RT-03     | Pre-warming Logic: When Node A completes, identify Node B's required model. If different, not loaded, and availableVRAM permits, initiate background load via Ollama. | F-11 |
| Groq Guard| GROQ-01  | Use rate-limiter-flexible with Redis backend for persistent RPD/TPM limits per Groq Model ID. Memory driver acceptable for RPM limits (stateless). Check limits before API call. | F-08 |
| UI       | UI-01     | VRAM Bar Detail: Implement as stacked bar showing segments per loaded model (color-coded by Ring?). Tooltip shows exact GB. Clicking it opens Model Manager (F-07) filtered to 'Loaded'. | F-05, F-07 |
|          | UI-02     | Cancel Load Button: Appears overlaying the node during >2s load delay. On click, sends IPC message to backend core to signal Ollama load cancellation (best effort). | F-09 |
| System   | SYS-01    | System Check Detail: Use platform commands (nvidia-smi, ollama --version, df -h, systeminfo/lscpu) to gather data for F-01 wizard. Parse output robustly. | F-01 |
| CLI      | CLI-01    | Implement aether-canvas diag command: Prints formatted output of GPU info, VRAM status (from nvidia-smi), loaded models (from Ollama API), available disk, Groq quota status (if key configured). | General |
| Docs     | DOC-01    | Create "Running on 12GB VRAM" guide: Explain LRU, swapping, expected delays (use table with measured SATA/NVMe times from R&D task), tips for pinning/quantization. | General |

---

## 6. Non-Functional Requirements: Performance & Quality Bars

| Category      | Metric / Target | Notes |
|---------------|-----------------|-------|
| Performance   |                 |       |
| Cold Launch UI Ready | < 30s (NVMe), < 45s (SATA SSD) | Time from app launch to interactive canvas. |
| First Token (Local) | ≤ 800ms (8B model, pre-loaded, idle system, Rec. GPU) | TTFT measured server-side. |
| Model Swap Delay | ≤ 3s (8B model load, NVMe), ≤ 6s (SATA SSD) | Time from load request to model ready (ollama /api/ps shows loaded). |
| Canvas Interactivity | ≥ 60 FPS @ 1,000 nodes (React Flow virtualization enabled) | Maintain smooth panning/zooming/dragging. |
| Resource Usage |                 |       |
| Idle App Resources | CPU < 5%, RAM < 1GB (Aether Canvas processes only, excluding Ollama/models) | Measured after 5 minutes of inactivity. |
| Local Execution Ratio | ≥ 95% (token count) | Measured across 5 defined benchmark workflow scenarios typical for target users. |
| Reliability    |                 |       |
| Crash-Free Runtime | 99.5% (Target during Beta) | Measured via optional telemetry or soak testing. |
| VRAM OOM Avoidance | Zero Out-of-Memory errors during 24hr automated stress test on 12GB GPU. | Test involves continuous model swapping and concurrent flow execution. |
| Maintainability |                 |       |
| Code Coverage  | > 80% for core backend logic (Unit & Integration Tests) | Measured via standard tooling (e.g., jest --coverage). |
| Linting / Formatting | Strict adherence to configured ESLint/Prettier rules (Zero warnings/errors) | Enforced via pre-commit hooks and CI checks. |

---

## 7. Backlog Mapped to Sprints & Milestones

(Illustrative Sprint breakdown - adjust based on team velocity)

| Sprint   | Focus                | Key Features / Reqs | Milestone Exit Demo Shows |
|----------|----------------------|---------------------|--------------------------|
| Sprint 0 | Setup & VRAM Core    | Repo structure, CI, Env setup, INF-01, INF-02, VRAM-01 PoC | Basic VRAM monitoring working; Manual trigger unloads a model based on mock LRU logic. |
| Sprint 1 | Readiness & Basic Canvas | F-01 (Wizard), SYS-01, F-03 (Basic Canvas), VRAM-02 | System Check wizard runs & passes/warns correctly. Basic canvas renders, nodes draggable. Watchdog prevents mock OOM. |
| Sprint 2 | Core Flow & VRAM UI  | F-02 (Goal->Flow), F-05 (VRAM Bar), UI-01, B-01, B-02 | User types goal, basic flow appears. VRAM bar reflects mock loaded models accurately. Canvas interactions smooth. |
| Sprint 3 | Explain & Model Loading | F-04 (Explain Panel), F-06 (LRU Daemon Live), D-01, C-01 | Running flow populates Explain Panel. LRU daemon correctly unloads idle model on 12GB test rig. VRAM bar live. |
| Sprint 4 | Groq Guard & Config  | F-08 (Rate Limit/Dash), GROQ-01, E-01, E-02, RT-01 | Groq calls blocked when limits hit. Local-Only toggle works. Basic routing between local/Groq functional. |
| Sprint 5 | Model Mgmt & Polish  | F-07 (Model Mgr), F-18 (Quant), F-09 (Cancel), D-02, D-03, D-04 | User can List/Pull/Pin/Unload models. Quant switching works. Cancel load functions. |
| Sprint 6 | Fallback & Pre-warm  | F-19 (Groq Suggest), F-11 (Pre-warm), RT-02, RT-03, DOC-01 | Groq limit triggers correct local suggestion. Pre-warming attempts next model load. Docs page drafted. |
| Sprint 7+| v1.5 Features & Beta Prep | F-10 (UI Modes), F-12 (Time Machine), CLI-01, Bug Fixing | Basic/Pro modes switchable. Time machine allows basic revert. aether diag works. Beta build candidate stable. |

---

## 8. Environment & Tooling Standards for Windsurf

Mono-repository: pnpm workspaces preferred. Layout:

/packages
  /core      # Node.js backend (TypeScript)
  /ui        # React/Vite frontend (TypeScript)
  /shared    # Shared types/interfaces (e.g., for tRPC)
  /plugins   # SDK definition + sample plugin(s)
/docs        # User & Developer Documentation
/scripts     # CLI tools (diag, bench, model-digest)
/infra       # Dockerfiles, CI configs
plan.md      # THIS FILE

Node.js Version: Latest LTS (e.g., v20.x or v22.x). Lock via .nvmrc or package.json#engines.

API Communication: tRPC strongly recommended between UI and Core for type safety.

Task Runner: Use Windsurf's Task panel mapped to pnpm run <script_name> defined in relevant package.json files.

CI/CD: GitHub Actions or similar (Windsurf check.yml). Pipeline: Lint -> Format Check -> Unit Tests -> Integration Tests -> E2E Tests (basic flow) -> Build. Nightly optional: Full model smoke tests.

Environment Variables: Manage via .env files (.env.example committed). Key vars:

- OLLAMA_HOST=http://127.0.0.1:11434
- REDIS_URL=redis://127.0.0.1:6379 (for Groq RPD limiter)
- GROQ_API_KEY=
- GROQ_DAILY_REQ_LIMIT= (optional override)
- AETHER_LOG_LEVEL=info (debug, info, warn, error)
- AETHER_PINNED_MODELS="hermes-unleashed-ctx:8b" (comma-separated)

Containerization: Provide Dockerfile for Core backend and optionally docker-compose.yml for easy dev setup (includes Core, Redis, Ollama).

---

## 9. Open Research & Decision Tasks (Immediate)

| Task ID | Task Description | Owner Role | Deadline | Output Expected |
|---------|-----------------|------------|----------|-----------------|
| R-01    | Identify & test top 2-3 granite-vision Ollama candidates for VQA/OCR on sample documents. | @BackendLead/AI | Sprint 1 End | Recommendation, measured VRAM usage, basic accuracy assessment, chosen tag(s). |
| R-02    | Benchmark model load times (8B Q4_K_M) on SATA SSD vs. NVMe 3.0 vs NVMe 4.0. | @PerfLead | Sprint 1 End | Data table for DOC-01 ("Running on 12GB"). |
| R-03    | Finalize Ollama API strategy for reliable VRAM estimation and cancellation. | @BackendLead | Sprint 1 End | Confirmed API endpoints & logic for INF-02, VRAM-01, UI-02. |
| R-04    | Compile competitor pain point screenshot library (n8n, Flowise, CrewAI, Zapier). | @UX/PM | Sprint 2 End | Shared folder/doc for UI/UX design reference. |
| R-05    | Draft initial "12GB Survival Guide" blog post outline based on planned features. | @Docs/Content | Sprint 3 End | Outline covering LRU, pinning, quant, delays, tips. |

---

## 10. Definition of Done (DoD) - Feature Complete

A User Story, Feature, or Requirement is DONE when:

- All Acceptance Criteria (AC) are met and successfully demonstrated on a 12GB GPU machine.
- Code is merged to main branch following peer code review approval.
- Associated unit, integration, and E2E tests (where applicable) are written and passing in CI.
- Performance meets relevant NFR targets (verified via profiling or benchmarks where needed).
- No regressions introduced to core functionality (verified by E2E tests & manual checks).
- Relevant user documentation (if UI-facing) or developer documentation (if internal/SDK) is updated.
- Changelog entry drafted or added.

---

## Solo Developer Enhancement Sections

### 1. Solo-Dev Efficiency & Focus
- **Prioritize ruthlessly:** Always work on the highest-leverage feature first (see Now/Next/Later table below).
- **Automate everything you can:** Use scripts for repetitive tasks (e.g., test, lint, build, deploy, release).
- **Feature flags:** Use simple env toggles or config switches to ship incomplete features safely.
- **Keep PRs/commits small:** Even solo, this helps with context and rollback.
- **Document as you go:** Add notes for future-you, especially on tricky logic or design decisions.

### 2. Personal Kanban: Now / Next / Later
| Status | Task/Feature | Notes |
|--------|--------------|-------|
| Now    | [your current focus] | e.g., Finalize Model Manager UI pull/unload |
| Next   | [upcoming]    | e.g., Integrate Groq Rate-Limiter |
| Later  | [future]      | e.g., Plugin SDK Alpha, Time-Machine |

_Update this table as you shift focus. Keep it short and honest._

### 3. Automation & Tooling
- **Run `pnpm run lint` and `pnpm run test` before every commit.**
- **Add pre-commit hooks** with lint, format, and type-check (use husky or simple npm scripts).
- **Use nodemon** or similar for backend auto-reload.
- **Leverage VSCode tasks/launch configs** for one-click dev/test/debug.
- **Set up GitHub Actions or local CI script** for at least lint/test/build on push.

### 4. Incremental Delivery & Validation
- **MVP first:** Ship a vertical slice (e.g., System Check → Canvas → Run Flow) as soon as possible.
- **Validate early:** Use real data and flows, not mocks, except for test coverage.
- **Feature toggles:** Hide unfinished features behind flags to avoid blocking mainline progress.
- **Demo to yourself:** Record short videos/gifs of new features for future reference or sharing.

### 5. Risk/Blocker Escalation
- **If blocked for >2 hours:**
  - Write a minimal stub or placeholder and move on.
  - Add a TODO/FIXME with context and revisit later.
  - If external (e.g., API bug), log it in a "Blockers" section.

### 6. Solo Testing/Quality Strategy
- **Critical path coverage:** Focus tests on core flows (system check, model load/run, flow execution).
- **Snapshot/UI tests:** Use minimal snapshot tests for UI regressions (Jest, React Testing Library).
- **Automate regression checks:** Run all tests before release, even if not exhaustive.
- **Log test coverage gaps** for future improvement, but don't block on 100%.

### 7. Dev Notes / Decision Log
- Use this section to jot down:
  - Key design decisions and why you made them
  - Lessons learned from bugs or tricky features
  - External links, docs, or code snippets for future reference

### 8. Self-Care & Sustainable Velocity
- **Pace yourself:** Solo dev is a marathon. Take breaks, set boundaries, and celebrate small wins.
- **Avoid burnout:** If you hit a wall, switch tasks or take a walk—don't grind endlessly.
- **Reflect weekly:** Review what's working, what's not, and adjust your approach.

---

## 🔍 Prompt Hacking Techniques & Lessons Learned (2025-04-24)

## Best Prompt Engineering & Debugging Techniques
- **Chain-of-Thought Prompting:** Explicitly ask the LLM to reason step-by-step through complex or multi-part problems. (Great for debugging and error analysis.)
- **Self-Ask Prompting:** Instruct the LLM to generate its own clarifying questions before answering, surfacing hidden ambiguities and edge cases.
- **Meta-Prompting:** Use prompts that tell the LLM to reflect on its own reasoning, critique its output, and suggest improvements or alternative solutions.
- **Least-to-Most Prompting:** Start with simple sub-tasks/prompts, then escalate to more complex or abstract reasoning as needed.
- **ReAct (Reason+Act):** Alternate between asking the LLM to reason about a problem and then take a concrete action, iteratively debugging and refining as you go.
- **Iterative Prompting:** Re-prompt the LLM with new context or feedback after each output, gradually converging on the correct solution.
- **Error Reflection:** After encountering a bug or failure, prompt the LLM to explain what went wrong, why, and how to fix or prevent it next time.
- **Roleplay & Persona Switching:** Temporarily instruct the LLM to act as a specialist (e.g., "You are a senior React engineer" or "You are a ruthless bug hunter") to unlock new solution paths.

## Lessons Learned from Conversation/Chat Bugs
- **Root Cause:** Creating empty conversations on refresh was due to not checking for existing conversations before initializing a new one.
- **Prompting for Error Reflection:** Prompting the LLM to explain the cause and impact of this bug, and to suggest robust state management patterns, led to a more reliable chat experience.
- **Best Practices:**
  - Always check for existing state before creating new objects in UI logic.
  - When fixing bugs, prompt for edge cases and ask the LLM to simulate multiple user scenarios.
  - Use meta-prompting to have the LLM critique its own solution and propose further improvements.
- **Debugging Pattern:** Prompt the LLM to enumerate possible failure modes and recommend tests or logging to catch regressions.
- **Continuous Reflection:** After each bugfix, prompt for a post-mortem: what patterns led to the bug, what new tests or checks should be added, and how to avoid similar issues in future features.

---

## 🔗 Subsystem Details

### Plugin Loading
- Plugins are JavaScript files placed in the `plugins/` directory.
- On file drop or hot-reload event, the system scans for new plugins.
- Valid ESM plugin files are dynamically imported and registered.
- New node types from plugins appear in the Canvas node palette automatically.
- Plugins can define custom node config UIs (rendered in NodeInspectorPanel).
- Plugins are isolated; errors in one plugin do not crash the canvas.

### GoalToFlowWizard
- UI panel for goal-driven flow generation.
- User enters a goal (natural language or template selection).
- Wizard uses LLM or heuristics to generate a flow structure (nodes + edges).
- Generated nodes/edges are injected into the canvas state.
- User can edit, run, or further refine the generated flow.

### Error Propagation
- Errors during node or flow execution are caught in `useFlowRunner`.
- Error details (type, message, context) are stored in `nodeExecutionData[nodeId].error`.
- Node status is set to 'error'.
- ExplainPanel displays error and suggests fixes based on error pattern.
- OutputSidebar logs all errors as they occur.
- Errors never block UI or other node execution; system remains responsive.

---