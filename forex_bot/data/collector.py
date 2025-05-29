"""
Data collection module for fetching forex data from OANDA API.
"""

import oandapyV20
import oandapyV20.endpoints.instruments as instruments
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging

class OandaDataCollector:
    def __init__(self, 
                 access_token: str,
                 account_id: str,
                 environment: str = "practice"):
        """
        Initialize OANDA data collector.
        
        Args:
            access_token: OANDA API access token
            account_id: OANDA account ID
            environment: 'practice' or 'live'
        """
        self.client = oandapyV20.API(access_token=access_token,
                                    environment=environment)
        self.account_id = account_id
        self.logger = logging.getLogger(__name__)
        
    def get_historical_data(self,
                          instrument: str,
                          granularity: str = "M15",
                          count: int = 5000,
                          start: Optional[datetime] = None,
                          end: Optional[datetime] = None) -> pd.DataFrame:
        """
        Fetch historical price data from OANDA.
        
        Args:
            instrument: Trading pair (e.g., 'EUR_USD')
            granularity: Candle timeframe (e.g., 'M15', 'H1', 'D')
            count: Number of candles to fetch (max 5000)
            start: Start datetime (optional)
            end: End datetime (optional)
            
        Returns:
            DataFrame with OHLCV data
        """
        try:
            params = {
                'granularity': granularity,
                'count': min(count, 5000)  # OANDA limit
            }
            
            if start:
                params['from'] = start.isoformat()
            if end:
                params['to'] = end.isoformat()
                
            r = instruments.InstrumentsCandles(instrument=instrument,
                                             params=params)
            self.client.request(r)
            
            # Convert to DataFrame
            data = []
            for candle in r.response['candles']:
                if candle['complete']:
                    data.append({
                        'time': pd.Timestamp(candle['time']),
                        'open': float(candle['mid']['o']),
                        'high': float(candle['mid']['h']),
                        'low': float(candle['mid']['l']),
                        'close': float(candle['mid']['c']),
                        'volume': int(candle['volume'])
                    })
                    
            df = pd.DataFrame(data)
            df.set_index('time', inplace=True)
            return df
            
        except Exception as e:
            self.logger.error(f"Error fetching historical data: {str(e)}")
            raise
            
    def get_account_summary(self) -> Dict[str, Any]:
        """
        Get account summary information.
        
        Returns:
            Dictionary containing account details
        """
        try:
            r = oandapyV20.endpoints.accounts.AccountSummary(self.account_id)
            self.client.request(r)
            return r.response
        except Exception as e:
            self.logger.error(f"Error fetching account summary: {str(e)}")
            raise
            
    def get_current_prices(self, instruments: List[str]) -> Dict[str, float]:
        """
        Get current prices for specified instruments.
        
        Args:
            instruments: List of trading pairs
            
        Returns:
            Dictionary mapping instruments to current prices
        """
        try:
            prices = {}
            for instrument in instruments:
                r = instruments.InstrumentsCandles(instrument=instrument,
                                                 params={'count': 1})
                self.client.request(r)
                prices[instrument] = float(r.response['candles'][0]['mid']['c'])
            return prices
        except Exception as e:
            self.logger.error(f"Error fetching current prices: {str(e)}")
            raise
            
    def get_instrument_details(self, instrument: str) -> Dict[str, Any]:
        """
        Get detailed information about a trading instrument.
        
        Args:
            instrument: Trading pair
            
        Returns:
            Dictionary containing instrument details
        """
        try:
            r = oandapyV20.endpoints.instruments.InstrumentsDetails(instrument=instrument)
            self.client.request(r)
            return r.response
        except Exception as e:
            self.logger.error(f"Error fetching instrument details: {str(e)}")
            raise
            
    def calculate_pip_value(self, 
                          instrument: str,
                          account_currency: str = "USD") -> float:
        """
        Calculate the value of one pip for the instrument.
        
        Args:
            instrument: Trading pair
            account_currency: Account currency
            
        Returns:
            Value of one pip in account currency
        """
        try:
            details = self.get_instrument_details(instrument)
            pip_location = details['instrument']['pipLocation']
            display_precision = details['instrument']['displayPrecision']
            
            # Get current price
            current_price = self.get_current_prices([instrument])[instrument]
            
            # Calculate pip value
            pip_value = 0.0001 * (10 ** pip_location)
            
            # Convert to account currency if needed
            if account_currency != details['instrument']['quoteCurrency']:
                # Need to convert using current exchange rate
                conversion_rate = self.get_current_prices([f"{account_currency}_{details['instrument']['quoteCurrency']}"])[f"{account_currency}_{details['instrument']['quoteCurrency']}"]
                pip_value *= conversion_rate
                
            return pip_value
            
        except Exception as e:
            self.logger.error(f"Error calculating pip value: {str(e)}")
            raise 