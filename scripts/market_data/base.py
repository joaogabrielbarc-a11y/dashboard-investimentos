from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


class ProviderError(RuntimeError):
    """A recoverable provider failure that allows the router to use a fallback."""


@dataclass(slots=True)
class Quote:
    ticker: str
    price_native: float
    currency: str
    date: str
    source: str
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class HistoricalSeries:
    ticker: str
    currency: str
    source: str
    prices: list[tuple[str, float]]
    dividends: list[tuple[str, float]] = field(default_factory=list)
    splits: list[tuple[str, float]] = field(default_factory=list)
    adjusted: bool = True


class BaseMarketDataProvider(ABC):
    """Stable contract implemented by free and future paid data sources."""

    name = 'base'

    @abstractmethod
    def get_latest_prices(self, tickers: list[str]) -> dict[str, Quote]:
        raise NotImplementedError

    @abstractmethod
    def get_historical_data(self, ticker: str, timeframe: str = '5y') -> HistoricalSeries:
        raise NotImplementedError

    @abstractmethod
    def get_economic_indicators(self) -> dict[str, Any]:
        raise NotImplementedError

    # Aliases document the public DataProvider contract requested by the product.
    def getLatestPrices(self, tickers: list[str]):  # noqa: N802
        return self.get_latest_prices(tickers)

    def getHistoricalData(self, ticker: str, timeframe: str = '5y'):  # noqa: N802
        return self.get_historical_data(ticker, timeframe)

    def getEconomicIndicators(self):  # noqa: N802
        return self.get_economic_indicators()
