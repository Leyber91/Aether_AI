import React, { useState } from 'react';
import styles from './GoalToFlowWizard.module.css';

const DEFAULT_PLACEHOLDER = 'Describe what you want to automate or achieve...';

const GoalToFlowWizard = ({ onGenerate, onCancel, loading }) => {
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = () => {
    if (!goal.trim()) {
      setError('Please enter a goal or workflow description.');
      return;
    }
    setError('');
    onGenerate(goal.trim());
  };

  return (
    <div className={styles.wizardOverlay}>
      <div className={styles.wizardModal}>
        <h2>Goal-to-Flow AI Wizard</h2>
        <p className={styles.instructions}>
          Describe your workflow goal in plain language. The AI will generate a draft workflow using core nodes.
        </p>
        <textarea
          className={styles.goalInput}
          placeholder={DEFAULT_PLACEHOLDER}
          value={goal}
          onChange={e => setGoal(e.target.value)}
          disabled={loading}
          rows={4}
        />
        {error && <div className={styles.errorMsg}>{error}</div>}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={loading}>Cancel</button>
          <button className={styles.generateBtn} onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Flow'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalToFlowWizard;
