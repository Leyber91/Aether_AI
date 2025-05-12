// Minimal process graph for MetaLoopLab. This can be extended or made editable later.

// --- Standard Loop (A <-> B) ---
const standardProcessGraph = {
  nodes: [
    {
      id: "ideation",
      type: "agent",
      data: {
        label: "Ideation",
        backend: "ollama",
        instructions: "Generate creative ideas for the user's prompt."
      }
    },
    {
      id: "critic",
      type: "agent",
      data: {
        label: "Critic",
        backend: "ollama",
        instructions: "Critique the previous idea and suggest improvements."
      }
    }
  ],
  edges: [
    { source: "ideation", target: "critic" },
    { source: "critic", target: "ideation" }
  ],
  entry: "ideation"
};

// --- Self-Evolving Reflector Mode (A -> R -> B -> R) ---
const reflectorProcessGraph = {
  nodes: [
    {
      id: "agentA",
      type: "agent",
      data: {
        label: "Agent A (Ideation)",
        backend: "ollama",
        instructions: "Generate creative ideas for the user's prompt."
      }
    },
    {
      id: "reflector",
      type: "agent",
      data: {
        label: "Reflector (Agent R)",
        backend: "ollama",
        instructions: `You are Agent R, a Self-Evolving Reflector. Your role is to enhance, critique, or evolve the output from the other agent, using your memory log (provided as JSON) to inform your strategy.\n\n1. Analyze the provided memory log for effective past strategies and learned heuristics.\n2. Decide on a reflection/enhancement strategy for this turn, and state it explicitly.\n3. Output an enhanced or critiqued version of the incoming text.\n4. Output a structured JSON update with this cycle's events, your chosen strategy, and any new or updated heuristics.\n\nAlways output both the enhanced text and the memory update JSON as specified.`
      }
    },
    {
      id: "agentB",
      type: "agent",
      data: {
        label: "Agent B (Critic)",
        backend: "ollama",
        instructions: "Critique the enhanced idea and suggest improvements or new directions."
      }
    }
  ],
  edges: [
    { source: "agentA", target: "reflector" },
    { source: "reflector", target: "agentB" },
    { source: "agentB", target: "reflector" },
    { source: "reflector", target: "agentA" }
  ],
  entry: "agentA"
};

export { standardProcessGraph, reflectorProcessGraph };
