import React from 'react';
import styles from './VisionParallaxExperience.module.css';
import ParallaxBackground from './ParallaxBackground';
import HeroSection from './HeroSection';
import StorySection from './StorySection';

const storyBeats = [
  {
    title: 'Welcome to the Aether AI Suite',
    content: 'Embark on a journey into the future of collaborative intelligence. The Aether AI Suite is not just a set of tools; it\'s an integrated ecosystem designed to amplify human ingenuity through seamless AI interaction and orchestration.',
    visual: null,
    sticky: false,
  },
  {
    title: 'The Synergistic Triad: Our Core',
    content: (
      <div>
        <p>At the heart of Aether lies a powerful triad of components, each distinct yet deeply interconnected, creating emergent capabilities far beyond their individual sum:</p>
        <ul>
          <li><strong>Aether Chat:</strong> Your intuitive conversational gateway for immediate AI interaction, contextual assistance, and seamless handoff to more structured processes. (Ref: Blueprint Sec 3.1)</li>
          <li><strong>Aether Canvas:</strong> A dynamic visual stage where AI-driven workflows come to life. Design, orchestrate, and evolve complex processes with AI as your co-pilot, blending local and cloud capabilities with unprecedented ease. (Ref: Blueprint Sec 3.2)</li>
          <li><strong>MetaLoopLab:</strong> The crucible of innovation. An experimental "Scape Discovery Lab" for pioneering "Model Scaping," advanced agentic research, and the exploration of novel AI paradigms. (Ref: Blueprint Sec 3.3)</li>
        </ul>
        <p>This triad embodies our vision of an "AI Operating System" (AIOS) – a platform where human and artificial intelligence collaborate and co-evolve.</p>
      </div>
    ),
    visual: null,
    sticky: false,
  },
  {
    title: 'Guiding Principles: The Aether Advantage',
    content: (
      <div>
        <p>Our development is guided by principles that ensure Aether is powerful, trustworthy, and user-centric:</p>
        <ul>
          <li><strong>AI-First, Human-Perfected:</strong> Describe your goals, and let Aether\'s intelligence draft solutions. Refine, guide, and iterate with AI assistance every step of the way.</li>
          <li><strong>Synergy and Emergence:</strong> The true power of Aether unfolds through the deep integration of Chat, Canvas, and MetaLoopLab. Experience how conversational insights can fuel orchestrated workflows, and how experimental scapes can graduate into robust applications.</li>
          <li><strong>Model Scaping Paradigm:</strong> Central to MetaLoopLab and increasingly influencing AetherCanvas, this focuses on dynamic, iterative multi-agent systems that learn and adapt.</li>
          <li><strong>Unlimited Local & Hybrid Orchestration:</strong> Harness the power of local LLMs (like Ollama) for privacy and control, seamlessly blending with cloud models (like Groq) and web tools when optimal. AI intelligently guides these choices, always prioritizing your needs.</li>
          <li><strong>Radical Explainability & Trust:</strong> Every AI action, suggestion, and workflow step is designed for transparency. Understand the "why" behind the "what," with clear error explanations and AI-suggested fixes.</li>
          <li><strong>Seamless Evolution & Experimentation:</strong> With features like comprehensive history, undo/redo, and workflow versioning, Aether encourages bold experimentation without fear.</li>
        </ul>
      </div>
    ),
    visual: null,
    sticky: false,
  },
  {
    title: 'Why Aether? Why Now?',
    content: 'The convergence of powerful local LLMs, scalable cloud infrastructure, and novel agentic frameworks has opened a new frontier. Aether AI Suite is built to navigate this frontier, offering a unified platform that is intelligent, private, adaptable, and boundless in its potential. It\'s more than automation; it\'s the dawn of orchestrated intelligence, accessible to all.',
    visual: null,
    sticky: false,
  },
  {
    title: 'Your Role in the Aetherverse',
    content: (
      <div>
        <p>Whether you\'re a developer, a researcher, a business professional, or simply an explorer of AI\'s potential, Aether provides the tools and the environment to:</p>
        <ul>
          <li><strong>Innovate Faster:</strong> Move from idea to implemented AI solution at an accelerated pace.</li>
          <li><strong>Automate with Intelligence:</strong> Go beyond repetitive tasks to create self-optimizing, adaptive systems.</li>
          <li><strong>Explore Uncharted Territories:</strong> Push the boundaries of AI research and application in the MetaLoopLab.</li>
          <li><strong>Collaborate with AI:</strong> Experience a new paradigm of human-AI partnership.</li>
        </ul>
        <p>The journey begins now. Let\'s shape the future of intelligence, together.</p>
      </div>
    ),
    visual: null,
    sticky: false,
  },
];

const VisionParallaxExperience = () => (
  <div className={styles.root}>
    <ParallaxBackground />
    <div className={styles.content}>
      <HeroSection />
      {storyBeats.map((beat, i) => (
        <StorySection
          key={i}
          title={beat.title}
          content={beat.content}
          visual={beat.visual}
          sticky={beat.sticky}
        />
      ))}
    </div>
  </div>
);

export default VisionParallaxExperience;
