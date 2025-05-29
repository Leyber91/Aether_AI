"""
Configuration settings for the forex trading bot.
"""

from typing import Dict, Any

# OANDA API Configuration
OANDA_CONFIG = {
    'access_token': 'YOUR_ACCESS_TOKEN',
    'account_id': 'YOUR_ACCOUNT_ID',
    'environment': 'practice'  # or 'live'
}

# Account Configuration
ACCOUNT_CONFIG = {
    'initial_balance': 10000.0,  # Initial account balance
    'currency': 'USD'  # Account currency
}

# Risk Management Configuration
RISK_CONFIG = {
    'risk_per_trade': 0.01,  # 1% risk per trade
    'max_positions': 5,  # Maximum number of concurrent positions
    'max_correlation': 0.7,  # Maximum correlation between positions
    'max_drawdown': 0.20,  # Maximum drawdown before stopping
    'daily_loss_limit': 0.02,  # 2% daily loss limit
    'volatility_limit': 0.03  # 3% volatility limit
}

# Strategy Configuration
STRATEGY_CONFIG = {
    'trend_following': {
        'fast_period': 20,
        'slow_period': 50,
        'atr_period': 14,
        'atr_multiplier': 2,
        'risk_reward_ratio': 3,
        'rsi_period': 14,
        'rsi_overbought': 70,
        'rsi_oversold': 30,
        'adx_period': 14,
        'adx_threshold': 25,
        'volume_ma_period': 20
    },
    'mean_reversion': {
        'bb_period': 20,
        'bb_std': 2,
        'rsi_period': 14,
        'rsi_overbought': 70,
        'rsi_oversold': 30,
        'atr_period': 14,
        'atr_multiplier': 2,
        'risk_reward_ratio': 2
    }
}

# Trading Pairs Configuration
TRADING_PAIRS = [
    'EUR_USD',
    'GBP_USD',
    'USD_JPY',
    'AUD_USD',
    'USD_CAD',
    'NZD_USD',
    'USD_CHF'
]

# Timeframes Configuration
TIMEFRAMES = {
    'M1': 60,  # 1 minute
    'M5': 300,  # 5 minutes
    'M15': 900,  # 15 minutes
    'H1': 3600,  # 1 hour
    'H4': 14400,  # 4 hours
    'D': 86400  # 1 day
}

# Performance Monitoring Configuration
PERFORMANCE_CONFIG = {
    'metrics_update_interval': 60,  # Update metrics every 60 seconds
    'strategy_optimization_interval': 10,  # Optimize strategy weights every 10 trades
    'regime_detection_lookback': 20,  # Days for market regime detection
    'volatility_threshold': 0.02,  # Threshold for volatile market
    'trend_threshold': 0.6  # Threshold for trending market
}

# Logging Configuration
LOGGING_CONFIG = {
    'level': 'INFO',
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'file': 'forex_bot.log'
}

# Combine all configurations
CONFIG: Dict[str, Any] = {
    'oanda': OANDA_CONFIG,
    'account': ACCOUNT_CONFIG,
    'risk': RISK_CONFIG,
    'strategies': STRATEGY_CONFIG,
    'trading_pairs': TRADING_PAIRS,
    'timeframes': TIMEFRAMES,
    'performance': PERFORMANCE_CONFIG,
    'logging': LOGGING_CONFIG
} 