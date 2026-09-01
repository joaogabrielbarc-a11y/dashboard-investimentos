const V18_KEY='carteira-v18-segment-plan';
const V18_MODEL_VERSION='18.0';
let v18Plan=loadV18Plan();
let v18Search='';

function loadV18Plan(){
  let x=null;try{x=JSON.parse(localStorage.getItem(V18_KEY)||'null')}catch(e){}
  return x&&typeof x==='object'?{segments:x.segments||{},bands:x.bands||{}}:{segments:{},bands:{}};
}
function saveV18Plan(){localStorage.setItem(V18_KEY,JSON.stringify(v18Plan));}
function normSegmentV18(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();}
function segmentIdV18(name){return 'seg-'+normSegmentV18(name).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+Math.random().toString(36).slice(2,6);}
function classBandV18(className){const x=+v18Plan.bands[className];return Number.isFinite(x)?Math.min(100,Math.max(0,x)):Math.min(100,Math.max(0,+state.band||25));}
function holdingsForClassV18(className){return state.holdings.filter(h=>h.className===className&&(+h.qty||0)>1e-10);}
function classTotalV18(className){return holdingsForClassV18(className).reduce((s,h)=>s+Math.max(0,+h.value||0),0);}
function macroWeightV18(className){const total=totalAtual(),a=state.assets.find(x=>x.name===className);return total&&a?(+a.current||0)/total*100:0;}

function ensureSegmentPlanV18(className){
  if(!Array.isArray(v18Plan.segments[className]))v18Plan.segments[className]=[];
  if(!Number.isFinite(+v18Plan.bands[className]))v18Plan.bands[className]=Math.min(100,Math.max(0,+state.band||25));
  const plan=v18Plan.segments[className],items=holdingsForClassV18(className),grouped={};
  items.forEach(h=>{
    const name=(h.segment||'Sem segmento').trim()||'Sem segmento';h.segment=name;
    const key=normSegmentV18(name);if(!grouped[key])grouped[key]={name,target:0,hasTarget:false};
    if(Number.isFinite(+h.microTarget)&&+h.microTarget>=0){grouped[key].target+=+h.microTarget;grouped[key].hasTarget=true;}
  });
  Object.values(grouped).forEach(g=>{if(!plan.some(s=>normSegmentV18(s.name)===normSegmentV18(g.name)))plan.push({id:segmentIdV18(g.name),name:g.name,target:g.hasTarget?Math.min(100,g.target):0});});
  return plan;
}
function ensureAllSegmentsV18(){state.assets.forEach(a=>ensureSegmentPlanV18(a.name));saveV18Plan();}
function segmentRowsV18(className){
  const items=holdingsForClassV18(className),total=classTotalV18(className),band=classBandV18(className)/100;
  return ensureSegmentPlanV18(className).map(seg=>{
    const value=items.filter(h=>normSegmentV18(h.segment)===normSegmentV18(seg.name)).reduce((s,h)=>s+Math.max(0,+h.value||0),0);
    const real=total?value/total*100:0,target=Math.max(0,+seg.target||0),min=Math.max(0,target*(1-band)),max=target*(1+band);
    const status=target<=0?'Sem meta':real<min?'Abaixo':real<=max?'Na banda':'Acima';
    return {...seg,value,real,target,min,max,status,canBuy:target>0&&real<=max+1e-9};
  });
}
function segmentStatusClassV18(status){return status==='Abaixo'?'below':status==='Na banda'?'inside':status==='Acima'?'above':'unset';}
function datePriceV18(h){return h.priceDate?`fech. ${dateBr(h.priceDate)}`:'último preço salvo';}
function currentDisplayV18(h){const native=Number.isFinite(+h.currentPriceNative),currency=native?(h.currentCurrency||priceCurrencyV17(h)):'BRL',value=native?+h.currentPriceNative:+h.currentPriceBRL;return {value,currency};}
