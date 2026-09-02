from __future__ import annotations

import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUTS = [ROOT / 'docs' / 'dividends.json', ROOT / 'web-v1' / 'dividends.json']
TZ = ZoneInfo('America/Sao_Paulo')
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.7,en;q=0.5',
    'Accept': 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
}

BR_STOCKS = [
    'CPFE3','BBSE3','BBAS3','PETR4','SAPR4','ISAE4','VALE3','ITSA4','WIZC3',
    'TAEE11','CMIG4','ITUB4','BBDC3','FIQE3','BRBI11',
]
FIIS = ['GGRC11','XPML11','GARE11','HGCR11','LVBI11','TRXF11']
US_ETFS = ['VOO','VTV','AVUV','VEA','AVDV','VWO','AVES','TFLO']
US_STOCKS = [
    'NU','AAPL','MSFT','NVDA','GOOGL','AMZN','META','JPM','JNJ','XOM','PG','KO','PEP','V','MA',
]

DATE_BR_RE = re.compile(r'^\d{2}/\d{2}/\d{4}$')
ROW_TEXT_RE = re.compile(
    r'(Dividendos?|JSCP|JCP|Rend\.\s*Trib\.?|Rendimento|Amortiza(?:ç|c)[aã]o)\s+'
    r'(\d{2}/\d{2}/\d{4})\s+(\d{2}/\d{2}/\d{4})\s+([0-9.,]+)', re.I
)


def num(value):
    if value is None:
        return None
    s = str(value).strip().replace('R$', '').replace('US$', '').replace('$', '').replace('\xa0', ' ')
    s = re.sub(r'[^0-9,.-]', '', s)
    if not s:
        return None
    if ',' in s and '.' in s:
        if s.rfind(',') > s.rfind('.'):
            s = s.replace('.', '').replace(',', '.')
        else:
            s = s.replace(',', '')
    elif ',' in s:
        s = s.replace('.', '').replace(',', '.')
    try:
        return float(s)
    except Exception:
        return None


def iso_br(s):
    try:
        return datetime.strptime(s.strip(), '%d/%m/%Y').date().isoformat()
    except Exception:
        return None


def iso_us(s):
    if not s:
        return None
    s = str(s).strip()
    for fmt in ('%m/%d/%Y', '%m/%d/%y', '%Y-%m-%d'):
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except Exception:
            pass
    return None


def event_key(e):
    return '|'.join([
        str(e.get('ticker') or ''), str(e.get('type') or ''), str(e.get('exDate') or ''),
        str(e.get('paymentDate') or ''), f"{float(e.get('amount') or 0):.8f}", str(e.get('currency') or '')
    ])


def clean_event(e):
    amount = num(e.get('amount'))
    if not e.get('ticker') or amount is None or amount < 0:
        return None
    return {
        'ticker': str(e['ticker']).upper(),
        'className': str(e.get('className') or ''),
        'type': str(e.get('type') or 'Provento').strip(),
        'exDate': e.get('exDate') or None,
        'paymentDate': e.get('paymentDate') or None,
        'amount': amount,
        'currency': str(e.get('currency') or 'BRL').upper(),
        'source': str(e.get('source') or ''),
        'paymentDateEstimated': bool(e.get('paymentDateEstimated', False)),
    }


def parse_investidor10(ticker: str, kind: str):
    path = 'fiis' if kind == 'fii' else 'acoes'
    class_name = 'Fundos Imobiliários' if kind == 'fii' else 'Ações'
    url = f'https://investidor10.com.br/{path}/{ticker.lower()}/'
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')
        events = []
        for tr in soup.find_all('tr'):
            cells = [' '.join(c.stripped_strings).strip() for c in tr.find_all(['td','th'])]
            if len(cells) < 4:
                continue
            date_positions = [(i, c) for i, c in enumerate(cells) if DATE_BR_RE.match(c)]
            if len(date_positions) < 2:
                continue
            ex_i, ex_s = date_positions[0]
            pay_i, pay_s = date_positions[1]
            amount = None
            for c in reversed(cells[pay_i+1:]):
                amount = num(c)
                if amount is not None:
                    break
            if amount is None:
                continue
            typ = cells[0] if ex_i > 0 else 'Provento'
            e = clean_event({
                'ticker': ticker, 'className': class_name, 'type': typ,
                'exDate': iso_br(ex_s), 'paymentDate': iso_br(pay_s), 'amount': amount,
                'currency': 'BRL', 'source': 'Investidor10'
            })
            if e:
                events.append(e)
        if not events:
            text = ' '.join(soup.stripped_strings)
            for m in ROW_TEXT_RE.finditer(text):
                e = clean_event({
                    'ticker': ticker, 'className': class_name, 'type': m.group(1),
                    'exDate': iso_br(m.group(2)), 'paymentDate': iso_br(m.group(3)),
                    'amount': num(m.group(4)), 'currency': 'BRL', 'source': 'Investidor10'
                })
                if e:
                    events.append(e)
        uniq = {event_key(e): e for e in events}
        print(f'Investidor10 {ticker}: {len(uniq)} eventos')
        return list(uniq.values())
    except Exception as exc:
        print(f'Investidor10 warning {ticker}: {exc}')
        return []


def nasdaq_dividends(ticker: str, assetclass: str):
    url = f'https://api.nasdaq.com/api/quote/{quote(ticker)}/dividends?assetclass={assetclass}'
    headers = dict(HEADERS)
    headers.update({'Accept': 'application/json, text/plain, */*', 'Origin': 'https://www.nasdaq.com', 'Referer': 'https://www.nasdaq.com/'})
    try:
        r = requests.get(url, headers=headers, timeout=20)
        r.raise_for_status()
        rows = (((r.json().get('data') or {}).get('dividends') or {}).get('rows') or [])
        class_name = 'ETFs Internacionais' if assetclass == 'etf' else 'Stocks'
        events = []
        for row in rows:
            amount = num(row.get('amount'))
            if amount is None:
                continue
            ex = iso_us(row.get('exOrEffDate') or row.get('exDate'))
            pay = iso_us(row.get('paymentDate'))
            e = clean_event({
                'ticker': ticker, 'className': class_name, 'type': row.get('type') or 'Dividendos',
                'exDate': ex, 'paymentDate': pay, 'amount': amount, 'currency': 'USD', 'source': 'Nasdaq'
            })
            if e:
                events.append(e)
        uniq = {event_key(e): e for e in events}
        print(f'Nasdaq {ticker}: {len(uniq)} eventos')
        return list(uniq.values())
    except Exception as exc:
        print(f'Nasdaq warning {ticker}: {exc}')
        return []


def yahoo_dividends_fallback(ticker: str, class_name: str):
    start = int(datetime(2021, 1, 1, tzinfo=timezone.utc).timestamp())
    end = int(datetime.now(timezone.utc).timestamp()) + 370 * 86400
    url = f'https://query1.finance.yahoo.com/v8/finance/chart/{quote(ticker)}?period1={start}&period2={end}&interval=1d&events=div%2Csplits'
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        r.raise_for_status()
        result = (((r.json().get('chart') or {}).get('result') or [None])[0] or {})
        events_map = ((result.get('events') or {}).get('dividends') or {})
        out = []
        for item in events_map.values():
            amount = num(item.get('amount'))
            ts = item.get('date')
            if amount is None or not ts:
                continue
            d = datetime.fromtimestamp(int(ts), timezone.utc).date().isoformat()
            e = clean_event({
                'ticker': ticker, 'className': class_name, 'type': 'Dividendos',
                'exDate': d, 'paymentDate': d, 'amount': amount, 'currency': 'USD',
                'source': 'Yahoo Finance (data ex como referência)', 'paymentDateEstimated': True
            })
            if e:
                out.append(e)
        print(f'Yahoo dividend fallback {ticker}: {len(out)} eventos')
        return out
    except Exception as exc:
        print(f'Yahoo dividend warning {ticker}: {exc}')
        return []


def load_old():
    for p in OUTS:
        if p.exists():
            try:
                j = json.loads(p.read_text(encoding='utf-8'))
                if isinstance(j.get('events'), list) and j['events']:
                    return j
            except Exception:
                pass
    return {'events': []}


def write(payload):
    text = json.dumps(payload, ensure_ascii=False, indent=2)
    for p in OUTS:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding='utf-8')
        print('wrote', p)


def main():
    old = load_old()
    fresh = []
    jobs = []
    with ThreadPoolExecutor(max_workers=8) as pool:
        for t in BR_STOCKS:
            jobs.append(pool.submit(parse_investidor10, t, 'stock'))
        for t in FIIS:
            jobs.append(pool.submit(parse_investidor10, t, 'fii'))
        for t in US_ETFS:
            jobs.append(pool.submit(nasdaq_dividends, t, 'etf'))
        for t in US_STOCKS:
            jobs.append(pool.submit(nasdaq_dividends, t, 'stocks'))
        for fut in as_completed(jobs):
            try:
                fresh.extend(fut.result())
            except Exception as exc:
                print('worker warning:', exc)

    fresh_tickers = {e['ticker'] for e in fresh}
    for t in US_ETFS:
        if t not in fresh_tickers:
            fresh.extend(yahoo_dividends_fallback(t, 'ETFs Internacionais'))
    for t in US_STOCKS:
        if t not in fresh_tickers:
            fresh.extend(yahoo_dividends_fallback(t, 'Stocks'))

    merged = {}
    for raw in old.get('events') or []:
        e = clean_event(raw)
        if e:
            merged[event_key(e)] = e
    for e in fresh:
        merged[event_key(e)] = e

    events = list(merged.values())
    events.sort(key=lambda e: (e.get('paymentDate') or e.get('exDate') or '', e.get('ticker') or ''), reverse=True)
    payload = {
        'updatedAt': datetime.now(TZ).isoformat(),
        'sources': ['Investidor10', 'Nasdaq', 'Yahoo Finance fallback'],
        'coverage': {
            'b3Stocks': BR_STOCKS,
            'fiis': FIIS,
            'internationalEtfs': US_ETFS,
            'stocks': US_STOCKS,
        },
        'events': events,
    }
    print('total events:', len(events))
    write(payload)


if __name__ == '__main__':
    main()
