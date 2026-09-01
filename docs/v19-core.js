const V19_UI_KEY='carteira-v19-ui';
const V19_MODEL_VERSION='19.0';
let v19Ui=loadV19Ui();
let v19EditingPendingId=null;

function loadV19Ui(){
  let x=null;try{x=JSON.parse(localStorage.getItem(V19_UI_KEY)||'null')}catch(e){}
  return x&&typeof x==='object'?{collapsed:x.collapsed||{}}:{collapsed:{}};
}
function saveV19Ui(){localStorage.setItem(V19_UI_KEY,JSON.stringify(v19Ui));}
function toggleClassV19(className){v19Ui.collapsed[className]=!v19Ui.collapsed[className];saveV19Ui();render();}
function tickerV19(t){return typeof tickerKeyV17==='function'?tickerKeyV17(t):String(t||'').trim().toUpperCase();}
function holdingByTickerV19(ticker){const key=tickerV19(ticker);return state.holdings.find(h=>tickerV19(h.ticker)===key)||null;}
function currentFxForHoldingV19(h){
  if(!h)return null;
  if((h.avgCurrency||h.currentCurrency)==='BRL')return 1;
  if(Number.isFinite(+h.avgPriceBRL)&&Number.isFinite(+h.avgPriceNative)&&+h.avgPriceNative>0)return +h.avgPriceBRL/+h.avgPriceNative;
  if(Number.isFinite(+h.currentPriceBRL)&&Number.isFinite(+h.currentPriceNative)&&+h.currentPriceNative>0)return +h.currentPriceBRL/+h.currentPriceNative;
  const rec=typeof v17PriceCache!=='undefined'?v17PriceCache[tickerV19(h.ticker)]:null;
  if(rec&&Number.isFinite(+rec.priceBRL)&&Number.isFinite(+rec.priceNative)&&+rec.priceNative>0)return +rec.priceBRL/+rec.priceNative;
  return null;
}
function unitCostBRLV19(h){
  if(!h)return null;
  if(Number.isFinite(+h.avgPriceBRL)&&+h.avgPriceBRL>=0)return +h.avgPriceBRL;
  if(!Number.isFinite(+h.avgPriceNative))return null;
  if((h.avgCurrency||'BRL')==='BRL')return +h.avgPriceNative;
  const fx=currentFxForHoldingV19(h);return Number.isFinite(fx)?+h.avgPriceNative*fx:null;
}
function investedValueV19(h){const u=unitCostBRLV19(h);return Number.isFinite(u)?Math.max(0,+h.qty||0)*u:null;}
function performanceV19(h){
  const current=Math.max(0,+h?.value||0),invested=investedValueV19(h),estimated=!(Number.isFinite(+h?.avgPriceBRL))&&(h?.avgCurrency==='USD');
  const nativePct=Number.isFinite(+h?.avgPriceNative)&&+h.avgPriceNative>0&&Number.isFinite(+h?.currentPriceNative)?((+h.currentPriceNative/+h.avgPriceNative)-1)*100:null;
  const delta=Number.isFinite(invested)?current-invested:null,pctValue=Number.isFinite(invested)&&invested>0?delta/invested*100:null;
  return {current,invested,delta,pct:Number.isFinite(nativePct)?nativePct:pctValue,estimated};
}
function classPerformanceV19(className){
  const items=holdingsForClassV18(className),current=items.reduce((s,h)=>s+Math.max(0,+h.value||0),0);let invested=0,known=true,estimated=false;
  items.forEach(h=>{const p=performanceV19(h);if(Number.isFinite(p.invested))invested+=p.invested;else known=false;if(p.estimated)estimated=true;});
  const delta=known?current-invested:null,pctValue=known&&invested>0?delta/invested*100:null;return {current,invested:known?invested:null,delta,pct:pctValue,estimated};
}
function portfolioPerformanceV19(){
  const current=state.holdings.reduce((s,h)=>s+Math.max(0,+h.value||0),0);let invested=0,known=true,estimated=false;
  state.holdings.filter(h=>(+h.qty||0)>1e-10).forEach(h=>{const p=performanceV19(h);if(Number.isFinite(p.invested))invested+=p.invested;else known=false;if(p.estimated)estimated=true;});
  const delta=known?current-invested:null,pctValue=known&&invested>0?delta/invested*100:null;return {current,invested:known?invested:null,delta,pct:pctValue,estimated};
}
function variationClassV19(v){return !Number.isFinite(v)?'neutral':v>0?'positive':v<0?'negative':'neutral';}
function signedMoneyV19(v){if(!Number.isFinite(v))return '—';return `${v>=0?'+':''}${fmt.format(v)}`;}
function signedPctV19(v){if(!Number.isFinite(v))return '—';return `${v>=0?'+':''}${pct(v)}`;}

function pendingSegmentV19(t){
  const raw=String(t?.segment||'').trim();if(raw)return raw;
  const h=holdingByTickerV19(t?.ticker);return String(h?.segment||'Sem segmento').trim()||'Sem segmento';
}
function projectedSegmentsV19(className){
  const items=holdingsForClassV18(className),currentTotal=classTotalV18(className),band=classBandV18(className)/100,plan=ensureSegmentPlanV18(className),map=new Map();
  plan.forEach(s=>map.set(normSegmentV18(s.name),{name:s.name,target:Math.max(0,+s.target||0),currentValue:0,delta:0}));
  items.forEach(h=>{const name=String(h.segment||'Sem segmento').trim()||'Sem segmento',key=normSegmentV18(name);if(!map.has(key))map.set(key,{name,target:0,currentValue:0,delta:0});map.get(key).currentValue+=Math.max(0,+h.value||0);});
  let classDelta=0;
  (v14?.pending||[]).filter(t=>t.className===className&&Number.isFinite(txBrl(t))).forEach(t=>{const name=pendingSegmentV19(t),key=normSegmentV18(name),d=(t.side==='Compra'?1:-1)*txBrl(t);if(!map.has(key))map.set(key,{name,target:0,currentValue:0,delta:0});map.get(key).delta+=d;classDelta+=d;});
  const postTotal=Math.max(0,currentTotal+classDelta);
  return [...map.values()].map(r=>{const postValue=Math.max(0,r.currentValue+r.delta),current=currentTotal?r.currentValue/currentTotal*100:0,post=postTotal?postValue/postTotal*100:0,min=Math.max(0,r.target*(1-band)),max=r.target*(1+band),status=r.target<=0?'Sem meta':post<min?'Abaixo':post<=max?'Na banda':'Acima';return {...r,current,post,postValue,min,max,status,canBuy:r.target>0&&post<=max+1e-9};});
}
function projectedClassTotalV19(className){const current=classTotalV18(className),delta=(v14?.pending||[]).filter(t=>t.className===className&&Number.isFinite(txBrl(t))).reduce((s,t)=>s+(t.side==='Compra'?1:-1)*txBrl(t),0);return Math.max(0,current+delta);}
function projectedClassHasActivityV19(className){return (v14?.pending||[]).some(t=>t.className===className);}

function latestPriceForTickerV19(ticker,className){
  const key=tickerV19(ticker),h=holdingByTickerV19(key),rec=typeof v17PriceCache!=='undefined'?v17PriceCache[key]:null;
  if(rec&&Number.isFinite(+rec.priceNative))return {price:+rec.priceNative,currency:rec.currency||'BRL',date:rec.date||null,source:rec.source||'cotação'};
  if(h){const native=Number.isFinite(+h.currentPriceNative)?+h.currentPriceNative:+h.currentPriceBRL,currency=Number.isFinite(+h.currentPriceNative)?(h.currentCurrency||priceCurrencyV17(h)):'BRL';if(Number.isFinite(native))return {price:native,currency,date:h.priceDate||null,source:h.priceSource||'cotação'};}
  return null;
}
function fxForTickerV19(ticker){const h=holdingByTickerV19(ticker),rec=typeof v17PriceCache!=='undefined'?v17PriceCache[tickerV19(ticker)]:null;if(rec&&Number.isFinite(+rec.priceBRL)&&Number.isFinite(+rec.priceNative)&&+rec.priceNative>0)return +rec.priceBRL/+rec.priceNative;return currentFxForHoldingV19(h);}
async function yahooLookupV19(ticker,className){
  const key=tickerV19(ticker);if(!key||className==='Tesouro Direto')return null;
  const fake={ticker:key,className},symbol=typeof yahooSymbolV17==='function'?yahooSymbolV17(fake):null;if(!symbol)return null;
  try{
    const r=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=7d&interval=1d`,{mode:'cors'});if(!r.ok)return null;
    const j=await r.json(),res=j?.chart?.result?.[0],meta=res?.meta||{},ts=res?.timestamp||[],cl=res?.indicators?.quote?.[0]?.close||[],today=new Date().toISOString().slice(0,10);let chosen=null;
    for(let i=0;i<ts.length;i++){const d=new Date(ts[i]*1000).toISOString().slice(0,10);if(d<today&&Number.isFinite(+cl[i]))chosen={price:+cl[i],date:d};}
    return {name:meta.longName||meta.shortName||key,price:chosen?.price??null,date:chosen?.date??null,currency:String(meta.currency||'').toUpperCase()||((v17InternationalClasses?.has(className))?'USD':'BRL')};
  }catch(e){return null;}
}
