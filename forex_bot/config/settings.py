"""
Configuration settings for the forex trading bot.
This module contains all configurable parameters for the trading system.
"""

# API Configuration
OANDA_ACCESS_TOKEN = ""  # Your OANDA API access token
OANDA_ACCOUNT_ID = ""    # Your OANDA account ID
OANDA_ENVIRONMENT = "practice"  # 'practice' or 'live'

# Trading Parameters
INITIAL_CAPITAL = 10000  # Starting capital in USD
RISK_PER_TRADE = 0.01   # 1% risk per trade
MAX_DRAWDOWN = 0.20     # 20% maximum drawdown before stopping
MAX_LEVERAGE = 10       # Maximum allowed leverage

# Trading Pairs
TRADING_PAIRS = [
    "EUR_USD",
    "GBP_USD",
    "USD_JPY",
    "AUD_USD",
    "USD_CAD"
]

# Timeframes
TIMEFRAMES = {
    "M15": "15min",
    "H1": "1hour",
    "H4": "4hour",
    "D": "1day"
}

# Strategy Parameters
STRATEGY_PARAMS = {
    "trend_following": {
        "fast_period": 20,
        "slow_period": 50,
        "atr_multiplier": 2,
        "risk_reward_ratio": 3
    },
    "mean_reversion": {
        "bb_period": 20,
        "bb_std": 2,
        "rsi_period": 14,
        "rsi_overbought": 70,
        "rsi_oversold": 30
    }
}

# Risk Management
POSITION_SIZING = {
    "max_positions": 5,          # Maximum concurrent positions
    "max_correlation": 0.7,      # Maximum correlation between positions
    "min_distance": 50,          # Minimum pips between positions
    "max_daily_trades": 10       # Maximum trades per day
}

# Monitoring
MONITORING = {
    "log_level": "INFO",
    "save_trades": True,
    "performance_metrics": [
        "sharpe_ratio",
        "max_drawdown",
        "win_rate",
        "profit_factor"
    ]
}

# Backtesting
BACKTESTING = {
    "in_sample_ratio": 0.7,      # 70% for optimization
    "out_sample_ratio": 0.3,     # 30% for validation
    "monte_carlo_sims": 1000,    # Number of Monte Carlo simulations
    "min_trades": 100            # Minimum trades for validation
} 