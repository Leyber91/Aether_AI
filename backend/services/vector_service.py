# Vector Service for DEAC Memory Management
# Handles semantic memory storage and retrieval using ChromaDB

import logging
import os
import uuid
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class VectorService:
    """
    Vector service for DEAC memory management using ChromaDB.
    Provides semantic memory capabilities for DEACs.
    """
    
    def __init__(self, persist_directory: str = None):
        """Initialize the vector service."""
        self.persist_directory = persist_directory or os.path.join(os.getcwd(), "data", "vectors", "chromadb")
        os.makedirs(self.persist_directory, exist_ok=True)
        
        # Initialize ChromaDB client (lazy loading to avoid import errors)
        self.client = None
        self.collections = {}
        
        logger.info(f"Vector service initialized with persist directory: {self.persist_directory}")
    
    def _get_client(self):
        """Get ChromaDB client with lazy initialization."""
        if self.client is None:
            try:
                import chromadb
                self.client = chromadb.PersistentClient(path=self.persist_directory)
                logger.info("ChromaDB client initialized successfully")
            except ImportError:
                logger.warning("ChromaDB not installed. Vector memory will not be available.")
                return None
            except Exception as e:
                logger.error(f"Error initializing ChromaDB client: {e}")
                return None
        return self.client
    
    async def initialize_memory(self, deac_id: str) -> bool:
        """
        Initialize memory collection for a DEAC.
        
        Args:
            deac_id: The DEAC identifier
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            client = self._get_client()
            if not client:
                return False
            
            collection_name = f"deac_{deac_id.replace('-', '_')}"
            
            try:
                # Try to get existing collection
                collection = client.get_collection(collection_name)
                logger.info(f"Found existing memory collection for DEAC {deac_id}")
            except:
                # Create new collection
                collection = client.create_collection(
                    name=collection_name,
                    metadata={"deac_id": deac_id, "created_at": str(uuid.uuid4())}
                )
                logger.info(f"Created new memory collection for DEAC {deac_id}")
            
            self.collections[deac_id] = collection
            return True
            
        except Exception as e:
            logger.error(f"Error initializing memory for DEAC {deac_id}: {e}")
            return False
    
    async def store_memory(self, deac_id: str, content: str, metadata: Dict[str, Any] = None) -> bool:
        """
        Store a memory in the DEAC's vector collection.
        
        Args:
            deac_id: The DEAC identifier
            content: The content to store
            metadata: Additional metadata
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if deac_id not in self.collections:
                await self.initialize_memory(deac_id)
            
            collection = self.collections.get(deac_id)
            if not collection:
                logger.warning(f"No memory collection available for DEAC {deac_id}")
                return False
            
            memory_id = str(uuid.uuid4())
            memory_metadata = metadata or {}
            memory_metadata.update({
                "deac_id": deac_id,
                "timestamp": str(uuid.uuid4())  # Simple timestamp placeholder
            })
            
            collection.add(
                documents=[content],
                metadatas=[memory_metadata],
                ids=[memory_id]
            )
            
            logger.debug(f"Stored memory for DEAC {deac_id}: {content[:100]}...")
            return True
            
        except Exception as e:
            logger.error(f"Error storing memory for DEAC {deac_id}: {e}")
            return False
    
    async def query_memory(self, deac_id: str, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """
        Query memories for a DEAC.
        
        Args:
            deac_id: The DEAC identifier
            query: The query string
            n_results: Number of results to return
            
        Returns:
            List of relevant memories
        """
        try:
            if deac_id not in self.collections:
                await self.initialize_memory(deac_id)
            
            collection = self.collections.get(deac_id)
            if not collection:
                logger.warning(f"No memory collection available for DEAC {deac_id}")
                return []
            
            results = collection.query(
                query_texts=[query],
                n_results=n_results
            )
            
            memories = []
            if results['documents'] and results['documents'][0]:
                for i, doc in enumerate(results['documents'][0]):
                    memory = {
                        "content": doc,
                        "metadata": results['metadatas'][0][i] if results['metadatas'] and results['metadatas'][0] else {},
                        "distance": results['distances'][0][i] if results['distances'] and results['distances'][0] else 0.0
                    }
                    memories.append(memory)
            
            logger.debug(f"Retrieved {len(memories)} memories for DEAC {deac_id}")
            return memories
            
        except Exception as e:
            logger.error(f"Error querying memory for DEAC {deac_id}: {e}")
            return []
    
    async def get_memory_stats(self, deac_id: str) -> Dict[str, Any]:
        """
        Get memory statistics for a DEAC.
        
        Args:
            deac_id: The DEAC identifier
            
        Returns:
            Dictionary with memory statistics
        """
        try:
            if deac_id not in self.collections:
                await self.initialize_memory(deac_id)
            
            collection = self.collections.get(deac_id)
            if not collection:
                return {"error": "No memory collection available"}
            
            count = collection.count()
            
            return {
                "total_memories": count,
                "collection_name": f"deac_{deac_id.replace('-', '_')}",
                "deac_id": deac_id
            }
            
        except Exception as e:
            logger.error(f"Error getting memory stats for DEAC {deac_id}: {e}")
            return {"error": str(e)}
    
    async def cleanup_memory(self, deac_id: str) -> bool:
        """
        Clean up memory for a DEAC.
        
        Args:
            deac_id: The DEAC identifier
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            client = self._get_client()
            if not client:
                return False
            
            collection_name = f"deac_{deac_id.replace('-', '_')}"
            
            try:
                client.delete_collection(collection_name)
                logger.info(f"Deleted memory collection for DEAC {deac_id}")
            except Exception as e:
                logger.warning(f"Error deleting collection for DEAC {deac_id}: {e}")
            
            # Remove from active collections
            if deac_id in self.collections:
                del self.collections[deac_id]
            
            return True
            
        except Exception as e:
            logger.error(f"Error cleaning up memory for DEAC {deac_id}: {e}")
            return False

class MemoryManager:
    """
    High-level memory manager for DEACs.
    Provides convenient interface for memory operations.
    """
    
    def __init__(self, vector_service: VectorService = None):
        """Initialize the memory manager."""
        self.vector_service = vector_service or VectorService()
        logger.info("Memory manager initialized")
    
    async def initialize_memory(self, deac_id: str) -> bool:
        """Initialize memory for a DEAC."""
        return await self.vector_service.initialize_memory(deac_id)
    
    async def add_interaction_memory(self, deac_id: str, user_message: str, response: str, context: Dict[str, Any] = None) -> bool:
        """
        Add an interaction to DEAC memory.
        
        Args:
            deac_id: The DEAC identifier
            user_message: The user's message
            response: The DEAC's response
            context: Additional context
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Store the interaction as a memory
            interaction_content = f"User: {user_message}\nDEAC: {response}"
            metadata = {
                "type": "interaction",
                "user_message": user_message,
                "response": response
            }
            if context:
                metadata.update(context)
            
            return await self.vector_service.store_memory(deac_id, interaction_content, metadata)
            
        except Exception as e:
            logger.error(f"Error adding interaction memory for DEAC {deac_id}: {e}")
            return False
    
    async def add_learning_memory(self, deac_id: str, learning_content: str, source: str = "evolution", metadata: Dict[str, Any] = None) -> bool:
        """
        Add a learning memory for a DEAC.
        
        Args:
            deac_id: The DEAC identifier
            learning_content: What was learned
            source: Source of the learning
            metadata: Additional metadata
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            learning_metadata = {
                "type": "learning",
                "source": source
            }
            if metadata:
                learning_metadata.update(metadata)
            
            return await self.vector_service.store_memory(deac_id, learning_content, learning_metadata)
            
        except Exception as e:
            logger.error(f"Error adding learning memory for DEAC {deac_id}: {e}")
            return False
    
    async def get_relevant_memories(self, deac_id: str, query: str, memory_type: str = None, n_results: int = 5) -> List[Dict[str, Any]]:
        """
        Get relevant memories for a query.
        
        Args:
            deac_id: The DEAC identifier
            query: The query string
            memory_type: Filter by memory type (optional)
            n_results: Number of results to return
            
        Returns:
            List of relevant memories
        """
        try:
            memories = await self.vector_service.query_memory(deac_id, query, n_results)
            
            # Filter by type if specified
            if memory_type:
                memories = [m for m in memories if m.get("metadata", {}).get("type") == memory_type]
            
            return memories
            
        except Exception as e:
            logger.error(f"Error getting relevant memories for DEAC {deac_id}: {e}")
            return []
    
    async def get_memory_summary(self, deac_id: str) -> Dict[str, Any]:
        """
        Get a summary of DEAC's memory.
        
        Args:
            deac_id: The DEAC identifier
            
        Returns:
            Dictionary with memory summary
        """
        try:
            stats = await self.vector_service.get_memory_stats(deac_id)
            
            # Get sample memories
            recent_interactions = await self.get_relevant_memories(deac_id, "recent interactions", "interaction", 3)
            recent_learnings = await self.get_relevant_memories(deac_id, "learning", "learning", 3)
            
            return {
                "stats": stats,
                "recent_interactions": len(recent_interactions),
                "recent_learnings": len(recent_learnings),
                "sample_memories": {
                    "interactions": recent_interactions[:2],  # Show first 2
                    "learnings": recent_learnings[:2]  # Show first 2
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting memory summary for DEAC {deac_id}: {e}")
            return {"error": str(e)}
    
    async def cleanup_memory(self, deac_id: str) -> bool:
        """Clean up memory for a DEAC."""
        return await self.vector_service.cleanup_memory(deac_id) 