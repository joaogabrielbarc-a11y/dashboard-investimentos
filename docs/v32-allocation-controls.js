(()=>{
'use strict';
if(window.__PONDERA_ALLOCATION_CONTROLS_V32__)return;
const VERSION='2.12.4';
const SELECTOR=[
  '#tabMacroV22 input[data-target-v25]',
  '#tabMacroV22 #macroBandInputV26',
  '#tabMacroV22 #globalBandV25',
  '#tabMacroV22 input[data-band-class-v18]',
  '#tabMacroV22 input[data-segment-target-v18]',
  '#classDialog #classTarget',
  '#classEditDialogV25 #classEditTargetV25',
  '#segmentDialogV18 #segmentTargetDialogV18',
  '#holdingDialog #holdingMicroTargetV17'
].join(',');
const HOST_CLASSES=['targetInputV25','bandInputV25','macroBandV302','bandInputV18','targetInputV18'];
let observer=null,scheduled=false;
function ensureCss(){let link=document.querySelector('link[href^="v32-allocation-controls.css"]');if(!link){link=document.createElement('link');link.rel='stylesheet';document.head.appendChild(link);}link.href='v32-allocation-controls.css?v=32.3';}
function finite(v){return v!==''&&Number.isFinite(Number(v));}
function clamp(input,value){const min=finite(input.min)?Number(input.min):0,max=finite(input.max)?Number(input.max):100;return Math.min(max,Math.max(min,value));}
function pctText(value,digits=1){return `${Number(value||0).toFixed(digits).replace('.',',')}%`;}
function escapeSelector(value){return window.CSS?.escape?CSS.escape(String(value)):String(value).replace(/["\\]/g,'\\$&');}
function setText(node,value){if(node&&node.textContent!==value)node.textContent=value;}
function flash(node){if(!node)return;node.classList.remove('ppUpdatedV32');requestAnimationFrame(()=>{node.classList.add('ppUpdatedV32');setTimeout(()=>node.classList.remove('ppUpdatedV32'),360);});}
function removeLegacySign(host,input){[...host.children].filter(node=>node!==input&&['±','+/-'].includes(node.textContent.trim())).forEach(node=>node.remove());}
function updateSegmentTotal(article,rows=null){
  if(!article||typeof segmentRowsV18!=='function')return;
  const className=article.dataset.classDashboardV18,data=rows||segmentRowsV18(className),title=article.querySelector('.segmentsPaneV18 .paneTitleV18');if(!title)return;
  let actions=title.querySelector('.segmentHeaderActionsV32');
  if(!actions){actions=document.createElement('div');actions.className='segmentHeaderActionsV32';title.appendChild(actions);const add=title.querySelector('[data-add-segment-v18]');if(add)actions.appendChild(add);}
  let pill=actions.querySelector('.segmentTargetTotalV32');if(!pill){pill=document.createElement('span');pill.className='pill segmentTargetTotalV32';actions.insertBefore(pill,actions.firstChild||null);}
  const total=data.reduce((sum,row)=>sum+Math.max(0,Number(row.target)||0),0);pill.className=`pill segmentTargetTotalV32 ${Math.abs(total-100)<.01?'ok':'warn'}`;setText(pill,`Metas ${pctText(total)}`);
}
function ensureSegmentTotals(root=document){root.querySelectorAll?.('.classDashboardV18[data-class-dashboard-v18]').forEach(article=>updateSegmentTotal(article));}
function refreshMacroUi(){
  const rows=typeof getRows==='function'?getRows():[];
  document.querySelectorAll('#tabMacroV22 input[data-target-v25]').forEach(current=>{
    const data=rows.find(row=>String(row.id)===String(current.dataset.targetV25)),tr=current.closest('tr');if(!data||!tr)return;
    const cells=tr.cells,range=cells?.[4],status=cells?.[5]?.querySelector('.pill');
    setText(range,`${pctText(data.min)} – ${pctText(data.max)}`);
    if(status){status.className=`pill ${data.balanced?'ok':'warn'}`;setText(status,data.balanced?'OK':'NOK');}
    flash(range);flash(status);
  });
  const total=rows.reduce((sum,row)=>sum+Math.max(0,Number(row.target)||0),0);
  const totalPill=document.querySelector('#allocationMacroSnapshotV23 .allocationMacroActionsV25 > .pill');
  if(totalPill){totalPill.className=`pill ${Math.abs(total-100)>.05?'warn':'ok'}`;setText(totalPill,`Metas ${pctText(total)}`);flash(totalPill);}
  const legacyTotal=document.getElementById('targetTotal');if(legacyTotal){legacyTotal.className=`pill ${Math.abs(total-100)<.01?'ok':'warn'}`;setText(legacyTotal,`Metas: ${pctText(total)}`);}
  rows.forEach(data=>{const article=document.querySelector(`[data-class-dashboard-v18="${escapeSelector(data.name)}"]`),summary=article?.querySelector('.classHeaderV18 p');if(summary)summary.textContent=summary.textContent.replace(/meta macro\s+[^•]+$/i,`meta macro ${pctText(data.target)}`);});
  requestAnimationFrame(()=>{try{if(typeof renderMacro==='function')renderMacro();}catch(e){}try{if(typeof renderAllocationPulseV26==='function')renderAllocationPulseV26();}catch(e){}});
}
function refreshClassUi(className){
  if(!className||typeof segmentRowsV18!=='function')return;
  const article=document.querySelector(`[data-class-dashboard-v18="${escapeSelector(className)}"]`);if(!article)return;
  const rows=segmentRowsV18(className);
  article.querySelectorAll('input[data-segment-target-v18]').forEach(current=>{
    const data=rows.find(row=>String(row.id)===String(current.dataset.segmentTargetV18)),tr=current.closest('tr');if(!data||!tr)return;
    const cells=tr.cells,range=cells?.[3],status=cells?.[4]?.querySelector('.segmentStatusV18'),buy=cells?.[5]?.querySelector('.canBuyV18');
    setText(range,`${pctText(data.min)}–${pctText(data.max)}`);
    if(status){status.className=`segmentStatusV18 ${typeof segmentStatusClassV18==='function'?segmentStatusClassV18(data.status):''}`;setText(status,data.status);}
    if(buy){buy.className=`canBuyV18 ${data.canBuy?'yes':'no'}`;setText(buy,data.canBuy?'SIM':'NÃO');}
    flash(range);flash(status);flash(buy);
  });
  const targetTotal=rows.reduce((sum,row)=>sum+Math.max(0,Number(row.target)||0),0),inside=rows.filter(row=>row.status==='Na banda').length,pills=article.querySelectorAll('.classPillsV18 .pill');
  if(pills[0]){pills[0].className=`pill ${Math.abs(targetTotal-100)<.01?'ok':'warn'}`;setText(pills[0],`Metas ${pctText(targetTotal)}`);flash(pills[0]);}
  if(pills[1]){pills[1].className=`pill ${rows.length&&inside===rows.length?'ok':'warn'}`;setText(pills[1],`${inside}/${rows.length} na banda`);flash(pills[1]);}
  updateSegmentTotal(article,rows);flash(article.querySelector('.segmentTargetTotalV32'));
  article.querySelectorAll('.classMicroLegendRowV25').forEach(legend=>{const name=legend.querySelector('span strong')?.textContent?.trim(),data=rows.find(row=>row.name===name);if(!data)return;setText(legend.querySelector('span small'),data.status||'Sem status');setText(legend.querySelector('em'),`alvo ${pctText(data.target)}`);});
}
function labelFor(input){
  if(input.id==='macroBandInputV26'||input.id==='globalBandV25')return'band geral';
  if(input.dataset.bandClassV18)return`banda de ${input.dataset.bandClassV18}`;
  if(input.dataset.segmentTargetV18){const row=input.closest('tr'),name=row?.querySelector('.segmentNameV18 strong')?.textContent?.trim();return`meta${name?' de '+name:''}`;}
  if(input.dataset.targetV25){const row=input.closest('tr'),name=row?.querySelector('.macroClassNameV25 strong')?.textContent?.trim();return`meta${name?' de '+name:''}`;}
  return String(input.closest('label')?.childNodes?.[0]?.textContent||'percentual').trim().toLowerCase()||'percentual';
}
function button(direction,input){const b=document.createElement('button');b.type='button';b.className='ppStepButtonV32';b.dataset.ppStepV32=String(direction);b.textContent=direction<0?'−':'+';b.setAttribute('aria-label',`${direction<0?'Diminuir':'Aumentar'} ${labelFor(input)} em 1 ponto percentual`);return b;}
function directHost(input){const p=input.parentElement;if(!p)return null;if(input.id==='macroBandInputV26')return p;return HOST_CLASSES.some(c=>p.classList.contains(c))||p.classList.contains('macroBandV26')?p:null;}
function ensurePercentSuffix(host,input){if(input.id==='macroBandInputV26'||input.id==='globalBandV25'||host.querySelector('.ppPercentV32'))return;const existing=[...host.children].find(x=>x!==input&&x.tagName==='SPAN'&&x.textContent.trim()==='%');if(existing){existing.classList.add('ppPercentV32');return;}const suffix=document.createElement('span');suffix.className='ppPercentV32';suffix.textContent='%';input.insertAdjacentElement('afterend',suffix);}
function syncButtons(host,input){const value=finite(input.value)?Number(input.value):0,min=finite(input.min)?Number(input.min):0,max=finite(input.max)?Number(input.max):100;const minus=host.querySelector('[data-pp-step-v32="-1"]'),plus=host.querySelector('[data-pp-step-v32="1"]');if(minus)minus.disabled=value<=min;if(plus)plus.disabled=value>=max;}
function updateAllocationState(input){
  const value=clamp(input,finite(input.value)?Number(input.value):0);input.value=String(Number(value.toFixed(6)));
  if(input.dataset.targetV25){const asset=state.assets.find(x=>x.id===input.dataset.targetV25);if(!asset)return false;asset.target=value;if(state.autoAportes)state.aportes={};save();refreshMacroUi();return true;}
  if(input.id==='macroBandInputV26'||input.id==='globalBandV25'){state.band=value;document.querySelectorAll('#macroBandInputV26,#globalBandV25,#band').forEach(current=>{if(current!==input)current.value=value;});save();refreshMacroUi();return true;}
  if(input.dataset.bandClassV18){const className=input.dataset.bandClassV18;v18Plan.bands[className]=value;saveV18Plan();refreshClassUi(className);return true;}
  if(input.dataset.segmentTargetV18){const className=input.dataset.segmentClassV18,plan=ensureSegmentPlanV18(className),segment=plan.find(x=>x.id===input.dataset.segmentTargetV18);if(!segment)return false;segment.target=value;saveV18Plan();refreshClassUi(className);return true;}
  return false;
}
function commit(input){if(!input.isConnected)return;input.dataset.ppCommittingV32='1';if(!updateAllocationState(input))input.dispatchEvent(new Event('change',{bubbles:true}));delete input.dataset.ppCommittingV32;}
function enhanceInput(input){
  if(input.dataset.ppStepperV32==='1')return;
  input.dataset.ppStepperV32='1';input.step='1';input.inputMode='numeric';
  if(!input.id)input.id=`pp-input-v32-${Math.random().toString(36).slice(2,9)}`;
  let host=directHost(input);
  if(!host){host=document.createElement('div');host.className='ppStepperV32 ppDialogStepperV32';input.replaceWith(host);host.appendChild(input);}else host.classList.add('ppStepperV32');
  removeLegacySign(host,input);
  ensurePercentSuffix(host,input);
  const minus=button(-1,input),plus=button(1,input);minus.setAttribute('aria-controls',input.id);plus.setAttribute('aria-controls',input.id);host.insertBefore(minus,host.firstChild);host.appendChild(plus);
  let timer=null;
  input.addEventListener('input',()=>{syncButtons(host,input);if(input.dataset.ppCommittingV32==='1')return;clearTimeout(timer);timer=setTimeout(()=>commit(input),240);});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){clearTimeout(timer);commit(input);}});
  syncButtons(host,input);
}
function enhance(root=document){ensureCss();const inputs=[];if(root.nodeType===1&&root.matches?.(SELECTOR))inputs.push(root);root.querySelectorAll?.(SELECTOR).forEach(i=>inputs.push(i));inputs.forEach(enhanceInput);ensureSegmentTotals(root);document.documentElement.dataset.ponderaAllocationControls=VERSION;}
function step(input,direction){const current=finite(input.value)?Number(input.value):0,next=clamp(input,current+direction);if(next===current)return;input.value=String(Number(next.toFixed(6)));const host=input.closest('.ppStepperV32');syncButtons(host,input);input.dataset.ppCommittingV32='1';input.dispatchEvent(new Event('input',{bubbles:true}));commit(input);delete input.dataset.ppCommittingV32;}
function clickCapture(e){const b=e.target.closest?.('[data-pp-step-v32]');if(!b)return;const host=b.closest('.ppStepperV32'),input=host?.querySelector('input');if(!input)return;e.preventDefault();e.stopImmediatePropagation();step(input,Number(b.dataset.ppStepV32));}
function schedule(root=document){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance(root);});}
function boot(){ensureCss();enhance();document.addEventListener('click',clickCapture,true);observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.addedNodes.length))schedule(document);});observer.observe(document.body,{childList:true,subtree:true});window.addEventListener('pondera:tabchange',()=>schedule(document));window.addEventListener('pondera:ready',()=>schedule(document));window.__PONDERA_ALLOCATION_CONTROLS_V32__=true;window.PonderaAllocationControlsV32={version:VERSION,enhance};document.documentElement.dataset.ponderaAllocationControls=VERSION;}
let tries=0;const wait=()=>{tries++;if(typeof state==='undefined'||typeof render!=='function'||!document.getElementById('tabMacroV22')){if(tries<500)setTimeout(wait,25);return;}boot();};wait();
})();
