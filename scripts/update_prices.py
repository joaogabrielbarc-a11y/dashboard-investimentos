from __future__ import annotations
import json, math, unicodedata, zipfile
from datetime import datetime
from io import BytesIO
from pathlib import Path
from zoneinfo import ZoneInfo

import pandas as pd
import requests
import yfinance as yf

ROOT=Path(__file__).resolve().parents[1]
PRICE_OUTS=[ROOT/'docs'/'prices.json',ROOT/'web-v1'/'prices.json']
INDEX_OUTS=[ROOT/'docs'/'market-indexes.json',ROOT/'web-v1'/'market-indexes.json']
FUND_OUTS=[ROOT/'docs'/'fund-prices.json',ROOT/'web-v1'/'fund-prices.json']

BR=['CPFE3','BBSE3','BBAS3','PETR4','SAPR4','ISAE4','VALE3','ITSA4','WIZC3','TAEE11','CMIG4','ITUB4','BBDC3','FIQE3','BRBI11','GGRC11','XPML11','GARE11','HGCR11','LVBI11','TRXF11']
US=['VOO','AVUV','VEA','TFLO']
HEADERS={'User-Agent':'Mozilla/5.0 dashboard-investimentos/2.0'}

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

def write_json(path,payload):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
    print('wrote',path)

def treasury_prices():
    url='https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/precotaxatesourodireto.csv'
    r=requests.get(url,headers=HEADERS,timeout=60);r.raise_for_status()
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
        if 'renda' in t:key=f'TESOURO RENDA+ {year-19}'
        elif 'educa' in t:key=f'TESOURO EDUCA+ {year-5}'
        elif 'ipca' in t:key=f'TESOURO IPCA+ {year}'
        elif 'selic' in t:key=f'TESOURO SELIC {year}'
        elif 'prefixado' in t:key=f'TESOURO PREFIXADO {year}'
        else:key=f'{typ.upper()} {year}'
        out[key]={'priceNative':px,'priceBRL':px,'currency':'BRL','date':latest.date().isoformat(),'source':'Tesouro Transparente','maturity':mat.date().isoformat(),'titleType':typ}
    return out

def bcb_last(series,n=1):
    url=f'https://api.bcb.gov.br/dados/serie/bcdata.sgs.{series}/dados/ultimos/{n}?formato=json'
    r=requests.get(url,headers=HEADERS,timeout=30);r.raise_for_status();data=r.json()
    return [{'date':x.get('data'),'value':clean(str(x.get('valor','')).replace(',','.'))} for x in data if clean(str(x.get('valor','')).replace(',','.')) is not None]

def market_indexes():
    out={'updatedAt':datetime.now(ZoneInfo('America/Sao_Paulo')).isoformat(),'source':'Banco Central do Brasil','indexes':{}}
    try:
        cdi=bcb_last(12,1)[-1];daily=cdi['value']/100;annual=((1+daily)**252-1)*100
        out['indexes']['CDI']={'annualPct':annual,'dailyPct':cdi['value'],'date':cdi['date'],'series':12}
    except Exception as e:print('CDI warning:',e)
    try:
        sel=bcb_last(11,1)[-1];daily=sel['value']/100;annual=((1+daily)**252-1)*100
        out['indexes']['SELIC']={'annualPct':annual,'dailyPct':sel['value'],'date':sel['date'],'series':11}
    except Exception as e:print('Selic warning:',e)
    try:
        vals=bcb_last(433,12);factor=1.0
        for x in vals:factor*=1+x['value']/100
        last=vals[-1];out['indexes']['IPCA']={'annualPct':(factor-1)*100,'lastMonthlyPct':last['value'],'date':last['date'],'series':433}
    except Exception as e:print('IPCA warning:',e)
    return out

def digits(s):return ''.join(c for c in str(s or '') if c.isdigit())

def cvm_fund_prices():
    now=datetime.now(ZoneInfo('America/Sao_Paulo'));months=[]
    for back in range(0,3):
        y=now.year;m=now.month-back
        while m<=0:y-=1;m+=12
        months.append(f'{y}{m:02d}')
    blob=None;ym=None
    for candidate in months:
        url=f'https://dados.cvm.gov.br/dados/FI/DOC/INF_DIARIO/DADOS/inf_diario_fi_{candidate}.zip'
        try:
            r=requests.get(url,headers=HEADERS,timeout=90)
            if r.ok and len(r.content)>1000:blob=r.content;ym=candidate;break
        except Exception:pass
    if blob is None:return {'updatedAt':now.isoformat(),'source':'CVM Informe Diário','month':None,'funds':{}}
    with zipfile.ZipFile(BytesIO(blob)) as z:
        names=[n for n in z.namelist() if n.lower().endswith('.csv')]
        if not names:return {'updatedAt':now.isoformat(),'source':'CVM Informe Diário','month':ym,'funds':{}}
        with z.open(names[0]) as f:df=pd.read_csv(f,sep=';',encoding='utf-8',low_memory=False)
    cnpj_col=next((c for c in ('CNPJ_FUNDO_CLASSE','CNPJ_FUNDO') if c in df.columns),None)
    date_col=next((c for c in ('DT_COMPTC','DT_COMPTC_FUNDO') if c in df.columns),None)
    quota_col=next((c for c in ('VL_QUOTA','VL_COTA') if c in df.columns),None)
    if not all((cnpj_col,date_col,quota_col)):return {'updatedAt':now.isoformat(),'source':'CVM Informe Diário','month':ym,'funds':{}}
    df['_date']=pd.to_datetime(df[date_col],errors='coerce');df['_quota']=pd.to_numeric(df[quota_col],errors='coerce');df=df.dropna(subset=['_date','_quota'])
    today=pd.Timestamp(now.date());df=df[df['_date']<today]
    if df.empty:return {'updatedAt':now.isoformat(),'source':'CVM Informe Diário','month':ym,'funds':{}}
    latest=df['_date'].max();df=df[df['_date']==latest]
    funds={}
    for _,row in df.iterrows():
        key=digits(row[cnpj_col]);px=clean(row['_quota'])
        if len(key)>=14 and px is not None:funds[key]={'priceNative':px,'priceBRL':px,'currency':'BRL','date':latest.date().isoformat(),'source':'CVM Informe Diário'}
    return {'updatedAt':now.isoformat(),'source':'CVM Informe Diário','month':ym,'funds':funds}

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
    for out in PRICE_OUTS:
        old={}
        if out.exists():
            try:old=json.loads(out.read_text(encoding='utf-8'))
            except Exception:pass
        merged=dict(old.get('prices') or {});merged.update({k:v for k,v in prices.items() if v.get('priceBRL') is not None or v.get('priceNative') is not None})
        write_json(out,{'updatedAt':datetime.now(ZoneInfo('America/Sao_Paulo')).isoformat(),'fxUsdBrl':fx,'prices':merged})
    indexes=market_indexes()
    for out in INDEX_OUTS:write_json(out,indexes)
    try:funds=cvm_fund_prices()
    except Exception as e:print('CVM warning:',e);funds={'updatedAt':datetime.now(ZoneInfo('America/Sao_Paulo')).isoformat(),'source':'CVM Informe Diário','month':None,'funds':{}}
    for out in FUND_OUTS:write_json(out,funds)

if __name__=='__main__':main()
