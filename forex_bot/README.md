# Forex Trading Bot

A robust forex trading bot built with Python, implementing proven trading strategies with proper risk management.

## Features

- Multiple trading strategies (Trend Following, Mean Reversion)
- Sophisticated risk management
- Position sizing based on account risk
- Correlation-based portfolio management
- Real-time performance monitoring
- Comprehensive logging
- OANDA API integration

## Prerequisites

- Python 3.8+
- OANDA account (practice or live)
- OANDA API access token

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd forex_bot
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Install TA-Lib:
   - Windows: Download and install from [here](https://www.lfd.uci.edu/~gohlke/pythonlibs/#ta-lib)
   - Linux: `sudo apt-get install ta-lib`
   - macOS: `brew install ta-lib`

5. Configure your OANDA credentials in `config/settings.py`:
```python
OANDA_ACCESS_TOKEN = "your-access-token"
OANDA_ACCOUNT_ID = "your-account-id"
OANDA_ENVIRONMENT = "practice"  # or "live"
```

## Usage

1. Start the bot:
```bash
python -m forex_bot.main
```

2. Monitor the bot:
- Check `forex_bot.log` for detailed logging
- Use the performance metrics to track results

## Risk Management

The bot implements several risk management features:

- Maximum 1% risk per trade
- Maximum 20% drawdown before stopping
- Position sizing based on ATR
- Correlation-based position limits
- Maximum 5 concurrent positions

## Trading Strategies

### Trend Following Strategy
- Uses moving average crossovers
- ATR-based dynamic stop losses
- 1:3 risk-reward ratio
- Trend strength confirmation

### Mean Reversion Strategy (Coming Soon)
- Bollinger Bands
- RSI
- Support/Resistance levels

## Performance Metrics

The bot tracks several performance metrics:

- Win rate
- Profit factor
- Average profit/loss
- Maximum drawdown
- Sharpe ratio
- Total P&L

## Development

### Adding New Strategies

1. Create a new strategy class in `strategies/`
2. Inherit from `BaseStrategy`
3. Implement required methods:
   - `calculate_indicators()`
   - `generate_signals()`
   - `should_close_position()`

### Backtesting

1. Use the backtesting module to test strategies
2. Implement walk-forward analysis
3. Use Monte Carlo simulation for robustness

## Disclaimer

This bot is for educational purposes only. Trading forex carries significant risk. Past performance is not indicative of future results. Always use proper risk management and never trade with money you cannot afford to lose.

## License

MIT License - See LICENSE file for details 