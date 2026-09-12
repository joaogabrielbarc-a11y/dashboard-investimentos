(()=>{
'use strict';
if(window.PonderaFinance)return;

const EPS=1e-10;
const finite=value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value));
const number=value=>finite(value)?Number(value):null;
const ticker=value=>{const normalized=String(value||'').trim().toUpperCase();return normalized==='BTC'?'BTCUSD':normalized;};
const assetClass=value=>String(value||'').trim().toLowerCase()==='tesouro reserva'?'Tesouro Direto':String(value||'Sem classe').trim();
const iso=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||'').slice(0,10))?String(value).slice(0,10):null;
const kind=value=>{const normalized=String(value||'').trim().toLowerCase();if(['compra','buy'].includes(normalized))return'buy';if(['venda','sell'].includes(normalized))return'sell';if(['provento','dividend'].includes(normalized))return'dividend';return'adjustment';};
const accountKey=transaction=>`${transaction.portfolioId||'legacy'}::${transaction.ticker}`;

function normalizeTransaction(raw,index=0){
  const normalizedKind=kind(raw.kind||raw.operationType||raw.side||raw.type);
  const quantity=Math.max(0,number(raw.quantity??raw.qty)??0);
  const unitPrice=Math.max(0,number(raw.unit_price??raw.unitPrice)??0);
  const currency=String(raw.currency||'BRL').toUpperCase();
  const nativeTotal=number(raw.native_total??raw.nativeTotal??raw.totalNative)??(quantity*unitPrice);
  const fxRate=number(raw.fx_rate??raw.fxRate??raw.fx);
  const baseTotal=number(raw.base_total??raw.baseTotal??raw.brlTotal)??(currency==='BRL'?nativeTotal:(finite(fxRate)?nativeTotal*fxRate:null));
  return{
    id:String(raw.client_id||raw.clientId||raw.id||`tx-${index}`),
    databaseId:raw.id&&raw.client_id?raw.id:null,
    portfolioId:String(raw.portfolio_id||raw.portfolioId||'legacy'),
    userId:raw.user_id||raw.userId||null,
    kind:normalizedKind,
    ticker:ticker(raw.ticker),
    name:String(raw.asset_name||raw.name||raw.ticker||'').trim(),
    className:assetClass(raw.class_name||raw.className),
    segment:String(raw.segment_name||raw.segment||'Sem segmento').trim(),
    date:iso(raw.trade_date||raw.date),
    quantity,
    unitPrice,
    currency,
    nativeTotal,
    fxRate,
    baseTotal,
    feesNative:Math.max(0,number(raw.fees_native??raw.feesNative??raw.otherCostsNative)??0),
    source:String(raw.source||'dashboard'),
    metadata:raw.metadata&&typeof raw.metadata==='object'?raw.metadata:{}
  };
}

function feeInBase(transaction){
  if(transaction.currency==='BRL')return transaction.feesNative;
  return finite(transaction.fxRate)?transaction.feesNative*transaction.fxRate:0;
}

function buildLedger(rawTransactions,{prices={}}={}){
  const transactions=(rawTransactions||[]).map(normalizeTransaction).filter(row=>row.date&&row.ticker).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
  const accounts=new Map(),warnings=[],dividends=[];
  for(const transaction of transactions){
    if(transaction.kind==='dividend'){dividends.push(transaction);continue;}
    if(!['buy','sell'].includes(transaction.kind))continue;
    const key=accountKey(transaction);
    let account=accounts.get(key);
    if(!account){account={key,portfolioId:transaction.portfolioId,ticker:transaction.ticker,name:transaction.name,className:transaction.className,segment:transaction.segment,currency:transaction.currency,quantity:0,costBase:0,realizedGain:0,matchedSaleQuantity:0,lastUnitBase:null,lastTransactionDate:null};accounts.set(key,account);}
    account.name=transaction.name||account.name;
    account.className=transaction.className||account.className;
    account.segment=transaction.segment||account.segment;
    account.currency=transaction.currency||account.currency;
    const quantity=transaction.quantity,feeBase=feeInBase(transaction);
    const grossBase=finite(transaction.baseTotal)?Number(transaction.baseTotal):null;
    const unitBase=quantity>EPS&&finite(grossBase)?grossBase/quantity:null;
    if(finite(unitBase)){account.lastUnitBase=unitBase;account.lastTransactionDate=transaction.date;}
    if(transaction.kind==='buy'){
      account.quantity+=quantity;
      if(finite(grossBase))account.costBase+=grossBase+feeBase;
      else warnings.push({type:'unknown-cost',portfolioId:account.portfolioId,ticker:account.ticker,date:transaction.date,quantity});
      continue;
    }
    const before=account.quantity,matched=Math.min(before,quantity),averageCost=before>EPS?account.costBase/before:0,costRemoved=averageCost*matched;
    if(matched>EPS&&finite(grossBase)){
      const matchedProceeds=(grossBase-feeBase)*(matched/quantity);
      account.realizedGain+=matchedProceeds-costRemoved;
      account.matchedSaleQuantity+=matched;
    }
    account.quantity=Math.max(0,before-matched);
    account.costBase=Math.max(0,account.costBase-costRemoved);
    if(quantity>matched+EPS)warnings.push({type:'unmatched-sale',portfolioId:account.portfolioId,ticker:account.ticker,date:transaction.date,quantity:quantity-matched});
  }

  const holdings=[];
  for(const account of accounts.values()){
    if(account.quantity<=EPS)continue;
    const priceRecord=prices[account.key]||prices[account.ticker]||{},currentPriceBase=number(priceRecord.priceBase??priceRecord.priceBRL)??account.lastUnitBase??0;
    const currentValue=account.quantity*currentPriceBase,averagePriceBase=account.quantity>EPS?account.costBase/account.quantity:null;
    holdings.push({...account,currentPriceBase,currentValue,averagePriceBase,unrealizedGain:finite(averagePriceBase)?currentValue-account.costBase:null});
  }
  const currentValue=holdings.reduce((sum,row)=>sum+row.currentValue,0),openCost=holdings.reduce((sum,row)=>sum+row.costBase,0),realizedGain=[...accounts.values()].reduce((sum,row)=>sum+row.realizedGain,0),receivedIncome=dividends.filter(row=>row.date<=new Date().toISOString().slice(0,10)&&finite(row.baseTotal)).reduce((sum,row)=>sum+row.baseTotal,0);
  return{transactions,accounts,holdings,dividends,warnings,currentValue,openCost,realizedGain,unrealizedGain:currentValue-openCost,receivedIncome,totalProfit:currentValue-openCost+realizedGain+receivedIncome};
}

function aggregateHoldings(holdings){
  const grouped=new Map();
  for(const holding of holdings||[]){const key=[holding.ticker,holding.className,holding.segment].join('::'),row=grouped.get(key)||{ticker:holding.ticker,name:holding.name,className:holding.className,segment:holding.segment,quantity:0,costBase:0,currentValue:0,portfolioIds:new Set()};row.quantity+=holding.quantity;row.costBase+=holding.costBase;row.currentValue+=holding.currentValue;row.portfolioIds.add(holding.portfolioId);grouped.set(key,row);}
  return[...grouped.values()].map(row=>({...row,portfolioIds:[...row.portfolioIds],averagePriceBase:row.quantity>EPS?row.costBase/row.quantity:null,currentPriceBase:row.quantity>EPS?row.currentValue/row.quantity:null,unrealizedGain:row.currentValue-row.costBase}));
}

function allocationBy(holdings,field='className'){
  const total=(holdings||[]).reduce((sum,row)=>sum+Math.max(0,row.currentValue||0),0),map=new Map();
  for(const holding of holdings||[]){const key=holding[field]||`Sem ${field==='className'?'classe':'segmento'}`;map.set(key,(map.get(key)||0)+Math.max(0,holding.currentValue||0));}
  return[...map.entries()].map(([name,value])=>({name,value,weight:total>EPS?value/total*100:0})).sort((a,b)=>b.value-a.value);
}

function portfolioSnapshots(portfolios,transactions,options={}){
  return(portfolios||[]).map(portfolio=>{const ledger=buildLedger((transactions||[]).filter(row=>String(row.portfolio_id||row.portfolioId)===String(portfolio.id)),options);return{portfolio,ledger,netWorth:ledger.currentValue,income:ledger.receivedIncome,classAllocation:allocationBy(ledger.holdings,'className'),segmentAllocation:allocationBy(ledger.holdings,'segment')};});
}

function consolidate(portfolios,transactions,options={}){
  const included=(portfolios||[]).filter(portfolio=>portfolio.include_in_consolidated??portfolio.includeInConsolidated),ids=new Set(included.map(portfolio=>String(portfolio.id))),ledger=buildLedger((transactions||[]).filter(row=>ids.has(String(row.portfolio_id||row.portfolioId))),options);
  return{scope:'consolidated',portfolioIds:[...ids],ledger,holdings:aggregateHoldings(ledger.holdings),netWorth:ledger.currentValue,income:ledger.receivedIncome,classAllocation:allocationBy(ledger.holdings,'className'),segmentAllocation:allocationBy(ledger.holdings,'segment')};
}

function weightedTargets(snapshots,classes){
  const total=(snapshots||[]).reduce((sum,row)=>sum+row.netWorth,0),targets=new Map();
  for(const snapshot of snapshots||[]){const weight=total>EPS?snapshot.netWorth/total:0;for(const item of (classes||[]).filter(row=>String(row.portfolio_id||row.portfolioId)===String(snapshot.portfolio.id))){const name=item.name||'Sem classe';targets.set(name,(targets.get(name)||0)+Number(item.target_pct??item.target??0)*weight);}}
  return[...targets.entries()].map(([name,target])=>({name,target}));
}

window.PonderaFinance=Object.freeze({version:'3.2.0',normalizeTransaction,buildLedger,aggregateHoldings,allocationBy,portfolioSnapshots,consolidate,weightedTargets});
})();
