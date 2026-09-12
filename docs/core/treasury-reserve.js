(()=>{
'use strict';
if(window.PonderaTreasuryReserve)return;

const VERSION='3.4.0';
const TICKER='TESOURO RESERVA';
const START_DATE='2026-05-11';
const DAY=86400000;
const finite=value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value));

function isoDate(value){
  const raw=String(value||'').trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw))return raw;
  const match=raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match?`${match[3]}-${match[2]}-${match[1]}`:null;
}

function isReserve(value){
  return String(value||'').trim().toUpperCase().replace(/\s+/g,' ')===TICKER;
}

function dateNumber(value){
  const iso=isoDate(value);
  return iso?Date.parse(`${iso}T00:00:00Z`):null;
}

function factorBetween(fromDate,toDate,indexRecord={}){
  const from=dateNumber(fromDate),to=dateNumber(toDate);
  if(!finite(from)||!finite(to)||to<=from)return{factor:1,exact:true,observations:0};
  const rates=Array.isArray(indexRecord.dailyRates)?indexRecord.dailyRates:[];
  let factor=1,observations=0,first=null,last=null;
  const coverage=rates.map(row=>dateNumber(row?.date)).filter(finite).sort((a,b)=>a-b);
  for(const row of rates){
    const date=dateNumber(row?.date),value=Number(row?.value);
    if(!finite(date)||!Number.isFinite(value)||date<=from||date>to)continue;
    factor*=1+value/100;observations+=1;first=first||date;last=date;
  }
  const historyStartsBefore=coverage.length&&coverage[0]<=from+4*DAY;
  const historyEndsNearTarget=coverage.length&&coverage[coverage.length-1]>=to-4*DAY;
  if(historyStartsBefore&&historyEndsNearTarget)return{factor,exact:true,observations};
  const annual=Number(indexRecord.annualPct);
  if(!Number.isFinite(annual))return{factor:1,exact:false,observations:0};
  const days=Math.max(0,(to-from)/DAY);
  return{factor:Math.pow(1+annual/100,days/365),exact:false,observations:0};
}

function transactionAmount(row){
  if(finite(row?.brlTotal))return Number(row.brlTotal);
  if(String(row?.currency||'BRL').toUpperCase()==='BRL'&&finite(row?.totalNative))return Number(row.totalNative);
  if(String(row?.currency||'BRL').toUpperCase()==='BRL'&&finite(row?.unitPrice)&&finite(row?.qty))return Number(row.unitPrice)*Number(row.qty);
  return null;
}

function position(transactions,indexRecord={}){
  const valuationDate=isoDate(indexRecord.date)||new Date().toISOString().slice(0,10);
  const rows=(transactions||[]).map((row,index)=>({...row,__index:index})).filter(row=>isReserve(row.ticker)&&isoDate(row.date)&&Number(row.qty)>0).sort((a,b)=>isoDate(a.date).localeCompare(isoDate(b.date))||a.__index-b.__index);
  let quantity=0,value=0,lastDate=null,exact=true;
  for(const row of rows){
    const date=isoDate(row.date);
    if(lastDate){const accrued=factorBetween(lastDate,date,indexRecord);value*=accrued.factor;exact=exact&&accrued.exact;}
    const qty=Math.max(0,Number(row.qty)||0);
    if(row.side==='Venda'){
      const matched=Math.min(quantity,qty);
      if(quantity>0)value*=Math.max(0,(quantity-matched)/quantity);
      quantity=Math.max(0,quantity-matched);
    }else{
      const amount=transactionAmount(row);
      if(finite(amount)){value+=Number(amount);quantity+=qty;}
    }
    lastDate=date;
  }
  if(lastDate){const accrued=factorBetween(lastDate,valuationDate,indexRecord);value*=accrued.factor;exact=exact&&accrued.exact;}
  return{quantity,value,unitPrice:quantity>0?value/quantity:null,date:valuationDate,exact};
}

function applyHolding(holding,transactions,indexRecord){
  if(!holding||!isReserve(holding.ticker)||holding.className!=='Tesouro Direto'||!indexRecord)return false;
  const result=position(transactions,indexRecord);
  if(!(result.quantity>0)&&!(Number(holding.qty)>0))return false;
  const price=result.unitPrice;
  if(!finite(price)||Number(price)<=0)return false;
  holding.currentPriceNative=Number(price);holding.currentPriceBRL=Number(price);holding.currentCurrency='BRL';holding.price=Number(price);holding.value=Math.max(0,Number(holding.qty)||0)*Number(price);holding.priceDate=result.date;holding.priceSource=result.exact?'Banco Central do Brasil • 100% Selic Over':'Estimativa automática • 100% Selic Over vigente';holding.automaticVariation=true;
  return true;
}

window.PonderaTreasuryReserve=Object.freeze({version:VERSION,ticker:TICKER,startDate:START_DATE,isReserve,isoDate,factorBetween,position,applyHolding});
})();
