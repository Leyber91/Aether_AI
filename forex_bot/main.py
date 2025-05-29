"""
Main forex trading bot implementation with enhanced strategy management.
"""

import logging
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from data.collector import OandaDataCollector
from risk_management.position_sizer import PositionSizer
from strategies.strategy_manager import StrategyManager

class ForexTradingBot:
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize forex trading bot with enhanced components.
        
        Args:
            config: Dictionary containing bot configuration
        """
        self.config = config
        self.setup_logging()
        
        # Initialize components
        self.data_collector = OandaDataCollector(
            access_token=config['oanda']['access_token'],
            account_id=config['oanda']['account_id'],
            environment=config['oanda']['environment']
        )
        
        self.position_sizer = PositionSizer(
            account_balance=config['account']['initial_balance'],
            risk_per_trade=config['risk']['risk_per_trade'],
            max_positions=config['risk']['max_positions'],
            max_correlation=config['risk']['max_correlation'],
            max_drawdown=config['risk']['max_drawdown']
        )
        
        self.strategy_manager = StrategyManager(config['strategies'])
        
        # Trading state
        self.positions = {}
        self.trade_history = []
        self.last_update = None
        self.is_running = False
        
        # Performance tracking
        self.daily_stats = {
            'trades': 0,
            'wins': 0,
            'losses': 0,
            'pnl': 0
        }
        
    def setup_logging(self):
        """Configure logging for the bot."""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('forex_bot.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        
    def run(self):
        """Main bot execution loop."""
        self.logger.info("Starting forex trading bot...")
        self.is_running = True
        
        try:
            while self.is_running:
                current_time = datetime.now()
                
                # Update every minute
                if (self.last_update is None or 
                    (current_time - self.last_update).total_seconds() >= 60):
                    self.update()
                    self.last_update = current_time
                    
                # Sleep to prevent excessive CPU usage
                time.sleep(1)
                
        except KeyboardInterrupt:
            self.logger.info("Bot stopped by user")
        except Exception as e:
            self.logger.error(f"Error in main loop: {str(e)}")
        finally:
            self.cleanup()
            
    def update(self):
        """Update trading state and execute trades."""
        try:
            # Update account summary
            account_summary = self.data_collector.get_account_summary()
            self.position_sizer.update_account_balance(float(account_summary['balance']))
            
            # Check drawdown limit
            if self.position_sizer.current_drawdown >= self.position_sizer.max_drawdown:
                self.logger.warning("Maximum drawdown reached, closing all positions")
                self.close_all_positions()
                return
                
            # Update each trading pair
            for pair in self.config['trading_pairs']:
                self.update_pair(pair)
                
            # Optimize strategy weights periodically
            if len(self.trade_history) % 10 == 0:
                self.strategy_manager.optimize_weights()
                
        except Exception as e:
            self.logger.error(f"Error in update: {str(e)}")
            
    def update_pair(self, pair: str):
        """Update and trade a specific currency pair."""
        try:
            # Get historical data
            data = self.data_collector.get_historical_data(
                instrument=pair,
                granularity='M1',
                count=100
            )
            
            if data is None or len(data) < 50:
                return
                
            # Get current price
            current_price = float(data['close'].iloc[-1])
            
            # Check existing position
            if pair in self.positions:
                if self.strategy_manager.should_close_position(pair, current_price, self.positions[pair]):
                    self.close_position(pair, current_price)
                return
                
            # Check if we can open new position
            if not self.position_sizer.can_open_position(pair, self.calculate_correlation_matrix()):
                return
                
            # Generate trading signal
            signal = self.strategy_manager.generate_combined_signal(data)
            
            if signal['action'] != 'HOLD' and signal['confidence'] >= 0.7:
                self.execute_trade(pair, signal, current_price)
                
        except Exception as e:
            self.logger.error(f"Error updating pair {pair}: {str(e)}")
            
    def execute_trade(self, pair: str, signal: Dict[str, Any], current_price: float):
        """Execute a new trade."""
        try:
            # Calculate position size
            position_size = self.position_sizer.calculate_position_size(
                instrument=pair,
                entry_price=current_price,
                stop_loss=signal['stop_loss'],
                pip_value=self.data_collector.calculate_pip_value(pair)
            )
            
            # Record position
            self.positions[pair] = {
                'action': signal['action'],
                'size': position_size,
                'entry_price': current_price,
                'stop_loss': signal['stop_loss'],
                'take_profit': signal['take_profit'],
                'entry_time': datetime.now()
            }
            
            self.logger.info(f"Opened {signal['action']} position in {pair} at {current_price}")
            
        except Exception as e:
            self.logger.error(f"Error executing trade for {pair}: {str(e)}")
            
    def close_position(self, pair: str, current_price: float):
        """Close an existing position."""
        try:
            position = self.positions[pair]
            
            # Calculate P&L
            if position['action'] == 'BUY':
                pnl = (current_price - position['entry_price']) * position['size']
            else:
                pnl = (position['entry_price'] - current_price) * position['size']
                
            # Record trade
            self.position_sizer.record_trade(
                instrument=pair,
                entry_price=position['entry_price'],
                exit_price=current_price,
                position_size=position['size'],
                pnl=pnl
            )
            
            # Update daily stats
            self.daily_stats['trades'] += 1
            if pnl > 0:
                self.daily_stats['wins'] += 1
            else:
                self.daily_stats['losses'] += 1
            self.daily_stats['pnl'] += pnl
            
            # Remove position
            del self.positions[pair]
            
            self.logger.info(f"Closed {position['action']} position in {pair} at {current_price}, P&L: {pnl}")
            
        except Exception as e:
            self.logger.error(f"Error closing position for {pair}: {str(e)}")
            
    def close_all_positions(self):
        """Close all open positions."""
        for pair in list(self.positions.keys()):
            try:
                current_price = float(self.data_collector.get_current_prices([pair])[pair])
                self.close_position(pair, current_price)
            except Exception as e:
                self.logger.error(f"Error closing position for {pair}: {str(e)}")
                
    def calculate_correlation_matrix(self) -> pd.DataFrame:
        """Calculate correlation matrix for all trading pairs."""
        try:
            # Get historical data for all pairs
            data = {}
            for pair in self.config['trading_pairs']:
                hist_data = self.data_collector.get_historical_data(
                    instrument=pair,
                    granularity='H1',
                    count=100
                )
                if hist_data is not None:
                    data[pair] = hist_data['close']
                    
            # Calculate correlation matrix
            df = pd.DataFrame(data)
            return df.corr()
            
        except Exception as e:
            self.logger.error(f"Error calculating correlation matrix: {str(e)}")
            return pd.DataFrame()
            
    def cleanup(self):
        """Clean up resources before stopping."""
        self.logger.info("Cleaning up...")
        self.close_all_positions()
        self.is_running = False
        
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics."""
        metrics = self.position_sizer.get_performance_metrics()
        metrics.update({
            'daily_stats': self.daily_stats,
            'open_positions': len(self.positions),
            'strategy_performance': self.strategy_manager.strategy_performance
        })
        return metrics

if __name__ == "__main__":
    bot = ForexTradingBot()
    bot.run() 