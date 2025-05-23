// Minimal process graph for MetaLoopLab. This can be extended or made editable later.
// Aligns with Blueprint 3.3.1 - Dynamic scaping engine and UI for expert users
// and Blueprint 2.2 - "Model Scaping" paradigm

// --- Standard Loop (A <-> B) ---
const standardProcessGraph = {
  nodes: [
    {
      id: "ideation_agent_std", // Renamed for clarity
      type: "agent",
      data: {
        label: "Ideation Agent (A)",
        backend: "ollama", // Default backend, can be overridden by user selection
        instructions: `Your role is to be a highly creative Ideation Agent. 
        Given the user's seed prompt and the previous turn's context (if any), generate a diverse set of novel and imaginative ideas. 
        Consider different perspectives, scales, and applications. 
        
        Output Format:
        1.  A brief summary of your core idea.
        2.  A list of 3-5 distinct creative concepts, each with a title and a short explanation.
        3.  Optionally, include a [STRUCTURED_OUTPUT] JSON block containing key elements of your ideas (e.g., { "concept_titles": [], "keywords": [] }).
        
        Focus on originality and exploration.`,
        messageType: "analysis" // Default message type hint
      }
    },
    {
      id: "critique_agent_std", // Renamed for clarity
      type: "agent",
      data: {
        label: "Critique Agent (B)",
        backend: "ollama",
        instructions: `Your role is to be a constructive Critique Agent. 
        Analyze the ideas provided by the Ideation Agent. 
        Provide specific, actionable feedback. Identify strengths, weaknesses, and potential areas for improvement or refinement. 
        Suggest concrete next steps or alternative approaches.
        
        Output Format:
        1.  A concise summary of your overall critique.
        2.  A list of 2-3 specific points of feedback, each with reasoning.
        3.  At least one actionable suggestion for the Ideation Agent's next turn.
        4.  Optionally, include a [STRUCTURED_OUTPUT] JSON block with your critique summary (e.g., { "strengths": [], "weaknesses": [], "suggestions": [] }).
        
        Focus on clarity, constructiveness, and fostering iterative improvement.`,
        messageType: "critique"
      }
    }
  ],
  edges: [
    { source: "ideation_agent_std", target: "critique_agent_std" },
    { source: "critique_agent_std", target: "ideation_agent_std" }
  ],
  entry: "ideation_agent_std"
};

// --- Self-Evolving Reflector Mode (A -> R -> B -> R) ---
// Implements Blueprint 3.3.3.c - Meta-Agent & Meta-Reasoning Capabilities
const reflectorProcessGraph = {
  nodes: [
    {
      id: "initiator_agent_ref", // Renamed for role clarity
      type: "agent",
      data: {
        label: "Initiator Agent (A)",
        backend: "ollama",
        instructions: `Your role is the Initiator Agent. 
        Based on the user's seed prompt, generate an initial creative concept, proposal, or solution. 
        Articulate your idea clearly and provide some initial reasoning or context. 
        Your output will be reviewed and evolved by other agents.
        
        Output Format:
        1.  A clear title for your initial concept.
        2.  A detailed description of the concept (2-3 paragraphs).
        3.  Optionally, include a [STRUCTURED_OUTPUT] JSON block with key elements (e.g., { "concept_name": "...", "core_elements": [], "initial_thoughts": "..." }).`,
        messageType: "analysis"
      }
    },
    {
      id: "reflector_agent_ref", // Renamed for clarity
      type: "agent",
      data: {
        label: "Reflector Agent (R)",
        backend: "ollama", // This agent often benefits from more advanced reasoning models
        instructions: `You are the Reflector Agent (Agent R), a core component of a Self-Evolving Scape. 
        Your primary function is to analyze the ongoing conversation and the accumulated Reflector Memory (provided as JSON) to guide the evolution of ideas and strategies. 
        
        Your Process:
        1.  **Analyze Input:** Carefully review the most recent message from another agent and the full Reflector Memory log.
        2.  **Memory Interpretation:** Identify relevant past cycles, successful/failed strategies, and learned heuristics from the memory. Note any patterns or insights.
        3.  **Strategic Reflection:** Based on your analysis, decide on a meta-level strategy for this turn. This could involve: 
            *   Suggesting a shift in approach for the other agents.
            *   Proposing a new heuristic based on recent interactions.
            *   Identifying a knowledge gap or a point of confusion.
            *   Reinforcing a successful pattern.
            *   Critiquing the current trajectory or questioning assumptions.
        4.  **Guidance Formulation:** Formulate clear, concise guidance or a question for the next agent. This should aim to improve the quality, relevance, or novelty of the output.
        5.  **Memory Update (Crucial):** Prepare a structured JSON update for the Reflector Memory. This is essential for learning and evolution.
        
        Output Format (MUST include both sections):
        
        SECTION 1: Guidance for Next Agent
        (Your textual output: analysis, reflections, and specific guidance/questions for the next agent in the loop. Be explicit about your reasoning based on the memory and current context.)
        
        SECTION 2: Reflector Memory Update (JSON)
        Your JSON output MUST strictly follow the structure below, including all specified keys (e.g., "memory_update_proposal", "new_heuristics", "updated_heuristics", "cycle_observations"). 
        If a list like "new_heuristics" or "updated_heuristics" has no items for this turn, provide an empty list [].
        [STRUCTURED_OUTPUT]
        {
          "reflector_analysis": {
            "current_turn_focus": "(e.g., Analyzing Agent B's critique, Assessing overall progress)",
            "memory_insights_utilized": ["(e.g., Heuristic H3 was relevant, Cycle C5 showed similar issues)"],
            "reasoning_for_guidance": "(Briefly explain why you are providing the specific guidance to the next agent)"
          },
          "guidance_to_next_agent": {
            "summary": "(Summarize your textual guidance in one sentence)",
            "key_questions_or_directives": ["(List specific questions or directives for the next agent)"]
          },
          "memory_update_proposal": {
            "new_heuristics": [
              { "heuristic_id": "H{next_heuristic_id}", "rule": "(Describe a new rule or pattern observed)", "confidence": "(e.g., High, Medium, Low)", "source_turn": "(Current turn number)" }
            ],
            "updated_heuristics": [
              { "heuristic_id": "(ID of existing heuristic)", "update_reason": "(e.g., Increased confidence due to repeated success)", "new_confidence": "(e.g., High)" }
            ],
            "cycle_observations": {
              "cycle_id": "C{current_cycle_number}",
              "contributing_agents": ["(List agents involved in this part of the cycle)"],
              "key_event_summary": "(Summarize the key events of this part ofthe cycle)",
              "outcome_assessment": "(e.g., Productive, Stalled, Insightful, Needs_Refinement)",
              "tags": ["(e.g., creative_block, successful_critique, strategy_shift)"]
            }
          }
        }
        [/STRUCTURED_OUTPUT]
        
        Your role is critical for the scape's ability to learn and adapt. Ensure your JSON output is complete and accurate for effective memory accumulation.`,
        messageType: "reflection" // This agent's primary output type
      }
    },
    {
      id: "analyst_synthesizer_agent_ref", // Renamed and role redefined
      type: "agent",
      data: {
        label: "Analyst/Synthesizer Agent (B)",
        backend: "ollama",
        instructions: `Your role is the Analyst/Synthesizer Agent. 
        You will receive input that has been processed or guided by the Reflector Agent. 
        Your task is to:
        1.  **Analyze the input:** Deeply understand the provided information, considering the Reflector's guidance.
        2.  **Synthesize & Build:** Instead of just critiquing, try to build upon, refine, or synthesize the input into a more concrete, actionable, or comprehensive form. This might involve combining ideas, detailing a plan, or creating a more polished artifact.
        3.  **Address Reflector's Points:** Explicitly address any questions or directives from the Reflector Agent.
        
        Output Format:
        1.  A summary of how you incorporated the Reflector's guidance.
        2.  Your synthesized output (e.g., a refined proposal, a detailed plan, a combined concept).
        3.  Optionally, a [STRUCTURED_OUTPUT] JSON block with key elements of your synthesized output (e.g., { "synthesized_concept": "...", "actionable_steps": [], "confidence_score": 0.85 }).`,
        messageType: "analysis"
      }
    }
  ],
  edges: [
    { source: "initiator_agent_ref", target: "reflector_agent_ref", data: { label: "Initial Idea to Reflector" } },
    { source: "reflector_agent_ref", target: "analyst_synthesizer_agent_ref", data: { label: "Reflector Guidance to Analyst" } },
    { source: "analyst_synthesizer_agent_ref", target: "reflector_agent_ref", data: { label: "Synthesized Output to Reflector" } }
    // The loop back to initiator_agent_ref from reflector_agent_ref can be implicit 
    // or explicitly defined if the Reflector decides to re-engage the Initiator with new parameters.
    // For now, the primary loop is A -> R -> B -> R...
  ],
  entry: "initiator_agent_ref"
};

export { standardProcessGraph, reflectorProcessGraph };
