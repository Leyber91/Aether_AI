import { useState, useRef, useCallback, useEffect } from "react";
import { API_BASE_URL, loadReflectorMemory, saveReflectorMemory } from "../../../api/apiService";
import { createAgentConfig, getAgentConfig, formatMemoryForPrompt } from "../domain/agentConfig";
import { formatPriorContext, formatUserPromptContent, extractTrailingJson, createMessage } from "../domain/messageUtils";
import { fetchOllamaStream, simulateProviderResponse, saveLoopConversation } from "../services/llmService";

// --- Use new API service for reflector memory ---
// (loadReflectorMemory, saveReflectorMemory imported above)


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
      const loaded = await loadReflectorMemory();
      if (loaded && typeof loaded === "object") {
        setReflectorMemory(loaded);
      } else {
        // If missing/corrupt, reinitialize
        const template = reflectorMemoryTemplate();
        await saveReflectorMemory(template);
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
    saveReflectorMemory(updated).catch(err => 
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
    saveReflectorMemory(updated).catch(err => 
      console.error('Failed to persist heuristic:', err)
    );
    return updated;
  });
};

  // Reset memory
  const resetReflectorMemory = async () => {
    const template = reflectorMemoryTemplate();
    await saveReflectorMemory(template).catch(err => 
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
    // Prevent starting loop if models are not set
    if (!modelA || !modelB) {
      setError("Please select a model for both Agent A and Agent B before starting the loop.");
      return;
    }
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
    // --- SELF-EVOLVING REFLECTOR: Insert Agent R between every A and B ---
    if (activeMode === "Self-Evolving Reflector") {
      let isAgentA = true;
      let lastResponse = seedPrompt;
      let localStep = 0;
      while (localStep < stepLimit && runningRef.current) {
        setCurrentStep(localStep + 1);
        // 1. Agent A or B generates a message
        const agentLabel = isAgentA ? 'Agent A' : 'Agent B';
        let agent = createAgentConfig(
          agentLabel,
          isAgentA ? providerA : providerB,
          isAgentA ? modelA : modelB,
          agentLabel === 'Agent A' ? 'creativeExpansion' : 'criticalAnalysis' // or use node.data.label if needed
        );
        let userPromptContent = lastResponse;
        let responseText = "";
        let structuredOutput = null;
        try {
          setStreamingActive(true);
          setCurrentStreamMsg({ agent: agent.name, model: agent.model, text: "" });
          if (agent.provider === "ollama") {
            responseText = await fetchOllamaStream(
              agent,
              agent.model,
              userPromptContent,
              [],
              (partial) => {
                if (!runningRef.current) return;
                setCurrentStreamMsg({ agent: agent.name, model: agent.model, text: partial });
              },
              abortControllerRef.current.signal
            );
          } else {
            responseText = await simulateProviderResponse(
              agent.provider,
              agent.model,
              userPromptContent,
              (partial) => {
                setCurrentStreamMsg({ agent: agent.name, model: agent.model, text: partial });
              }
            );
          }
          setStreamingActive(false);
          setCurrentStreamMsg(null);
          structuredOutput = extractTrailingJson(responseText);
          const newDisplayMessage = createMessage(
            agent.name,
            agent.model,
            responseText,
            structuredOutput
          );
          displayHistory = [...displayHistory, newDisplayMessage];
          llmHistory = [
            ...llmHistory,
            { role: 'user', content: userPromptContent },
            { role: 'assistant', content: responseText }
          ];
          setMessages([...displayHistory]);
          if (!runningRef.current) break;
        } catch (err) {
          if (err.name === 'AbortError') {
            setError("Loop stopped.");
            break;
          }
          console.error(`Error step ${localStep + 1} (${agent.name}):`, err);
          setError(`Error in ${agent.name}: ${err?.message || String(err)}`);
          setMessages(prev => [
            ...prev,
            createMessage('System', '', `Error: ${err?.message || String(err)}`)
          ]);
          runningRef.current = false;
          break;
        }
        // 2. Agent R processes the message
        const agentRConfig = getAgentConfig('reflector-agent');
        const memoryContext = formatMemoryForPrompt(reflectorMemory);
        const agentR = {
          ...agentRConfig,
          model: agentRConfig.modelId,
          systemPrompt: agentRConfig.systemPrompt({ memoryContext }),
        };
        let rResponseText = "";
        try {
          setStreamingActive(true);
          setCurrentStreamMsg({ agent: agentR.name, model: agentR.model, text: "" });
          rResponseText = await fetchOllamaStream(
            agentR,
            agentR.model,
            responseText,
            [],
            (partial) => {
              if (!runningRef.current) return;
              setCurrentStreamMsg({ agent: agentR.name, model: agentR.model, text: partial });
            },
            abortControllerRef.current.signal
          );
          setStreamingActive(false);
          setCurrentStreamMsg(null);
          const rDisplayMessage = createMessage(
            agentR.name,
            agentR.model,
            rResponseText,
            null
          );
          displayHistory = [...displayHistory, rDisplayMessage];
          setMessages([...displayHistory]);
          if (!runningRef.current) break;
        } catch (err) {
          if (err.name === 'AbortError') {
            setError("Loop stopped.");
            break;
          }
          console.error(`Error step ${localStep + 1} (Reflector):`, err);
          setError(`Error in Reflector: ${err?.message || String(err)}`);
          setMessages(prev => [
            ...prev,
            createMessage('System', '', `Error: ${err?.message || String(err)}`)
          ]);
          runningRef.current = false;
          break;
        }
        // Prepare for next agent
        lastResponse = rResponseText;
        isAgentA = !isAgentA;
        localStep++;
      }
      setRunning(false);
      setStreamingActive(false);
      setCurrentStreamMsg(null);
      return;
    }
    // --- END SELF-EVOLVING REFLECTOR ---

    // --- ORIGINAL LOOP FOR STANDARD MODE ---
    while (step < stepLimit && runningRef.current && currentNodeId) {
      setCurrentStep(step + 1);
      const node = nodeMap[currentNodeId];

      // --- DEBUG: Log model and agent config before LLM call ---
      if (process.env.NODE_ENV !== 'production') {
        console.log('[MetaLoopOrchestration] Step', step + 1, {
          node,
          modelA,
          modelB,
          providerA,
          providerB
        });
      }
      
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

      // --- Inject proper Agent R config and memory context in Self-Evolving Reflector mode ---
      if (activeMode === "Self-Evolving Reflector" && agentLabel === "Agent B") {
        const agentRConfig = getAgentConfig('reflector-agent');
        const memoryContext = formatMemoryForPrompt(reflectorMemory);
        agent = {
          ...agentRConfig,
          model: agentRConfig.modelId, // Ensure model is set for payload
          systemPrompt: agentRConfig.systemPrompt({ memoryContext }),
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
