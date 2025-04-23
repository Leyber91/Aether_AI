import React from 'react';
import GoalToFlowWizard from '../../GoalToFlowWizard';

const GoalToFlowWizardPanel = ({ show, loading, onGenerate, onCancel }) => {
  if (!show) return null;
  return (
    <GoalToFlowWizard
      onGenerate={onGenerate}
      onCancel={onCancel}
      loading={loading}
    />
  );
};

export default GoalToFlowWizardPanel;
