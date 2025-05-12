import { useState, useRef, useCallback, useEffect } from "react";
import { API_BASE_URL } from "../../../api/apiService";
import { createAgentConfig } from "../domain/agentConfig";
import { formatPriorContext, formatUserPromptContent, extractTrailingJson, createMessage } from "../domain/messageUtils";
import { fetchOllamaStream, simulateProviderResponse, saveLoopConversation } from "../services/llmService";

// Reflector memory API endpoints
const REFLECTOR_MEMORY_API = 'http://localhost:4001/api/reflector_memory';

// JSON file persistence utility functions
const readReflectorMemory = async () => {
  try {
    const response = await fetch(REFLECTOR_MEMORY_API);
    if (!response.ok) {
      console.warn(`Failed to fetch reflector memory: ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (err) {
    console.warn('Failed to read reflector memory from file:', err);
    return null;
  }
};

const writeReflectorMemory = async (data) => {
  try {
    const response = await fetch(REFLECTOR_MEMORY_API, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.ok;
  } catch (err) {
    console.error('Failed to write reflector memory to file:', err);
    return false;
  }
};


/**
 * Hook for orchestrating the MetaLoop state and execution
 * Extracted from MetaLoopLab for better separation of concerns
 * 
 * @param {Object} config Initial configuration
 * @returns {Object} Loop state and control functions
 */
export function useMetaLoopOrchestration({
  processGraph,
  initialSeedPrompt = "",
  activeMode = "Standard Loop"
}) {
  // State management
  const [modelA, setModelA] = useState("");
  const [modelB, setModelB] = useState("");
  const [seedPrompt, setSeedPrompt] = useState(initialSeedPrompt);
  const [messages, setMessages] = useState([]);
  const [running, setRunning] = useState(false);
  const [providerA, setProviderA] = useState("ollama");
  const [providerB, setProviderB] = useState("ollama");
  const [currentStreamMsg, setCurrentStreamMsg] = useState(null);
  const [error, setError] = useState("");
  const [maxSteps, setMaxSteps] = useState(8);
  const [endless, setEndless] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [streamingActive, setStreamingActive] = useState(false);

  // --- Reflector Memory State (Self-Evolving Reflector Mode) ---
  const reflectorMemoryTemplate = () => ({
    sessionId: `session_${Date.now()}`,
    startTime: new Date().toISOString(),
    seedPrompt: initialSeedPrompt,
    overallGoal: '',
    loopCycles: [],
    learnedHeuristics: [],
  });
  const [reflectorMemory, setReflectorMemory] = useState(reflectorMemoryTemplate());

// Load reflector memory from file when initializing or changing to Self-Evolving mode
useEffect(() => {
  if (activeMode === "Self-Evolving Reflector") {
    const loadMemory = async () => {
      const loaded = await readReflectorMemory();
      if (loaded && typeof loaded === "object") {
        setReflectorMemory(loaded);
      } else {
        // If missing/corrupt, reinitialize
        const template = reflectorMemoryTemplate();
        await writeReflectorMemory(template);
        setReflectorMemory(template);
      }
    };
    loadMemory();
  }
}, [activeMode]);  // Only run when activeMode changes

  // Append a new loop cycle
  const appendReflectorCycle = (cycle) => {
  setReflectorMemory(mem => {
    const updated = { ...mem, loopCycles: [...mem.loopCycles, cycle] };
    // Async write to file in the background
    writeReflectorMemory(updated).catch(err => 
      console.error('Failed to persist cycle:', err)
    );
    return updated;
  });
};

  // Update/add a heuristic
  const upsertReflectorHeuristic = (heuristic) => {
  setReflectorMemory(mem => {
    const idx = mem.learnedHeuristics.findIndex(h => h.heuristic_id === heuristic.heuristic_id);
    let newHeuristics = [...mem.learnedHeuristics];
    if (idx !== -1) newHeuristics[idx] = heuristic;
    else newHeuristics.push(heuristic);
    const updated = { ...mem, learnedHeuristics: newHeuristics };
    // Async write to file in the background
    writeReflectorMemory(updated).catch(err => 
      console.error('Failed to persist heuristic:', err)
    );
    return updated;
  });
};

  // Reset memory
  const resetReflectorMemory = async () => {
    const template = reflectorMemoryTemplate();
    await writeReflectorMemory(template).catch(err => 
      console.error('Failed to reset memory file:', err)
    );
    setReflectorMemory(template);
  };

  // Export memory (returns a deep copy)
  const exportReflectorMemory = () => JSON.parse(JSON.stringify(reflectorMemory));

  // Refs
  const runningRef = useRef(false);
  const abortControllerRef = useRef(null);

  // --- For Self-Evolving Reflector Mode: memory updaters ---
  // These are only used if activeMode === 'Self-Evolving Reflector'

  /**
   * Stops the currently running loop
   */
  const handleStop = useCallback(() => {
    runningRef.current = false;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setRunning(false);
    setStreamingActive(false);
    setCurrentStreamMsg(null);
  }, []);

  /**
   * Start the loop process
   */
  const startLoop = useCallback(async () => {
    if (running) return;
    
    // Initialize loop state
    runningRef.current = true;
    setRunning(true);
    setStreamingActive(false);
    setError("");
    setMessages([]);
    setCurrentStep(0);
    abortControllerRef.current = new AbortController();

    // Extract graph data
    const { nodes, edges, entry } = processGraph;
    let nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
    let currentNodeId = entry;
    let currentContext = seedPrompt;
    let llmHistory = [];
    let displayHistory = [];
    let step = 0;
    const stepLimit = endless ? Infinity : maxSteps;

    // Main loop
    while (step < stepLimit && runningRef.current && currentNodeId) {
      setCurrentStep(step + 1);
      const node = nodeMap[currentNodeId];
      
      if (!node) {
        setError(`Error: Node ID "${currentNodeId}" not found.`);
        break;
      }

      // Set up agent based on step (alternating A and B)
      const isAgentA = step % 2 === 0;
      const agentLabel = isAgentA ? 'Agent A' : 'Agent B';
      let agent = createAgentConfig(
        agentLabel,
        isAgentA ? providerA : providerB,
        isAgentA ? modelA : modelB,
        node.data.label
      );

      // --- Inject special system prompt for Agent R in Self-Evolving Reflector mode ---
      if (activeMode === "Self-Evolving Reflector" && agentLabel === "Agent B") {
        agent = {
          ...agent,
          systemPrompt: `You are Agent R, a reflective AI whose job is to help the system learn and evolve over time.\n\nAfter your main response, output a JSON object containing:\n{\n  \"enhanced_text\": \"...\",\n  \"memory_update\": {\n    \"loopCycle\": { ... },\n    \"heuristics\": [ ... ]\n  }\n}\n\nThe memory_update.loopCycle should summarize the key events and strategies of this turn. The heuristics array should include any new or updated reflection strategies or rules you have learned.\n\nAlways output your enhanced text for Agent A first, then the JSON object on a new line.`
        };
      }

      let responseText = "";
      let structuredOutput = null;

      try {
        // Start streaming phase
        setStreamingActive(true);
        setCurrentStreamMsg({ agent: agent.name, model: agent.model, text: "" });

        // Format context for the prompt
        const priorContextFormatted = llmHistory.length > 0 
          ? formatPriorContext(displayHistory) 
          : "No prior conversation.";
          
        const userPromptContent = formatUserPromptContent(
          node, 
          priorContextFormatted, 
          seedPrompt, 
          currentContext
        );

        // Handle different LLM providers
        if (agent.provider === "ollama") {
          responseText = await fetchOllamaStream(
            agent, 
            agent.model, 
            userPromptContent, 
            [],
            (partial) => {
              if (!runningRef.current) return;
              setCurrentStreamMsg({ 
                agent: agent.name, 
                model: agent.model, 
                text: partial 
              });
            },
            abortControllerRef.current.signal
          );
        } else {
          responseText = await simulateProviderResponse(
            agent.provider,
            agent.model,
            userPromptContent,
            (partial) => {
              setCurrentStreamMsg({ 
                agent: agent.name, 
                model: agent.model, 
                text: partial 
              });
            }
          );
        }

        // If user aborted, exit loop
        if (!runningRef.current) break;

        // End streaming
        setStreamingActive(false);
        setCurrentStreamMsg(null);

        // Process the response
        structuredOutput = extractTrailingJson(responseText);
        const newDisplayMessage = createMessage(
          agent.name, 
          agent.model, 
          responseText, 
          structuredOutput
        );

        // --- Self-Evolving Reflector Mode: append cycle and heuristics ---
        if (activeMode === "Self-Evolving Reflector") {
          // Append a new loop cycle if structuredOutput has required fields
          if (structuredOutput && (structuredOutput.memory_update || structuredOutput.cycleNumber)) {
            // Prefer explicit memory_update, else fallback to all structuredOutput
            const cycleData = structuredOutput.memory_update?.loopCycle || structuredOutput.memory_update || structuredOutput;
            if (cycleData && typeof appendReflectorCycle === 'function') {
              appendReflectorCycle(cycleData);
            }
            // Add heuristics if present
            const heuristics = structuredOutput.memory_update?.heuristics || structuredOutput.heuristics;
            if (heuristics && Array.isArray(heuristics) && typeof upsertReflectorHeuristic === 'function') {
              heuristics.forEach(upsertReflectorHeuristic);
            } else if (heuristics && typeof heuristics === 'object' && typeof upsertReflectorHeuristic === 'function') {
              upsertReflectorHeuristic(heuristics);
            }
          }
        }
        
        // Update conversation history
        displayHistory = [...displayHistory, newDisplayMessage];
        llmHistory = [
          ...llmHistory, 
          { role: 'user', content: userPromptContent }, 
          { role: 'assistant', content: responseText }
        ];
        setMessages([...displayHistory]);

        // Advance to next node in graph
        const nextEdge = edges.find(e => e.source === currentNodeId);
        const nextNodeId = nextEdge ? nextEdge.target : null;
        currentContext = responseText;
        currentNodeId = nextNodeId;
        step++;

      } catch (err) {
        if (err.name === 'AbortError') {
          setError("Loop stopped.");
          break;
        }
        console.error(`Error step ${step + 1} (${agent.name}):`, err);
        setError(`Error in ${agent.name}: ${err?.message || String(err)}`);
        setMessages(prev => [
          ...prev, 
          createMessage('System', '', `Error: ${err?.message || String(err)}`)
        ]);
        runningRef.current = false;
        break;
      } finally {
        if (!runningRef.current) {
          setStreamingActive(false);
          setCurrentStreamMsg(null);
        }
      }
    } // End while loop

    // Cleanup
    setRunning(false);
    setStreamingActive(false);
    runningRef.current = false;
    setCurrentStep(0);

    // Save conversation if there's anything to save
    if (displayHistory.length > 0) {
      try {
        await saveLoopConversation({
          seedPrompt,
          modelA,
          providerA,
          modelB,
          providerB,
          messages: displayHistory
        }, API_BASE_URL);
      } catch (e) {
        console.error("Failed to save loop conversation:", e);
      }
    }
  }, [
    endless, 
    maxSteps, 
    modelA, 
    modelB, 
    processGraph, 
    providerA, 
    providerB, 
    running, 
    seedPrompt
  ]);

  return {
    // State
    modelA,
    modelB,
    seedPrompt,
    messages,
    running,
    providerA,
    providerB,
    currentStreamMsg,
    error,
    maxSteps,
    endless,
    currentStep,
    streamingActive,
    
    // Setters
    setModelA,
    setModelB,
    setSeedPrompt,
    setProviderA,
    setProviderB,
    setMaxSteps,
    setEndless,
    
    // Actions
    startLoop,
    handleStop,

    // Reflector Memory API (Self-Evolving Reflector Mode)
    reflectorMemory,
    appendReflectorCycle,
    upsertReflectorHeuristic,
    resetReflectorMemory,
    exportReflectorMemory
  };
}
