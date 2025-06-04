import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.routing import APIRouter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class DEACNetworkManager:
    """Manages real-time DEAC network state and WebSocket connections"""
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.network_state = {
            "nodes": [],
            "edges": [],
            "health": {
                "activeNodes": 0,
                "totalCommunications": 0,
                "evolutionGeneration": 0,
                "healthScore": 100
            }
        }
        self.message_history: List[Dict] = []
        self.health_update_task = None  # Track health update task
        
    async def connect(self, websocket: WebSocket):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"🌐 New WebSocket connection. Total: {len(self.active_connections)}")
        
        # Start periodic health updates if not already running
        if self.health_update_task is None or self.health_update_task.done():
            self.health_update_task = asyncio.create_task(self.periodic_health_update())
            logger.info("🔄 Started periodic health updates")
        
        # Send current network state to new connection
        await self.send_to_connection(websocket, {
            "type": "network_update",
            "nodes": self.network_state["nodes"],
            "edges": self.network_state["edges"],
            "health": self.network_state["health"]
        })
        
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        self.active_connections.discard(websocket)
        logger.info(f"🌐 WebSocket disconnected. Total: {len(self.active_connections)}")
        
    async def send_to_connection(self, websocket: WebSocket, data: Dict):
        """Send data to a specific WebSocket connection"""
        try:
            await websocket.send_text(json.dumps(data))
        except Exception as e:
            logger.error(f"Error sending to WebSocket: {e}")
            self.disconnect(websocket)
            
    async def broadcast(self, data: Dict):
        """Broadcast data to all connected clients"""
        if not self.active_connections:
            return
            
        logger.info(f"📡 Broadcasting to {len(self.active_connections)} connections: {data.get('type')}")
        
        # Send to all connections concurrently
        tasks = [self.send_to_connection(ws, data) for ws in self.active_connections.copy()]
        await asyncio.gather(*tasks, return_exceptions=True)
        
    async def handle_message(self, websocket: WebSocket, data: Dict):
        """Process incoming WebSocket messages"""
        message_type = data.get("type")
        logger.info(f"📩 Received message: {message_type}")
        
        try:
            if message_type == "initialize_network":
                await self.handle_initialize_network(data)
            elif message_type == "chat_message":
                await self.handle_chat_message(data)
            elif message_type == "trigger_evolution":
                await self.handle_evolution_trigger(data)
            elif message_type == "metaloop_communication":
                await self.handle_metaloop_communication(data)
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await self.send_to_connection(websocket, {
                "type": "error",
                "message": str(e)
            })
    
    async def handle_initialize_network(self, data: Dict):
        """Initialize the network state"""
        self.network_state["nodes"] = data.get("nodes", [])
        self.network_state["edges"] = data.get("edges", [])
        self.network_state["health"]["activeNodes"] = len(self.network_state["nodes"])
        
        logger.info(f"🌐 Network initialized with {len(self.network_state['nodes'])} nodes")
        
        # Broadcast network update
        await self.broadcast({
            "type": "network_update",
            "nodes": self.network_state["nodes"],
            "edges": self.network_state["edges"],
            "health": self.network_state["health"]
        })
        
    async def handle_chat_message(self, data: Dict):
        """Process chat messages and simulate AI responses"""
        message = data.get("message", "")
        target = data.get("target", "network")
        timestamp = data.get("timestamp", datetime.now().isoformat())
        
        # Add to message history
        self.message_history.append({
            "type": "user_message",
            "message": message,
            "target": target,
            "timestamp": timestamp
        })
        
        # Simulate AI processing delay
        await asyncio.sleep(0.5)
        
        # Generate simulated AI response
        if target == "network":
            response = await self.generate_network_response(message)
        else:
            response = await self.generate_node_response(message, target)
            
        # Broadcast communication event
        await self.broadcast({
            "type": "communication",
            "sourceId": "ai-system",
            "targetId": "user",
            "message": response,
            "timestamp": datetime.now().isoformat()
        })
        
        # Update network health
        self.network_state["health"]["totalCommunications"] += 1
        await self.broadcast({
            "type": "health_update",
            "health": self.network_state["health"]
        })
        
    async def handle_evolution_trigger(self, data: Dict):
        """Handle evolution triggers from the UI"""
        evolution_type = data.get("evolutionType")
        target_node_id = data.get("targetNodeId")
        
        logger.info(f"🧬 Evolution triggered: {evolution_type} on {target_node_id}")
        
        if evolution_type == "spawn":
            await self.simulate_node_spawning(target_node_id)
        elif evolution_type == "specialize":
            await self.simulate_node_specialization(target_node_id)
            
    async def handle_metaloop_communication(self, data: Dict):
        """Handle MetaLoop communication between nodes"""
        source_id = data.get("sourceId")
        target_id = data.get("targetId")
        message = data.get("message")
        
        # Broadcast the communication
        await self.broadcast({
            "type": "communication",
            "sourceId": source_id,
            "targetId": target_id,
            "message": message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Update edge activity
        for edge in self.network_state["edges"]:
            if ((edge["source"] == source_id and edge["target"] == target_id) or
                (edge["source"] == target_id and edge["target"] == source_id)):
                edge["data"]["messageCount"] = edge["data"].get("messageCount", 0) + 1
                edge["data"]["lastActivity"] = datetime.now().isoformat()
                break
                
    async def simulate_node_spawning(self, parent_id: str):
        """Simulate spawning a new node"""
        # Find parent node
        parent_node = None
        for node in self.network_state["nodes"]:
            if node["id"] == parent_id:
                parent_node = node
                break
                
        if not parent_node:
            return
            
        # Create new node
        new_node_id = f"spawned-{len(self.network_state['nodes'])}-{int(datetime.now().timestamp())}"
        new_node = {
            "id": new_node_id,
            "type": "specialized",
            "position": {
                "x": parent_node["position"]["x"] + 100,
                "y": parent_node["position"]["y"] + 50
            },
            "data": {
                "name": f"Analyzer-{new_node_id[-4:]}",
                "state": "ready",
                "evolutionGeneration": parent_node["data"]["evolutionGeneration"] + 1,
                "parentId": parent_id,
                "specialization": "data-analysis",
                "capabilities": ["analysis", "pattern-recognition"],
                "personality": "Focused and analytical",
                "conversationHistory": []
            }
        }
        
        # Create connection edge
        new_edge = {
            "id": f"spawn-{parent_id}-{new_node_id}",
            "source": parent_id,
            "target": new_node_id,
            "type": "default",
            "style": {"stroke": "#7affc3", "strokeWidth": 2},
            "data": {"strength": 1.0, "messageCount": 0}
        }
        
        # Add to network state
        self.network_state["nodes"].append(new_node)
        self.network_state["edges"].append(new_edge)
        self.network_state["health"]["activeNodes"] = len(self.network_state["nodes"])
        self.network_state["health"]["evolutionGeneration"] = max(
            self.network_state["health"]["evolutionGeneration"],
            new_node["data"]["evolutionGeneration"]
        )
        
        # Broadcast spawning event
        await self.broadcast({
            "type": "node_spawned",
            "parentId": parent_id,
            "newNode": new_node,
            "newEdge": new_edge
        })
        
        # Broadcast updated network
        await self.broadcast({
            "type": "network_update",
            "nodes": self.network_state["nodes"],
            "edges": self.network_state["edges"],
            "health": self.network_state["health"]
        })
        
    async def simulate_node_specialization(self, node_id: str):
        """Simulate node evolution/specialization"""
        # Find and update node
        for node in self.network_state["nodes"]:
            if node["id"] == node_id:
                node["data"]["evolutionGeneration"] += 1
                node["data"]["state"] = "evolved"
                node["data"]["capabilities"].append("enhanced-processing")
                
                # Update internal structure
                structure = node["data"].get("internalStructure", {})
                structure["coreProcessors"] = structure.get("coreProcessors", 1) + 1
                structure["enhancementModules"] = structure.get("enhancementModules", 0) + 1
                node["data"]["internalStructure"] = structure
                
                # Broadcast evolution event
                await self.broadcast({
                    "type": "node_evolved",
                    "nodeId": node_id,
                    "enhancements": {
                        "internalStructure": structure
                    }
                })
                
                break
                
        # Update network health
        self.network_state["health"]["evolutionGeneration"] = max(
            node["data"]["evolutionGeneration"] 
            for node in self.network_state["nodes"]
        )
        
        await self.broadcast({
            "type": "health_update",
            "health": self.network_state["health"]
        })
        
    async def generate_network_response(self, message: str) -> str:
        """Generate a simulated network collective response"""
        responses = [
            f"Genesis Alpha: Analyzing request '{message}' through strategic framework...",
            f"Genesis Beta: Creative analysis suggests innovative approaches to '{message}'...",
            f"Genesis Gamma: Evolutionary perspective on '{message}' indicates adaptation potential..."
        ]
        return "**Network Collective Response:**\n\n" + "\n\n".join(responses)
        
    async def generate_node_response(self, message: str, node_id: str) -> str:
        """Generate a simulated individual node response"""
        node = None
        for n in self.network_state["nodes"]:
            if n["id"] == node_id:
                node = n
                break
                
        if not node:
            return f"Node {node_id} not found."
            
        personality = node["data"].get("personality", "Analytical")
        name = node["data"].get("name", node_id)
        
        return f"[{name}] {personality}. Processing request: '{message}'. Ready to assist with specialized capabilities."
        
    async def periodic_health_update(self):
        """Send periodic health updates to connected clients"""
        while True:
            await asyncio.sleep(10)  # Update every 10 seconds
            
            if self.active_connections:
                # Simulate some health fluctuation
                health = self.network_state["health"]
                health["healthScore"] = max(80, min(100, health["healthScore"] + (hash(str(datetime.now())) % 5 - 2)))
                
                await self.broadcast({
                    "type": "health_update",
                    "health": health
                })
            else:
                # No connections, stop the task
                logger.info("🔄 No active connections, stopping health updates")
                break

# Global network manager instance
network_manager = DEACNetworkManager()

@router.websocket("/ws/deac-network")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for DEAC network communication"""
    await network_manager.connect(websocket)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle the message
            await network_manager.handle_message(websocket, message)
            
    except WebSocketDisconnect:
        network_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        network_manager.disconnect(websocket)

# Note: periodic_health_update will be started when the first connection is made
# to avoid event loop issues during module import 