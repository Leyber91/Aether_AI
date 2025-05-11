import { useState, useRef, useCallback } from "react";
import { API_BASE_URL } from "../../../api/apiService";
import { createAgentConfig } from "../domain/agentConfig";
import { formatPriorContext, formatUserPromptContent, extractTrailingJson, createMessage } from "../domain/messageUtils";
import { fetchOllamaStream, simulateProviderResponse, saveLoopConversation } from "../services/llmService";

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
  
  // Refs
  const runningRef = useRef(false);
  const abortControllerRef = useRef(null);

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
      const agent = createAgentConfig(
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
    handleStop
  };
}
