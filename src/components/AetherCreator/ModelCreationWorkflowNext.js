import React, { useState, useEffect } from 'react';
import {
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  Typography, 
  Card, 
  CardContent,
  LinearProgress,
  Alert,
  Chip,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress
} from '@mui/material';
import {
  Psychology as AnalyzeIcon,
  Build as OptimizeIcon,
  Tune as RefineIcon,
  CheckCircle as CompleteIcon,
  Timeline as MetricsIcon
} from '@mui/icons-material';

import AITaskAnalyzer from './AITaskAnalyzerNew';
import ModelGenerationService from './services/ModelGenerationService';
import { useHardwareProfile } from '../../hooks/useHardwareProfile';

const steps = [
  {
    label: 'Task Analysis',
    description: 'Analyze requirements and recommend optimal approach',
    icon: <AnalyzeIcon />
  },
  {
    label: 'Model Creation',
    description: 'Design architecture and optimize parameters',
    icon: <OptimizeIcon />
  },
  {
    label: 'Performance Testing',
    description: 'Evaluate model performance and metrics',
    icon: <MetricsIcon />
  },
  {
    label: 'Iterative Refinement',
    description: 'Apply AI-driven optimizations for best performance',
    icon: <RefineIcon />
  },
  {
    label: 'Deployment Ready',
    description: 'Model is optimized and ready for use',
    icon: <CompleteIcon />
  }
];

const ModelCreationWorkflowNext = ({ onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [workflowData, setWorkflowData] = useState({
    analysis: null,
    architecture: null,
    configuration: null,
    tests: null,
    metrics: null,
    refinement: null,
    finalModel: null
  });
  const [error, setError] = useState(null);
  const [showMetricsDialog, setShowMetricsDialog] = useState(false);
  const [showModelfileDialog, setShowModelfileDialog] = useState(false);
  const [modelName, setModelName] = useState('aether-custom-model');
  const { hardwareProfile } = useHardwareProfile();
  const modelGenerationService = new ModelGenerationService();

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setWorkflowData({
      analysis: null,
      architecture: null,
      configuration: null,
      tests: null,
      metrics: null,
      refinement: null,
      finalModel: null
    });
    setError(null);
    setProgress(0);
  };

  const handleTaskAnalysisComplete = async (analysisResult) => {
    setWorkflowData(prev => ({ ...prev, analysis: analysisResult }));
    handleNext();
  };

  const executeModelGeneration = async () => {
    if (!workflowData.analysis) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Use ModelGenerationService to generate the model
      const result = await modelGenerationService.generateModel(
        {
          description: workflowData.analysis.taskDescription,
          modelName: modelName,
          hardwareProfile: hardwareProfile
        },
        (progressUpdate) => {
          setProgress(progressUpdate.progress * 100);
          console.log(`Progress: ${progressUpdate.stage} - ${progressUpdate.message}`);
        }
      );

      if (result.success) {
        // Update workflow data with generation results
        setWorkflowData(prev => ({
          ...prev,
          architecture: result.architecture,
          configuration: result.configuration,
          tests: result.tests,
          metrics: result.metrics,
          refinement: result.improvements,
          finalModel: {
            modelName: result.modelName,
            modelfile: result.deployment.modelfile,
            deploymentInstructions: result.deployment.deploymentInstructions
          }
        }));

        // Auto-advance through remaining steps
        setTimeout(() => {
          setActiveStep(2); // Performance Testing
          setTimeout(() => {
            setActiveStep(3); // Iterative Refinement
            setTimeout(() => {
              setActiveStep(4); // Deployment Ready
            }, 1000);
          }, 1000);
        }, 1000);
      } else {
        setError(`Error generating model: ${result.error}`);
      }
    } catch (error) {
      setError(`Error generating model: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModelNameChange = (e) => {
    setModelName(e.target.value.replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase());
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <AITaskAnalyzer onAnalysisComplete={handleTaskAnalysisComplete} />
        );

      case 1:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Model Creation & Optimization
              </Typography>
              
              {workflowData.analysis && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Configuration Summary:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip 
                      label={workflowData.analysis.recommendedModel.modelId}
                      color="primary"
                    />
                    <Chip 
                      label={workflowData.analysis.recommendedModel.capabilities.parameterCount}
                      variant="outlined"
                    />
                    <Chip 
                      label={`VRAM: ${workflowData.analysis.expectedPerformance.vramUsage}`}
                      variant="outlined"
                    />
                  </Box>

                  <TextField
                    label="Model Name"
                    value={modelName}
                    onChange={handleModelNameChange}
                    fullWidth
                    margin="normal"
                    helperText="Lowercase letters, numbers, hyphens and underscores only"
                    disabled={isProcessing}
                  />
                </Box>
              )}

              {isProcessing && (
                <Box sx={{ width: '100%', mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Generating your optimized model...
                  </Typography>
                  <LinearProgress variant="determinate" value={progress} />
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    {Math.round(progress)}% Complete
                  </Typography>
                </Box>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={executeModelGeneration}
                  disabled={isProcessing || !workflowData.analysis}
                  startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {isProcessing ? 'Generating...' : 'Generate Model'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Testing
              </Typography>
              
              {workflowData.metrics ? (
                <>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                        <Typography variant="h3" color="primary">
                          {Math.round(workflowData.metrics.qualityScore?.overallScore || 0)}
                        </Typography>
                        <Typography variant="body2">
                          Overall Quality Score
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={4}>
                      <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                        <Typography variant="h3" color="success.main">
                          {Math.round(workflowData.metrics.qualityScore?.overallPassRate || 0)}%
                        </Typography>
                        <Typography variant="body2">
                          Test Pass Rate
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={4}>
                      <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                        <Typography variant="h3" color="info.main">
                          {Math.round(workflowData.metrics.qualityScore?.performanceMetrics?.averageLatency || 0)}ms
                        </Typography>
                        <Typography variant="body2">
                          Average Latency
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Button 
                    variant="outlined" 
                    onClick={() => setShowMetricsDialog(true)}
                    sx={{ mr: 1 }}
                  >
                    View Detailed Metrics
                  </Button>
                </>
              ) : (
                <Alert severity="info">
                  Performance data will be available after model generation is complete.
                </Alert>
              )}
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Iterative Refinement
              </Typography>
              
              {workflowData.refinement ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      AI-Suggested Improvements (Priority: {workflowData.refinement.priority || 'medium'})
                    </Typography>
                    
                    <Box component="ul" sx={{ pl: 2 }}>
                      {(workflowData.refinement.suggestions || []).map((suggestion, i) => (
                        <Box component="li" key={i}>
                          <Typography variant="body2">{suggestion}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </>
              ) : (
                <Alert severity="info">
                  Refinement suggestions will be available after performance testing is complete.
                </Alert>
              )}
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Deployment Ready
              </Typography>
              
              {workflowData.finalModel ? (
                <>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Your custom model "{workflowData.finalModel.modelName}" is ready for deployment!
                  </Alert>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Deployment Options:
                    </Typography>
                    
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      onClick={() => setShowModelfileDialog(true)}
                      sx={{ mr: 1, mb: 1 }}
                    >
                      View Modelfile
                    </Button>
                    
                    <Button 
                      variant="contained" 
                      color="primary"
                      sx={{ mb: 1 }}
                      onClick={() => {
                        // In production, this would actually deploy the model
                        alert('In a production environment, this would deploy the model to your Ollama instance.');
                      }}
                    >
                      Deploy to Ollama
                    </Button>
                  </Box>
                </>
              ) : (
                <Alert severity="info">
                  Deployment options will be available after model generation is complete.
                </Alert>
              )}
              
              <Box sx={{ mt: 2 }}>
                <Button onClick={handleReset}>
                  Create Another Model
                </Button>
              </Box>
            </CardContent>
          </Card>
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((step, index) => (
          <Step key={index}>
            <StepLabel StepIconComponent={() => 
              <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: activeStep >= index ? 'primary.main' : 'grey.400',
                color: 'white'
              }}>
                {step.icon}
              </Box>
            }>
              <Typography variant="body2" fontWeight={activeStep === index ? 'bold' : 'normal'}>
                {step.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {step.description}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 4, mb: 2 }}>
        {renderStepContent(activeStep)}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
        <Button
          color="inherit"
          disabled={activeStep === 0 || isProcessing}
          onClick={handleBack}
          sx={{ mr: 1 }}
        >
          Back
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        {activeStep < steps.length - 1 && activeStep !== 0 && (
          <Button 
            onClick={handleNext}
            disabled={
              isProcessing || 
              (activeStep === 1 && !workflowData.architecture) ||
              (activeStep === 2 && !workflowData.metrics) ||
              (activeStep === 3 && !workflowData.refinement)
            }
          >
            Next
          </Button>
        )}
      </Box>

      {/* Metrics Dialog */}
      <Dialog 
        open={showMetricsDialog} 
        onClose={() => setShowMetricsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detailed Performance Metrics</DialogTitle>
        <DialogContent>
          {workflowData.metrics && (
            <>
              <Typography variant="h6" gutterBottom>
                Category Performance
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {(workflowData.metrics.qualityScore?.categoryScores || []).map((category, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body1" fontWeight="bold">
                        {category.category}
                      </Typography>
                      <Typography variant="h4" color={category.passRate > 70 ? 'success.main' : 'warning.main'}>
                        {Math.round(category.passRate)}%
                      </Typography>
                      <Typography variant="caption">
                        Weight: {Math.round(category.weight * 100)}%
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Typography variant="h6" gutterBottom>
                Failed Tests
              </Typography>
              {workflowData.metrics.failed && workflowData.metrics.failed.length > 0 ? (
                workflowData.metrics.failed.slice(0, 3).map((failure, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1">
                      {failure.test.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Category: {failure.category}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Input:</strong> {failure.test.input}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Expected:</strong> {failure.test.expected}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Failure Reason:</strong> {failure.test.failureIndicators}
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Alert severity="success">No failed tests!</Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMetricsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Modelfile Dialog */}
      <Dialog 
        open={showModelfileDialog} 
        onClose={() => setShowModelfileDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Modelfile for {workflowData.finalModel?.modelName}</DialogTitle>
        <DialogContent>
          {workflowData.finalModel && (
            <>
              <TextField
                multiline
                fullWidth
                rows={20}
                value={workflowData.finalModel.modelfile}
                InputProps={{
                  readOnly: true,
                  sx: { fontFamily: 'monospace' }
                }}
                sx={{ mb: 2 }}
              />
              
              <Typography variant="subtitle1" gutterBottom>
                Deployment Instructions
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {workflowData.finalModel.deploymentInstructions}
                </Typography>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              if (workflowData.finalModel) {
                navigator.clipboard.writeText(workflowData.finalModel.modelfile);
                alert('Modelfile copied to clipboard!');
              }
            }}
          >
            Copy Modelfile
          </Button>
          <Button onClick={() => setShowModelfileDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModelCreationWorkflowNext;
