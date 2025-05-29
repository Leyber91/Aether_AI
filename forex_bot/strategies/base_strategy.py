"""
Base strategy class that defines the interface for all trading strategies.
All specific strategy implementations should inherit from this class.
"""

from abc import ABC, abstractmethod
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional

class BaseStrategy(ABC):
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the strategy with configuration parameters.
        
        Args:
            config: Dictionary containing strategy-specific parameters
        """
        self.config = config
        self.name = self.__class__.__name__
        self.positions = {}  # Current open positions
        self.trade_history = []  # Historical trades
        
    @abstractmethod
    def generate_signals(self, data: pd.DataFrame) -> Dict[str, Any]:
        """
        Generate trading signals based on the input data.
        
        Args:
            data: DataFrame containing OHLCV data and indicators
            
        Returns:
            Dictionary containing:
            - action: 'BUY', 'SELL', or 'HOLD'
            - stop_loss: Stop loss price
            - take_profit: Take profit price
            - confidence: Signal confidence (0-1)
        """
        pass
    
    @abstractmethod
    def calculate_indicators(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate technical indicators required for the strategy.
        
        Args:
            data: DataFrame containing OHLCV data
            
        Returns:
            DataFrame with added indicator columns
        """
        pass
    
    def validate_data(self, data: pd.DataFrame) -> bool:
        """
        Validate input data has required columns and sufficient history.
        
        Args:
            data: DataFrame to validate
            
        Returns:
            Boolean indicating if data is valid
        """
        required_columns = ['open', 'high', 'low', 'close', 'volume']
        return all(col in data.columns for col in required_columns)
    
    def calculate_position_size(self, 
                              account_balance: float,
                              risk_per_trade: float,
                              stop_loss_pips: float,
                              pip_value: float) -> float:
        """
        Calculate position size based on risk parameters.
        
        Args:
            account_balance: Current account balance
            risk_per_trade: Maximum risk per trade (e.g., 0.01 for 1%)
            stop_loss_pips: Stop loss distance in pips
            pip_value: Value of one pip in account currency
            
        Returns:
            Position size in units
        """
        risk_amount = account_balance * risk_per_trade
        position_size = risk_amount / (stop_loss_pips * pip_value)
        return min(position_size, account_balance * self.config.get('max_leverage', 10))
    
    def update_position(self, 
                       symbol: str,
                       action: str,
                       size: float,
                       entry_price: float,
                       stop_loss: float,
                       take_profit: float) -> None:
        """
        Update position tracking.
        
        Args:
            symbol: Trading pair symbol
            action: 'BUY' or 'SELL'
            size: Position size
            entry_price: Entry price
            stop_loss: Stop loss price
            take_profit: Take profit price
        """
        self.positions[symbol] = {
            'action': action,
            'size': size,
            'entry_price': entry_price,
            'stop_loss': stop_loss,
            'take_profit': take_profit,
            'entry_time': pd.Timestamp.now()
        }
    
    def record_trade(self,
                    symbol: str,
                    action: str,
                    size: float,
                    entry_price: float,
                    exit_price: float,
                    pnl: float) -> None:
        """
        Record completed trade in history.
        
        Args:
            symbol: Trading pair symbol
            action: 'BUY' or 'SELL'
            size: Position size
            entry_price: Entry price
            exit_price: Exit price
            pnl: Profit/loss in account currency
        """
        self.trade_history.append({
            'symbol': symbol,
            'action': action,
            'size': size,
            'entry_price': entry_price,
            'exit_price': exit_price,
            'pnl': pnl,
            'entry_time': self.positions[symbol]['entry_time'],
            'exit_time': pd.Timestamp.now()
        })
        del self.positions[symbol]
    
    def get_performance_metrics(self) -> Dict[str, float]:
        """
        Calculate strategy performance metrics.
        
        Returns:
            Dictionary containing performance metrics
        """
        if not self.trade_history:
            return {}
            
        trades_df = pd.DataFrame(self.trade_history)
        
        metrics = {
            'total_trades': len(trades_df),
            'win_rate': len(trades_df[trades_df['pnl'] > 0]) / len(trades_df),
            'avg_profit': trades_df[trades_df['pnl'] > 0]['pnl'].mean() if len(trades_df[trades_df['pnl'] > 0]) > 0 else 0,
            'avg_loss': trades_df[trades_df['pnl'] < 0]['pnl'].mean() if len(trades_df[trades_df['pnl'] < 0]) > 0 else 0,
            'profit_factor': abs(trades_df[trades_df['pnl'] > 0]['pnl'].sum() / 
                               trades_df[trades_df['pnl'] < 0]['pnl'].sum()) if len(trades_df[trades_df['pnl'] < 0]) > 0 else float('inf'),
            'total_pnl': trades_df['pnl'].sum()
        }
        
        return metrics 