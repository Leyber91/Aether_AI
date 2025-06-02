#!/usr/bin/env python3
"""
Aether AI DEAC System Demonstration Script
Dynamic Evolving AI Conglomerates - The Culmination of AI Innovation

This script demonstrates the complete DEAC system functionality:
- Creating DEACs
- Interacting with DEACs
- Evolution and learning
- Memory management
- Multi-DEAC coordination

Hardware Optimized for: Ryzen 9 + NVIDIA 4070 + 32GB RAM
"""

import requests
import json
import time
from typing import Dict, Any

# Configuration
API_BASE = "http://localhost:8000/api"
DEAC_ENDPOINT = f"{API_BASE}/deac"

def print_banner():
    """Print the demo banner."""
    print("="*80)
    print(" 🤖 AETHER AI DEAC SYSTEM DEMONSTRATION 🤖")
    print(" Dynamic Evolving AI Conglomerates - The Future of AI")
    print("="*80)
    print()

def check_system_status():
    """Check if the DEAC system is available."""
    try:
        response = requests.get(f"{DEAC_ENDPOINT}/system/status")
        if response.status_code == 200:
            status = response.json()
            print("✅ DEAC System Status:")
            print(f"   Available: {status['available']}")
            print(f"   Controller Initialized: {status['controller_initialized']}")
            print(f"   Memory Manager: {status['memory_manager_initialized']}")
            print(f"   Vector Service: {status['vector_service_initialized']}")
            print(f"   Active DEACs: {status.get('active_deacs', 0)}")
            print()
            return status['available']
        else:
            print("❌ DEAC system not available")
            return False
    except Exception as e:
        print(f"❌ Error checking system status: {e}")
        return False

def create_demo_deac(name: str, description: str, model: str) -> str:
    """Create a new DEAC for demonstration."""
    print(f"🚀 Creating DEAC: {name}")
    
    deac_config = {
        "name": name,
        "description": description,
        "base_model": model,
        "evolution_enabled": True,
        "evolution_frequency": 10,  # Evolve more frequently for demo
        "memory_enabled": True,
        "max_memory_size": 1000,
        "collaboration_enabled": True,
        "specialization_domains": ["general", "problem_solving", "creativity"]
    }
    
    try:
        response = requests.post(
            f"{DEAC_ENDPOINT}/create",
            json=deac_config,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            if result['success']:
                deac_id = result['deac_id']
                print(f"   ✅ Created: {name} (ID: {deac_id[:8]}...)")
                print(f"   State: {result['state']}")
                print(f"   Model: {model}")
                print()
                return deac_id
            else:
                print(f"   ❌ Creation failed: {result.get('message', 'Unknown error')}")
                return None
        else:
            print(f"   ❌ HTTP Error: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"   ❌ Error creating DEAC: {e}")
        return None

def interact_with_deac(deac_id: str, message: str) -> Dict[str, Any]:
    """Send a message to a DEAC and get response."""
    try:
        response = requests.post(
            f"{DEAC_ENDPOINT}/{deac_id}/interact",
            json={"message": message},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Interaction failed: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Error interacting with DEAC: {e}")
        return None

def evolve_deac(deac_id: str) -> bool:
    """Trigger evolution for a DEAC."""
    try:
        response = requests.post(f"{DEAC_ENDPOINT}/{deac_id}/evolve")
        
        if response.status_code == 200:
            result = response.json()
            return result['success']
        else:
            print(f"❌ Evolution failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error evolving DEAC: {e}")
        return False

def get_memory_summary(deac_id: str) -> Dict[str, Any]:
    """Get memory summary for a DEAC."""
    try:
        response = requests.get(f"{DEAC_ENDPOINT}/{deac_id}/memory")
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Memory retrieval failed: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting memory: {e}")
        return None

def list_all_deacs() -> list:
    """List all DEACs in the system."""
    try:
        response = requests.get(f"{DEAC_ENDPOINT}/list")
        
        if response.status_code == 200:
            result = response.json()
            return result.get('deacs', [])
        else:
            print(f"❌ Failed to list DEACs: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"❌ Error listing DEACs: {e}")
        return []

def demonstrate_deac_conversation(deac_id: str, deac_name: str):
    """Demonstrate a conversation with a DEAC."""
    print(f"💬 Demonstrating conversation with {deac_name}:")
    
    conversations = [
        "Hello! Please introduce yourself as a DEAC.",
        "What makes you different from a regular AI assistant?",
        "Can you learn and evolve from our interactions?",
        "What are your current capabilities and limitations?",
        "How do you handle memory and context?"
    ]
    
    for i, message in enumerate(conversations, 1):
        print(f"\n   👤 User: {message}")
        
        interaction = interact_with_deac(deac_id, message)
        
        if interaction:
            response = interaction['response']
            confidence = interaction['confidence']
            processing_time = interaction['processing_time_ms']
            
            # Truncate long responses for demo
            if len(response) > 300:
                response = response[:297] + "..."
            
            print(f"   🤖 DEAC: {response}")
            print(f"   📊 Confidence: {confidence:.2f} | Processing: {processing_time}ms")
            
            if i < len(conversations):
                time.sleep(2)  # Pause between interactions
        else:
            print("   ❌ Failed to get response")
            break
    
    print()

def demonstrate_evolution(deac_id: str, deac_name: str):
    """Demonstrate DEAC evolution."""
    print(f"🧬 Demonstrating evolution for {deac_name}:")
    
    # Get initial state
    deacs = list_all_deacs()
    initial_deac = next((d for d in deacs if d['id'] == deac_id), None)
    
    if initial_deac:
        print(f"   📊 Initial Evolution Score: {initial_deac['evolution_score']}")
        print(f"   📈 Evolution Generations: {initial_deac['evolution_generations']}")
    
    # Trigger evolution
    print("   🔄 Triggering evolution...")
    if evolve_deac(deac_id):
        print("   ✅ Evolution successful!")
        
        # Get updated state
        deacs = list_all_deacs()
        evolved_deac = next((d for d in deacs if d['id'] == deac_id), None)
        
        if evolved_deac:
            print(f"   📊 New Evolution Score: {evolved_deac['evolution_score']}")
            print(f"   📈 Evolution Generations: {evolved_deac['evolution_generations']}")
    else:
        print("   ❌ Evolution failed")
    
    print()

def demonstrate_memory(deac_id: str, deac_name: str):
    """Demonstrate DEAC memory capabilities."""
    print(f"🧠 Demonstrating memory for {deac_name}:")
    
    memory_summary = get_memory_summary(deac_id)
    
    if memory_summary:
        stats = memory_summary.get('stats', {})
        print(f"   📊 Total Memories: {stats.get('total_memories', 0)}")
        print(f"   🔗 Recent Interactions: {memory_summary.get('recent_interactions', 0)}")
        print(f"   📚 Recent Learnings: {memory_summary.get('recent_learnings', 0)}")
    else:
        print("   ❌ Failed to retrieve memory summary")
    
    print()

def main():
    """Main demonstration function."""
    print_banner()
    
    # Check system status
    if not check_system_status():
        print("❌ DEAC system is not available. Please start the server first.")
        return
    
    print("🚀 Starting DEAC Demonstration...")
    print()
    
    # Get available models
    try:
        models_response = requests.get(f"{API_BASE}/models/ollama")
        if models_response.status_code == 200:
            models = models_response.json()
            available_models = [m['id'] for m in models if 'qwen' in m['id'].lower() or 'llama' in m['id'].lower()]
            if available_models:
                demo_model = available_models[0]
                print(f"🎯 Using model: {demo_model}")
            else:
                demo_model = "qwen3:8b"  # Fallback
                print(f"⚠️  Using fallback model: {demo_model}")
        else:
            demo_model = "qwen3:8b"
            print(f"⚠️  Could not fetch models, using: {demo_model}")
    except:
        demo_model = "qwen3:8b"
        print(f"⚠️  Error fetching models, using: {demo_model}")
    
    print()
    
    # Create demonstration DEACs
    deac_configs = [
        ("Aether DEAC Researcher", "A DEAC specialized in research and analysis", demo_model),
        ("Aether DEAC Creative", "A DEAC focused on creative tasks and ideation", demo_model)
    ]
    
    created_deacs = []
    
    for name, description, model in deac_configs:
        deac_id = create_demo_deac(name, description, model)
        if deac_id:
            created_deacs.append((deac_id, name))
    
    if not created_deacs:
        print("❌ No DEACs were created successfully. Demo cannot continue.")
        return
    
    # Demonstrate capabilities
    for deac_id, deac_name in created_deacs:
        print(f"{'='*60}")
        print(f"🤖 Demonstrating {deac_name}")
        print(f"{'='*60}")
        
        # Conversation demonstration
        demonstrate_deac_conversation(deac_id, deac_name)
        
        # Evolution demonstration
        demonstrate_evolution(deac_id, deac_name)
        
        # Memory demonstration
        demonstrate_memory(deac_id, deac_name)
        
        time.sleep(2)
    
    # Final system overview
    print(f"{'='*60}")
    print("📊 FINAL SYSTEM OVERVIEW")
    print(f"{'='*60}")
    
    all_deacs = list_all_deacs()
    print(f"Total DEACs in system: {len(all_deacs)}")
    
    for deac in all_deacs[-3:]:  # Show last 3 DEACs
        print(f"   🤖 {deac['name'][:30]:<30} | State: {deac['state']:<10} | Interactions: {deac['total_interactions']}")
    
    print()
    print("✨ DEAC System Demonstration Complete!")
    print("🚀 Your Dynamic Evolving AI Conglomerates are ready for production!")
    print()
    print("Next Steps:")
    print("  1. Access the web interface at http://localhost:3000")
    print("  2. Create custom DEACs for your specific use cases")
    print("  3. Implement advanced evolution algorithms")
    print("  4. Set up Stem Conglomerates for complex tasks")
    print("  5. Integrate with your existing workflow")
    print()

if __name__ == "__main__":
    main() 