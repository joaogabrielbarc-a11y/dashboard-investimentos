(()=>{
'use strict';
if(window.__PONDERA_QUALITY_V45__)return;

const VERSION='3.6.0',EPS=1e-8;
let timer=null;
const runtimeErrors=[];
const finite=value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value));
const visible=node=>{try{return!!node&&node.getClientRects().length>0&&getComputedStyle(node).display!=='none'&&getComputedStyle(node).visibility!=='hidden';}catch(error){return false;}};
const schedule=(delay=80)=>{clearTimeout(timer);timer=setTimeout(run,delay);};

function hierarchyAudit(){
  window.PonderaAllocationMarketV43?.syncOrder?.();
  const panel=document.getElementById('tabMacroV22'),children=[...(panel?.children||[])],macro=document.getElementById('macroStageV28'),micro=document.querySelector('#tabMacroV22 .allocationHoldingsV23, #tabMacroV22 .holdingsCard'),macroIndex=children.indexOf(macro),microIndex=children.indexOf(micro);
  return{ok:!!panel&&macroIndex>=0&&microIndex>=0&&macroIndex<microIndex,macroIndex,microIndex,macroParent:macro?.parentElement?.id||null,microParent:micro?.parentElement?.id||null};
}

function renderAudit(){
  const panelIds=['tabPatrimonioV22','tabMacroV22','tabMicroV22','tabHistoricoV39','tabProventosV22','tabQuantitativaV37'],visiblePanels=panelIds.map(id=>document.getElementById(id)).filter(visible).map(node=>node.id),ids=[...document.querySelectorAll('[id]')].map(node=>node.id),duplicates=[...new Set(ids.filter((id,index)=>ids.indexOf(id)!==index))],text=document.querySelector('main.shell')?.innerText||'';
  return{ok:document.documentElement.dataset.ponderaRuntimeState==='ready'&&visiblePanels.length===1&&duplicates.length===0&&!/\b(?:NaN|undefined|Infinity)\b/.test(text),runtimeState:document.documentElement.dataset.ponderaRuntimeState||null,visiblePanels,duplicateIds:duplicates,invalidNumericText:/\b(?:NaN|undefined|Infinity)\b/.test(text),portfolioTransition:document.documentElement.dataset.ponderaPortfolioTransition||null};
}

function storageAudit(){
  const repository=window.PonderaLocalPortfolioRepository;
  if(!repository||window.PonderaPlatform?.configured)return{ok:true,mode:window.PonderaPlatform?.configured?'remote':'unavailable'};
  try{return{mode:'local',...repository.auditIntegrity()};}catch(error){return{ok:false,mode:'local',error:String(error?.message||error)};}
}

function allocationAudit(){
  const currentState=typeof state!=='undefined'&&state&&typeof state==='object'?state:{},assets=Array.isArray(currentState.assets)?currentState.assets:[],holdings=Array.isArray(currentState.holdings)?currentState.holdings:[],targets=assets.map(row=>Number(row.target)),values=assets.map(row=>Number(row.current)),holdingValues=holdings.map(row=>Number(row.value)),targetTotal=targets.reduce((sum,value)=>sum+(finite(value)?Math.max(0,value):0),0),currentTotal=values.reduce((sum,value)=>sum+(finite(value)?Math.max(0,value):0),0);
  const finiteTargets=targets.every(finite),finiteValues=values.every(finite),finiteHoldings=holdingValues.every(finite),nonNegative=values.every(value=>!finite(value)||value>=-EPS)&&holdingValues.every(value=>!finite(value)||value>=-EPS);
  return{ok:finiteTargets&&finiteValues&&finiteHoldings&&nonNegative,targetTotal,currentTotal,classes:assets.length,holdings:holdings.length,finiteTargets,finiteValues,finiteHoldings,nonNegative,zeroPortfolioSafe:currentTotal>EPS||assets.every(row=>!finite(row.current)||Number(row.current)>=0)};
}

function financeAudit(){
  try{
    const empty=window.PonderaLocalConsolidation?.build?.([]),repository=window.PonderaLocalPortfolioRepository,summary=repository&&window.PonderaLocalConsolidation&&!window.PonderaPlatform?.configured?window.PonderaLocalConsolidation.build(repository.snapshots()):null,weights=summary?.classAllocation?.map(row=>Number(row.weight))||[],weightTotal=weights.reduce((sum,value)=>sum+(finite(value)?value:0),0),finiteSummary=!summary||[summary.netWorth,summary.receivedIncome,...weights].every(finite),weightsValid=!summary||summary.netWorth<=EPS||Math.abs(weightTotal-100)<.01;
    return{ok:empty?.netWorth===0&&finiteSummary&&weightsValid,emptyConsolidation:empty?.netWorth??null,netWorth:summary?.netWorth??null,classWeightTotal:weightTotal,finiteSummary,weightsValid};
  }catch(error){return{ok:false,error:String(error?.message||error)};}
}

function layoutAudit(){
  const roots=[...document.querySelectorAll('#tabMacroV22>#macroStageV28,#tabMacroV22>.allocationHoldingsV23,#tabMacroV22>.holdingsCard,.platformDialogCardV40')].filter(visible),overflow=roots.filter(node=>node.clientWidth>0&&node.scrollWidth>node.clientWidth+2).map(node=>node.id||node.className),viewportOverflow=document.documentElement.clientWidth>0&&document.documentElement.scrollWidth>document.documentElement.clientWidth+2;
  return{ok:overflow.length===0&&!viewportOverflow,overflow,viewportOverflow,viewportWidth:document.documentElement.clientWidth};
}

function quoteAudit(){const status=window.__PONDERA_QUOTE_STATUS__||null,client=(()=>{try{return JSON.parse(localStorage.getItem('carteira-v17-quote-diagnostics')||'{}')||{};}catch(error){return{};}})(),missing=(client.assets||[]).filter(row=>row.status==='missing').map(row=>row.ticker);return{ok:status?.status!=='error'&&missing.length===0,status:status?.status||'unknown',message:status?.message||null,missing};}

function run(){
  const report={version:VERSION,createdAt:new Date().toISOString(),hierarchy:hierarchyAudit(),rendering:renderAudit(),storage:storageAudit(),allocation:allocationAudit(),finance:financeAudit(),layout:layoutAudit(),quotes:quoteAudit(),runtimeErrors:[...runtimeErrors]};
  report.ok=['hierarchy','rendering','storage','allocation','finance','layout'].every(key=>report[key].ok)&&report.runtimeErrors.length===0;
  window.__PONDERA_QUALITY_AUDIT__=report;document.documentElement.dataset.ponderaQualityAudit=report.ok?'ok':'review';return report;
}

function capture(type,event){const reason=event?.reason||event?.error||event?.message||'Erro não identificado';runtimeErrors.push({type,message:String(reason?.message||reason),at:new Date().toISOString()});if(runtimeErrors.length>20)runtimeErrors.shift();schedule(0);}

function boot(){
  window.addEventListener('error',event=>capture('error',event));window.addEventListener('unhandledrejection',event=>capture('unhandledrejection',event));
  for(const event of ['pondera:contextchange','pondera:tabchange','pondera:historychange','pondera:quote-status','pondera:storageerror'])window.addEventListener(event,()=>schedule(event==='pondera:contextchange'?0:80));
  window.PonderaQualityAuditV45=Object.freeze({version:VERSION,run,get report(){return window.__PONDERA_QUALITY_AUDIT__||null;}});window.__PONDERA_QUALITY_V45__=true;document.documentElement.dataset.ponderaQualityVersion=VERSION;schedule(180);
}

let attempts=0;const wait=()=>{attempts++;if(document.documentElement.dataset.ponderaRuntimeState!=='ready'||!document.getElementById('tabMacroV22')||!window.PonderaAllocationMarketV43){if(attempts<800)setTimeout(wait,25);return;}boot();};wait();
})();
