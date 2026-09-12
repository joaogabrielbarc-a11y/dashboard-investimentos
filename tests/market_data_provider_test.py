import unittest

from scripts.market_data.base import BaseMarketDataProvider, HistoricalSeries, ProviderError, Quote
from scripts.market_data.metrics import metrics
from scripts.market_data.orchestrator import MarketDataRouter


class FakeProvider(BaseMarketDataProvider):
    def __init__(self, name, fail=False):
        self.name, self.fail = name, fail

    def get_latest_prices(self, tickers):
        if self.fail:
            raise ProviderError('indisponível')
        return {str(t): Quote(str(t), 10, 'BRL', '2026-09-11', self.name) for t in tickers}

    def get_historical_data(self, ticker, timeframe='5y'):
        if self.fail:
            raise ProviderError('indisponível')
        return HistoricalSeries(str(ticker), 'BRL', self.name, [('2026-09-10', 9), ('2026-09-11', 10)])

    def get_economic_indicators(self):
        return {}


class MarketDataTest(unittest.TestCase):
    def test_router_falls_back_without_interrupting(self):
        router = MarketDataRouter({'b3': [FakeProvider('primary', True), FakeProvider('fallback')]})
        rows, missing = router.latest('b3', ['PETR4'])
        self.assertFalse(missing)
        self.assertEqual(rows['PETR4'].source, 'fallback')
        self.assertEqual([row['status'] for row in router.diagnostics], ['error', 'ok'])

    def test_metrics_return_finite_values_and_beta(self):
        prices = [(f'2026-01-{day:02d}', 100 + day + (day % 3)) for day in range(1, 29)]
        benchmark = [(date, 90 + index) for index, (date, _) in enumerate(prices, 1)]
        result = metrics(prices, benchmark, benchmark)
        self.assertGreater(result['observations'], 20)
        self.assertIsInstance(result['volatility'], float)
        self.assertIsInstance(result['sharpe'], float)
        self.assertIsInstance(result['beta'], float)


if __name__ == '__main__':
    unittest.main()
