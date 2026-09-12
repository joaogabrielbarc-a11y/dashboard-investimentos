from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from market_data.metrics import metrics

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs' / 'quant-market-history.json'
OUTPUTS = [ROOT / 'docs' / 'quant-validation.json', ROOT / 'web-v1' / 'quant-validation.json']


def main():
    payload = json.loads(SOURCE.read_text(encoding='utf-8'))
    prices = payload.get('prices') or {}
    benchmarks = payload.get('benchmarks') or {}
    cdi = benchmarks.get('CDI') or []
    representative = next((ticker for ticker in ('BOVA11', 'IVVB11', 'PETR4', 'VOO') if len(prices.get(ticker) or []) >= 30), None)
    result = metrics(prices.get(representative) or [], cdi, benchmarks.get('IBOV') or []) if representative else {}
    checks = {
        'schemaVersion2': payload.get('schemaVersion') == 2,
        'fiveYearWindow': payload.get('period') == '5y',
        'minimumHistory': bool(representative and len(prices[representative]) >= 30),
        'benchmarks': all(len(benchmarks.get(key) or []) >= 30 for key in ('IBOV', 'IFIX', 'SP500', 'CDI')),
        'finiteVolatility': isinstance(result.get('volatility'), (int, float)),
        'finiteSharpe': isinstance(result.get('sharpe'), (int, float)),
        'finiteBeta': isinstance(result.get('beta'), (int, float)),
    }
    report = {
        'updatedAt': datetime.now(ZoneInfo('America/Sao_Paulo')).isoformat(),
        'status': 'ok' if all(checks.values()) else 'review',
        'representativeTicker': representative,
        'checks': checks,
        'metrics': result,
        'coverage': {'assets': len(prices), 'benchmarks': len(benchmarks)},
    }
    for path in OUTPUTS:
        path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if report['status'] != 'ok' and '--strict' in sys.argv:
        raise SystemExit(2)


if __name__ == '__main__':
    main()
