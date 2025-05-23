import { useState, useRef, useCallback, useEffect } from "react";
import { API_BASE_URL, loadReflectorMemory, saveReflectorMemory } from "../../../api/apiService";
import { createAgentConfig, getAgentConfig, formatMemoryForPrompt } from "../domain/agentConfig";
import { 
  formatPriorContext, 
  formatUserPromptContent, 
  extractTrailingJson,
  validateStructuredOutput,
  createMessage,
  processAgentResponse,
  extractImages,
  detectMessageType
} from "../domain/messageUtils";
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
  const exportReflectorMemory = useCallback(() => JSON.parse(JSON.stringify(reflectorMemory)), [reflectorMemory]);

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
        // Determine message type hint based on agent role
        const messageTypeHint = isAgentA ? 'analysis' : 'critique';
        
        let agent = createAgentConfig(
          agentLabel,
          isAgentA ? providerA : providerB,
          isAgentA ? modelA : modelB,
          agentLabel === 'Agent A' ? 'creativeExpansion' : 'criticalAnalysis' // or use node.data.label if needed
        );
        
        // Use enhanced formatUserPromptContent with message type hint
        let userPromptContent = formatUserPromptContent(
          { data: { label: agentLabel, instructions: agent.systemPrompt || "Continue the conversation." } },
          formatPriorContext(displayHistory),
          seedPrompt,
          lastResponse,
          messageTypeHint
        );
        
        let responseText = "";
        try {
          setStreamingActive(true);
          setCurrentStreamMsg({ 
            agent: agent.name, 
            model: agent.model, 
            text: "",
            type: messageTypeHint
          });
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
                  text: partial,
                  type: messageTypeHint
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
                  text: partial,
                  type: messageTypeHint
                });
              }
            );
          }
          setStreamingActive(false);
          setCurrentStreamMsg(null);
          
          // Use the new processAgentResponse function to handle the response
          const newDisplayMessage = processAgentResponse(agent.name, agent.model, responseText);
          
          // Extract images if any (for future multi-modal support)
          const extractedImages = extractImages(responseText);
          if (extractedImages) {
            newDisplayMessage.images = extractedImages;
          }

          // Access structured output from the processed message
          const structuredOutput = newDisplayMessage.structured;
          
          // Update conversation history
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
        } finally {
          if (!runningRef.current) {
            setStreamingActive(false);
            setCurrentStreamMsg(null);
          }
        }
        // 2. Agent R (Reflector) processes the interaction between Agent A and B
        const agentRConfig = getAgentConfig('reflector-agent');
        const agentAMessage = displayHistory.find(m => m.agent === 'Agent A');
        const agentBMessage = displayHistory.find(m => m.agent === 'Agent B');
        const agentAResponse = agentAMessage?.text || '';
        const agentBResponse = agentBMessage?.text || '';
        
        // Enhanced context for the Reflector Agent
        const memoryContext = formatMemoryForPrompt(reflectorMemory);
        const conversationContext = formatPriorContext(displayHistory.slice(-4)); // Last 4 messages
       
        // Create more comprehensive agent configuration with all necessary context
        const agentR = {
          ...agentRConfig,
          model: agentRConfig.modelId,
          systemPrompt: agentRConfig.systemPrompt({ 
            memoryContext, 
            context: conversationContext,
            agentAResponse,
            agentBResponse
          }),
        };
        
        // Track metrics for stagnation detection
        const repetitionThreshold = 0.85;
        const currentNoveltyScore = reflectorMemory.metrics?.noveltyScore || 1.0;
        
        let rResponseText = "";
        try {
          // Stream reflector response
          setStreamingActive(true);
          setCurrentStreamMsg({ 
            agent: agentR.name, 
            model: agentR.model, 
            text: "",
            type: 'reflection' 
          });
          
          console.log("[useMetaLoopOrchestration] About to call fetchOllamaStream for Reflector with enhanced context");
          
          // Use empty input - all context is now in the system prompt
          rResponseText = await fetchOllamaStream(
            agentR,
            agentR.model,
            "Please synthesize the conversation and provide guidance as per your instructions.", // Simple trigger prompt
            [],
            (partial) => {
              if (!runningRef.current) return;
              setCurrentStreamMsg({ 
                agent: agentR.name, 
                model: agentR.model, 
                text: partial,
                type: 'reflection'
              });
            },
            abortControllerRef.current.signal
          );
          
          setStreamingActive(false);
          setCurrentStreamMsg(null);
          
          console.log("[useMetaLoopOrchestration] Reflector raw output before processing:", rResponseText);
          
          // Process the Reflector's response with enhanced parsing
          const rDisplayMessage = processAgentResponse(agentR.name, agentR.model, rResponseText);
          rDisplayMessage.type = 'reflection'; // Ensure correct message type
          
          // Extract and validate the structured output with our enhanced tools
          const rawStructuredOutput = extractTrailingJson(rResponseText);
          const structuredOutput = validateStructuredOutput(rawStructuredOutput);
          rDisplayMessage.structured = structuredOutput;
          
          // --- Process Reflector's structured output for memory updates with improved handling ---
          let memoryUpdated = false;
          let newNoveltyScore = currentNoveltyScore;
          let stagnationRisk = reflectorMemory.metrics?.stagnationRisk || 'low';
          
          if (structuredOutput && structuredOutput.memory_update) {
            console.log("[useMetaLoopOrchestration] Processing Reflector structured output with enhanced validation");
            
            const memUpdate = structuredOutput.memory_update;
            
            // Process loop cycle data
            if (memUpdate.loopCycle) {
              // Extract cycle evolution metrics if available
              if (memUpdate.loopCycle.cycle_evolution) {
                newNoveltyScore = memUpdate.loopCycle.cycle_evolution.novelty_score || 0.5;
                stagnationRisk = memUpdate.loopCycle.cycle_evolution.stagnation_risk || 'medium';
                
                // Store metrics in memory
                setReflectorMemory(prev => ({
                  ...prev,
                  metrics: {
                    ...prev.metrics,
                    noveltyScore: newNoveltyScore,
                    stagnationRisk: stagnationRisk,
                    repetitionRisk: newNoveltyScore < repetitionThreshold ? 'high' : 'low',
                    progressScore: memUpdate.loopCycle.cycle_evolution.progress_score || 0.5
                  }
                }));
              }
              
              // Append the loop cycle to memory
              appendReflectorCycle(memUpdate.loopCycle);
              memoryUpdated = true;
              
              // Log cycle insights
              console.log(`[useMetaLoopOrchestration] Cycle ${reflectorMemory.loopCycles?.length || 0} insights:`, 
                memUpdate.loopCycle.summary, 
                `Novelty: ${newNoveltyScore}, Stagnation Risk: ${stagnationRisk}`);
            }
            
            // Process heuristics with improved handling
            if (memUpdate.heuristics && Array.isArray(memUpdate.heuristics)) {
              // Track which heuristics have been processed to avoid duplicates
              const processedIds = new Set();
              
              memUpdate.heuristics.forEach(h => {
                if (!h.id && !h.heuristic_id) {
                  // Generate ID for new heuristics
                  h.id = `h${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                }
                
                const heuristicId = h.id || h.heuristic_id;
                
                // Skip if already processed in this batch
                if (processedIds.has(heuristicId)) return;
                processedIds.add(heuristicId);
                
                // Update or add the heuristic
                upsertReflectorHeuristic(h);
              });
              
              if (memUpdate.heuristics.length > 0) {
                memoryUpdated = true;
                console.log(`[useMetaLoopOrchestration] Updated ${memUpdate.heuristics.length} heuristics`);
              }
            }
          } else if (rawStructuredOutput) {
            // Fallback handling for structured data that doesn't match our expected format
            console.log("[useMetaLoopOrchestration] Using fallback processing for structured output:", rawStructuredOutput);
            
            // Check for any objects that look like loop cycles or heuristics
            try {
              // Look for loop cycle data
              if (rawStructuredOutput.summary || rawStructuredOutput.identified_patterns) {
                const cycleData = {
                  timestamp: new Date().toISOString(),
                  summary: rawStructuredOutput.summary || "Cycle processed without explicit summary",
                  identified_patterns: Array.isArray(rawStructuredOutput.identified_patterns) 
                    ? rawStructuredOutput.identified_patterns 
                    : []
                };
                
                appendReflectorCycle(cycleData);
                memoryUpdated = true;
                console.log("[useMetaLoopOrchestration] Processed cycle data from fallback method");
              }
              
              // Look for anything that might be a heuristic
              if (rawStructuredOutput.rule || rawStructuredOutput.heuristic) {
                const heuristicData = {
                  id: rawStructuredOutput.id || `h${Date.now()}`,
                  rule: rawStructuredOutput.rule || rawStructuredOutput.heuristic || "Unnamed heuristic",
                  evaluation: rawStructuredOutput.evaluation || "No evaluation provided",
                  source_cycle: reflectorMemory.loopCycles?.length || 0
                };
                
                upsertReflectorHeuristic(heuristicData);
                memoryUpdated = true;
                console.log("[useMetaLoopOrchestration] Processed heuristic from fallback method");
              }
            } catch (e) {
              console.error("[useMetaLoopOrchestration] Error in fallback structured data processing:", e);
            }
          }
          
          // --- End memory update processing ---

          // Check for conversation stagnation and inject intervention if needed
          if (newNoveltyScore < repetitionThreshold && reflectorMemory.loopCycles?.length > 2) {
            console.log(`[useMetaLoopOrchestration] Detected potential stagnation (novelty: ${newNoveltyScore}). Injecting intervention.`);
            
            // Add a system message about stagnation detection
            const stagnationMessage = createMessage(
              'System', 
              '', 
              `Detected conversation stagnation (novelty score: ${newNoveltyScore.toFixed(2)}). Encouraging exploration of new perspectives.`,
              null,
              { type: 'system' }
            );
            
            displayHistory = [...displayHistory, rDisplayMessage, stagnationMessage];
            
            // Record stagnation detection in memory
            if (typeof appendReflectorCycle === 'function') {
              appendReflectorCycle({
                timestamp: new Date().toISOString(),
                summary: "System detected conversation stagnation and intervened to encourage new directions.",
                identified_patterns: [{
                  pattern: "stagnation",
                  description: "Conversation becoming repetitive with low novelty score",
                  significance: "Requires intervention to maintain productive exploration"
                }]
              });
            }
          } else {
            // Normal flow
            displayHistory = [...displayHistory, rDisplayMessage];
          }
          
          setMessages([...displayHistory]);
          if (!runningRef.current) break;
        } catch (err) {
          if (err.name === 'AbortError') {
            setError("Loop stopped.");
            break;
          }
          console.error(`Error in Reflector processing (cycle ${localStep}):`, err);
          setError(`Error in Reflector: ${err?.message || String(err)}`);
          
          // Add more detailed error message to aid debugging
          setMessages(prev => [
            ...prev,
            createMessage(
              'System', 
              '', 
              `Error in Reflector processing: ${err?.message || String(err)}\nCheck browser console for details.`,
              null,
              { type: 'system' }
            )
          ]);
          
          // Record error in memory for future reference
          if (typeof appendReflectorCycle === 'function') {
            try {
              appendReflectorCycle({
                timestamp: new Date().toISOString(),
                summary: `Error occurred during Reflector processing: ${err?.message || String(err)}`,
                error: true,
                error_details: {
                  message: err?.message || String(err),
                  cycle: localStep
                }
              });
            } catch (memErr) {
              console.error("Failed to record error in memory:", memErr);
            }
          }
          
          runningRef.current = false;
          break;
        }
        // Prepare for next agent
        lastResponse = rResponseText;
        isAgentA = !isAgentA;
        localStep++;
      }
      // No specific 'return;' here, fall through to common cleanup and save logic
      // The loop terminates via runningRef.current or localStep >= stepLimit
    }
    // --- END SELF-EVOLVING REFLECTOR ---
    else { // This 'else' covers the original standard loop logic
      // --- ORIGINAL LOOP FOR STANDARD MODE ---
      let standardModeStep = 0; 
      while (standardModeStep < stepLimit && runningRef.current && currentNodeId) {
        setCurrentStep(standardModeStep + 1); 
        const node = nodeMap[currentNodeId];

        // --- DEBUG: Log model and agent config before LLM call ---
        if (process.env.NODE_ENV !== 'production') {
          console.log('[MetaLoopOrchestration] Step', standardModeStep + 1, {
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
        const isAgentA = standardModeStep % 2 === 0;
        const agentLabel = isAgentA ? 'Agent A' : 'Agent B';
        let agent = createAgentConfig(
          agentLabel,
          isAgentA ? providerA : providerB,
          isAgentA ? modelA : modelB,
          node.data.label
        );

        let responseText = "";
        let structuredOutput = null;

        try {
          // Start streaming phase
          setStreamingActive(true);
          
          // Determine message type hint based on node data or agent alternation
          const messageTypeHint = node.data.messageType || 
            (standardModeStep % 2 === 0 ? 'analysis' : 'critique');
          
          setCurrentStreamMsg({ 
            agent: agent.name, 
            model: agent.model, 
            text: "",
            type: messageTypeHint
          });

          // Format context for the prompt
          const priorContextFormatted = llmHistory.length > 0 
            ? formatPriorContext(displayHistory) 
            : "No prior conversation.";
            
          const userPromptContent = formatUserPromptContent(
            node, 
            priorContextFormatted, 
            seedPrompt, 
            currentContext,
            messageTypeHint
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
          const newDisplayMessage = processAgentResponse(agent.name, agent.model, responseText);

          // Extract images if any (for future multi-modal support)
          const extractedImages = extractImages(responseText);
          if (extractedImages) {
            newDisplayMessage.images = extractedImages;
          }

          // Access structured output from the processed message
          structuredOutput = newDisplayMessage.structured;
          
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
          standardModeStep++;

        } catch (err) {
          if (err.name === 'AbortError') {
            setError("Loop stopped.");
            break;
          }
          console.error(`Error step ${standardModeStep + 1} (${agent.name}):`, err);
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
      } // End while loop for standard mode
    }

    // Common cleanup for all modes - DO NOT reset currentStep yet
    setRunning(false);
    setStreamingActive(false);
    runningRef.current = false;

    const actualCompletedSteps = currentStep; // currentStep reflects the last step + 1 set in the loops

    console.log("[useMetaLoopOrchestration] Reached end of startLoop. Checking if should save.");
    if (displayHistory.length > 0) { // displayHistory is the locally built array from this run
      try {
        console.log(`[useMetaLoopOrchestration] Attempting to save loop. displayHistory length: ${displayHistory.length}, activeMode: ${activeMode}.`);
        const payloadToSave = {
          seedPrompt,
          modelA,
          providerA,
          modelB,
          providerB,
          messages: displayHistory, // Use the locally built displayHistory
          activeMode: activeMode,
          reflectorModel: activeMode === "Self-Evolving Reflector" ? (getAgentConfig('reflector-agent')?.modelId || 'phi3:mini') : undefined,
          finalReflectorMemory: activeMode === "Self-Evolving Reflector" ? exportReflectorMemory() : undefined,
          maxSteps,
          endlessLoop: endless,
          completedSteps: actualCompletedSteps,
          finalError: error || null,
          timestamp: new Date().toISOString()
        };
        console.log("[useMetaLoopOrchestration] Payload for saveLoopConversation:", JSON.stringify(payloadToSave, null, 2));
        await saveLoopConversation(payloadToSave, API_BASE_URL);
        console.log(`[useMetaLoopOrchestration] saveLoopConversation call completed successfully for mode: ${activeMode}`);
      } catch (e) {
        console.error("[useMetaLoopOrchestration] Failed to save loop conversation:", e);
        setError("Failed to save conversation history. Check console.");
      }
    } else {
       console.warn("[useMetaLoopOrchestration] displayHistory is empty. Skipping save.");
    }
    setCurrentStep(0); // Reset currentStep *after* all operations using its value are done.
  }, [
    activeMode,
    endless,
    error,
    exportReflectorMemory, // Memoized and correct dependency
    maxSteps,
    modelA,
    modelB,
    processGraph,
    providerA,
    providerB,
    seedPrompt,
    currentStep, // currentStep state is read for actualCompletedSteps
    // displayHistory is a local variable, not a dependency from hook scope.
    // Key state variables used indirectly by displayHistory (e.g. seedPrompt, models affecting prompts) are listed.
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
