import ModelGenerationService from './ModelGenerationService';
import { v4 as uuidv4 } from 'uuid';

/**
 * RealtimeModelGeneration - WebSocket-based real-time model generation service
 * Handles streaming progress updates during model generation
 */
class RealtimeModelGeneration {
  constructor(io) {
    this.io = io;
    this.activeGenerations = new Map();
    this.generationService = new ModelGenerationService();
  }

  /**
   * Handle WebSocket connection for real-time model generation
   * @param {object} socket - Socket.io socket connection
   */
  async handleConnection(socket) {
    console.log('New client connected for real-time model generation');

    // Listen for generation start event
    socket.on('generate:start', async (data) => {
      const generationId = uuidv4();
      this.activeGenerations.set(generationId, { socket, status: 'starting' });
      
      // Send initial connection confirmation
      socket.emit('generation:connected', { 
        generationId, 
        message: 'Connected to real-time model generation service' 
      });
      
      // Stream progress updates
      await this.streamGeneration(generationId, data);
    });

    // Listen for generation cancellation
    socket.on('generate:cancel', async (data) => {
      const { generationId } = data;
      
      if (this.activeGenerations.has(generationId)) {
        const generation = this.activeGenerations.get(generationId);
        generation.status = 'cancelled';
        generation.socket.emit('generation:cancelled', { 
          generationId, 
          message: 'Generation cancelled by user' 
        });
        this.activeGenerations.delete(generationId);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      // Find and clean up any active generations for this socket
      for (const [id, generation] of this.activeGenerations.entries()) {
        if (generation.socket === socket) {
          this.activeGenerations.delete(id);
          console.log(`Client disconnected, cleaned up generation ${id}`);
        }
      }
    });
  }

  /**
   * Stream model generation with progress updates
   * @param {string} generationId - Unique ID for this generation
   * @param {object} request - Model generation request
   */
  async streamGeneration(generationId, request) {
    const generation = this.activeGenerations.get(generationId);
    const { socket } = generation;
    
    if (!socket) {
      console.error(`No socket found for generation ${generationId}`);
      return;
    }
    
    generation.status = 'in_progress';
    
    try {
      // Progress callback that will send updates to the client
      const progressCallback = (progress) => {
        if (generation.status === 'cancelled') {
          throw new Error('Generation cancelled by user');
        }
        
        socket.emit('generation:progress', {
          generationId,
          ...progress
        });
      };
      
      // Execute model generation with progress updates
      const result = await this.generationService.generateModel(request, progressCallback);
      
      if (generation.status !== 'cancelled') {
        if (result.success) {
          // Send success result
          socket.emit('generation:complete', {
            generationId,
            success: true,
            result
          });
        } else {
          // Send error result
          socket.emit('generation:error', {
            generationId,
            success: false,
            error: result.error,
            suggestions: result.suggestions
          });
        }
        
        // Clean up completed generation
        this.activeGenerations.delete(generationId);
      }
    } catch (error) {
      console.error(`Error in generation ${generationId}:`, error);
      
      if (generation.status !== 'cancelled') {
        // Send error to client
        socket.emit('generation:error', {
          generationId,
          success: false,
          error: error.message,
          suggestions: await this.generationService.generateErrorSuggestions(error)
        });
        
        // Clean up failed generation
        this.activeGenerations.delete(generationId);
      }
    }
  }

  /**
   * Send detailed updates during multi-stage processes
   * @param {string} generationId - Generation ID
   * @param {string} stage - Current stage
   * @param {object} data - Update data
   */
  sendDetailedUpdate(generationId, stage, data) {
    const generation = this.activeGenerations.get(generationId);
    
    if (generation && generation.socket) {
      generation.socket.emit('generation:detail', {
        generationId,
        stage,
        data
      });
    }
  }

  /**
   * Process batch of generations (for admin/system use)
   * @param {Array} requests - Batch of generation requests
   * @returns {Array} Batch results
   */
  async processBatch(requests) {
    const results = [];
    
    for (const request of requests) {
      try {
        const result = await this.generationService.generateModel(request);
        results.push({
          requestId: request.id,
          success: true,
          result
        });
      } catch (error) {
        results.push({
          requestId: request.id,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

export default RealtimeModelGeneration;
