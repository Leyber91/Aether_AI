import React from 'react';
import styles from './VisionParallaxExperience.module.css';
import ParallaxBackground from './ParallaxBackground';
import HeroSection from './HeroSection';
import StorySection from './StorySection';

const storyBeats = [
  {
    title: 'What is Aether Canvas?',
    content: 'Aether Canvas is a next-generation, AI-native automation and agent orchestration platform. It empowers users to visually design, run, and evolve intelligent workflows—combining the power of local LLMs (Ollama), cloud models (Groq), and web tools, all with no rate limits and full privacy.',
    visual: null,
    sticky: false,
  },
  {
    title: 'Core Principles',
    content: (
      <ul>
        <li><b>AI-First, Not Node-First:</b> Describe your goal, let the AI build and optimize the flow.</li>
        <li><b>Unlimited Local Automation:</b> Use Ollama for all tool-like and repetitive tasks, with no limits.</li>
        <li><b>Hybrid Orchestration:</b> Seamlessly blend local, cloud, and web automations—AI always picks the best tool.</li>
        <li><b>Explainability & Trust:</b> Every step is transparent, errors are explained, and fixes are suggested by the AI.</li>
        <li><b>History & Undo:</b> Time travel, branching, and experiment without fear—every change is tracked.</li>
      </ul>
    ),
    visual: null,
    sticky: false,
  },
  {
    title: 'What Makes Us Unique?',
    content: (
      <ul>
        <li><b>Unlimited, Private Automation:</b> No rate limits, no cloud lock-in, no data leaks—everything can run locally.</li>
        <li><b>AI as Copilot:</b> The system suggests, explains, and optimizes—never passive.</li>
        <li><b>Zero to Value in Minutes:</b> New users can describe a goal and see it run, instantly.</li>
        <li><b>Self-Evolving Flows:</b> The canvas watches for errors/inefficiencies and proposes improvements automatically.</li>
        <li><b>Community & Sharing:</b> Share, fork, and remix flows—learn from others and get AI-powered inspiration.</li>
      </ul>
    ),
    visual: null,
    sticky: false,
  },
  {
    title: 'Opportunities',
    content: (
      <ul>
        <li>Be the first truly AI-native, user-first automation canvas—usable by anyone, not just developers.</li>
        <li>Empower privacy-conscious users, businesses, and researchers with local, unlimited LLM automation.</li>
        <li>Bridge the gap between power-user automation and conversational AI for everyone.</li>
        <li>Foster a vibrant community of flow creators, sharers, and remixers.</li>
      </ul>
    ),
    visual: null,
    sticky: false,
  },
  {
    title: 'How Does It Work?',
    content: (
      <ol>
        <li>Describe your goal in natural language.</li>
        <li>The AI drafts a workflow—agents, tools, filters, outputs—ready to run or edit.</li>
        <li>Run, test, and debug with live, explainable feedback at every step.</li>
        <li>Iterate, optimize, and share—guided by AI suggestions and community wisdom.</li>
      </ol>
    ),
    visual: null,
    sticky: false,
  },
  {
    title: 'Why Now?',
    content: 'The convergence of fast local LLMs, scalable cloud models, and new agentic paradigms makes it possible to build a platform that is truly intelligent, private, and limitless. Aether Canvas is the answer for the next era of automation—where everyone can orchestrate intelligence.',
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
