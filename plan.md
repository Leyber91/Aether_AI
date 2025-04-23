# Aether Canvas — Megaplan: Development Blueprint (v5.1, 2025-04-22)

## Current Implementation State

| Feature ID | Feature Name                   | Implementation Status | Notes/Blockers                                      |
|------------|-------------------------------|----------------------|-----------------------------------------------------|
| F-01       | System-Check Wizard           | Complete             | Fully browser-based, robust onboarding.             |
| F-02       | Goal-to-Flow AI Wizard        | Complete             | Draft flow generation works, prompt can be improved.|
| F-03       | Canvas Editor & Node Grouping | Complete             | All core UX live.                                   |
| F-04       | Explain Panel                 | Partial              | UI stub exists; backend logs/tokens not wired yet.  |
| F-05       | Live VRAM Bar                 | Partial              | UI present, but not yet live data.                  |
| Node Inspector | Model selection, prompt suggestion, node execution | Partial | UI complete, backend integration for prompt suggestion and execution in progress. |
| ...        | ...                           | ...                  | ...                                                 |

### Known Blockers
- Node Inspector backend integration for prompt suggestion and node execution.
- Explain Panel: backend data wiring for logs/tokens.

## Conversation & Prompting System: Current State and Next Steps

- **Current:** Prompting in Goal-to-Flow and auto-naming uses multi-message context, retries, and fallback.
- **Next:** Enhance Node Inspector prompt suggestion with LLM fallback, better error handling, and user-editable context.
- **Planned:** Add contextual help/tooltips and more robust prompt validation.

## Next Steps Checklist

- [ ] Wire Explain Panel to backend for logs/tokens.
- [ ] Complete backend integration for Node Inspector prompt suggestion/execution.
- [ ] Enhance prompt fallback logic in Node Inspector.
- [ ] Add contextual tooltips/help to Node Inspector and Explain Panel.
- [ ] Continue UI/UX polish and modular CSS migration.

---

## April 2025 — Recent Progress Recap

### Canvas and Node System
- Refactored `AetherCanvas` to ensure robust memoization of `nodeTypes` and `edgeTypes`:
  - Moved memoization inside the component, after all handlers are defined, to avoid React Flow warnings and initialization errors.
  - Removed duplicate handler definitions, keeping code DRY and robust.
  - Confirmed all grouping, collapsing, and ungrouping logic remains functional.
- Restarted dev server and verified no runtime errors on initialization.

### Conversation Auto-Naming & Chat Enhancements
- Improved conversation auto-naming:
  - Enhanced title generation with better prompting, retries, fallbacks, and validation.
  - Made auto-naming fully automatic after a few messages, with robust error handling.
  - UI now features clear indicators for title generation, manual regeneration, and editing.
- Updated chat UI for better user experience:
  - Manual and automatic title generation buttons.
  - Visual feedback for title generation in progress and error states.

### Model/Backend Selection and Integration
- Node Inspector panel now manages backend/model selection reactively, using static Groq model list and live Ollama queries.
- Ensured model dropdown updates correctly when backend changes.

### Outstanding Issues / Next Steps
- React Flow warning may persist if any handler/state in nodeTypes/edgeTypes is not stable; further refinement may be needed.
- Deep-dive planned for `src/components/Chat` to analyze and ensure robust input/model/backend flow, especially for Groq/Ollama integration.
- Continue backend wiring for Explain Panel and Node Inspector prompt suggestion/execution.

---