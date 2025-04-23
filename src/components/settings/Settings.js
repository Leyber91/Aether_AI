import React, { useState } from 'react';
import OllamaModelMonitor from './OllamaModelMonitor';
import BackButton from '../common/BackButton';
import './Settings.css';

/**
 * Settings Component
 * Provides UI for application settings and configuration
 */
const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  
  return (
    <div className="settings-container glass-panel">
      <div className="settings-header">
        <h2>Settings</h2>
        <BackButton />
      </div>
      
      <div className="settings-tabs">
        <button 
          className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button 
          className={`tab-button ${activeTab === 'models' ? 'active' : ''}`}
          onClick={() => setActiveTab('models')}
        >
          Models
        </button>
        <button 
          className={`tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          Advanced
        </button>
      </div>
      
      <div className="settings-content">
        {activeTab === 'general' && (
          <div className="settings-section">
            <h3>General Settings</h3>
            <div className="setting-item">
              <label>
                <input type="checkbox" name="enableAutoSuggestions" defaultChecked />
                Enable Auto-suggestions
              </label>
              <p className="setting-description">
                Show real-time typing suggestions from Ollama models
              </p>
            </div>
            
            <div className="setting-item">
              <label>
                <input type="checkbox" name="enablePromptEnhancement" defaultChecked />
                Enable Prompt Enhancement
              </label>
              <p className="setting-description">
                Automatically improve prompts for better responses
              </p>
            </div>
          </div>
        )}
        
        {activeTab === 'models' && (
          <div className="settings-section">
            <h3>Model Settings</h3>
            <p>Configure model selection and view available models.</p>
            
            {/* Ollama Model Monitor */}
            <OllamaModelMonitor />
            
            <div className="setting-item">
              <label>
                <input type="checkbox" name="dynamicModelSelection" defaultChecked />
                Enable Dynamic Model Selection
              </label>
              <p className="setting-description">
                Automatically select the best model based on your query
              </p>
            </div>
          </div>
        )}
        
        {activeTab === 'advanced' && (
          <div className="settings-section">
            <h3>Advanced Settings</h3>
            <div className="setting-item">
              <label>
                <input type="checkbox" name="debugMode" />
                Debug Mode
              </label>
              <p className="setting-description">
                Show additional debugging information
              </p>
            </div>
            
            <div className="setting-item">
              <label>
                Maximum Suggestions Length:
                <select name="maxSuggestionsLength" defaultValue="30">
                  <option value="10">10 tokens</option>
                  <option value="20">20 tokens</option>
                  <option value="30">30 tokens</option>
                  <option value="50">50 tokens</option>
                </select>
              </label>
              <p className="setting-description">
                Maximum length of auto-completion suggestions
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
