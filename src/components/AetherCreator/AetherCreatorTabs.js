import React, { useState } from 'react';
import styles from './AetherCreator.module.css';
import Tooltip from './components/Tooltip';
import ModelSelector from '../ModelSelector/ModelSelector';
import Tier1ConfigForm from './components/Tier1ConfigForm';
import Tier2GGUFImporter from './components/Tier2GGUFImporter';
import Tier2QLoRAConfig from './components/Tier2QLoRAConfig';
import AIAssistConfig from './components/AIAssistConfig';
import PresetSelector from './components/PresetSelector';
import ModelfileWizardPanel from './components/ModelfileWizardPanel';

// Tab labels and icons can be extended
const TABS = [
  { key: 'wizard', label: '🧙‍♂️ AI Wizard', icon: '✨' },
  { key: 'tier1', label: 'Manual Config', icon: '🧩' },
  { key: 'tier2', label: 'Import/QLoRA', icon: '🔬' },
  { key: 'aiassist', label: 'Legacy Assistant', icon: '🤖' },
];

const AetherCreatorTabs = ({
  // All props passed from parent for state management
  ...props
}) => {
  const [activeTab, setActiveTab] = useState('wizard');

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabHeaderRow}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? `${styles.tabButton} ${styles.tabButtonActive}` : styles.tabButton}
            onClick={() => setActiveTab(tab.key)}
            type="button"
            data-tab-key={tab.key}
          >
            <span className={styles.tabIcon}>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.tabPanel}>
        {activeTab === 'wizard' && (
          <ModelfileWizardPanel 
            onModelfileGenerated={(result) => {
              // Update parent state with generated modelfile
              if (props.setGeneratedModelfile) {
                props.setGeneratedModelfile(result.modelfile);
              }
              if (props.setOllamaModelName && result.suggestedName) {
                props.setOllamaModelName(result.suggestedName);
              }
            }}
            availableModels={props.availableModels || []}
          />
        )}
        {activeTab === 'tier1' && (
          <>
            <div className={styles.premiumModelSelectorContainer}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <span className={styles.sectionTitle} style={{ fontSize: '1.25em', color: '#74d0fc', fontWeight: 700, letterSpacing: '0.01em' }}>
                  Select Ollama Model
                </span>
                <Tooltip text="Choose the Ollama model to use as the base for your Modelfile. Models are loaded from your local Ollama instance.">
                  <span className={styles.tooltipIcon} style={{ marginLeft: 6, fontSize: 18 }}>(?)</span>
                </Tooltip>
              </div>
              <div style={{ marginBottom: 18, marginTop: 4, width: '100%' }}>
                <ModelSelector onlyOllama premiumCardStyle />
              </div>
              <div style={{ borderBottom: '1.5px solid #244e82', margin: '18px 0 24px 0', opacity: 0.35 }} />
            </div>
            <Tier1ConfigForm {...props} />
          </>
        )}
        {activeTab === 'tier2' && (
          <div className={styles.tier2TabPanel}>
            <Tier2GGUFImporter {...props} />
            <Tier2QLoRAConfig {...props} />
          </div>
        )}
        {activeTab === 'aiassist' && (
          <div className={styles.aiAssistTabPanel}>
            <AIAssistConfig {...props} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AetherCreatorTabs;
