import { ollama } from '../../../services/ollamaService';

/**
 * ModelValidator - Automated model testing and validation
 * Runs test suites against models and evaluates results
 */
class ModelValidator {
  constructor() {
    this.evaluationModel = 'phi4-mini-reasoning:latest';
  }

  /**
   * Validate a model against a test suite
   * @param {string} modelName - Name of the model to test
   * @param {object} testSuite - Test suite to run
   * @param {object} requirements - Original user requirements
   * @returns {object} Validation results and metrics
   */
  async validateModel(modelName, testSuite, requirements) {
    const validationResults = {
      passed: [],
      failed: [],
      metrics: {},
      modelName
    };
    
    // Run through test suite categories
    for (const [category, tests] of Object.entries(testSuite.testSuite)) {
      console.log(`Running ${tests.length} tests for category: ${category}`);
      
      const categoryResults = await this.runCategoryTests(
        modelName, 
        category, 
        tests
      );
      
      this.aggregateResults(validationResults, categoryResults);
    }
    
    // Calculate quality score
    validationResults.qualityScore = this.calculateQualityScore(validationResults);
    
    // Generate improvement suggestions
    validationResults.improvements = await this.suggestImprovements(
      validationResults,
      requirements
    );
    
    return validationResults;
  }

  /**
   * Run tests for a specific category
   * @param {string} modelName - Name of the model to test
   * @param {string} category - Test category
   * @param {Array} tests - Tests to run
   * @returns {Array} Test results
   */
  async runCategoryTests(modelName, category, tests) {
    const results = [];
    
    for (const test of tests) {
      console.log(`Running test: ${test.title}`);
      
      const startTime = Date.now();
      
      try {
        const response = await ollama.chat({
          model: modelName,
          messages: [{ role: 'user', content: test.input }]
        });
        
        const endTime = Date.now();
        
        const result = {
          test,
          category,
          response: response.message.content,
          latency: endTime - startTime,
          passed: await this.evaluateResponse(test, response.message.content)
        };
        
        results.push(result);
        
      } catch (error) {
        console.error(`Error running test ${test.title}:`, error);
        
        // Add as failed test
        results.push({
          test,
          category,
          response: null,
          latency: 0,
          passed: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Evaluate if a model response passes the test
   * @param {object} test - Test definition
   * @param {string} response - Model response
   * @returns {boolean} Whether the test passed
   */
  async evaluateResponse(test, response) {
    // Use AI to evaluate the response
    const evaluationPrompt = `
      You are an objective test evaluator for AI model responses.
      Evaluate if this response meets the success criteria for the test.
      
      TEST INFORMATION:
      Title: ${test.title}
      Input prompt: ${test.input}
      Expected behavior: ${test.expected}
      Success criteria: ${test.successCriteria}
      Failure indicators: ${test.failureIndicators}
      
      ACTUAL RESPONSE:
      ${response}
      
      Analyze the response objectively against the success criteria and failure indicators.
      Focus solely on the criteria, not on subjective assessment of quality.
      Return a boolean true/false (without quotation marks) followed by a brief explanation.
    `;
    
    try {
      const evaluation = await ollama.chat({
        model: this.evaluationModel,
        messages: [{ role: 'user', content: evaluationPrompt }],
        options: { temperature: 0.1 }
      });
      
      const result = evaluation.message.content.trim();
      
      // Parse the boolean result from the beginning of the response
      if (result.toLowerCase().startsWith('true')) {
        return true;
      } else if (result.toLowerCase().startsWith('false')) {
        return false;
      }
      
      // If we can't clearly determine, check for pass/fail language
      const passTerms = ['pass', 'succeed', 'meets criteria', 'satisfies', 'successful'];
      const failTerms = ['fail', 'does not meet', 'doesn\'t meet', 'unsatisfactory', 'unsuccessful'];
      
      const textLower = result.toLowerCase();
      
      const passMatches = passTerms.filter(term => textLower.includes(term)).length;
      const failMatches = failTerms.filter(term => textLower.includes(term)).length;
      
      return passMatches > failMatches;
      
    } catch (error) {
      console.error('Error evaluating response:', error);
      
      // Fallback to simple heuristic
      return this.simpleEvaluate(test, response);
    }
  }

  /**
   * Simple heuristic evaluation as fallback
   * @param {object} test - Test definition
   * @param {string} response - Model response
   * @returns {boolean} Whether the test passed
   */
  simpleEvaluate(test, response) {
    if (!response) return false;
    
    // Check if response contains key terms from expected behavior
    const expectedTerms = test.expected
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 4)
      .slice(0, 5); // Take up to 5 significant words
    
    const responseLower = response.toLowerCase();
    const matchCount = expectedTerms.filter(term => responseLower.includes(term)).length;
    
    // Pass if more than half of expected terms are present
    const termRatio = matchCount / expectedTerms.length;
    
    // Check for failure indicators
    const failureIndicators = test.failureIndicators
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 4)
      .slice(0, 5);
    
    const failureMatchCount = failureIndicators.filter(term => responseLower.includes(term)).length;
    const failureRatio = failureMatchCount / (failureIndicators.length || 1);
    
    // Pass if expected terms ratio is high and failure ratio is low
    return termRatio > 0.5 && failureRatio < 0.3;
  }

  /**
   * Aggregate individual test results into the validation results
   * @param {object} validationResults - Results object to update
   * @param {Array} categoryResults - Results from a category
   */
  aggregateResults(validationResults, categoryResults) {
    // Add passed and failed tests to respective arrays
    categoryResults.forEach(result => {
      if (result.passed) {
        validationResults.passed.push(result);
      } else {
        validationResults.failed.push(result);
      }
    });
    
    // Update metrics
    const category = categoryResults[0]?.category || 'unknown';
    
    validationResults.metrics[category] = {
      total: categoryResults.length,
      passed: categoryResults.filter(r => r.passed).length,
      failed: categoryResults.filter(r => !r.passed).length,
      passRate: categoryResults.length > 0 
        ? (categoryResults.filter(r => r.passed).length / categoryResults.length) 
        : 0,
      averageLatency: categoryResults.length > 0
        ? categoryResults.reduce((sum, r) => sum + r.latency, 0) / categoryResults.length
        : 0
    };
  }

  /**
   * Calculate overall quality score from validation results
   * @param {object} validationResults - Validation results
   * @returns {object} Quality score and breakdown
   */
  calculateQualityScore(validationResults) {
    // Define weights for different test categories
    const categoryWeights = {
      basic_functionality: 0.35,
      edge_cases: 0.2,
      quality_metrics: 0.2,
      performance_benchmarks: 0.15,
      safety_checks: 0.1
    };
    
    // Calculate weighted score
    let weightedScore = 0;
    let appliedWeightSum = 0;
    
    for (const [category, metrics] of Object.entries(validationResults.metrics)) {
      const weight = categoryWeights[category] || 0.1;
      weightedScore += metrics.passRate * weight;
      appliedWeightSum += weight;
    }
    
    // Normalize score if we didn't have all categories
    const normalizedScore = appliedWeightSum > 0 
      ? weightedScore / appliedWeightSum 
      : 0;
    
    // Calculate other metrics
    const totalTests = validationResults.passed.length + validationResults.failed.length;
    const overallPassRate = totalTests > 0 
      ? validationResults.passed.length / totalTests 
      : 0;
    
    const allLatencies = [...validationResults.passed, ...validationResults.failed]
      .map(r => r.latency)
      .filter(l => l > 0);
    
    const avgLatency = allLatencies.length > 0
      ? allLatencies.reduce((sum, l) => sum + l, 0) / allLatencies.length
      : 0;
    
    return {
      overallScore: normalizedScore * 100, // 0-100 scale
      overallPassRate: overallPassRate * 100,
      categoryScores: Object.entries(validationResults.metrics).map(([category, metrics]) => ({
        category,
        passRate: metrics.passRate * 100,
        weight: categoryWeights[category] || 0.1
      })),
      performanceMetrics: {
        averageLatency: avgLatency,
        testsExecuted: totalTests,
        testsPassed: validationResults.passed.length,
        testsFailed: validationResults.failed.length
      }
    };
  }

  /**
   * Generate suggestions for improvement based on test results
   * @param {object} validationResults - Validation results
   * @param {object} requirements - Original requirements
   * @returns {object} Improvement suggestions
   */
  async suggestImprovements(validationResults, requirements) {
    // Extract failed tests
    const failedTests = validationResults.failed;
    
    if (failedTests.length === 0) {
      return {
        suggestions: ["No specific improvements needed - all tests passed."],
        priority: "low"
      };
    }
    
    // Group failures by category
    const failuresByCategory = {};
    failedTests.forEach(failure => {
      const category = failure.category;
      if (!failuresByCategory[category]) {
        failuresByCategory[category] = [];
      }
      failuresByCategory[category].push(failure);
    });
    
    // Generate improvement suggestions
    const improvementPrompt = `
      Analyze these test failures for an AI model and suggest improvements:
      
      Model name: ${validationResults.modelName}
      Original requirements: ${JSON.stringify(requirements)}
      
      Test failures by category:
      ${Object.entries(failuresByCategory).map(([category, failures]) => `
        Category: ${category} (${failures.length} failures)
        ${failures.map(f => `- ${f.test.title}: ${f.test.failureIndicators}`).join('\n        ')}
      `).join('\n')}
      
      Overall quality score: ${validationResults.qualityScore.overallScore.toFixed(1)}/100
      
      Provide:
      1. 3-5 specific improvement suggestions
      2. For each suggestion, explain the expected impact
      3. Prioritize suggestions (high/medium/low)
      4. For any critical issues, provide specific parameter adjustments
      
      Return as JSON with suggestions array and priority field.
    `;
    
    try {
      const result = await ollama.chat({
        model: this.evaluationModel,
        messages: [{ role: 'user', content: improvementPrompt }],
        options: { temperature: 0.3 }
      });
      
      return JSON.parse(result.message.content);
    } catch (e) {
      console.warn('Error parsing improvement suggestions:', e);
      
      // Fallback to simple suggestions
      return {
        suggestions: [
          "Improve system prompt to better address failure patterns",
          "Adjust temperature parameter to better match expected output style",
          "Consider using a different base model if performance is consistently poor"
        ],
        priority: failedTests.length > (validationResults.passed.length / 2) ? "high" : "medium",
        parsingError: true
      };
    }
  }

  /**
   * Generate a detailed report from validation results
   * @param {object} validationResults - Validation results
   * @returns {string} Formatted report
   */
  generateReport(validationResults) {
    const score = validationResults.qualityScore;
    
    let report = `# Model Validation Report: ${validationResults.modelName}\n\n`;
    
    // Overall score section
    report += `## Overall Performance\n\n`;
    report += `- **Quality Score**: ${score.overallScore.toFixed(1)}/100\n`;
    report += `- **Pass Rate**: ${score.overallPassRate.toFixed(1)}%\n`;
    report += `- **Tests Executed**: ${score.performanceMetrics.testsExecuted}\n`;
    report += `- **Average Latency**: ${score.performanceMetrics.averageLatency.toFixed(0)}ms\n\n`;
    
    // Category scores section
    report += `## Category Performance\n\n`;
    report += `| Category | Pass Rate | Weight |\n`;
    report += `|----------|-----------|--------|\n`;
    
    score.categoryScores.forEach(categoryScore => {
      report += `| ${this.formatCategoryName(categoryScore.category)} | ${categoryScore.passRate.toFixed(1)}% | ${(categoryScore.weight * 100).toFixed(0)}% |\n`;
    });
    
    report += `\n`;
    
    // Improvement suggestions
    report += `## Improvement Suggestions\n\n`;
    report += `**Priority**: ${validationResults.improvements.priority}\n\n`;
    
    validationResults.improvements.suggestions.forEach((suggestion, i) => {
      report += `${i + 1}. ${suggestion}\n`;
    });
    
    report += `\n`;
    
    // Failed tests summary
    if (validationResults.failed.length > 0) {
      report += `## Failed Tests (${validationResults.failed.length})\n\n`;
      
      validationResults.failed.forEach((failure, i) => {
        report += `### ${i + 1}. ${failure.test.title}\n\n`;
        report += `**Category**: ${this.formatCategoryName(failure.category)}\n\n`;
        report += `**Input**: ${failure.test.input}\n\n`;
        report += `**Expected**: ${failure.test.expected}\n\n`;
        report += `**Actual Response**: ${failure.response || 'No response (error)'}\n\n`;
        report += `**Failure Reason**: ${failure.test.failureIndicators}\n\n`;
        
        if (i < validationResults.failed.length - 1) {
          report += `---\n\n`;
        }
      });
    }
    
    return report;
  }
  
  /**
   * Format category name for display
   * @param {string} category - Category name
   * @returns {string} Formatted name
   */
  formatCategoryName(category) {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

export default ModelValidator;
