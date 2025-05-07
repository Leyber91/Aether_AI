"""
MCP Server Controller
Manages the MCP filesystem server process and provides an API endpoint for MCP operations
"""
import os
import sys
import asyncio
import logging
import subprocess
from fastapi import APIRouter, HTTPException
from typing import Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mcp", tags=["mcp"])

# Path to the MCP filesystem server
MCP_SERVER_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'mcp-filesystem-python', 'run_server.py'))
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'data'))

logger.info(f"MCP Server Path: {MCP_SERVER_PATH}")
logger.info(f"MCP Data Directory: {DATA_DIR}")

# Global MCP process
mcp_process = None
mcp_lock = asyncio.Lock()

async def ensure_mcp_server_running():
    """Ensure the MCP server is running."""
    global mcp_process
    
    async with mcp_lock:
        if mcp_process is None or mcp_process.returncode is not None:
            # Verify paths
            if not os.path.exists(MCP_SERVER_PATH):
                logger.error(f"MCP server path not found: {MCP_SERVER_PATH}")
                return False
                
            if not os.path.exists(DATA_DIR):
                logger.info(f"Creating data directory: {DATA_DIR}")
                os.makedirs(DATA_DIR, exist_ok=True)
            
            # Use direct Python executable path
            python_exe = sys.executable
            
            try:
                # Start the MCP server as a subprocess
                cmd = [python_exe, MCP_SERVER_PATH, DATA_DIR]
                logger.info(f"Starting MCP server with command: {' '.join(cmd)}")
                
                # Create process
                mcp_process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                if mcp_process.pid:
                    logger.info(f"MCP server started with PID: {mcp_process.pid}")
                    return True
                else:
                    logger.error("Failed to get PID for MCP server process")
                    return False
                    
            except Exception as e:
                logger.error(f"Failed to start MCP server: {str(e)}")
                # Check if stderr has any output
                if mcp_process and mcp_process.stderr:
                    try:
                        error_data = await asyncio.wait_for(mcp_process.stderr.read(1024), timeout=1.0)
                        if error_data:
                            logger.error(f"MCP server error: {error_data.decode().strip()}")
                    except Exception:
                        pass
                return False
        else:
            # Verify process is still alive
            if mcp_process.returncode is None:
                logger.debug("MCP server already running")
                return True
            else:
                logger.warning(f"MCP server exited with code {mcp_process.returncode}")
                mcp_process = None
                return await ensure_mcp_server_running()  # Retry

@router.get("/status")
async def get_mcp_status():
    """Get MCP server status."""
    global mcp_process
    
    try:
        # Check if the process exists and is still running
        if mcp_process and mcp_process.returncode is None:
            return {"status": "running", "pid": mcp_process.pid}
        
        # Try to start the server if it's not running
        running = await ensure_mcp_server_running()
        if running:
            return {"status": "running", "pid": mcp_process.pid if mcp_process else None}
        else:
            # Try running the command directly and capture output for debugging
            result = subprocess.run(
                [sys.executable, MCP_SERVER_PATH, DATA_DIR], 
                capture_output=True, 
                text=True,
                timeout=5
            )
            error_msg = f"Failed to start MCP server. Exit code: {result.returncode}"
            if result.stderr:
                error_msg += f", Error: {result.stderr}"
            return {"status": "error", "message": error_msg}
    except Exception as e:
        logger.error(f"Error checking MCP status: {str(e)}")
        return {"status": "error", "message": str(e)}

# Direct mcp_filesystem API endpoint for testing
@router.get("/test")
async def test_mcp_api():
    """Test MCP filesystem directly."""
    try:
        # Create a simple test file
        test_dir = os.path.join(DATA_DIR, "test")
        os.makedirs(test_dir, exist_ok=True)
        
        test_file = os.path.join(test_dir, "test.txt")
        with open(test_file, "w") as f:
            f.write("This is a test file")
            
        # List files in the directory
        files = os.listdir(test_dir)
        
        return {
            "status": "success", 
            "message": "MCP test successful", 
            "files": files,
            "content": "This is a test file"
        }
    except Exception as e:
        logger.error(f"Error testing MCP API: {str(e)}")
        return {"status": "error", "message": str(e)}

@router.post("/restart")
async def restart_mcp_server():
    """Restart the MCP server."""
    global mcp_process
    
    async with mcp_lock:
        if mcp_process and mcp_process.returncode is None:
            try:
                mcp_process.terminate()
                await mcp_process.wait()
                logger.info("MCP server terminated")
            except Exception as e:
                logger.error(f"Error terminating MCP server: {str(e)}")
        
        mcp_process = None
    
    running = await ensure_mcp_server_running()
    if running:
        return {"status": "restarted", "pid": mcp_process.pid if mcp_process else None}
    else:
        raise HTTPException(status_code=500, detail="Failed to restart MCP server")

# Initialize the MCP server when this module is imported
async def init_mcp_server():
    await ensure_mcp_server_running()

# Register shutdown handler
async def shutdown_mcp_server():
    """Shutdown the MCP server when the application exits."""
    global mcp_process
    
    if mcp_process and mcp_process.returncode is None:
        try:
            logger.info("Shutting down MCP server...")
            mcp_process.terminate()
            await asyncio.wait_for(mcp_process.wait(), timeout=5.0)
            logger.info("MCP server terminated gracefully")
        except asyncio.TimeoutError:
            logger.warning("MCP server did not terminate in time, killing")
            mcp_process.kill()
        except Exception as e:
            logger.error(f"Error shutting down MCP server: {str(e)}")
