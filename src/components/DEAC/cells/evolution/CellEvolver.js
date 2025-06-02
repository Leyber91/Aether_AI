import React from 'react';
import NodeCell from '../core/NodeCell';
import PrimordialNodeCell from '../specialized/PrimordialNodeCell';

/**
 * CellEvolver - Demonstrates cellular code evolution
 * Shows how code cells can spawn specialized variants
 */
class CellEvolver {
  constructor() {
    this.cellRegistry = new Map();
    this.evolutionHistory = [];
  }

  // Register a base cell type
  registerCell(type, cellComponent) {
    this.cellRegistry.set(type, cellComponent);
  }

  // Evolve a cell by adding new capabilities
  evolveCell(baseType, specialization, newFeatures = {}) {
    const BaseCell = this.cellRegistry.get(baseType);
    
    if (!BaseCell) {
      throw new Error(`Base cell type ${baseType} not found`);
    }

    // Create evolved cell component
    const EvolvedCell = (props) => {
      const enhancedData = {
        ...props.data,
        specialization,
        capabilities: [...(props.data.capabilities || []), ...newFeatures.capabilities],
        evolutionGeneration: (props.data.evolutionGeneration || 0) + 1
      };

      return (
        <BaseCell {...props} data={enhancedData}>
          {/* Add specialized features */}
          {newFeatures.renderExtensions?.(props)}
          {props.children}
        </BaseCell>
      );
    };

    // Register the evolved cell
    const evolvedType = `${baseType}-${specialization}`;
    this.cellRegistry.set(evolvedType, EvolvedCell);

    // Track evolution
    this.evolutionHistory.push({
      timestamp: new Date(),
      baseType,
      evolvedType,
      specialization,
      features: newFeatures
    });

    return EvolvedCell;
  }

  // Spawn a new cell instance with network context
  spawnCell(type, networkContext = {}) {
    const CellComponent = this.cellRegistry.get(type);
    
    if (!CellComponent) {
      throw new Error(`Cell type ${type} not found`);
    }

    const spawnId = `${type}-${Date.now()}`;
    
    return {
      id: spawnId,
      type,
      component: CellComponent,
      spawnedAt: new Date(),
      networkContext,
      parentType: type.includes('-') ? type.split('-')[0] : null
    };
  }

  // Create specialized analyzer cell
  createAnalyzerCell() {
    return this.evolveCell('basic', 'analyzer', {
      capabilities: ['data-analysis', 'pattern-recognition'],
      renderExtensions: (props) => (
        <div className="analyzer-features">
          <div className="analysis-indicator">📊</div>
        </div>
      )
    });
  }

  // Create communicator hub cell
  createCommunicatorCell() {
    return this.evolveCell('basic', 'communicator', {
      capabilities: ['message-routing', 'protocol-handling'],
      renderExtensions: (props) => (
        <div className="communicator-features">
          <div className="comm-indicator">📡</div>
        </div>
      )
    });
  }

  // Get evolution statistics
  getEvolutionStats() {
    return {
      totalEvolutions: this.evolutionHistory.length,
      registeredTypes: this.cellRegistry.size,
      evolutionTree: this.buildEvolutionTree(),
      recentEvolutions: this.evolutionHistory.slice(-5)
    };
  }

  buildEvolutionTree() {
    const tree = {};
    
    this.evolutionHistory.forEach(evolution => {
      if (!tree[evolution.baseType]) {
        tree[evolution.baseType] = [];
      }
      tree[evolution.baseType].push(evolution.evolvedType);
    });
    
    return tree;
  }

  // Demonstrate cellular architecture
  static demo() {
    const evolver = new CellEvolver();
    
    // Register base cells
    evolver.registerCell('basic', NodeCell);
    evolver.registerCell('primordial', PrimordialNodeCell);
    
    // Evolve specialized cells
    const AnalyzerCell = evolver.createAnalyzerCell();
    const CommunicatorCell = evolver.createCommunicatorCell();
    
    // Spawn network instances
    const network = [
      evolver.spawnCell('primordial', { role: 'genesis' }),
      evolver.spawnCell('basic-analyzer', { role: 'data-processor' }),
      evolver.spawnCell('basic-communicator', { role: 'message-hub' })
    ];
    
    console.log('Living Code Network:', {
      network,
      evolution: evolver.getEvolutionStats()
    });
    
    return { evolver, network };
  }
}

export default CellEvolver; 