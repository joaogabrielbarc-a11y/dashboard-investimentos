from __future__ import annotations

import os
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from io import BytesIO
from urllib.parse import quote as urlquote
from zoneinfo import ZoneInfo

import pandas as pd
import requests

from .base import BaseMarketDataProvider, HistoricalSeries, ProviderError, Quote

HEADERS = {'User-Agent': 'Pondera/4.4 market-data collector (+https://github.com/joaogabrielbarc-a11y/dashboard-investimentos)'}
SAO_PAULO = ZoneInfo('America/Sao_Paulo')


def _number(value):
    try:
        result = float(str(value).replace(',', '.'))
        return result if pd.notna(result) else None
    except (TypeError, ValueError):
        return None


def _iso(timestamp, timezone='America/Sao_Paulo'):
    return datetime.fromtimestamp(float(timestamp), ZoneInfo(timezone)).date().isoformat()


class YahooFinanceProvider(BaseMarketDataProvider):
    """No-key adapter used for listed assets; never called from the browser."""

    name = 'Yahoo Finance'

    def __init__(self, session=None):
        self.session = session or requests.Session()
        self.last_errors = {}

    def _chart(self, symbol, timeframe='10d', events='div,splits', timezone='America/Sao_Paulo'):
        errors = []
        for host in ('query1.finance.yahoo.com', 'query2.finance.yahoo.com'):
            try:
                url = f'https://{host}/v8/finance/chart/{urlquote(symbol, safe="")}'
                response = self.session.get(url, params={
                    'range': timeframe, 'interval': '1d', 'events': events,
                    'includeAdjustedClose': 'true', 'includePrePost': 'false',
                }, headers=HEADERS, timeout=20)
                response.raise_for_status()
                result = ((response.json().get('chart') or {}).get('result') or [None])[0]
                if result:
                    return result
            except Exception as exc:
                errors.append(f'{host}: {exc}')
        raise ProviderError(f'{symbol}: ' + (' | '.join(errors[-2:]) or 'sem dados'))

    def get_latest_prices(self, tickers):
        output = {}
        self.last_errors = {}
        def fetch_one(ticker):
            symbol = ticker['symbol'] if isinstance(ticker, dict) else str(ticker)
            key = ticker.get('ticker', symbol) if isinstance(ticker, dict) else symbol
            timezone = ticker.get('timezone', 'America/Sao_Paulo') if isinstance(ticker, dict) else 'America/Sao_Paulo'
            result = self._chart(symbol, '10d', timezone=timezone)
            meta = result.get('meta') or {}
            price = _number(meta.get('regularMarketPrice'))
            timestamp = meta.get('regularMarketTime')
            if not price:
                timestamps = result.get('timestamp') or []
                closes = (((result.get('indicators') or {}).get('quote') or [{}])[0]).get('close') or []
                valid = [(ts, _number(px)) for ts, px in zip(timestamps, closes) if _number(px)]
                if not valid:
                    raise ProviderError(f'{symbol}: cotação vazia')
                timestamp, price = valid[-1]
            return key, Quote(key, price, ticker.get('currency', 'BRL') if isinstance(ticker, dict) else 'BRL', _iso(timestamp, timezone), self.name, {'symbol': symbol})
        with ThreadPoolExecutor(max_workers=8) as pool:
            futures = {pool.submit(fetch_one, ticker): (ticker.get('ticker') if isinstance(ticker, dict) else str(ticker)) for ticker in tickers}
            for future in as_completed(futures):
                try:
                    key, row = future.result()
                    output[key] = row
                except Exception as exc:
                    self.last_errors[futures[future]] = str(exc)
        return output

    def get_historical_data(self, ticker, timeframe='5y'):
        spec = ticker if isinstance(ticker, dict) else {'ticker': str(ticker), 'symbol': str(ticker)}
        result = self._chart(spec['symbol'], timeframe, timezone=spec.get('timezone', 'America/Sao_Paulo'))
        timestamps = result.get('timestamp') or []
        indicators = result.get('indicators') or {}
        adjusted = ((indicators.get('adjclose') or [{}])[0]).get('adjclose') or []
        closes = adjusted or ((indicators.get('quote') or [{}])[0]).get('close') or []
        prices = [(_iso(ts, spec.get('timezone', 'America/Sao_Paulo')), px) for ts, raw in zip(timestamps, closes) if (px := _number(raw)) and px > 0]
        events = result.get('events') or {}
        dividends = sorted((_iso(ts, spec.get('timezone', 'America/Sao_Paulo')), value) for ts, row in (events.get('dividends') or {}).items() if (value := _number(row.get('amount'))) is not None)
        splits = sorted((_iso(ts, spec.get('timezone', 'America/Sao_Paulo')), value) for ts, row in (events.get('splits') or {}).items() if (value := _number(row.get('splitRatio') or row.get('numerator'))) is not None)
        if not prices:
            raise ProviderError(f"{spec['symbol']}: histórico vazio")
        return HistoricalSeries(spec['ticker'], spec.get('currency', 'BRL'), self.name, prices, dividends, splits, bool(adjusted))

    def get_economic_indicators(self):
        return {}


class BcbSgsProvider(BaseMarketDataProvider):
    name = 'Banco Central do Brasil - SGS'
    SERIES = {'SELIC': 11, 'CDI': 12, 'IPCA': 433}

    def __init__(self, session=None):
        self.session = session or requests.Session()

    def _range(self, series, start, end):
        response = self.session.get(
            f'https://api.bcb.gov.br/dados/serie/bcdata.sgs.{series}/dados',
            params={'formato': 'json', 'dataInicial': start, 'dataFinal': end},
            headers=HEADERS, timeout=25,
        )
        response.raise_for_status()
        return [{'date': datetime.strptime(row['data'], '%d/%m/%Y').date().isoformat(), 'value': _number(row['valor'])} for row in response.json() if _number(row.get('valor')) is not None]

    def get_latest_prices(self, tickers):
        return {}

    def get_historical_data(self, ticker, timeframe='5y'):
        key = str(ticker).upper()
        if key not in self.SERIES:
            raise ProviderError(f'Série SGS desconhecida: {ticker}')
        years = int(str(timeframe).rstrip('y')) if str(timeframe).endswith('y') else 5
        end = datetime.now(SAO_PAULO).date()
        start = end.replace(year=end.year - years)
        rows = self._range(self.SERIES[key], start.strftime('%d/%m/%Y'), end.strftime('%d/%m/%Y'))
        return HistoricalSeries(key, 'PCT', self.name, [(row['date'], row['value']) for row in rows], adjusted=False)

    def get_economic_indicators(self):
        end = datetime.now(SAO_PAULO).date()
        result = {}
        for key, series in self.SERIES.items():
            start = (end.replace(day=1) if key != 'IPCA' else end.replace(year=end.year - 1))
            rows = self._range(series, start.strftime('%d/%m/%Y'), end.strftime('%d/%m/%Y'))
            if rows:
                result[key] = {'series': series, 'date': rows[-1]['date'], 'observations': rows}
        return result


class TesouroTransparenteProvider(BaseMarketDataProvider):
    name = 'Tesouro Transparente'
    URL = 'https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/precotaxatesourodireto.csv'

    def __init__(self, session=None):
        self.session = session or requests.Session()
        self._frame = None

    def _data(self):
        if self._frame is not None:
            return self._frame
        response = self.session.get(self.URL, headers=HEADERS, timeout=30)
        response.raise_for_status()
        for encoding in ('latin1', 'utf-8'):
            try:
                frame = pd.read_csv(BytesIO(response.content), sep=';', encoding=encoding, decimal=',', thousands='.')
                if len(frame.columns) > 3:
                    self._frame = frame
                    return frame
            except Exception:
                continue
        raise ProviderError('CSV do Tesouro Transparente inválido')

    @staticmethod
    def _columns(frame):
        normalized = {str(c).lower().replace('í', 'i').replace('ç', 'c').replace('ã', 'a'): c for c in frame.columns}
        find = lambda text: next((value for key, value in normalized.items() if text in key), None)
        return find('tipo titulo'), find('data vencimento') or find('vencimento'), find('data base'), find('pu base manha') or find('pu venda manha')

    @staticmethod
    def _key(kind, maturity):
        text = str(kind).strip().upper()
        year = int(maturity.year)
        if 'RENDA' in text:
            return f'TESOURO RENDA+ {year - 19}'
        if 'EDUCA' in text:
            return f'TESOURO EDUCA+ {year - 5}'
        if 'IPCA' in text:
            return f'TESOURO IPCA+ {year}'
        if 'SELIC' in text:
            return f'TESOURO SELIC {year}'
        if 'PREFIXADO' in text:
            return f'TESOURO PREFIXADO {year}'
        return f'{text} {year}'

    def _normalized(self):
        frame = self._data().copy()
        type_col, maturity_col, date_col, price_col = self._columns(frame)
        if not all((type_col, maturity_col, date_col, price_col)):
            raise ProviderError('Colunas obrigatórias ausentes no Tesouro Transparente')
        frame['_date'] = pd.to_datetime(frame[date_col], dayfirst=True, errors='coerce')
        frame['_maturity'] = pd.to_datetime(frame[maturity_col], dayfirst=True, errors='coerce')
        frame['_price'] = pd.to_numeric(frame[price_col], errors='coerce')
        frame = frame.dropna(subset=['_date', '_maturity', '_price'])
        frame['_ticker'] = frame.apply(lambda row: self._key(row[type_col], row['_maturity']), axis=1)
        return frame, type_col

    def get_latest_prices(self, tickers=None):
        frame, type_col = self._normalized()
        latest = frame['_date'].max()
        selected = frame[frame['_date'] == latest]
        wanted = {str(x).upper() for x in (tickers or [])}
        output = {}
        for _, row in selected.iterrows():
            key = row['_ticker']
            if wanted and key not in wanted:
                continue
            output[key] = Quote(key, float(row['_price']), 'BRL', latest.date().isoformat(), self.name, {'maturity': row['_maturity'].date().isoformat(), 'titleType': str(row[type_col])})
        return output

    def get_historical_data(self, ticker, timeframe='5y'):
        frame, _ = self._normalized()
        selected = frame[frame['_ticker'] == str(ticker).upper()].sort_values('_date')
        if selected.empty:
            raise ProviderError(f'{ticker}: título não encontrado')
        years = int(str(timeframe).rstrip('y')) if str(timeframe).endswith('y') else 5
        cutoff = pd.Timestamp(datetime.now(SAO_PAULO).date()) - pd.DateOffset(years=years)
        selected = selected[selected['_date'] >= cutoff]
        return HistoricalSeries(str(ticker).upper(), 'BRL', self.name, [(row['_date'].date().isoformat(), float(row['_price'])) for _, row in selected.iterrows()])

    def get_economic_indicators(self):
        return {}


class CvmFundProvider(BaseMarketDataProvider):
    name = 'CVM Informe Diário'

    def __init__(self, session=None):
        self.session = session or requests.Session()

    @staticmethod
    def _digits(value):
        return ''.join(c for c in str(value or '') if c.isdigit())

    def _month(self, year_month):
        url = f'https://dados.cvm.gov.br/dados/FI/DOC/INF_DIARIO/DADOS/inf_diario_fi_{year_month}.zip'
        response = self.session.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        with zipfile.ZipFile(BytesIO(response.content)) as archive:
            name = next((item for item in archive.namelist() if item.lower().endswith('.csv')), None)
            if not name:
                raise ProviderError(f'CVM {year_month}: ZIP sem CSV')
            with archive.open(name) as file:
                return pd.read_csv(file, sep=';', encoding='utf-8', low_memory=False)

    @staticmethod
    def _columns(frame):
        return (next((c for c in ('CNPJ_FUNDO_CLASSE', 'CNPJ_FUNDO') if c in frame.columns), None), next((c for c in ('DT_COMPTC', 'DT_COMPTC_FUNDO') if c in frame.columns), None), next((c for c in ('VL_QUOTA', 'VL_COTA') if c in frame.columns), None))

    def get_latest_prices(self, tickers):
        now = datetime.now(SAO_PAULO)
        frame = None
        for back in range(2):
            serial = now.year * 12 + now.month - 1 - back
            year, month = divmod(serial, 12)
            try:
                frame = self._month(f'{year}{month + 1:02d}')
                break
            except Exception:
                continue
        if frame is None:
            raise ProviderError('CVM: informes dos dois meses mais recentes indisponíveis')
        cnpj_col, date_col, quota_col = self._columns(frame)
        wanted = {self._digits(item) for item in tickers}
        frame['_cnpj'] = frame[cnpj_col].map(self._digits)
        frame['_date'] = pd.to_datetime(frame[date_col], errors='coerce')
        frame['_price'] = pd.to_numeric(frame[quota_col], errors='coerce')
        selected = frame[frame['_cnpj'].isin(wanted)].dropna(subset=['_date', '_price']).sort_values('_date').groupby('_cnpj').tail(1)
        return {row['_cnpj']: Quote(row['_cnpj'], float(row['_price']), 'BRL', row['_date'].date().isoformat(), self.name) for _, row in selected.iterrows()}

    def get_historical_data(self, ticker, timeframe='5y'):
        target = self._digits(ticker)
        years = int(str(timeframe).rstrip('y')) if str(timeframe).endswith('y') else 5
        now = datetime.now(SAO_PAULO)
        months = [(now.year * 12 + now.month - 1 - back) for back in range(years * 12)]
        prices = []
        for serial in reversed(months):
            year, month = divmod(serial, 12)
            month += 1
            try:
                frame = self._month(f'{year}{month:02d}')
                cnpj_col, date_col, quota_col = self._columns(frame)
                mask = frame[cnpj_col].map(self._digits) == target
                for _, row in frame[mask].iterrows():
                    date = pd.to_datetime(row[date_col], errors='coerce')
                    value = _number(row[quota_col])
                    if pd.notna(date) and value:
                        prices.append((date.date().isoformat(), value))
            except Exception:
                continue
        if not prices:
            raise ProviderError(f'{target}: histórico CVM indisponível')
        return HistoricalSeries(target, 'BRL', self.name, sorted(dict(prices).items()))

    def get_economic_indicators(self):
        return {}


class BrapiProvider(BaseMarketDataProvider):
    """Paid-ready adapter. It becomes active only when BRAPI_TOKEN is configured."""
    name = 'brapi'

    def __init__(self, token=None, session=None):
        self.token = token or os.getenv('BRAPI_TOKEN')
        self.session = session or requests.Session()

    def _request(self, path, params=None):
        if not self.token:
            raise ProviderError('BRAPI_TOKEN não configurado')
        response = self.session.get('https://brapi.dev/api' + path, params={**(params or {}), 'token': self.token}, headers=HEADERS, timeout=25)
        response.raise_for_status()
        return response.json()

    def get_latest_prices(self, tickers):
        symbols = [(t.get('ticker') if isinstance(t, dict) else str(t)).upper() for t in tickers]
        data = self._request('/quote/' + ','.join(symbols))
        return {row['symbol']: Quote(row['symbol'], float(row['regularMarketPrice']), row.get('currency') or 'BRL', datetime.fromtimestamp(row.get('regularMarketTime') or datetime.now().timestamp(), SAO_PAULO).date().isoformat(), self.name) for row in data.get('results', []) if _number(row.get('regularMarketPrice'))}

    def get_historical_data(self, ticker, timeframe='5y'):
        data = self._request('/quote/' + str(ticker), {'range': timeframe, 'interval': '1d'})
        result = (data.get('results') or [{}])[0]
        prices = [(datetime.fromtimestamp(row['date'], SAO_PAULO).date().isoformat(), float(row.get('adjustedClose') or row['close'])) for row in result.get('historicalDataPrice', []) if _number(row.get('adjustedClose') or row.get('close'))]
        return HistoricalSeries(str(ticker).upper(), result.get('currency') or 'BRL', self.name, prices)

    def get_economic_indicators(self):
        return {}


class Up2DataProvider(BaseMarketDataProvider):
    """Contract placeholder: endpoint/auth are injected without changing the router."""
    name = 'B3 UP2DATA'

    def __init__(self, endpoint=None, token=None, session=None):
        self.endpoint = endpoint or os.getenv('UP2DATA_ENDPOINT')
        self.token = token or os.getenv('UP2DATA_TOKEN')
        self.session = session or requests.Session()

    def _unconfigured(self):
        raise ProviderError('UP2DATA_ENDPOINT/UP2DATA_TOKEN não configurados')

    def get_latest_prices(self, tickers):
        self._unconfigured()

    def get_historical_data(self, ticker, timeframe='5y'):
        self._unconfigured()

    def get_economic_indicators(self):
        self._unconfigured()
