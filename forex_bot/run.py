"""
Script to run the forex trading bot.
"""

import os
import sys
import logging
from config.config import CONFIG
from main import ForexTradingBot

def setup_environment():
    """Setup environment variables and logging."""
    # Add project root to Python path
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sys.path.append(project_root)
    
    # Setup logging
    logging.basicConfig(
        level=getattr(logging, CONFIG['logging']['level']),
        format=CONFIG['logging']['format'],
        handlers=[
            logging.FileHandler(CONFIG['logging']['file']),
            logging.StreamHandler()
        ]
    )
    
def main():
    """Main entry point for the forex trading bot."""
    try:
        # Setup environment
        setup_environment()
        logger = logging.getLogger(__name__)
        
        # Validate configuration
        if CONFIG['oanda']['access_token'] == 'YOUR_ACCESS_TOKEN':
            logger.error("Please set your OANDA access token in config.py")
            return
            
        if CONFIG['oanda']['account_id'] == 'YOUR_ACCOUNT_ID':
            logger.error("Please set your OANDA account ID in config.py")
            return
            
        # Initialize and run bot
        logger.info("Initializing forex trading bot...")
        bot = ForexTradingBot(CONFIG)
        
        # Run the bot
        logger.info("Starting forex trading bot...")
        bot.run()
        
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
    except Exception as e:
        logger.error(f"Error running bot: {str(e)}")
        raise
        
if __name__ == "__main__":
    main() 