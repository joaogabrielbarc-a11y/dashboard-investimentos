from __future__ import annotations
import json, math, unicodedata
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pandas as pd
import requests
import yfinance as yf

ROOT=Path(__file__).resolve().parents[1]
OUTS=[ROOT/'docs'/'prices.json',ROOT/'web-v1'/'prices.json']

BR=['CPFE3','BBSE3','BBAS3','PETR4','SAPR4','ISAE4','VALE3','ITSA4','WIZC3','TAEE11','CMIG4','ITUB4','BBDC3','FIQE3','BRBI11','GGRC11','XPML11','GARE11','HGCR11','LVBI11','TRXF11']
US=['VOO','AVUV','VEA','TFLO']

def clean(v):
    try:
        x=float(v); return x if math.isfinite(x) else None
    except Exception:return None

def previous_close(symbol,market_tz):
    hist=yf.Ticker(symbol).history(period='10d',interval='1d',auto_adjust=False)
    if hist is None or hist.empty or 'Close' not in hist:return None
    today=datetime.now(ZoneInfo(market_tz)).date();chosen=None
    for idx,row in hist.iterrows():
        try:d=idx.tz_convert(market_tz).date() if getattr(idx,'tzinfo',None) else idx.date()
        except Exception:d=idx.date()
        px=clean(row['Close'])
        if d<today and px is not None:chosen=(d.isoformat(),px)
    return chosen

def norm(s):
    s=unicodedata.normalize('NFD',str(s or ''))
    return ''.join(c for c in s if unicodedata.category(c)!='Mn').strip().lower()

def treasury_prices():
    url='https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/precotaxatesourodireto.csv'
    r=requests.get(url,timeout=45);r.raise_for_status()
    from io import BytesIO
    raw=BytesIO(r.content);df=None
    for enc in ('latin1','utf-8'):
        try:
            raw.seek(0);candidate=pd.read_csv(raw,sep=';',encoding=enc,decimal=',',thousands='.')
            if len(candidate.columns)>3:df=candidate;break
        except Exception:pass
    if df is None:return {}
    cols={norm(c):c for c in df.columns}
    type_col=next((cols[k] for k in cols if 'tipo titulo' in k),None);mat_col=next((cols[k] for k in cols if 'vencimento' in k),None);date_col=next((cols[k] for k in cols if 'data base' in k),None);pu_col=next((cols[k] for k in cols if 'pu base manha' in k),None) or next((cols[k] for k in cols if 'pu venda manha' in k),None)
    if not all((type_col,mat_col,date_col,pu_col)):return {}
    df['_date']=pd.to_datetime(df[date_col],dayfirst=True,errors='coerce');today=pd.Timestamp(datetime.now(ZoneInfo('America/Sao_Paulo')).date());df=df[df['_date']<today]
    if df.empty:return {}
    latest=df['_date'].max();df=df[df['_date']==latest];out={}
    for _,row in df.iterrows():
        typ=str(row[type_col]).strip();mat=pd.to_datetime(row[mat_col],dayfirst=True,errors='coerce');px=clean(row[pu_col])
        if not typ or pd.isna(mat) or px is None:continue
        year=int(mat.year);t=norm(typ)
        # No RendA+, a carteira identifica o título pelo ano de início da renda.
        # O CSV oficial identifica o vencimento final, 19 anos após esse início.
        if 'renda' in t:key=f'TESOURO RENDA+ {year-19}'
        elif 'ipca' in t:key=f'TESOURO IPCA+ {year}'
        elif 'selic' in t:key=f'TESOURO SELIC {year}'
        elif 'prefixado' in t:key=f'TESOURO PREFIXADO {year}'
        else:key=f'{typ.upper()} {year}'
        out[key]={'priceNative':px,'priceBRL':px,'currency':'BRL','date':latest.date().isoformat(),'source':'Tesouro Transparente'}
    return out

def main():
    prices={};fx_rec=previous_close('BRL=X','America/Sao_Paulo');fx=fx_rec[1] if fx_rec else None
    for t in BR:
        rec=previous_close(t+'.SA','America/Sao_Paulo')
        if rec:prices[t]={'priceNative':rec[1],'priceBRL':rec[1],'currency':'BRL','date':rec[0],'source':'Yahoo Finance'}
    for t in US:
        rec=previous_close(t,'America/New_York')
        if rec:prices[t]={'priceNative':rec[1],'priceBRL':rec[1]*fx if fx else None,'currency':'USD','date':rec[0],'source':'Yahoo Finance'}
    btc=previous_close('BTC-USD','America/Sao_Paulo')
    if btc:prices['BTCUSD']={'priceNative':btc[1],'priceBRL':btc[1]*fx if fx else None,'currency':'USD','date':btc[0],'source':'Yahoo Finance'}
    try:prices.update(treasury_prices())
    except Exception as e:print('Treasury warning:',e)
    for out in OUTS:
        out.parent.mkdir(parents=True,exist_ok=True);old={}
        if out.exists():
            try:old=json.loads(out.read_text(encoding='utf-8'))
            except Exception:pass
        merged=dict(old.get('prices') or {});merged.update({k:v for k,v in prices.items() if v.get('priceBRL') is not None or v.get('priceNative') is not None})
        payload={'updatedAt':datetime.now(ZoneInfo('America/Sao_Paulo')).isoformat(),'fxUsdBrl':fx,'prices':merged};out.write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8');print('wrote',out,len(merged),'prices')

if __name__=='__main__':main()
