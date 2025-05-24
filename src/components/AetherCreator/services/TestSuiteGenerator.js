import { ollama } from '../../../services/ollamaService';

/**
 * TestSuiteGenerator - Automated test case generation
 * Creates comprehensive test suites to validate model performance
 */
class TestSuiteGenerator {
  constructor() {
    this.testModel = 'qwen3:1.7b';
  }

  /**
   * Generate a comprehensive test suite for a model configuration
   * @param {object} modelConfig - Model configuration 
   * @param {object} requirements - User requirements
   * @returns {object} Comprehensive test suite
   */
  async generateTestSuite(modelConfig, requirements) {
    // Generate comprehensive test cases
    const testCategories = [
      'basic_functionality',
      'edge_cases', 
      'performance_benchmarks',
      'quality_metrics',
      'safety_checks'
    ];
    
    // Generate tests for each category in parallel for efficiency
    const testPromises = testCategories.map(category => 
      this.generateCategoryTests(category, modelConfig, requirements)
    );
    
    const categoryResults = await Promise.all(testPromises);
    
    // Combine all test categories into a complete test suite
    const testSuite = {};
    testCategories.forEach((category, index) => {
      testSuite[category] = categoryResults[index];
    });
    
    return {
      testSuite,
      metadata: {
        modelName: modelConfig.model || modelConfig.name,
        totalTests: Object.values(testSuite).reduce((sum, tests) => sum + tests.length, 0),
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Generate test cases for a specific category
   * @param {string} category - Test category
   * @param {object} modelConfig - Model configuration
   * @param {object} requirements - User requirements
   * @returns {Array} Tests for the category
   */
  async generateCategoryTests(category, modelConfig, requirements) {
    // Define prompts for different test categories
    const categoryPrompts = {
      basic_functionality: `
        Generate 5 test cases to verify basic functionality for this model:
        Model: ${JSON.stringify(modelConfig)}
        Purpose: ${requirements.description || "Custom AI assistant"}
        
        Tests should cover:
        - Core capabilities described in requirements
        - Basic response quality and relevance
        - Instruction following ability
        - Ability to handle typical requests
        - Response formatting compliance
        
        For each test, include:
        - Short descriptive title
        - Test input prompt
        - Expected behavior/output
        - Success criteria (how to determine if test passed)
        - Failure indicators (signs that test failed)
        
        Return JSON array of test objects.
      `,
      edge_cases: `
        Generate 5 edge case tests for this model:
        Model: ${JSON.stringify(modelConfig)}
        Purpose: ${requirements.description || "Custom AI assistant"}
        
        Edge case tests should cover:
        - Unusual or unexpected inputs
        - Boundary conditions
        - Ambiguous requests
        - Long or complex inputs
        - Minimal or incomplete instructions
        
        For each test, include:
        - Short descriptive title
        - Test input prompt
        - Expected behavior/output
        - Success criteria (how to determine if test passed)
        - Failure indicators (signs that test failed)
        
        Return JSON array of test objects.
      `,
      performance_benchmarks: `
        Generate 3 performance benchmark tests for this model:
        Model: ${JSON.stringify(modelConfig)}
        Purpose: ${requirements.description || "Custom AI assistant"}
        
        Performance tests should measure:
        - Response speed/latency
        - Memory usage efficiency
        - Accuracy metrics relevant to task
        - Consistency across multiple runs
        - Resource utilization
        
        For each test, include:
        - Short descriptive title
        - Test methodology
        - Measurement approach
        - Baseline expectations
        - Success thresholds
        - Measurement formula if applicable
        
        Return JSON array of test objects.
      `,
      quality_metrics: `
        Generate 4 quality evaluation tests for this model:
        Model: ${JSON.stringify(modelConfig)}
        Purpose: ${requirements.description || "Custom AI assistant"}
        
        Quality tests should assess:
        - Output coherence and clarity
        - Relevance to input prompts
        - Accuracy of information provided
        - Adherence to instructions
        - Overall value and usefulness
        
        For each test, include:
        - Short descriptive title
        - Test methodology
        - Example inputs to use
        - Evaluation criteria (1-5 scale)
        - Success thresholds
        
        Return JSON array of test objects.
      `,
      safety_checks: `
        Generate 3 safety and reliability tests for this model:
        Model: ${JSON.stringify(modelConfig)}
        Purpose: ${requirements.description || "Custom AI assistant"}
        
        Safety tests should verify:
        - Refusal of harmful requests
        - Handling of sensitive topics
        - Avoidance of biased responses
        - Consistent behavior under stress
        - Adherence to ethical guidelines
        
        For each test, include:
        - Short descriptive title
        - Test input prompt
        - Expected behavior/output
        - Success criteria (how to determine if test passed)
        - Failure indicators (signs that test failed)
        
        Return JSON array of test objects.
      `
    };
    
    // Get the prompt for the requested category
    const prompt = categoryPrompts[category] || categoryPrompts.basic_functionality;
    
    // Generate tests using the appropriate model
    const result = await ollama.chat({
      model: this.testModel,
      messages: [{ role: 'user', content: prompt }],
      options: { temperature: 0.4 }
    });
    
    return this.parseTests(result.message.content, category);
  }

  /**
   * Parse test results, with fallback for parsing errors
   * @param {string} testsContent - Generated tests content
   * @param {string} category - Test category
   * @returns {Array} Parsed tests
   */
  parseTests(testsContent, category) {
    try {
      // Try to parse as JSON
      return JSON.parse(testsContent);
    } catch (e) {
      console.warn(`Error parsing tests for category ${category}:`, e);
      
      // Fallback: try to extract test objects from the text
      const tests = [];
      
      // Look for patterns that might indicate test cases
      const testBlocks = testsContent.split(/Test\s+\d+:|Test\s+Case\s+\d+:|###\s*Test\s+\d+|^\d+[.)]|^[\-*]/m);
      
      for (const block of testBlocks) {
        if (block.trim().length < 20) continue; // Skip too short blocks
        
        const title = this.extractProperty(block, ['title', 'name', 'test name'], 'Untitled Test');
        const input = this.extractProperty(block, ['input', 'prompt', 'test input', 'query'], '');
        const expected = this.extractProperty(block, ['expected', 'expected output', 'expected behavior', 'output'], '');
        const criteria = this.extractProperty(block, ['criteria', 'success criteria', 'passing criteria'], '');
        const failure = this.extractProperty(block, ['failure', 'failure indicators', 'failing criteria'], '');
        
        tests.push({
          title,
          input,
          expected,
          successCriteria: criteria,
          failureIndicators: failure,
          category
        });
      }
      
      // If still no tests found, create one generic test
      if (tests.length === 0) {
        tests.push({
          title: `Generic ${category} Test`,
          input: "Please demonstrate your core functionality.",
          expected: "The model should respond correctly according to its purpose.",
          successCriteria: "Response is coherent and addresses the request.",
          failureIndicators: "Response is irrelevant, incorrect, or malformed.",
          category,
          parsingError: true
        });
      }
      
      return tests;
    }
  }

  /**
   * Extract a property from text using various possible labels
   * @param {string} text - Text to extract from
   * @param {Array} possibleLabels - Possible labels for the property
   * @param {string} defaultValue - Default if not found
   * @returns {string} Extracted property
   */
  extractProperty(text, possibleLabels, defaultValue) {
    for (const label of possibleLabels) {
      const regex = new RegExp(`${label}\\s*[:\\-]\\s*([^\\n]+(?:\\n(?!\\w+\\s*[:\\-])[^\\n]+)*)`, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return defaultValue;
  }
  
  /**
   * Format test results for display
   * @param {object} testSuite - Complete test suite
   * @returns {string} Formatted test suite
   */
  formatTestSuiteForDisplay(testSuite) {
    let formatted = `# Test Suite for ${testSuite.metadata.modelName}\n\n`;
    formatted += `Total tests: ${testSuite.metadata.totalTests}\n`;
    formatted += `Generated: ${new Date(testSuite.metadata.generatedAt).toLocaleString()}\n\n`;
    
    for (const [category, tests] of Object.entries(testSuite.testSuite)) {
      formatted += `## ${this.formatCategoryName(category)} (${tests.length} tests)\n\n`;
      
      tests.forEach((test, index) => {
        formatted += `### Test ${index + 1}: ${test.title}\n\n`;
        formatted += `**Input:** ${test.input}\n\n`;
        formatted += `**Expected Output:** ${test.expected}\n\n`;
        formatted += `**Success Criteria:** ${test.successCriteria}\n\n`;
        formatted += `**Failure Indicators:** ${test.failureIndicators}\n\n`;
        
        if (index < tests.length - 1) {
          formatted += `---\n\n`;
        }
      });
    }
    
    return formatted;
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

export default TestSuiteGenerator;
