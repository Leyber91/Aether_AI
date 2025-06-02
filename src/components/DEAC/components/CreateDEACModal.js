import React, { useState, useEffect } from 'react';
import { FiX, FiCpu, FiCheck, FiAlertCircle } from 'react-icons/fi';

/**
 * CreateDEACModal - Modal for creating new DEACs
 */
const CreateDEACModal = ({ isOpen, onClose, onSubmit, systemStatus }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_model: 'qwen3:8b',
    evolution_enabled: true,
    evolution_frequency: 100,
    max_evolution_steps: 50,
    memory_enabled: true,
    max_memory_size: 10000,
    collaboration_enabled: false,
    specialization_domains: []
  });

  const [availableModels, setAvailableModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [errors, setErrors] = useState({});

  // Predefined specialization domains
  const specializationOptions = [
    'general',
    'research',
    'creative',
    'technical',
    'educational',
    'business',
    'problem_solving',
    'data_analysis',
    'programming',
    'writing'
  ];

  // Fetch available models
  useEffect(() => {
    if (isOpen) {
      fetchAvailableModels();
    }
  }, [isOpen]);

  const fetchAvailableModels = async () => {
    try {
      setLoadingModels(true);
      const response = await fetch('http://localhost:8000/api/models/ollama');
      if (response.ok) {
        const models = await response.json();
        setAvailableModels(models);
        
        // Set default model if available
        if (models.length > 0 && !formData.base_model) {
          setFormData(prev => ({ ...prev, base_model: models[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSpecializationChange = (domain, isChecked) => {
    setFormData(prev => ({
      ...prev,
      specialization_domains: isChecked
        ? [...prev.specialization_domains, domain]
        : prev.specialization_domains.filter(d => d !== domain)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.base_model) {
      newErrors.base_model = 'Base model is required';
    }

    if (formData.evolution_frequency < 1) {
      newErrors.evolution_frequency = 'Evolution frequency must be at least 1';
    }

    if (formData.max_evolution_steps < 1) {
      newErrors.max_evolution_steps = 'Max evolution steps must be at least 1';
    }

    if (formData.max_memory_size < 100) {
      newErrors.max_memory_size = 'Max memory size must be at least 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const result = await onSubmit(formData);
      
      if (result.success) {
        setSubmitMessage({ type: 'success', text: result.message });
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2000);
      } else {
        setSubmitMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setSubmitMessage({ type: 'error', text: 'Failed to create DEAC' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      base_model: 'qwen3:8b',
      evolution_enabled: true,
      evolution_frequency: 100,
      max_evolution_steps: 50,
      memory_enabled: true,
      max_memory_size: 10000,
      collaboration_enabled: false,
      specialization_domains: []
    });
    setErrors({});
    setSubmitMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container create-deac-modal">
        <div className="modal-header">
          <div className="modal-title">
            <FiCpu className="modal-icon" />
            <h2>Create New DEAC</h2>
          </div>
          <button className="modal-close" onClick={handleClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-content">
          {!systemStatus?.available && (
            <div className="alert alert-warning">
              <FiAlertCircle />
              <div>
                <strong>System Not Available</strong>
                <p>The DEAC system is not fully operational. Please check system status.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="form-section">
              <h3>Basic Information</h3>
              
              <div className="form-group">
                <label htmlFor="name">DEAC Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Research Assistant DEAC"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the purpose and capabilities of this DEAC..."
                  rows={3}
                  className={errors.description ? 'error' : ''}
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="base_model">Base Model *</label>
                {loadingModels ? (
                  <div className="loading-inline">
                    <div className="loading-spinner small"></div>
                    <span>Loading models...</span>
                  </div>
                ) : (
                  <select
                    id="base_model"
                    name="base_model"
                    value={formData.base_model}
                    onChange={handleInputChange}
                    className={errors.base_model ? 'error' : ''}
                  >
                    <option value="">Select a model...</option>
                    {availableModels.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name || model.id}
                      </option>
                    ))}
                  </select>
                )}
                {errors.base_model && <span className="error-message">{errors.base_model}</span>}
              </div>
            </div>

            {/* Evolution Settings */}
            <div className="form-section">
              <h3>Evolution Settings</h3>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="evolution_enabled"
                    checked={formData.evolution_enabled}
                    onChange={handleInputChange}
                  />
                  Enable Evolution
                </label>
                <span className="help-text">Allow this DEAC to evolve and improve over time</span>
              </div>

              {formData.evolution_enabled && (
                <>
                  <div className="form-group">
                    <label htmlFor="evolution_frequency">Evolution Frequency</label>
                    <input
                      type="number"
                      id="evolution_frequency"
                      name="evolution_frequency"
                      value={formData.evolution_frequency}
                      onChange={handleInputChange}
                      min="1"
                      max="1000"
                      className={errors.evolution_frequency ? 'error' : ''}
                    />
                    <span className="help-text">Trigger evolution every N interactions</span>
                    {errors.evolution_frequency && <span className="error-message">{errors.evolution_frequency}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="max_evolution_steps">Max Evolution Steps</label>
                    <input
                      type="number"
                      id="max_evolution_steps"
                      name="max_evolution_steps"
                      value={formData.max_evolution_steps}
                      onChange={handleInputChange}
                      min="1"
                      max="100"
                      className={errors.max_evolution_steps ? 'error' : ''}
                    />
                    <span className="help-text">Maximum number of evolution steps allowed</span>
                    {errors.max_evolution_steps && <span className="error-message">{errors.max_evolution_steps}</span>}
                  </div>
                </>
              )}
            </div>

            {/* Memory Settings */}
            <div className="form-section">
              <h3>Memory Settings</h3>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="memory_enabled"
                    checked={formData.memory_enabled}
                    onChange={handleInputChange}
                  />
                  Enable Memory
                </label>
                <span className="help-text">Allow this DEAC to store and recall interactions</span>
              </div>

              {formData.memory_enabled && (
                <div className="form-group">
                  <label htmlFor="max_memory_size">Max Memory Size</label>
                  <input
                    type="number"
                    id="max_memory_size"
                    name="max_memory_size"
                    value={formData.max_memory_size}
                    onChange={handleInputChange}
                    min="100"
                    max="100000"
                    step="100"
                    className={errors.max_memory_size ? 'error' : ''}
                  />
                  <span className="help-text">Maximum number of memory vectors to store</span>
                  {errors.max_memory_size && <span className="error-message">{errors.max_memory_size}</span>}
                </div>
              )}
            </div>

            {/* Specialization */}
            <div className="form-section">
              <h3>Specialization Domains</h3>
              <p className="section-description">Select areas where this DEAC should focus its learning and expertise</p>
              
              <div className="checkbox-grid">
                {specializationOptions.map(domain => (
                  <label key={domain} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.specialization_domains.includes(domain)}
                      onChange={(e) => handleSpecializationChange(domain, e.target.checked)}
                    />
                    <span>{domain.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Collaboration */}
            <div className="form-section">
              <h3>Collaboration</h3>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="collaboration_enabled"
                    checked={formData.collaboration_enabled}
                    onChange={handleInputChange}
                  />
                  Enable Collaboration
                </label>
                <span className="help-text">Allow this DEAC to work with other DEACs</span>
              </div>
            </div>

            {submitMessage && (
              <div className={`alert alert-${submitMessage.type}`}>
                {submitMessage.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
                <span>{submitMessage.text}</span>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || !systemStatus?.available}
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner small"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <FiCpu />
                    Create DEAC
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateDEACModal; 