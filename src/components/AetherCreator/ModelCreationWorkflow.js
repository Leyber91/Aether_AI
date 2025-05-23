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
  DialogActions
} from '@mui/material';
import {
  Psychology as AnalyzeIcon,
  Build as OptimizeIcon,
  Tune as RefineIcon,
  CheckCircle as CompleteIcon,
  Timeline as MetricsIcon
} from '@mui/icons-material';

import AITaskAnalyzer from './AITaskAnalyzer';
import { apiService } from '../../services/apiService';
import { useHardwareProfile } from '../../hooks/useHardwareProfile';

const steps = [
  {
    label: 'Task Analysis',
    description: 'Analyze requirements and recommend optimal approach',
    icon: <AnalyzeIcon />
  },
  {
    label: 'Model Creation',
    description: 'Download, convert, and optimize base model',
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

const ModelCreationWorkflow = ({ onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [workflowData, setWorkflowData] = useState({
    analysis: null,
    optimization: null,
    metrics: null,
    refinement: null,
    finalModel: null
  });
  const [error, setError] = useState(null);
  const [showMetricsDialog, setShowMetricsDialog] = useState(false);
  const { hardwareProfile } = useHardwareProfile();

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
      optimization: null,
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

  const executeModelCreation = async () => {
    if (!workflowData.analysis) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Step 1: Create optimized model
      setProgress(25);
      const optimizationResult = await apiService.createOptimizedModel({
        modelId: "meta-llama/Llama-2-7b-chat-hf", // Would be dynamic based on analysis
        taskDescription: workflowData.analysis.taskDescription,
        hardwareProfile: hardwareProfile,
        quantizationType: "q4_k_m"
      });

      setWorkflowData(prev => ({ ...prev, optimization: optimizationResult }));
      setProgress(50);

      // Step 2: Get performance metrics
      const metricsResult = await apiService.getPerformanceMetrics(
        optimizationResult.quantized_path,
        hardwareProfile
      );

      setWorkflowData(prev => ({ ...prev, metrics: metricsResult }));
      setProgress(75);

      // Step 3: Run iterative refinement
      const refinementResult = await apiService.runIterativeRefinement({
        modelPath: optimizationResult.quantized_path,
        testDataset: [], // Would include actual test data
        hardwareProfile: hardwareProfile,
        maxIterations: 3,
        targetEfficiency: 0.85
      });

      setWorkflowData(prev => ({ 
        ...prev, 
        refinement: refinementResult,
        finalModel: refinementResult.final_model
      }));
      setProgress(100);

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

    } catch (error) {
      setError(`Error creating model: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
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
                      label={workflowData.analysis.recommendedModel.name}
                      color="primary"
                    />
                    <Chip 
                      label={workflowData.analysis.recommendedModel.parameterCount}
                      variant="outlined"
                    />
                    <Chip 
                      label={`VRAM: ${workflowData.analysis.expectedPerformance.vramUsage}`}
                      variant="outlined"
                    />
                  </Box>
                </Box>
              )}

              {isProcessing && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    Creating optimized model...
                  </Typography>
                  <LinearProgress variant="determinate" value={progress} />
                  <Typography variant="caption" sx={{ mt: 1 }}>
                    {progress < 25 && "Downloading base model..."}
                    {progress >= 25 && progress < 50 && "Converting to GGUF and quantizing..."}
                    {progress >= 50 && progress < 75 && "Measuring performance..."}
                    {progress >= 75 && "Running iterative refinement..."}
                  </Typography>
                </Box>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                variant="contained"
                onClick={executeModelCreation}
                disabled={!workflowData.analysis || isProcessing}
                fullWidth
              >
                {isProcessing ? 'Creating Model...' : 'Start Model Creation'}
              </Button>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Testing Results
              </Typography>
              
              {workflowData.metrics ? (
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {(workflowData.metrics.accuracy * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="caption">Accuracy</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {workflowData.metrics.inference_speed.toFixed(1)}
                      </Typography>
                      <Typography variant="caption">Tokens/Second</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {workflowData.metrics.memory_usage.toFixed(1)}GB
                      </Typography>
                      <Typography variant="caption">Memory Usage</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {(workflowData.metrics.efficiency_score * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="caption">Efficiency Score</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              ) : (
                <Typography>Performance testing in progress...</Typography>
              )}

              <Button
                variant="outlined"
                onClick={() => setShowMetricsDialog(true)}
                sx={{ mt: 2 }}
                disabled={!workflowData.metrics}
              >
                View Detailed Metrics
              </Button>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Iterative Refinement Progress
              </Typography>
              
              {workflowData.refinement ? (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Refinement Summary:
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Total Iterations: {workflowData.refinement.total_iterations}
                    </Typography>
                    <Typography variant="body2">
                      Total Time: {workflowData.refinement.total_time.toFixed(2)}s
                    </Typography>
                    <Typography variant="body2" color="success.main">
                      Overall Improvement: {workflowData.refinement.report?.summary?.total_improvement_percent?.toFixed(2) || 'N/A'}%
                    </Typography>
                  </Box>

                  {workflowData.refinement.refinement_history?.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Applied Refinements:
                      </Typography>
                      {workflowData.refinement.refinement_history.map((step, index) => (
                        <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {step.component}: {step.action}
                          </Typography>
                          <Typography variant="caption" color={step.improvement > 0 ? 'success.main' : 'warning.main'}>
                            {step.improvement > 0 ? '+' : ''}{step.improvement.toFixed(2)}% efficiency change
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography>Iterative refinement in progress...</Typography>
              )}
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CompleteIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h4" gutterBottom>
                  Model Ready for Deployment!
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Your optimized model has been created and is ready for use in the Aether AI Suite.
                </Typography>

                {workflowData.finalModel && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Final Model Details:
                    </Typography>
                    <Typography variant="body2">
                      Path: {workflowData.finalModel}
                    </Typography>
                    
                    {workflowData.refinement?.final_metrics && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">Final Performance:</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
                          <Chip 
                            label={`${(workflowData.refinement.final_metrics.efficiency_score * 100).toFixed(1)}% Efficiency`}
                            color="success"
                          />
                          <Chip 
                            label={`${workflowData.refinement.final_metrics.inference_speed.toFixed(1)} t/s`}
                            color="primary"
                          />
                          <Chip 
                            label={`${workflowData.refinement.final_metrics.memory_usage.toFixed(1)}GB VRAM`}
                            color="info"
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}

                <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button 
                    variant="contained" 
                    onClick={() => onComplete && onComplete(workflowData)}
                  >
                    Use This Model
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={handleReset}
                  >
                    Create Another Model
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        );

      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AI Model Creation Workflow
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Create optimized AI models tailored to your specific tasks and hardware.
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {step.icon}
                <Box>
                  <Typography variant="subtitle2">{step.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {step.description}
                  </Typography>
                </Box>
              </Box>
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 2, mb: 1 }}>
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
        {activeStep < steps.length - 1 && (
          <Button 
            onClick={handleNext}
            disabled={
              (activeStep === 0 && !workflowData.analysis) ||
              (activeStep === 1 && !workflowData.optimization) ||
              isProcessing
            }
          >
            Next
          </Button>
        )}
      </Box>

      {/* Detailed Metrics Dialog */}
      <Dialog
        open={showMetricsDialog}
        onClose={() => setShowMetricsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detailed Performance Metrics</DialogTitle>
        <DialogContent>
          {workflowData.metrics && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Accuracy</Typography>
                <Typography variant="h6">{(workflowData.metrics.accuracy * 100).toFixed(2)}%</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Inference Speed</Typography>
                <Typography variant="h6">{workflowData.metrics.inference_speed.toFixed(2)} tokens/sec</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Memory Usage</Typography>
                <Typography variant="h6">{workflowData.metrics.memory_usage.toFixed(2)} GB</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Latency</Typography>
                <Typography variant="h6">{(workflowData.metrics.latency * 1000).toFixed(0)} ms</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Quality Score</Typography>
                <Typography variant="h6">{(workflowData.metrics.quality_score * 100).toFixed(1)}%</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Overall Efficiency</Typography>
                <Typography variant="h6">{(workflowData.metrics.efficiency_score * 100).toFixed(1)}%</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMetricsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModelCreationWorkflow; 