"""
Position sizing and risk management module with enhanced risk controls.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
import logging

class PositionSizer:
    def __init__(self,
                 account_balance: float,
                 risk_per_trade: float = 0.01,
                 max_positions: int = 5,
                 max_correlation: float = 0.7,
                 max_drawdown: float = 0.20,
                 kelly_fraction: float = 0.5):  # Conservative Kelly implementation
        """
        Initialize position sizer with enhanced risk parameters.
        
        Args:
            account_balance: Current account balance
            risk_per_trade: Maximum risk per trade (e.g., 0.01 for 1%)
            max_positions: Maximum number of concurrent positions
            max_correlation: Maximum allowed correlation between positions
            max_drawdown: Maximum allowed drawdown before stopping
            kelly_fraction: Fraction of Kelly Criterion to use (0.5 = half Kelly)
        """
        self.account_balance = account_balance
        self.initial_balance = account_balance
        self.risk_per_trade = risk_per_trade
        self.max_positions = max_positions
        self.max_correlation = max_correlation
        self.max_drawdown = max_drawdown
        self.kelly_fraction = kelly_fraction
        self.logger = logging.getLogger(__name__)
        
        # Enhanced position tracking
        self.positions = {}  # Current open positions
        self.trade_history = []  # Historical trades
        self.peak_balance = account_balance
        self.current_drawdown = 0.0
        self.daily_pnl = []  # Track daily P&L for volatility calculation
        self.volatility_lookback = 20  # Days for volatility calculation
        
    def calculate_kelly_criterion(self) -> float:
        """
        Calculate Kelly Criterion based on historical performance.
        
        Returns:
            Kelly fraction for position sizing
        """
        if len(self.trade_history) < 10:
            return self.risk_per_trade  # Default to fixed risk if not enough history
            
        trades_df = pd.DataFrame(self.trade_history)
        win_rate = len(trades_df[trades_df['pnl'] > 0]) / len(trades_df)
        avg_win = trades_df[trades_df['pnl'] > 0]['pnl'].mean()
        avg_loss = abs(trades_df[trades_df['pnl'] < 0]['pnl'].mean())
        
        if avg_loss == 0:
            return self.risk_per_trade
            
        kelly = (win_rate * avg_win - (1 - win_rate) * avg_loss) / avg_win
        kelly = max(0, min(kelly, 0.5))  # Cap at 50% of account
        return kelly * self.kelly_fraction  # Apply conservative fraction
        
    def calculate_position_size(self,
                              instrument: str,
                              entry_price: float,
                              stop_loss: float,
                              pip_value: float) -> float:
        """
        Calculate position size using dynamic risk parameters.
        
        Args:
            instrument: Trading pair
            entry_price: Entry price
            stop_loss: Stop loss price
            pip_value: Value of one pip in account currency
            
        Returns:
            Position size in units
        """
        try:
            # Calculate stop loss distance in pips
            stop_loss_pips = abs(entry_price - stop_loss) / pip_value
            
            # Get dynamic risk based on Kelly Criterion
            risk_fraction = self.calculate_kelly_criterion()
            
            # Calculate risk amount
            risk_amount = self.account_balance * risk_fraction
            
            # Calculate position size
            position_size = risk_amount / (stop_loss_pips * pip_value)
            
            # Apply volatility-based position sizing
            if len(self.daily_pnl) >= self.volatility_lookback:
                volatility = np.std(self.daily_pnl[-self.volatility_lookback:])
                if volatility > 0:
                    # Reduce position size if volatility is high
                    volatility_factor = min(1.0, 0.02 / volatility)
                    position_size *= volatility_factor
            
            # Apply maximum leverage constraint (10:1)
            max_position = self.account_balance * 10
            position_size = min(position_size, max_position)
            
            return position_size
            
        except Exception as e:
            self.logger.error(f"Error calculating position size: {str(e)}")
            raise
            
    def can_open_position(self,
                         instrument: str,
                         correlation_matrix: pd.DataFrame) -> bool:
        """
        Enhanced position opening checks with additional risk controls.
        
        Args:
            instrument: Trading pair
            correlation_matrix: DataFrame of instrument correlations
            
        Returns:
            Boolean indicating if position can be opened
        """
        # Check maximum positions
        if len(self.positions) >= self.max_positions:
            self.logger.info("Maximum number of positions reached")
            return False
            
        # Check correlation with existing positions
        for pos in self.positions:
            if instrument in correlation_matrix.index and pos in correlation_matrix.columns:
                correlation = correlation_matrix.loc[instrument, pos]
                if abs(correlation) > self.max_correlation:
                    self.logger.info(f"Correlation too high: {correlation}")
                    return False
                    
        # Check drawdown
        if self.current_drawdown >= self.max_drawdown:
            self.logger.info("Maximum drawdown reached")
            return False
            
        # Check daily loss limit
        if len(self.daily_pnl) > 0:
            daily_loss = sum(self.daily_pnl[-1:])
            if daily_loss < -0.02 * self.account_balance:  # 2% daily loss limit
                self.logger.info("Daily loss limit reached")
                return False
                
        # Check volatility
        if len(self.daily_pnl) >= self.volatility_lookback:
            volatility = np.std(self.daily_pnl[-self.volatility_lookback:])
            if volatility > 0.03 * self.account_balance:  # 3% volatility limit
                self.logger.info("Volatility too high")
                return False
                
        return True
        
    def update_account_balance(self, new_balance: float) -> None:
        """
        Update account balance and calculate enhanced metrics.
        
        Args:
            new_balance: New account balance
        """
        self.account_balance = new_balance
        self.peak_balance = max(self.peak_balance, new_balance)
        self.current_drawdown = (self.peak_balance - new_balance) / self.peak_balance
        
        # Update daily P&L
        if len(self.daily_pnl) > 0 and pd.Timestamp.now().date() != pd.Timestamp(self.daily_pnl[-1]['date']).date():
            self.daily_pnl.append({
                'date': pd.Timestamp.now(),
                'pnl': new_balance - self.account_balance
            })
            
    def record_trade(self,
                    instrument: str,
                    entry_price: float,
                    exit_price: float,
                    position_size: float,
                    pnl: float) -> None:
        """
        Record trade with enhanced metrics.
        
        Args:
            instrument: Trading pair
            entry_price: Entry price
            exit_price: Exit price
            position_size: Position size
            pnl: Profit/loss in account currency
        """
        trade = {
            'instrument': instrument,
            'entry_price': entry_price,
            'exit_price': exit_price,
            'position_size': position_size,
            'pnl': pnl,
            'timestamp': pd.Timestamp.now(),
            'holding_period': (pd.Timestamp.now() - self.positions[instrument]['entry_time']).total_seconds() / 3600
        }
        
        self.trade_history.append(trade)
        self.update_account_balance(self.account_balance + pnl)
        
    def get_performance_metrics(self) -> Dict[str, float]:
        """
        Calculate enhanced performance metrics.
        
        Returns:
            Dictionary containing performance metrics
        """
        if not self.trade_history:
            return {}
            
        trades_df = pd.DataFrame(self.trade_history)
        
        # Calculate basic metrics
        metrics = {
            'total_trades': len(trades_df),
            'win_rate': len(trades_df[trades_df['pnl'] > 0]) / len(trades_df),
            'avg_profit': trades_df[trades_df['pnl'] > 0]['pnl'].mean() if len(trades_df[trades_df['pnl'] > 0]) > 0 else 0,
            'avg_loss': trades_df[trades_df['pnl'] < 0]['pnl'].mean() if len(trades_df[trades_df['pnl'] < 0]) > 0 else 0,
            'profit_factor': abs(trades_df[trades_df['pnl'] > 0]['pnl'].sum() / 
                               trades_df[trades_df['pnl'] < 0]['pnl'].sum()) if len(trades_df[trades_df['pnl'] < 0]) > 0 else float('inf'),
            'total_pnl': trades_df['pnl'].sum(),
            'max_drawdown': self.current_drawdown,
            'sharpe_ratio': self.calculate_sharpe_ratio(trades_df['pnl'])
        }
        
        # Add enhanced metrics
        if len(trades_df) > 0:
            metrics.update({
                'avg_holding_period': trades_df['holding_period'].mean(),
                'max_consecutive_wins': self.calculate_max_consecutive(trades_df['pnl'], True),
                'max_consecutive_losses': self.calculate_max_consecutive(trades_df['pnl'], False),
                'volatility': np.std(trades_df['pnl']) if len(trades_df) > 1 else 0,
                'kelly_criterion': self.calculate_kelly_criterion(),
                'recovery_factor': abs(metrics['total_pnl'] / (self.peak_balance * metrics['max_drawdown'])) if metrics['max_drawdown'] > 0 else float('inf')
            })
            
        return metrics
        
    def calculate_max_consecutive(self, series: pd.Series, positive: bool) -> int:
        """Calculate maximum consecutive wins or losses."""
        if positive:
            return (series > 0).astype(int).groupby((series > 0).astype(int).cumsum()).cumsum().max()
        else:
            return (series < 0).astype(int).groupby((series < 0).astype(int).cumsum()).cumsum().max()
            
    def calculate_sharpe_ratio(self, returns: pd.Series, risk_free_rate: float = 0.02) -> float:
        """
        Calculate enhanced Sharpe ratio with proper annualization.
        
        Args:
            returns: Series of trade returns
            risk_free_rate: Annual risk-free rate
            
        Returns:
            Sharpe ratio
        """
        if len(returns) < 2:
            return 0.0
            
        # Convert to daily returns
        daily_returns = returns.resample('D').sum()
        
        # Calculate Sharpe ratio with proper annualization
        excess_returns = daily_returns - (risk_free_rate / 252)  # Daily risk-free rate
        if len(excess_returns) < 2:
            return 0.0
            
        # Annualize returns and volatility
        annualized_return = excess_returns.mean() * 252
        annualized_vol = excess_returns.std() * np.sqrt(252)
        
        if annualized_vol == 0:
            return 0.0
            
        sharpe = annualized_return / annualized_vol
        return sharpe 