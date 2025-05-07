import asyncio
import json
import os
import logging
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any
from asyncio import subprocess

router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Path to the MCP stdio server
MCP_SERVER_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../mcp-filesystem-python/src/filesystem/server.py'))
MCP_ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'data'))

logger.info(f"MCP Server Path: {MCP_SERVER_PATH}")
logger.info(f"MCP Root Directory: {MCP_ROOT_DIR}")

# Global MCP process
mcp_process = None
mcp_lock = asyncio.Lock()

async def get_mcp_process():
    """Get or create the MCP process."""
    global mcp_process
    
    async with mcp_lock:
        if mcp_process is None or mcp_process.returncode is not None:
            logger.info("Starting new MCP process")
            mcp_process = await asyncio.create_subprocess_exec(
                'python', MCP_SERVER_PATH, MCP_ROOT_DIR,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
        return mcp_process

async def run_mcp_command(command: dict) -> dict:
    """Run a command through the MCP process."""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            proc = await get_mcp_process()
            
            # Send the command as a line of JSON
            if proc.stdin:
                command_json = json.dumps(command) + '\n'
                logger.debug(f"Sending command: {command_json}")
                proc.stdin.write(command_json.encode())
                await proc.stdin.drain()
            
            # Read output with timeout
            if proc.stdout:
                try:
                    output = await asyncio.wait_for(proc.stdout.readline(), timeout=5.0)
                    output_str = output.decode().strip()
                    logger.debug(f"Received output: {output_str}")
                    
                    try:
                        return json.loads(output_str)
                    except json.JSONDecodeError as e:
                        logger.error(f"Invalid JSON response: {e}")
                        # Check if process is still alive
                        if proc.returncode is not None:
                            logger.error(f"MCP process exited with code {proc.returncode}")
                            # Reset process to force recreation
                            global mcp_process
                            mcp_process = None
                        raise HTTPException(status_code=500, detail="Invalid MCP response format")
                except asyncio.TimeoutError:
                    logger.error("MCP command timed out")
                    raise HTTPException(status_code=504, detail="MCP command timed out")
            
        except Exception as e:
            logger.error(f"MCP command failed (attempt {attempt + 1}/{max_retries}): {str(e)}")
            if attempt == max_retries - 1:
                raise HTTPException(status_code=500, detail=f"MCP command failed: {str(e)}")
            await asyncio.sleep(0.1 * (attempt + 1))  # Exponential backoff
    
    raise HTTPException(status_code=500, detail="Maximum retries exceeded")

@router.get('/files')
async def list_files(path: str = "", pattern: str = "*.json"):
    """List files in a directory.
    
    Args:
        path: Directory path relative to MCP root
        pattern: File pattern to match
    """
    logger.info(f"Listing files in path: '{path}' with pattern: '{pattern}'")
    
    command = {
        "method": "list_files",
        "params": {
            "path": path,
            "pattern": pattern
        }
    }
    
    try:
        result = await run_mcp_command(command)
        logger.info(f"Listed files in {path}: {result}")
        return result
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}")
        raise

@router.get('/file/{file_path:path}')
async def get_file(file_path: str):
    """Read a file.
    
    Args:
        file_path: File path relative to MCP root
    """
    logger.info(f"Reading file: '{file_path}'")
    
    command = {
        "method": "read_file",
        "params": {
            "path": file_path
        }
    }
    
    try:
        result = await run_mcp_command(command)
        logger.info(f"Read file {file_path}")
        return result
    except Exception as e:
        logger.error(f"Error reading file {file_path}: {str(e)}")
        raise

@router.post('/file/{file_path:path}')
async def save_file(file_path: str, request: Request):
    """Write to a file.
    
    Args:
        file_path: File path relative to MCP root
    """
    content = await request.json()
    logger.info(f"Writing to file: '{file_path}'")
    
    command = {
        "method": "write_file",
        "params": {
            "path": file_path,
            "content": json.dumps(content, indent=2),
            "create_dirs": True
        }
    }
    
    try:
        result = await run_mcp_command(command)
        logger.info(f"Wrote to file {file_path}: {result}")
        return result
    except Exception as e:
        logger.error(f"Error writing to file {file_path}: {str(e)}")
        raise

@router.delete('/file/{file_path:path}')
async def delete_file(file_path: str):
    """Delete a file.
    
    Args:
        file_path: File path relative to MCP root
    """
    logger.info(f"Deleting file: '{file_path}'")
    
    command = {
        "method": "delete_file",
        "params": {
            "path": file_path,
            "recursive": False
        }
    }
    
    try:
        result = await run_mcp_command(command)
        logger.info(f"Deleted file {file_path}: {result}")
        return result
    except Exception as e:
        logger.error(f"Error deleting file {file_path}: {str(e)}")
        raise
