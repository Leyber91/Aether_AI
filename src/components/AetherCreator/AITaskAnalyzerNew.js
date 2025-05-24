import React, { useState, useEffect } from 'react';
import {
  Box, 
  TextField,
  Button,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MemoryIcon from '@mui/icons-material/Memory';
import SpeedIcon from '@mui/icons-material/Speed';
import CodeIcon from '@mui/icons-material/Code';
import TranslateIcon from '@mui/icons-material/Translate';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ChatIcon from '@mui/icons-material/Chat';
import IntentAnalyzer from './services/IntentAnalyzer';
import ContextEnhancer from './services/ContextEnhancer';
import ModelCapabilityMapper from './services/ModelCapabilityMapper';
import { fetchAvailableOllamaModels } from '../../api/apiService';

/**
 * AITaskAnalyzer - Advanced model requirements analysis component
 * Uses multiple AI models to analyze user requirements and recommend optimal models
 */
const AITaskAnalyzer = ({ onAnalysisComplete }) => {
  const [userInput, setUserInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [stage, setStage] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  
  // Create service instances
  const intentAnalyzer = new IntentAnalyzer();
  const contextEnhancer = new ContextEnhancer();
  const modelCapabilityMapper = new ModelCapabilityMapper();
  
  // Fetch available models on component mount
  useEffect(() => {
    const getAvailableModels = async () => {
      try {
        setFetchingModels(true);
        const models = await fetchAvailableOllamaModels();
        setAvailableModels(models);
      } catch (err) {
        console.error('Error fetching available models:', err);
        setError('Could not fetch available Ollama models. Ensure Ollama is running.');
      } finally {
        setFetchingModels(false);
      }
    };
    
    getAvailableModels();
  }, []);

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleAnalyze = async () => {
    if (!userInput.trim()) {
      setError('Please enter a description of your model requirements');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setStage('intent_analysis');

    try {
      // Stage 1: Deep analysis of user intent
      const intentAnalysis = await intentAnalyzer.analyzeIntent(userInput);
      setStage('context_enhancement');
      
      // Stage 2: Enhance context with additional information
      const enhancedContext = await contextEnhancer.enhanceContext(intentAnalysis);
      setStage('model_selection');
      
      // Stage 3: Map to optimal model capabilities
      const requirements = extractRequirements(enhancedContext);
      const modelSelection = await modelCapabilityMapper.selectOptimalModel(requirements, availableModels);
      
      // Combine all results
      const combinedResult = {
        userInput,
        intentAnalysis,
        enhancedContext,
        modelSelection,
        recommendedModel: modelSelection.primaryRecommendation,
        taskDescription: userInput,
        expectedPerformance: {
          vramUsage: `${estimateVramUsage(modelSelection.primaryRecommendation.modelId)}GB`,
          responseSpeed: estimateResponseSpeed(modelSelection.primaryRecommendation.modelId),
          qualityLevel: estimateQualityLevel(modelSelection.primaryRecommendation.totalScore)
        }
      };
      
      setAnalysisResult(combinedResult);
      setStage('complete');
      
      // Call the completion callback if provided
      if (onAnalysisComplete) {
        onAnalysisComplete(combinedResult);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(`Analysis failed: ${err.message}`);
      setStage('error');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  /**
   * Extract structured requirements from enhanced context
   */
  const extractRequirements = (enhancedContext) => {
    return {
      taskCategory: enhancedContext.classification?.category || 'general',
      capabilities: enhancedContext.classification?.capabilities || [],
      contextWindow: enhancedContext.technicalReqs?.contextLength || 4096,
      performanceNeeds: enhancedContext.technicalReqs?.performance || 'balanced',
      specialRequirements: enhancedContext.technicalReqs?.specialCapabilities || [],
      description: enhancedContext.deepAnalysis,
    };
  };
  
  /**
   * Estimate VRAM usage based on model
   */
  const estimateVramUsage = (modelId) => {
    if (modelId.includes('phi4-mini')) return 3.8;
    if (modelId.includes('qwen3:8b')) return 8;
    if (modelId.includes('qwen3:4b')) return 4;
    if (modelId.includes('qwen3:1.7b')) return 2;
    if (modelId.includes('deepseek-r1:8b')) return 8;
    return 4; // Default estimate
  };
  
  /**
   * Estimate response speed based on model
   */
  const estimateResponseSpeed = (modelId) => {
    if (modelId.includes('qwen3:1.7b')) return 'Very Fast';
    if (modelId.includes('qwen3:4b')) return 'Fast';
    if (modelId.includes('phi4-mini')) return 'Medium';
    if (modelId.includes('qwen3:8b')) return 'Medium';
    if (modelId.includes('deepseek-r1:8b')) return 'Slower';
    return 'Medium'; // Default estimate
  };
  
  /**
   * Estimate quality level based on score
   */
  const estimateQualityLevel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Very Good';
    if (score >= 60) return 'Good';
    if (score >= 45) return 'Adequate';
    return 'Basic';
  };
  
  /**
   * Get icon for task category
   */
  const getCategoryIcon = (category) => {
    if (!category) return <PsychologyIcon />;
    
    category = category.toLowerCase();
    if (category.includes('code') || category.includes('programming')) return <CodeIcon />;
    if (category.includes('creative') || category.includes('writing')) return <AssessmentIcon />;
    if (category.includes('analysis') || category.includes('reasoning')) return <PsychologyIcon />;
    if (category.includes('chat') || category.includes('conversation')) return <ChatIcon />;
    if (category.includes('translate') || category.includes('multilingual')) return <TranslateIcon />;
    return <MemoryIcon />;
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          AI Task Analyzer
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Describe your AI model requirements in detail, and our system will analyze them to recommend
          the optimal model architecture and configuration.
        </Typography>
        
        <TextField
          label="Describe your AI model requirements"
          multiline
          rows={4}
          fullWidth
          value={userInput}
          onChange={handleInputChange}
          placeholder="Example: I need an AI assistant that can analyze code, explain programming concepts, and help debug errors. It should be optimized for speed and work well with Python and JavaScript."
          disabled={isAnalyzing}
          sx={{ mb: 2 }}
        />
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleAnalyze}
          disabled={isAnalyzing || !userInput.trim()}
          startIcon={isAnalyzing ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Requirements'}
        </Button>
        
        {stage && stage !== 'complete' && stage !== 'error' && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2">
              {stage === 'intent_analysis' && 'Analyzing requirements with phi4-mini-reasoning...'}
              {stage === 'context_enhancement' && 'Enhancing context analysis...'}
              {stage === 'model_selection' && 'Selecting optimal model architecture...'}
            </Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>
      
      {fetchingModels && !analysisResult && (
        <Box display="flex" alignItems="center" mb={2}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2">Fetching available Ollama models...</Typography>
        </Box>
      )}
      
      {availableModels.length > 0 && !analysisResult && !isAnalyzing && (
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary">
            {availableModels.length} Ollama models available for selection
          </Typography>
        </Box>
      )}
      
      {analysisResult && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getCategoryIcon(analysisResult.modelSelection.primaryRecommendation.modelId)}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    Recommended Model
                  </Typography>
                </Box>
                
                <Typography variant="h5" gutterBottom>
                  {analysisResult.modelSelection.primaryRecommendation.modelId}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip 
                    label={`${analysisResult.modelSelection.primaryRecommendation.capabilities.parameterCount}`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip 
                    label={`Context: ${analysisResult.modelSelection.primaryRecommendation.capabilities.contextWindow}`}
                    color="secondary"
                    variant="outlined"
                  />
                  <Chip 
                    label={`Speed: ${analysisResult.modelSelection.primaryRecommendation.capabilities.speed}`}
                    icon={<SpeedIcon />}
                    variant="outlined"
                  />
                  <Chip 
                    label={analysisResult.modelSelection.primaryRecommendation.available ? "Available locally" : "Not installed"}
                    color={analysisResult.modelSelection.primaryRecommendation.available ? "success" : "error"}
                    variant="outlined"
                  />
                </Box>
                
                {analysisResult.modelSelection.warning && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {analysisResult.modelSelection.warning}
                  </Alert>
                )}
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {analysisResult.modelSelection.primaryRecommendation.rationale}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Alternative Models
                </Typography>
                
                {analysisResult.modelSelection.alternativeModels.length > 0 ? (
                  <List dense>
                    {analysisResult.modelSelection.alternativeModels.map((model, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          {getCategoryIcon(model.modelId)}
                        </ListItemIcon>
                        <ListItemText 
                          primary={
                            <Box display="flex" alignItems="center">
                              {model.modelId}
                              {model.available ? (
                                <Chip size="small" label="Available" color="success" sx={{ ml: 1 }} />
                              ) : (
                                <Chip size="small" label="Not installed" color="error" sx={{ ml: 1 }} />
                              )}
                            </Box>
                          }
                          secondary={model.rationale.split('.')[0] + '.'} 
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No alternative models available.
                  </Typography>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Expected Performance
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip 
                    label={`VRAM: ${analysisResult.expectedPerformance.vramUsage}`}
                    size="small"
                  />
                  <Chip 
                    label={`Speed: ${analysisResult.expectedPerformance.responseSpeed}`}
                    size="small"
                  />
                  <Chip 
                    label={`Quality: ${analysisResult.expectedPerformance.qualityLevel}`}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alternative Models
                </Typography>
                
                {analysisResult.modelSelection.alternativeModels.map((model, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">
                      {model.modelId} ({model.totalScore}/100)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {model.rationale}
                    </Typography>
                    {index < analysisResult.modelSelection.alternativeModels.length - 1 && (
                      <Divider sx={{ my: 1 }} />
                    )}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Detailed Analysis</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Classification
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Task Category: {analysisResult.enhancedContext.classification?.category || 'General'}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      Required Capabilities
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {(analysisResult.enhancedContext.classification?.capabilities || []).map((cap, i) => (
                        <Chip key={i} label={cap} size="small" />
                      ))}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Technical Requirements
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Context Length: {analysisResult.enhancedContext.technicalReqs?.contextLength || 'Not specified'}
                      <br />
                      Performance Priority: {analysisResult.enhancedContext.technicalReqs?.performance || 'Balanced'}
                    </Typography>
                    
                    {analysisResult.enhancedContext.clarifications?.needsClarification && (
                      <>
                        <Typography variant="subtitle1" gutterBottom>
                          Suggested Clarifications
                        </Typography>
                        <Box component="ul" sx={{ pl: 2 }}>
                          {(analysisResult.enhancedContext.clarifications?.questions || []).map((q, i) => (
                            <Box component="li" key={i}>
                              <Typography variant="body2">{q.question || q}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </>
                    )}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
          
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Available Ollama Models ({availableModels.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={1}>
                  {availableModels.map((model, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                      <Chip
                        label={model.name}
                        variant="outlined"
                        color={analysisResult?.modelSelection?.primaryRecommendation?.modelId === model.name ? "primary" : "default"}
                        sx={{ m: 0.5 }}
                      />
                    </Grid>
                  ))}
                </Grid>
                
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary">
                    Model selection automatically prioritizes available models. Missing your preferred model?
                    Install it with: <code>ollama pull MODEL_NAME</code>
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AITaskAnalyzer;
