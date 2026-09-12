from __future__ import annotations

from collections import defaultdict

from .base import ProviderError


class MarketDataRouter:
    """Routes by asset class and records every fallback attempt."""

    def __init__(self, routes):
        self.routes = routes
        self.diagnostics = []

    def providers_for(self, asset_class):
        return self.routes.get(asset_class) or self.routes.get('default') or []

    def latest(self, asset_class, tickers):
        remaining = list(tickers)
        output = {}
        for provider in self.providers_for(asset_class):
            if not remaining:
                break
            try:
                rows = provider.get_latest_prices(remaining)
                output.update(rows)
                found = set(rows)
                remaining = [item for item in remaining if (item.get('ticker') if isinstance(item, dict) else str(item)) not in found]
                self.diagnostics.append({'operation': 'latest', 'assetClass': asset_class, 'provider': provider.name, 'status': 'ok', 'found': len(rows), 'errors': getattr(provider, 'last_errors', {})})
            except Exception as exc:
                self.diagnostics.append({'operation': 'latest', 'assetClass': asset_class, 'provider': provider.name, 'status': 'error', 'error': str(exc)})
        return output, remaining

    def history(self, asset_class, ticker, timeframe='5y'):
        errors = []
        for provider in self.providers_for(asset_class):
            try:
                series = provider.get_historical_data(ticker, timeframe)
                self.diagnostics.append({'operation': 'history', 'assetClass': asset_class, 'ticker': ticker.get('ticker') if isinstance(ticker, dict) else str(ticker), 'provider': provider.name, 'status': 'ok', 'points': len(series.prices)})
                return series
            except Exception as exc:
                errors.append(f'{provider.name}: {exc}')
                self.diagnostics.append({'operation': 'history', 'assetClass': asset_class, 'ticker': ticker.get('ticker') if isinstance(ticker, dict) else str(ticker), 'provider': provider.name, 'status': 'error', 'error': str(exc)})
        raise ProviderError(' | '.join(errors) or 'nenhum provedor configurado')

    def summary(self):
        grouped = defaultdict(lambda: {'ok': 0, 'error': 0})
        for row in self.diagnostics:
            grouped[row['provider']][row['status']] += 1
        return dict(grouped)
