(()=>{
'use strict';
if(window.__PONDERA_ALLOCATION_V302__)return;
const VERSION='2.11.2';
const COLORS=['#43d39e','#69a7ff','#f2b66d','#b28cff','#5ed1dc','#ff8f9b','#93c86f','#cf9bff','#6fb6a7','#e1cf6a'];
let applying=false,pulseObserver=null,stageObserver=null,macroCardObserver=null,releaseTimer=null;
const finite=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));
const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money=v=>finite(v)&&typeof fmt!=='undefined'&&fmt?.format?fmt.format(Number(v)):'—';
const pct=(v,d=1)=>finite(v)?`${Number(v).toFixed(d).replace('.',',')}%`:'—';
function ensureCss(){let l=document.querySelector('link[href^="v30-allocation.css"]');if(!l){l=document.createElement('link');l.rel='stylesheet';document.head.appendChild(l);}l.href='v30-allocation.css?v=30.4';}
function rows(){try{return typeof getRows==='function'?getRows():[];}catch(e){return[];}}
function activePositions(){
  const map=new Map();
  for(const h of (state?.holdings||[])){
    if((+h.qty||0)<=1e-10||(+h.value||0)<=0)continue;
    const tk=String(h.ticker||'').trim().toUpperCase();if(!tk)continue;
    const key=`${tk}|${h.className||''}`;
    const cur=map.get(key)||{ticker:tk,className:h.className||'Sem classe',value:0};cur.value+=Math.max(0,+h.value||0);map.set(key,cur);
  }
  return [...map.values()];
}
function dispersion(rs){
  const weights=rs.map(r=>Math.max(0,+r.currentWeight||0));
  let targets;
  try{targets=typeof normalizedTargets==='function'?normalizedTargets(rs):rs.map(r=>Math.max(0,+r.target||0));}catch(e){targets=rs.map(r=>Math.max(0,+r.target||0));}
  try{return typeof dispersionIndex==='function'?dispersionIndex(weights,targets):Math.sqrt(weights.reduce((s,w,i)=>s+(w-(targets[i]||0))**2,0)/Math.max(1,weights.length));}catch(e){return 0;}
}
function sanitizePulseValues(){
  const card=document.querySelector('#allocationPulseV26 [data-v302-pulse="positions"]');if(!card)return;
  const positions=activePositions();
  card.querySelectorAll('.pulseRowsV26>div').forEach(row=>{
    const tk=row.querySelector('span strong')?.textContent?.trim()?.toUpperCase();
    const pos=positions.find(h=>h.ticker===tk);
    const nodes=[...row.querySelectorAll('.v28Value,.v30PositionValue')];
    let keep=nodes.find(n=>n.classList.contains('v30PositionValue'))||nodes[0];
    if(!keep){keep=document.createElement('small');row.querySelector('em')?.insertAdjacentElement('beforebegin',keep);}
    nodes.forEach(n=>{if(n!==keep)n.remove();});
    keep.classList.add('v28Value','v30PositionValue');
    const txt=pos?money(pos.value):'—';if(keep.textContent!==txt)keep.textContent=txt;
  });
}
function renderPulse(){
  if(applying)return;const panel=document.getElementById('tabMacroV22');if(!panel)return;let host=document.getElementById('allocationPulseV26');if(!host)return;
  applying=true;
  try{
    const positions=activePositions(),total=positions.reduce((s,h)=>s+h.value,0),top=positions.sort((a,b)=>b.value-a.value).slice(0,3);
    const rs=rows(),behind=rs.map(r=>({...r,deficit:(+r.target||0)-(+r.currentWeight||0)})).filter(r=>r.deficit>.001).sort((a,b)=>b.deficit-a.deficit).slice(0,3);
    const disp=dispersion(rs),band=Math.max(0,+state.band||0),ok=disp<=band;
    host.className='allocationPulseV26 allocationPulseV302';host.dataset.ponderaOwner='v302';
    host.innerHTML=`<article class="card pulseCardV26 pulseCardV302" data-v302-pulse="positions"><div class="pulseTitleV26"><span>MAIORES POSIÇÕES</span><strong>Top 3 ativos</strong></div><div class="pulseRowsV26">${top.length?top.map((h,i)=>`<div><b>${i+1}</b><span><strong>${esc(h.ticker)}</strong><small>${esc(h.className)}</small></span><small class="v28Value v30PositionValue">${money(h.value)}</small><em>${pct(total?h.value/total*100:0,2)}</em></div>`).join(''):'<p class="pulseEmptyV26">Sem posições.</p>'}</div></article><article class="card pulseCardV26 pulseCardV302" data-v302-pulse="behind"><div class="pulseTitleV26"><span>MAIOR DEFASAGEM</span><strong>Classes mais para trás</strong></div><div class="pulseRowsV26">${behind.length?behind.map((r,i)=>`<div><b>${i+1}</b><span><strong>${esc(r.name)}</strong><small>${pct(r.currentWeight)} atual • ${pct(r.target)} alvo</small></span><em class="negative">-${pct(r.deficit,2)} p.p.</em></div>`).join(''):'<p class="pulseEmptyV26">Nenhuma classe abaixo do alvo.</p>'}</div></article><article class="card pulseCardV26 pulseCardV302 dispersionPulseV26 ${ok?'good':'bad'}" data-v302-pulse="dispersion"><div class="pulseTitleV26"><span>ADERÊNCIA À ESTRATÉGIA</span><strong>Índice de dispersão</strong></div><div class="dispersionMainV26"><strong>${pct(disp,2)}</strong><span class="pill ${ok?'ok':'warn'}">${ok?'Dentro da banda':'Fora da banda'}</span></div><div class="dispersionMetaV26"><span>Banda global <b>±${pct(band,0)}</b></span><span>${ok?'Estrutura dentro da tolerância definida.':'Priorize classes mais defasadas.'}</span></div></article>`;
    sanitizePulseValues();
  }finally{applying=false;}
}
function ensureBandControl(){
  const macro=document.getElementById('allocationMacroSnapshotV23');if(!macro)return;
  const actions=macro.querySelector('.allocationMacroActionsV25,.sectionActions');if(!actions)return;
  const duplicates=[...actions.querySelectorAll('.macroBandV26,.macroBandV302')];
  let wrap=duplicates[0]||null;duplicates.slice(1).forEach(x=>x.remove());
  if(!wrap){wrap=document.createElement('label');actions.insertBefore(wrap,actions.firstChild||null);}
  wrap.className='macroBandV26 macroBandV302';
  let input=wrap.querySelector('input');
  if(!input){wrap.innerHTML='<span>Banda geral</span><div><b>±</b><input id="macroBandInputV26" type="number" min="0" max="100" step="1"><b>%</b></div>';input=wrap.querySelector('input');}
  input.id='macroBandInputV26';input.classList.add('percentageInputV302');
  const value=Math.max(0,+state.band||0);if(String(input.value)!==String(value))input.value=value;
  input.onchange=e=>{const n=Math.min(100,Math.max(0,Number(e.target.value)||0));state.band=n;const old=document.getElementById('band');if(old)old.value=n;try{save();}catch(_){}render();};
}
function repairMacroStructure(){
  const panel=document.getElementById('tabMacroV22'),pulse=document.getElementById('allocationPulseV26'),stage=document.getElementById('macroStageV28'),table=document.getElementById('allocationMacroSnapshotV23'),graph=document.getElementById('macroGraphicV28');
  if(!panel||!stage||!table||!graph)return;
  panel.classList.add('allocationPanelV302');stage.classList.add('macroStageV302');table.classList.add('macroDetailedV302');graph.classList.add('macroGraphicV302');
  stage.dataset.ponderaAllocation='v302';
  if(pulse&&pulse.nextElementSibling!==stage)pulse.insertAdjacentElement('afterend',stage);
  if(table.parentElement!==stage)stage.appendChild(table);if(graph.parentElement!==stage)stage.appendChild(graph);
  if(stage.firstElementChild!==table)stage.insertBefore(table,stage.firstElementChild||null);
  if(table.nextElementSibling!==graph)stage.insertBefore(graph,table.nextSibling);
  table.style.setProperty('order','0','important');graph.style.setProperty('order','1','important');
  table.style.setProperty('grid-column','1','important');graph.style.setProperty('grid-column','2','important');
  stage.style.setProperty('width','100%','important');stage.style.setProperty('max-width','none','important');stage.style.setProperty('align-self','stretch','important');
  ensureBandControl();
}
function healthyPulse(){const h=document.getElementById('allocationPulseV26');if(!h||h.dataset.ponderaOwner!=='v302'||h.querySelectorAll('[data-v302-pulse]').length!==3)return false;return[...h.querySelectorAll('[data-v302-pulse="positions"] .pulseRowsV26>div')].every(r=>r.querySelectorAll('.v28Value,.v30PositionValue').length===1);}
function healthyMacro(){const stage=document.getElementById('macroStageV28'),table=document.getElementById('allocationMacroSnapshotV23'),graph=document.getElementById('macroGraphicV28');return!!stage&&stage.firstElementChild===table&&table?.nextElementSibling===graph&&getComputedStyle(table).order==='0'&&getComputedStyle(graph).order==='1';}
function finalize(){renderPulse();sanitizePulseValues();repairMacroStructure();document.documentElement.dataset.ponderaAllocation=VERSION;}
function installObservers(){
  const host=document.getElementById('allocationPulseV26');if(host&&!pulseObserver){pulseObserver=new MutationObserver(()=>{if(applying)return;sanitizePulseValues();if(!healthyPulse())queueMicrotask(renderPulse);});pulseObserver.observe(host,{childList:true,subtree:true});}
  const stage=document.getElementById('macroStageV28');if(stage&&!stageObserver){stageObserver=new MutationObserver(()=>{if(!applying&&!healthyMacro())queueMicrotask(repairMacroStructure);});stageObserver.observe(stage,{childList:true,attributes:true,attributeFilter:['class','style']});}
  const macro=document.getElementById('allocationMacroSnapshotV23');if(macro&&!macroCardObserver){macroCardObserver=new MutationObserver(()=>{if(!applying)queueMicrotask(ensureBandControl);});macroCardObserver.observe(macro,{childList:true,subtree:true});}
}
function guardTabSwitch(e){
  const b=e.target.closest?.('[data-tab-v23="alocacao"]');if(!b)return;const panel=document.getElementById('tabMacroV22');if(!panel)return;
  panel.classList.add('allocationSwitchGuardV302');clearTimeout(releaseTimer);
  setTimeout(finalize,135);releaseTimer=setTimeout(()=>{finalize();panel.classList.remove('allocationSwitchGuardV302');},155);
}
function boot(){
  ensureCss();finalize();installObservers();
  document.addEventListener('click',guardTabSwitch,true);
  window.addEventListener('hashchange',()=>setTimeout(()=>{finalize();installObservers();},145));
  if(typeof render==='function'&&!window.__PONDERA_V302_RENDER_WRAP__){window.__PONDERA_V302_RENDER_WRAP__=true;const prev=render;render=function(){const r=prev.apply(this,arguments);setTimeout(()=>{finalize();installObservers();},145);return r;};}
  window.__PONDERA_ALLOCATION_V302__=true;document.documentElement.dataset.ponderaAllocation=VERSION;
}
let tries=0;const wait=()=>{tries++;if(typeof state==='undefined'||typeof render!=='function'||!document.getElementById('tabMacroV22')||!document.getElementById('allocationPulseV26')||!document.getElementById('macroStageV28')){if(tries<500)setTimeout(wait,25);return;}boot();};wait();
})();
