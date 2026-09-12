from __future__ import annotations

import math


def returns(prices):
    output = []
    previous = None
    for date, value in sorted(prices):
        value = float(value)
        if previous and previous > 0:
            output.append((date, value / previous - 1))
        previous = value
    return output


def _aligned(left, right):
    right_map = dict(right)
    return [(value, right_map[date]) for date, value in left if date in right_map]


def sample_std(values):
    if len(values) < 2:
        return None
    mean = sum(values) / len(values)
    return math.sqrt(sum((value - mean) ** 2 for value in values) / (len(values) - 1))


def metrics(price_rows, risk_free_prices=None, benchmark_prices=None):
    asset = returns(price_rows)
    values = [value for _, value in asset]
    if len(values) < 2:
        return {'observations': len(values), 'volatility': None, 'sharpe': None, 'sortino': None, 'beta': None}
    rf_returns = returns(risk_free_prices or [])
    rf_map = dict(rf_returns)
    excess = [value - rf_map.get(date, 0.0) for date, value in asset]
    volatility = sample_std(values) * math.sqrt(252)
    excess_std = sample_std(excess)
    downside = math.sqrt(sum(min(value, 0) ** 2 for value in excess) / len(excess))
    beta = None
    if benchmark_prices:
        pairs = _aligned(asset, returns(benchmark_prices))
        if len(pairs) >= 20:
            xs, ys = zip(*pairs)
            mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
            variance = sum((value - my) ** 2 for value in ys)
            beta = sum((x - mx) * (y - my) for x, y in pairs) / variance if variance else None
    return {
        'observations': len(values),
        'volatility': volatility,
        'sharpe': (sum(excess) / len(excess)) / excess_std * math.sqrt(252) if excess_std else None,
        'sortino': (sum(excess) / len(excess)) / downside * math.sqrt(252) if downside else None,
        'beta': beta,
    }
