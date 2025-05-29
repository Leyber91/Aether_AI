"""
Strategy manager for combining and optimizing multiple trading strategies.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List
from .trend_following import TrendFollowingStrategy
from .mean_reversion import MeanReversionStrategy

class StrategyManager:
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize strategy manager with multiple strategies.
        
        Args:
            config: Dictionary containing strategy configurations
        """
        self.trend_strategy = TrendFollowingStrategy(config.get('trend_following', {}))
        self.mean_rev_strategy = MeanReversionStrategy(config.get('mean_reversion', {}))
        self.strategies = [self.trend_strategy, self.mean_rev_strategy]
        
        # Strategy weights (can be optimized based on performance)
        self.strategy_weights = {
            'trend_following': 0.6,
            'mean_reversion': 0.4
        }
        
        # Performance tracking
        self.strategy_performance = {
            'trend_following': {'wins': 0, 'losses': 0, 'pnl': 0},
            'mean_reversion': {'wins': 0, 'losses': 0, 'pnl': 0}
        }
        
        # Market regime detection
        self.regime_lookback = 20
        self.volatility_threshold = 0.02
        self.trend_threshold = 0.6
        
    def detect_market_regime(self, data: pd.DataFrame) -> str:
        """
        Detect current market regime to adjust strategy weights.
        
        Args:
            data: DataFrame with OHLCV data
            
        Returns:
            String indicating market regime ('trending', 'ranging', 'volatile')
        """
        if len(data) < self.regime_lookback:
            return 'unknown'
            
        # Calculate volatility
        returns = data['close'].pct_change()
        volatility = returns.std() * np.sqrt(252)
        
        # Calculate trend strength using ADX
        high_low = data['high'] - data['low']
        high_close = abs(data['high'] - data['close'].shift(1))
        low_close = abs(data['low'] - data['close'].shift(1))
        tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        atr = tr.rolling(window=14).mean()
        
        plus_dm = (data['high'] - data['high'].shift(1)).clip(lower=0)
        minus_dm = (data['low'].shift(1) - data['low']).clip(lower=0)
        
        plus_di = 100 * (plus_dm.rolling(window=14).mean() / atr)
        minus_di = 100 * (minus_dm.rolling(window=14).mean() / atr)
        
        dx = 100 * abs(plus_di - minus_di) / (plus_di + minus_di)
        adx = dx.rolling(window=14).mean()
        
        # Determine regime
        if volatility > self.volatility_threshold:
            return 'volatile'
        elif adx.iloc[-1] > self.trend_threshold:
            return 'trending'
        else:
            return 'ranging'
            
    def adjust_strategy_weights(self, regime: str) -> None:
        """
        Adjust strategy weights based on market regime.
        
        Args:
            regime: Current market regime
        """
        if regime == 'trending':
            self.strategy_weights = {
                'trend_following': 0.8,
                'mean_reversion': 0.2
            }
        elif regime == 'ranging':
            self.strategy_weights = {
                'trend_following': 0.3,
                'mean_reversion': 0.7
            }
        elif regime == 'volatile':
            self.strategy_weights = {
                'trend_following': 0.5,
                'mean_reversion': 0.5
            }
            
    def update_strategy_performance(self, strategy: str, pnl: float) -> None:
        """
        Update performance metrics for each strategy.
        
        Args:
            strategy: Strategy name
            pnl: Profit/loss from trade
        """
        if pnl > 0:
            self.strategy_performance[strategy]['wins'] += 1
        else:
            self.strategy_performance[strategy]['losses'] += 1
        self.strategy_performance[strategy]['pnl'] += pnl
        
    def optimize_weights(self) -> None:
        """
        Optimize strategy weights based on recent performance.
        """
        total_pnl = sum(perf['pnl'] for perf in self.strategy_performance.values())
        if total_pnl == 0:
            return
            
        for strategy, perf in self.strategy_performance.items():
            weight = perf['pnl'] / total_pnl
            self.strategy_weights[strategy] = max(0.2, min(0.8, weight))
            
    def generate_combined_signal(self, data: pd.DataFrame) -> Dict[str, Any]:
        """
        Generate combined trading signal from all strategies.
        
        Args:
            data: DataFrame with OHLCV data
            
        Returns:
            Dictionary containing combined trading signal
        """
        # Detect market regime
        regime = self.detect_market_regime(data)
        self.adjust_strategy_weights(regime)
        
        # Get signals from each strategy
        trend_signal = self.trend_strategy.generate_signals(data)
        mean_rev_signal = self.mean_rev_strategy.generate_signals(data)
        
        signals = {
            'trend_following': trend_signal,
            'mean_reversion': mean_rev_signal
        }
        
        # Combine signals
        combined_signal = {
            'action': 'HOLD',
            'stop_loss': None,
            'take_profit': None,
            'confidence': 0
        }
        
        # Calculate weighted confidence for each action
        action_scores = {
            'BUY': 0,
            'SELL': 0,
            'HOLD': 0
        }
        
        for strategy, signal in signals.items():
            weight = self.strategy_weights[strategy]
            action_scores[signal['action']] += signal['confidence'] * weight
            
        # Select action with highest score
        best_action = max(action_scores.items(), key=lambda x: x[1])
        combined_signal['action'] = best_action[0]
        combined_signal['confidence'] = best_action[1]
        
        # Calculate weighted stop loss and take profit
        if combined_signal['action'] != 'HOLD':
            stop_losses = []
            take_profits = []
            
            for strategy, signal in signals.items():
                if signal['action'] == combined_signal['action']:
                    weight = self.strategy_weights[strategy]
                    stop_losses.append((signal['stop_loss'], weight))
                    take_profits.append((signal['take_profit'], weight))
                    
            if stop_losses:
                combined_signal['stop_loss'] = sum(sl * w for sl, w in stop_losses) / sum(w for _, w in stop_losses)
            if take_profits:
                combined_signal['take_profit'] = sum(tp * w for tp, w in take_profits) / sum(w for _, w in take_profits)
                
        return combined_signal
        
    def should_close_position(self,
                            symbol: str,
                            current_price: float,
                            position: Dict[str, Any]) -> bool:
        """
        Check if position should be closed based on all strategies.
        
        Args:
            symbol: Trading pair symbol
            current_price: Current market price
            position: Position information dictionary
            
        Returns:
            Boolean indicating if position should be closed
        """
        # Check each strategy
        for strategy in self.strategies:
            if strategy.should_close_position(symbol, current_price, position):
                return True
                
        return False 