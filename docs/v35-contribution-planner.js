(()=>{
'use strict';
if(window.__PONDERA_CONTRIBUTION_PLANNER_V35__)return;

const VERSION='2.15.1',EPS=.005;
let updateTimer=null,renderTimer=null;
const finite=value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value));
const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const money=value=>finite(value)&&typeof fmt!=='undefined'?fmt.format(Number(value)):'—';
const pct=(value,digits=1)=>finite(value)?`${Number(value).toFixed(digits).replace('.',',')}%`:'—';
const quantity=value=>Number(value||0).toLocaleString('pt-BR',{maximumFractionDigits:6});
const escapeText=value=>typeof escapeHtml==='function'?escapeHtml(String(value??'')):String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const escapeAttribute=value=>typeof escapeAttr==='function'?escapeAttr(String(value??'')):escapeText(value);
const holdings=()=>Array.isArray(state?.holdings)?state.holdings.filter(holding=>(Number(holding.qty)||0)>1e-10&&(Number(holding.value)||0)>EPS):[];
const pending=()=>typeof v14!=='undefined'&&Array.isArray(v14.pending)?v14.pending:[];

function ensureCss(){
  let link=document.querySelector('link[href^="v35-contribution-planner.css"]');
  if(!link){link=document.createElement('link');link.rel='stylesheet';document.head.appendChild(link);}
  link.href='v35-contribution-planner.css?v=35.1';
}

function currentFx(){
  try{const value=typeof fxUsdBrlV20==='function'?fxUsdBrlV20():null;if(finite(value)&&Number(value)>0)return Number(value);}catch(e){}
  const holding=holdings().find(item=>finite(item.currentPriceBRL)&&finite(item.currentPriceNative)&&Number(item.currentPriceNative)>0);
  return holding?Number(holding.currentPriceBRL)/Number(holding.currentPriceNative):null;
}

function transactionBrl(transaction){
  if(finite(transaction?.brlTotal))return Number(transaction.brlTotal);
  if(String(transaction?.currency||'BRL').toUpperCase()==='BRL'&&finite(transaction?.totalNative))return Number(transaction.totalNative);
  const fx=finite(transaction?.fx)?Number(transaction.fx):currentFx();
  return finite(transaction?.totalNative)&&finite(fx)?Number(transaction.totalNative)*fx:null;
}

function requiredSale(part,whole,upperPct){
  const upper=Math.max(0,Number(upperPct)||0)/100,current=Math.max(0,Number(part)||0),total=Math.max(0,Number(whole)||0);
  if(current<=EPS||total<=EPS||upper>=1)return 0;
  return Math.max(0,(current-upper*total)/(1-upper));
}

function calculateSales(budgetOverride=null){
  const rows=typeof getRows==='function'?getRows():[],total=rows.reduce((sum,row)=>sum+Math.max(0,Number(row.current)||0),0),budget=Math.max(0,finite(budgetOverride)?Number(budgetOverride):Number(state?.contribution)||0),threshold=total*.01;
  const result={version:VERSION,total,budget,threshold,eligible:total>EPS&&budget<threshold,recommendations:[],uncovered:0,overweightClasses:[],overweightSegments:[]};
  if(!result.eligible)return result;

  const openHoldings=holdings(),pendingByTicker=new Map(),pendingByClass=new Map(),pendingBySegment=new Map();
  pending().filter(transaction=>transaction.side==='Venda').forEach(transaction=>{
    const value=Math.max(0,transactionBrl(transaction)||0),ticker=String(transaction.ticker||'').trim().toUpperCase(),className=transaction.className||'',segment=norm(transaction.segment||'Sem segmento');
    pendingByTicker.set(ticker,(pendingByTicker.get(ticker)||0)+value);pendingByClass.set(className,(pendingByClass.get(className)||0)+value);pendingBySegment.set(`${className}|${segment}`,(pendingBySegment.get(`${className}|${segment}`)||0)+value);
  });
  const plannedByTicker=new Map(),recommendations=new Map();

  function available(holding){const ticker=String(holding.ticker||'').trim().toUpperCase();return Math.max(0,(Number(holding.value)||0)-(pendingByTicker.get(ticker)||0)-(plannedByTicker.get(ticker)||0));}
  function allocate(candidates,requested,reason){
    let remaining=Math.max(0,requested),spent=0;
    for(const holding of candidates.slice().sort((a,b)=>available(b)-available(a))){
      if(remaining<=EPS)break;const ticker=String(holding.ticker||'').trim().toUpperCase(),free=available(holding);if(free<=EPS)continue;
      const atomic=holding.className==='Renda Fixa',amount=atomic?free:Math.min(free,remaining);plannedByTicker.set(ticker,(plannedByTicker.get(ticker)||0)+amount);
      const current=recommendations.get(ticker)||{holding,amount:0,reasons:new Set()};current.amount+=amount;current.reasons.add(reason);recommendations.set(ticker,current);spent+=amount;remaining=Math.max(0,remaining-amount);
    }
    return spent;
  }

  rows.forEach(row=>{
    const className=row.name,classHoldings=openHoldings.filter(holding=>holding.className===className),classAbove=Number(row.currentWeight)>Number(row.max)+EPS;
    let classNeed=classAbove?Math.max(0,requiredSale(row.current,total,row.max)-(pendingByClass.get(className)||0)):0,segmentAllocated=0;
    if(classAbove)result.overweightClasses.push({name:className,current:Number(row.currentWeight)||0,max:Number(row.max)||0,required:classNeed});
    let segmentRows=[];try{segmentRows=typeof segmentRowsV18==='function'?segmentRowsV18(className):[];}catch(e){}
    segmentRows.filter(segment=>Number(segment.target)>0&&Number(segment.real)>Number(segment.max)+EPS).forEach(segment=>{
      const pendingValue=pendingBySegment.get(`${className}|${norm(segment.name)}`)||0,need=Math.max(0,requiredSale(segment.value,row.current,segment.max)-pendingValue),reason=`Segmento acima da faixa (${pct(segment.real)} > ${pct(segment.max)})`;
      result.overweightSegments.push({className,name:segment.name,current:Number(segment.real)||0,max:Number(segment.max)||0,required:need});
      const allocated=allocate(classHoldings.filter(holding=>norm(holding.segment||'Sem segmento')===norm(segment.name)),need,reason);segmentAllocated+=allocated;result.uncovered+=Math.max(0,need-allocated);
    });
    classNeed=Math.max(0,classNeed-segmentAllocated);
    if(classNeed>EPS){const aboveSegments=new Set(result.overweightSegments.filter(segment=>segment.className===className).map(segment=>norm(segment.name))),ordered=classHoldings.slice().sort((a,b)=>Number(aboveSegments.has(norm(b.segment||'Sem segmento')))-Number(aboveSegments.has(norm(a.segment||'Sem segmento')))||available(b)-available(a)),reason=`Classe acima da faixa (${pct(row.currentWeight)} > ${pct(row.max)})`;const allocated=allocate(ordered,classNeed,reason);result.uncovered+=Math.max(0,classNeed-allocated);}
  });

  result.recommendations=[...recommendations.values()].map(item=>{
    const holding=item.holding,value=Math.min(Number(holding.value)||0,item.amount),unitBrl=(Number(holding.qty)||0)>EPS?(Number(holding.value)||0)/Number(holding.qty):Number(holding.currentPriceBRL)||Number(holding.price)||0,qty=holding.className==='Renda Fixa'?Number(holding.qty)||1:(unitBrl>EPS?value/unitBrl:0);
    return{holdingId:holding.id,ticker:holding.ticker,name:holding.name||holding.ticker,className:holding.className,segment:holding.segment||'Sem segmento',amount:value,qty,reasons:[...item.reasons],fullPosition:value>=(Number(holding.value)||0)-EPS};
  }).filter(item=>item.amount>EPS&&item.qty>0).sort((a,b)=>b.amount-a.amount);
  return result;
}

function ensureSalesHost(){
  const card=document.getElementById('contributionPlannerV26');if(!card)return null;let host=document.getElementById('plannerRebalanceV35');if(!host){host=document.createElement('section');host.id='plannerRebalanceV35';host.className='plannerRebalanceV35';const summary=card.querySelector('.plannerSummaryV28');summary?.insertAdjacentElement('afterend',host)||card.appendChild(host);}return host;
}

function renderSales(){
  const host=ensureSalesHost();if(!host)return;const plan=calculateSales(),rule=`1% do patrimônio = ${money(plan.threshold)}`;
  if(!plan.total){host.innerHTML=`<div class="rebalanceHeadV35"><div><span>REBALANCEAMENTO</span><h3>Vendas sugeridas</h3></div><small>${rule}</small></div><div class="rebalanceStateV35 neutral">Cadastre posições com valor atual para avaliar o rebalanceamento por venda.</div>`;return;}
  if(!plan.eligible){host.innerHTML=`<div class="rebalanceHeadV35"><div><span>REBALANCEAMENTO</span><h3>Vendas sugeridas</h3><p>A venda só é considerada quando o aporte fica abaixo de 1% do patrimônio.</p></div><small>${rule}</small></div><div class="rebalanceStateV35 ok"><strong>Somente aportes</strong><span>O orçamento de ${money(plan.budget)} atingiu o limite mínimo; nenhuma venda foi sugerida.</span></div>`;return;}
  if(!plan.recommendations.length){host.innerHTML=`<div class="rebalanceHeadV35"><div><span>REBALANCEAMENTO ATIVO</span><h3>Vendas sugeridas</h3><p>O aporte está abaixo de 1%, mas nenhuma classe ou segmento com meta está acima da faixa.</p></div><small>${rule}</small></div><div class="rebalanceStateV35 ok"><strong>Carteira dentro do critério</strong><span>Nenhuma venda é necessária pelas bandas atuais.</span></div>`;return;}
  const total=plan.recommendations.reduce((sum,item)=>sum+item.amount,0);
  host.innerHTML=`<div class="rebalanceHeadV35"><div><span>REBALANCEAMENTO ATIVO</span><h3>Vendas sugeridas</h3><p>Como o aporte é menor que 1% do patrimônio, o plano considera somente posições de classes ou segmentos acima da faixa.</p></div><div class="rebalanceTotalsV35"><small>${rule}</small><strong>${money(total)}</strong><span>venda total sugerida</span></div></div><div class="rebalanceRowsV35">${plan.recommendations.map(item=>`<article class="rebalanceRowV35"><div class="rebalanceAssetV35"><strong>${escapeText(item.ticker)}</strong><span>${escapeText(item.name)}</span><small>${escapeText(item.className)} • ${escapeText(item.segment)}</small></div><div class="rebalanceReasonV35">${item.reasons.map(reason=>`<span>${escapeText(reason)}</span>`).join('')}</div><div class="rebalanceValueV35"><small>Venda sugerida</small><strong>− ${money(item.amount)}</strong><span>${quantity(item.qty)} un.${item.fullPosition?' • posição total':''}</span></div><button type="button" class="dangerGhost rebalanceActionV35" data-rebalance-sale-v35="${escapeAttribute(item.holdingId)}" data-rebalance-amount-v35="${item.amount}">Preparar venda</button></article>`).join('')}</div>${plan.uncovered>EPS?`<div class="rebalanceWarningV35">${money(plan.uncovered)} não pôde ser associado a uma posição disponível.</div>`:''}`;
  host.querySelectorAll('[data-rebalance-sale-v35]').forEach(button=>button.addEventListener('click',()=>openSuggestedSale(button.dataset.rebalanceSaleV35,Number(button.dataset.rebalanceAmountV35)||0)));
}

function segmentIdeal(){
  const className=document.getElementById('txClassV20')?.value||'',segmentName=document.getElementById('txSegmentV20')?.value?.trim()||'Sem segmento',asset=(state.assets||[]).find(item=>item.name===className),macro=typeof getSuggestions==='function'&&asset?Number(getSuggestions()[asset.id])||0:0;
  let segments=[];try{segments=typeof segmentRowsV18==='function'?segmentRowsV18(className).filter(row=>Number(row.target)>0||Number(row.value)>0):[];}catch(e){}
  const total=typeof classTotalV18==='function'?classTotalV18(className):segments.reduce((sum,row)=>sum+(Number(row.value)||0),0),targetTotal=segments.reduce((sum,row)=>sum+Math.max(0,Number(row.target)||0),0),future=total+macro,gaps=segments.map(row=>({...row,gap:Math.max(0,future*(targetTotal?Math.max(0,Number(row.target)||0)/targetTotal:0)-(Number(row.value)||0))})),gapTotal=gaps.reduce((sum,row)=>sum+row.gap,0),selected=gaps.find(row=>norm(row.name)===norm(segmentName));
  if(!selected)return 0;return macro>0?(gapTotal?macro*selected.gap/gapTotal:macro*(targetTotal?Math.max(0,Number(selected.target)||0)/targetTotal:0)):0;
}

function simplifyModalIdeal(){
  const template=document.getElementById('txTemplateV20');if(!template)return;let strip=document.getElementById('txIdealSegmentV28');if(!strip){strip=document.createElement('div');strip.id='txIdealSegmentV28';strip.className='txIdealSegmentV28';const impact=document.getElementById('txImpactV20');impact?.insertAdjacentElement('afterend',strip)||template.appendChild(strip);}strip.innerHTML=`<span><small>Ideal do segmento</small><strong>${money(segmentIdeal())}</strong></span>`;strip.setAttribute('aria-label',`Ideal do segmento: ${strip.querySelector('strong')?.textContent||'indisponível'}`);
}

function patchLaunchModal(){
  if(typeof updateLaunchTotalV20!=='function'||window.__PONDERA_V35_LAUNCH_PATCH__)return;window.__PONDERA_V35_LAUNCH_PATCH__=true;const previous=updateLaunchTotalV20;updateLaunchTotalV20=function(){const result=previous.apply(this,arguments);simplifyModalIdeal();return result;};simplifyModalIdeal();
}

function holdingFx(holding){if(finite(holding.currentPriceBRL)&&finite(holding.currentPriceNative)&&Number(holding.currentPriceNative)>0)return Number(holding.currentPriceBRL)/Number(holding.currentPriceNative);return currentFx();}
function openSuggestedSale(holdingId,amount){
  const holding=holdings().find(item=>String(item.id)===String(holdingId));if(!holding||amount<=EPS)return false;
  try{
    buildTxDialogV20();v20EditingPendingId=null;const currency=String(holding.currentCurrency||holding.avgCurrency||'BRL').toUpperCase(),unitBrl=(Number(holding.qty)||0)>EPS?(Number(holding.value)||0)/Number(holding.qty):Number(holding.currentPriceBRL)||Number(holding.price)||0,native=finite(holding.currentPriceNative)?Number(holding.currentPriceNative):(currency==='USD'&&finite(holdingFx(holding))?unitBrl/holdingFx(holding):unitBrl),qty=holding.className==='Renda Fixa'?Number(holding.qty)||1:Math.min(Number(holding.qty)||0,unitBrl>EPS?amount/unitBrl:0),fx=currency==='USD'?holdingFx(holding):null,totalNative=qty*native;
    const data={ticker:holding.ticker,name:holding.name||holding.ticker,className:holding.className,side:'Venda',qty,unitPrice:native,currency,fx,totalNative,brlTotal:currency==='USD'&&finite(fx)?totalNative*fx:totalNative,date:new Date().toISOString().slice(0,10),segment:holding.segment||'Sem segmento',microTarget:finite(holding.microTarget)?Number(holding.microTarget):null,otherCostsNative:0,fixedIncomeMeta:holding.fixedIncomeMeta?{...holding.fixedIncomeMeta,principal:amount}:undefined,priceHint:'Venda sugerida para retornar à banda de alocação.'};
    document.getElementById('txTitleV20').textContent='Venda sugerida para rebalanceamento';document.getElementById('txSaveV20').textContent='Adicionar venda à simulação';renderLaunchTemplateV20(holding.className,data);setSideV20('Venda');document.getElementById('txDialog').showModal();return true;
  }catch(error){console.error('[Pondera V2.15] Falha ao preparar a venda sugerida.',error);return false;}
}

function refreshSales(){clearTimeout(updateTimer);updateTimer=setTimeout(()=>{try{renderSales();simplifyModalIdeal();}catch(error){console.warn('[Pondera V2.15] Atualização do rebalanceamento incompleta.',error);}},0);}
function scheduleRefresh(delay=140){clearTimeout(renderTimer);renderTimer=setTimeout(refreshSales,delay);}

function audit(){
  const card=document.getElementById('contributionPlannerV26'),plan=calculateSales(),rows=typeof getRows==='function'?getRows():[],threshold=plan.threshold,under=threshold>EPS?calculateSales(Math.max(0,threshold-.01)):null,at=threshold>EPS?calculateSales(threshold):null,modalStrip=document.getElementById('txIdealSegmentV28');
  const result={version:VERSION,planner:{present:!!card,stable:card?.dataset.plannerStableV28==='1',instance:card?.dataset.plannerInstanceV28||null,budgetInputs:card?.querySelectorAll('#plannerBudgetV28').length||0,classRows:card?.querySelectorAll('[data-planner-class-id-v28]').length||0,expectedClasses:rows.length},rebalance:{eligible:plan.eligible,threshold:plan.threshold,recommendations:plan.recommendations.length,onlyOverweightSources:plan.recommendations.every(item=>item.reasons.every(reason=>reason.startsWith('Classe acima')||reason.startsWith('Segmento acima'))),boundaryCorrect:!threshold||!!under?.eligible&&!at?.eligible},modal:{visibleMetrics:modalStrip?modalStrip.children.length:null,onlyIdeal:!modalStrip||modalStrip.children.length===1&&/Ideal do segmento/.test(modalStrip.textContent)}};
  result.ok=result.planner.present&&result.planner.stable&&result.planner.budgetInputs===1&&result.planner.classRows===result.planner.expectedClasses&&result.rebalance.onlyOverweightSources&&result.rebalance.boundaryCorrect&&result.modal.onlyIdeal;document.documentElement.dataset.ponderaContributionAudit=result.ok?'ok':'review';return result;
}

function boot(){
  ensureCss();patchLaunchModal();refreshSales();document.addEventListener('click',event=>{if(event.target.closest?.('#newTransaction,[data-edit-pending-v20],[data-rebalance-sale-v35]'))setTimeout(simplifyModalIdeal,0);},true);window.addEventListener('pondera:tabchange',event=>{if(event.detail?.tab==='aportes'){refreshSales();scheduleRefresh(180);}});window.addEventListener('hashchange',()=>scheduleRefresh(160));
  if(typeof render==='function'&&!window.__PONDERA_V35_RENDER_WRAP__){window.__PONDERA_V35_RENDER_WRAP__=true;const previous=render;render=function(){const result=previous.apply(this,arguments);scheduleRefresh(240);return result;};}
  window.PonderaContributionPlannerV35={version:VERSION,calculateSales,refreshSales,openSuggestedSale,audit};window.__PONDERA_CONTRIBUTION_PLANNER_V35__=true;document.documentElement.dataset.ponderaContributionPlanner=VERSION;setTimeout(()=>{refreshSales();audit();},220);
}

let attempts=0;const wait=()=>{attempts++;if(typeof state==='undefined'||typeof render!=='function'||typeof updateLaunchTotalV20!=='function'||!document.getElementById('contributionPlannerV26')){if(attempts<500)setTimeout(wait,25);return;}boot();};wait();
})();
