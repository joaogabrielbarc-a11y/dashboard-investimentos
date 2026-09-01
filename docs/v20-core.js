const V20_UI_KEY='carteira-v20-ui';
const V20_MODEL_VERSION='20.0';
let v20Ui=(()=>{try{const x=JSON.parse(localStorage.getItem(V20_UI_KEY)||'null');return x&&typeof x==='object'?{historyCollapsed:x.historyCollapsed||{},showAllProjection:!!x.showAllProjection}: {historyCollapsed:{},showAllProjection:false};}catch(e){return {historyCollapsed:{},showAllProjection:false};}})();
let v20EditingPendingId=null;
let v20IndexCache={};
let v20FundCache={};

function saveV20Ui(){localStorage.setItem(V20_UI_KEY,JSON.stringify(v20Ui));}
function digitsV20(s){return String(s||'').replace(/\D/g,'');}
function normV20(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();}
function isInternationalV20(className){return ['ETFs Internacionais','Stocks','REITs'].includes(className);}
function isBrazilExchangeV20(className){return ['Ações','Fundos Imobiliários','Fiagros','BDRs','ETFs Nacionais'].includes(className);}
function isMarketClassV20(className){return !['Renda Fixa','Tesouro Direto'].includes(className);}
function activeClassNamesV20(){return state.assets.map(a=>a.name);}
function ensureLaunchClassV20(name){
  if(state.assets.some(a=>a.name===name))return;
  const id=(typeof safeId==='function'?safeId(name):name.toLowerCase().replace(/\W+/g,'-'))+'-'+Date.now().toString(36).slice(-4);
  state.assets.push({id,name,current:0,target:0});state.aportes[id]=0;save();
}
function classOptionsV20(selected){
  const names=[...new Set([...activeClassNamesV20(),'Renda Fixa','Tesouro Direto'])];
  return names.map(n=>`<option value="${escapeAttr(n)}" ${n===selected?'selected':''}>${escapeHtml(n)}</option>`).join('');
}
function segmentsForClassV20(className){
  try{return ensureSegmentPlanV18(className).map(s=>s.name);}catch(e){return [];}
}
function treasuryTitlesV20(){
  const keys=Object.keys(typeof v17PriceCache!=='undefined'?v17PriceCache:{}).filter(k=>k.startsWith('TESOURO '));
  return keys.sort((a,b)=>a.localeCompare(b,'pt-BR'));
}
function tickerKeyV20(t){return String(t||'').trim().toUpperCase();}
function yahooSymbolV20(ticker,className){
  let t=tickerKeyV20(ticker);if(!t)return null;
  if(isBrazilExchangeV20(className))return t.endsWith('.SA')?t:t+'.SA';
  if(isInternationalV20(className))return t;
  if(className==='Criptomoedas'){
    if(t==='BTCUSD')return 'BTC-USD';if(t.endsWith('-USD'))return t;if(t.endsWith('USD')&&t.length>3)return t.slice(0,-3)+'-USD';return t+'-USD';
  }
  if(className==='Moedas'){
    const aliases={'USD/BRL':'BRL=X','USDBRL':'BRL=X','DOLAR':'BRL=X','DÓLAR':'BRL=X','EUR/BRL':'EURBRL=X','EURBRL':'EURBRL=X','GBP/BRL':'GBPBRL=X','GBPBRL':'GBPBRL=X'};
    if(aliases[t])return aliases[t];if(t.endsWith('=X'))return t;if(t.includes('/'))return t.replace('/','')+'=X';if(/^[A-Z]{6}$/.test(t))return t+'=X';return t;
  }
  if(className==='Índices'){
    const aliases={'IBOV':'^BVSP','IBOVESPA':'^BVSP','SP500':'^GSPC','S&P500':'^GSPC','NASDAQ':'^IXIC','DOW':'^DJI'};return aliases[t]||t;
  }
  if(className==='Commodities'){
    const aliases={'OURO':'GC=F','GOLD':'GC=F','PRATA':'SI=F','SILVER':'SI=F','WTI':'CL=F','PETROLEO':'CL=F','PETRÓLEO':'CL=F','BRENT':'BZ=F'};return aliases[t]||t;
  }
  return t;
}
function fxUsdBrlV20(){
  for(const rec of Object.values(typeof v17PriceCache!=='undefined'?v17PriceCache:{})){if(rec&&rec.currency==='USD'&&Number.isFinite(+rec.priceNative)&&+rec.priceNative>0&&Number.isFinite(+rec.priceBRL))return +rec.priceBRL/+rec.priceNative;}
  return typeof globalFxV19==='function'?globalFxV19():null;
}
async function fetchYahooV20(ticker,className){
  const symbol=yahooSymbolV20(ticker,className);if(!symbol)return null;
  try{
    const r=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=7d&interval=1d`,{mode:'cors',cache:'no-store'});if(!r.ok)return null;
    const j=await r.json(),res=j?.chart?.result?.[0],meta=res?.meta||{},ts=res?.timestamp||[],cl=res?.indicators?.quote?.[0]?.close||[],today=new Date().toISOString().slice(0,10);let chosen=null;
    for(let i=0;i<ts.length;i++){const d=new Date(ts[i]*1000).toISOString().slice(0,10);if(d<today&&Number.isFinite(+cl[i]))chosen={price:+cl[i],date:d};}
    if(!chosen)return null;const cur=String(meta.currency||'').toUpperCase()||((isInternationalV20(className)||className==='Criptomoedas')?'USD':'BRL');
    return {ticker:tickerKeyV20(ticker),name:meta.longName||meta.shortName||tickerKeyV20(ticker),price:chosen.price,date:chosen.date,currency:cur,source:'Yahoo Finance'};
  }catch(e){return null;}
}
async function lookupQuoteV20(ticker,className){
  const key=tickerKeyV20(ticker),existing=typeof holdingByTickerV19==='function'?holdingByTickerV19(key):null;
  if(className==='Tesouro Direto'){
    const rec=(typeof v17PriceCache!=='undefined'?v17PriceCache:{} )[key];return rec?{ticker:key,name:key,price:+rec.priceNative,date:rec.date,currency:'BRL',source:rec.source||'Tesouro Transparente'}:null;
  }
  if(className==='Fundos de Investimentos'){
    const rec=v20FundCache[digitsV20(key)];return rec?{ticker:key,name:existing?.name||key,price:+rec.priceNative,date:rec.date,currency:'BRL',source:rec.source||'CVM Informe Diário'}:null;
  }
  const rec=(typeof v17PriceCache!=='undefined'?v17PriceCache:{} )[key];
  if(rec)return {ticker:key,name:existing?.name||key,price:+rec.priceNative,date:rec.date,currency:rec.currency||'BRL',source:rec.source||'cotação'};
  if(existing&&Number.isFinite(+existing.currentPriceNative))return {ticker:key,name:existing.name||key,price:+existing.currentPriceNative,date:existing.priceDate,currency:existing.currentCurrency||'BRL',source:existing.priceSource||'cotação'};
  return await fetchYahooV20(key,className);
}
function titleSourceV20(className){
  if(className==='Tesouro Direto')return 'Tesouro Transparente';if(className==='Fundos de Investimentos')return 'CVM Informe Diário';if(className==='Renda Fixa')return 'Indexador / BCB';if(className==='Outros')return 'Manual';return 'Yahoo Finance';
}
function pricingCoverageV20(className){
  if(isBrazilExchangeV20(className))return 'Fechamento automático B3/Yahoo';
  if(isInternationalV20(className))return 'Fechamento automático pelo ticker internacional';
  if(className==='Criptomoedas')return 'Cotação automática em USD e conversão BRL';
  if(className==='Tesouro Direto')return 'Preço oficial diário do Tesouro Transparente';
  if(className==='Renda Fixa')return 'Valor atualizado estimado pelo indexador BCB';
  if(className==='Fundos de Investimentos')return 'Cota diária CVM por CNPJ';
  if(['Moedas','Índices','Commodities'].includes(className))return 'Cotação automática quando houver símbolo Yahoo compatível';
  return 'Preço manual / fonte específica';
}
async function loadExtraMarketDataV20(){
  try{const r=await fetch(`market-indexes.json?v=${Date.now()}`,{cache:'no-store'});if(r.ok){const j=await r.json();v20IndexCache=j?.indexes||{};}}catch(e){}
  try{const r=await fetch(`fund-prices.json?v=${Date.now()}`,{cache:'no-store'});if(r.ok){const j=await r.json();v20FundCache=j?.funds||{};}}catch(e){}
  applySpecialPricesV20();save();render();
}
function rfAnnualRateV20(meta){
  if(!meta)return null;const idx=String(meta.indexer||'').toUpperCase(),rate=Math.max(0,+meta.rate||0);
  if(idx==='PREFIXADO')return rate/100;
  if(idx==='IPCA'){
    const ipca=(+v20IndexCache.IPCA?.annualPct||0)/100;return (1+ipca)*(1+rate/100)-1;
  }
  if(idx==='CDI'||idx==='SELIC'){
    const base=(+v20IndexCache[idx]?.annualPct||0)/100;const factor=rate?rate/100:1;return base*factor;
  }
  return rate?rate/100:null;
}
function applyFixedIncomeV20(h){
  const m=h?.fixedIncomeMeta;if(!m)return;const principal=Math.max(0,+m.principal||+h.avgPriceBRL||+h.avgPriceNative||0),start=new Date(m.date||m.transactionDate||Date.now()),now=new Date(),days=Math.max(0,(now-start)/86400000),annual=rfAnnualRateV20(m);if(!principal||!Number.isFinite(annual))return;
  const current=principal*Math.pow(1+annual,days/365);h.qty=1;h.currentPriceNative=current;h.currentPriceBRL=current;h.currentCurrency='BRL';h.value=current;h.price=current;h.priceDate=new Date().toISOString().slice(0,10);h.priceSource='Estimativa por indexador BCB';
}
function applyFundPriceV20(h){
  if(h.className!=='Fundos de Investimentos')return;const rec=v20FundCache[digitsV20(h.ticker)];if(!rec)return;h.currentPriceNative=+rec.priceNative;h.currentPriceBRL=+rec.priceBRL;h.currentCurrency='BRL';h.priceDate=rec.date;h.priceSource=rec.source;h.value=Math.max(0,+h.qty||0)*(+rec.priceBRL||0);h.price=+rec.priceBRL;
}
function applySpecialPricesV20(){state.holdings.forEach(h=>{if(h.className==='Renda Fixa')applyFixedIncomeV20(h);if(h.className==='Fundos de Investimentos')applyFundPriceV20(h);});}
