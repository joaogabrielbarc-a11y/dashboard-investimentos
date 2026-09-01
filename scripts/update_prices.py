from __future__ import annotations

import json
import math
import unicodedata
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from io import BytesIO
from pathlib import Path
from urllib.parse import quote
from zoneinfo import ZoneInfo

import pandas as pd
import requests

ROOT = Path(__file__).resolve().parents[1]
PRICE_OUTS = [ROOT / 'docs' / 'prices.json', ROOT / 'web-v1' / 'prices.json']
INDEX_OUTS = [ROOT / 'docs' / 'market-indexes.json', ROOT / 'web-v1' / 'market-indexes.json']
FUND_OUTS = [ROOT / 'docs' / 'fund-prices.json', ROOT / 'web-v1' / 'fund-prices.json']

# Ativos que precisam estar disponíveis no site estático mesmo quando o Yahoo bloqueia CORS no navegador.
BR = [
    'CPFE3','BBSE3','BBAS3','PETR4','SAPR4','ISAE4','VALE3','ITSA4','WIZC3',
    'TAEE11','CMIG4','ITUB4','BBDC3','FIQE3','BRBI11','GGRC11','XPML11','GARE11',
    'HGCR11','LVBI11','TRXF11'
]
US = [
    'VOO','VTV','AVUV','VEA','AVDV','VWO','AVES','TFLO',
    'NU',
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; dashboard-investimentos/2.1; +https://github.com/joaogabrielbarc-a11y/dashboard-investimentos)'
}


def clean(v):
    try:
        x = float(v)
        return x if math.isfinite(x) else None
    except Exception:
        return None


def yahoo_market_quote(symbol: str, market_tz: str):
    """Return the most recent regular-market price, falling back to latest daily close."""
    url = f'https://query1.finance.yahoo.com/v8/finance/chart/{quote(symbol, safe="")}?range=10d&interval=1d&includePrePost=false'
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        r.raise_for_status()
        result = ((r.json().get('chart') or {}).get('result') or [None])[0]
        if not result:
            return None

        meta = result.get('meta') or {}
        live = clean(meta.get('regularMarketPrice'))
        live_ts = clean(meta.get('regularMarketTime'))
        if live is not None and live > 0:
            if live_ts:
                date = datetime.fromtimestamp(live_ts, ZoneInfo(market_tz)).date().isoformat()
            else:
                date = datetime.now(ZoneInfo(market_tz)).date().isoformat()
            return date, live

        timestamps = result.get('timestamp') or []
        closes = ((((result.get('indicators') or {}).get('quote') or [{}])[0]).get('close') or [])
        chosen = None
        for ts, px in zip(timestamps, closes):
            px = clean(px)
            if px is None:
                continue
            date = datetime.fromtimestamp(ts, ZoneInfo(market_tz)).date().isoformat()
            chosen = (date, px)
        return chosen
    except Exception as exc:
        print(f'Yahoo warning {symbol}: {exc}')
        return None


def norm(s):
    s = unicodedata.normalize('NFD', str(s or ''))
    return ''.join(c for c in s if unicodedata.category(c) != 'Mn').strip().lower()


def write_json(path: Path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
    print('wrote', path)


def treasury_prices():
    url = 'https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/precotaxatesourodireto.csv'
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    raw = BytesIO(r.content)
    df = None
    for enc in ('latin1', 'utf-8'):
        try:
            raw.seek(0)
            candidate = pd.read_csv(raw, sep=';', encoding=enc, decimal=',', thousands='.')
            if len(candidate.columns) > 3:
                df = candidate
                break
        except Exception:
            pass
    if df is None:
        return {}

    cols = {norm(c): c for c in df.columns}
    type_col = next((cols[k] for k in cols if 'tipo titulo' in k), None)
    mat_col = next((cols[k] for k in cols if 'vencimento' in k), None)
    date_col = next((cols[k] for k in cols if 'data base' in k), None)
    pu_col = next((cols[k] for k in cols if 'pu base manha' in k), None) or next((cols[k] for k in cols if 'pu venda manha' in k), None)
    if not all((type_col, mat_col, date_col, pu_col)):
        return {}

    df['_date'] = pd.to_datetime(df[date_col], dayfirst=True, errors='coerce')
    today = pd.Timestamp(datetime.now(ZoneInfo('America/Sao_Paulo')).date())
    df = df[df['_date'] <= today]
    if df.empty:
        return {}
    latest = df['_date'].max()
    df = df[df['_date'] == latest]

    out = {}
    for _, row in df.iterrows():
        typ = str(row[type_col]).strip()
        mat = pd.to_datetime(row[mat_col], dayfirst=True, errors='coerce')
        px = clean(row[pu_col])
        if not typ or pd.isna(mat) or px is None:
            continue
        year = int(mat.year)
        t = norm(typ)
        if 'renda' in t:
            key = f'TESOURO RENDA+ {year - 19}'
        elif 'educa' in t:
            key = f'TESOURO EDUCA+ {year - 5}'
        elif 'ipca' in t:
            key = f'TESOURO IPCA+ {year}'
        elif 'selic' in t:
            key = f'TESOURO SELIC {year}'
        elif 'prefixado' in t:
            key = f'TESOURO PREFIXADO {year}'
        else:
            key = f'{typ.upper()} {year}'
        out[key] = {
            'priceNative': px, 'priceBRL': px, 'currency': 'BRL',
            'date': latest.date().isoformat(), 'source': 'Tesouro Transparente',
            'maturity': mat.date().isoformat(), 'titleType': typ,
        }
    return out


def bcb_last(series, n=1):
    url = f'https://api.bcb.gov.br/dados/serie/bcdata.sgs.{series}/dados/ultimos/{n}?formato=json'
    r = requests.get(url, headers=HEADERS, timeout=20)
    r.raise_for_status()
    data = r.json()
    out = []
    for x in data:
        value = clean(str(x.get('valor', '')).replace(',', '.'))
        if value is not None:
            out.append({'date': x.get('data'), 'value': value})
    return out


def market_indexes():
    out = {
        'updatedAt': datetime.now(ZoneInfo('America/Sao_Paulo')).isoformat(),
        'source': 'Banco Central do Brasil', 'indexes': {}
    }
    try:
        cdi = bcb_last(12, 1)[-1]
        annual = ((1 + cdi['value'] / 100) ** 252 - 1) * 100
        out['indexes']['CDI'] = {'annualPct': annual, 'dailyPct': cdi['value'], 'date': cdi['date'], 'series': 12}
    except Exception as exc:
        print('CDI warning:', exc)
    try:
        sel = bcb_last(11, 1)[-1]
        annual = ((1 + sel['value'] / 100) ** 252 - 1) * 100
        out['indexes']['SELIC'] = {'annualPct': annual, 'dailyPct': sel['value'], 'date': sel['date'], 'series': 11}
    except Exception as exc:
        print('Selic warning:', exc)
    try:
        vals = bcb_last(433, 12)
        factor = 1.0
        for x in vals:
            factor *= 1 + x['value'] / 100
        last = vals[-1]
        out['indexes']['IPCA'] = {'annualPct': (factor - 1) * 100, 'lastMonthlyPct': last['value'], 'date': last['date'], 'series': 433}
    except Exception as exc:
        print('IPCA warning:', exc)
    return out


def digits(s):
    return ''.join(c for c in str(s or '') if c.isdigit())


def cvm_fund_prices():
    now = datetime.now(ZoneInfo('America/Sao_Paulo'))
    months = []
    for back in range(3):
        y, m = now.year, now.month - back
        while m <= 0:
            y -= 1
            m += 12
        months.append(f'{y}{m:02d}')

    blob = None
    ym = None
    for candidate in months:
        url = f'https://dados.cvm.gov.br/dados/FI/DOC/INF_DIARIO/DADOS/inf_diario_fi_{candidate}.zip'
        try:
            r = requests.get(url, headers=HEADERS, timeout=25)
            if r.ok and len(r.content) > 1000:
                blob, ym = r.content, candidate
                break
        except Exception as exc:
            print(f'CVM {candidate} warning:', exc)
    if blob is None:
        return {'updatedAt': now.isoformat(), 'source': 'CVM Informe Diário', 'month': None, 'funds': {}}

    with zipfile.ZipFile(BytesIO(blob)) as z:
        names = [n for n in z.namelist() if n.lower().endswith('.csv')]
        if not names:
            return {'updatedAt': now.isoformat(), 'source': 'CVM Informe Diário', 'month': ym, 'funds': {}}
        with z.open(names[0]) as f:
            df = pd.read_csv(f, sep=';', encoding='utf-8', low_memory=False)

    cnpj_col = next((c for c in ('CNPJ_FUNDO_CLASSE', 'CNPJ_FUNDO') if c in df.columns), None)
    date_col = next((c for c in ('DT_COMPTC', 'DT_COMPTC_FUNDO') if c in df.columns), None)
    quota_col = next((c for c in ('VL_QUOTA', 'VL_COTA') if c in df.columns), None)
    if not all((cnpj_col, date_col, quota_col)):
        return {'updatedAt': now.isoformat(), 'source': 'CVM Informe Diário', 'month': ym, 'funds': {}}

    df['_date'] = pd.to_datetime(df[date_col], errors='coerce')
    df['_quota'] = pd.to_numeric(df[quota_col], errors='coerce')
    df = df.dropna(subset=['_date', '_quota'])
    df = df[df['_date'] <= pd.Timestamp(now.date())]
    if df.empty:
        return {'updatedAt': now.isoformat(), 'source': 'CVM Informe Diário', 'month': ym, 'funds': {}}

    latest = df['_date'].max()
    df = df[df['_date'] == latest]
    funds = {}
    for _, row in df.iterrows():
        key = digits(row[cnpj_col])
        px = clean(row['_quota'])
        if len(key) >= 14 and px is not None:
            funds[key] = {'priceNative': px, 'priceBRL': px, 'currency': 'BRL', 'date': latest.date().isoformat(), 'source': 'CVM Informe Diário'}
    return {'updatedAt': now.isoformat(), 'source': 'CVM Informe Diário', 'month': ym, 'funds': funds}


def market_quotes():
    specs = {'BRL=X': ('BRL=X', 'America/Sao_Paulo')}
    specs.update({t: (t + '.SA', 'America/Sao_Paulo') for t in BR})
    specs.update({t: (t, 'America/New_York') for t in US})
    specs['BTCUSD'] = ('BTC-USD', 'America/Sao_Paulo')

    out = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(yahoo_market_quote, sym, tz): key for key, (sym, tz) in specs.items()}
        for future in as_completed(futures):
            key = futures[future]
            try:
                out[key] = future.result()
            except Exception as exc:
                print('quote warning', key, exc)
    return out


def main():
    quotes = market_quotes()
    fx_rec = quotes.get('BRL=X')
    fx = fx_rec[1] if fx_rec else None
    prices = {}

    for ticker in BR:
        rec = quotes.get(ticker)
        if rec:
            prices[ticker] = {'priceNative': rec[1], 'priceBRL': rec[1], 'currency': 'BRL', 'date': rec[0], 'source': 'Yahoo Finance'}
    for ticker in US:
        rec = quotes.get(ticker)
        if rec:
            prices[ticker] = {'priceNative': rec[1], 'priceBRL': rec[1] * fx if fx else None, 'currency': 'USD', 'date': rec[0], 'source': 'Yahoo Finance'}
    btc = quotes.get('BTCUSD')
    if btc:
        prices['BTCUSD'] = {'priceNative': btc[1], 'priceBRL': btc[1] * fx if fx else None, 'currency': 'USD', 'date': btc[0], 'source': 'Yahoo Finance'}

    try:
        prices.update(treasury_prices())
    except Exception as exc:
        print('Treasury warning:', exc)

    for out_path in PRICE_OUTS:
        old = {}
        if out_path.exists():
            try:
                old = json.loads(out_path.read_text(encoding='utf-8'))
            except Exception:
                pass
        merged = dict(old.get('prices') or {})
        merged.update({k: v for k, v in prices.items() if v.get('priceBRL') is not None or v.get('priceNative') is not None})
        write_json(out_path, {
            'updatedAt': datetime.now(ZoneInfo('America/Sao_Paulo')).isoformat(),
            'fxUsdBrl': fx,
            'prices': merged,
        })

    indexes = market_indexes()
    for out_path in INDEX_OUTS:
        write_json(out_path, indexes)

    try:
        funds = cvm_fund_prices()
    except Exception as exc:
        print('CVM warning:', exc)
        funds = {'updatedAt': datetime.now(ZoneInfo('America/Sao_Paulo')).isoformat(), 'source': 'CVM Informe Diário', 'month': None, 'funds': {}}
    for out_path in FUND_OUTS:
        write_json(out_path, funds)


if __name__ == '__main__':
    main()
