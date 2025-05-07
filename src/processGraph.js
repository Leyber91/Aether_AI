// Minimal process graph for MetaLoopLab. This can be extended or made editable later.

const processGraph = {
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
    { source: "critic", target: "ideation" } // Loop for demonstration
  ],
  entry: "ideation"
};

export default processGraph;
