(()=>{
'use strict';
if(window.__PONDERA_ALLOCATION_CONTROLS_V32__)return;
const VERSION='2.12.0';
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
function ensureCss(){let link=document.querySelector('link[href^="v32-allocation-controls.css"]');if(!link){link=document.createElement('link');link.rel='stylesheet';document.head.appendChild(link);}link.href='v32-allocation-controls.css?v=32.0';}
function finite(v){return v!==''&&Number.isFinite(Number(v));}
function clamp(input,value){const min=finite(input.min)?Number(input.min):0,max=finite(input.max)?Number(input.max):100;return Math.min(max,Math.max(min,value));}
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
function commit(input){if(!input.isConnected)return;input.dataset.ppCommittingV32='1';input.dispatchEvent(new Event('change',{bubbles:true}));delete input.dataset.ppCommittingV32;}
function enhanceInput(input){
  if(input.dataset.ppStepperV32==='1')return;
  input.dataset.ppStepperV32='1';input.step='1';input.inputMode='numeric';
  if(!input.id)input.id=`pp-input-v32-${Math.random().toString(36).slice(2,9)}`;
  let host=directHost(input);
  if(!host){host=document.createElement('div');host.className='ppStepperV32 ppDialogStepperV32';input.replaceWith(host);host.appendChild(input);}else host.classList.add('ppStepperV32');
  ensurePercentSuffix(host,input);
  const minus=button(-1,input),plus=button(1,input);minus.setAttribute('aria-controls',input.id);plus.setAttribute('aria-controls',input.id);host.insertBefore(minus,host.firstChild);host.appendChild(plus);
  let timer=null;
  input.addEventListener('input',()=>{syncButtons(host,input);if(input.dataset.ppCommittingV32==='1')return;clearTimeout(timer);timer=setTimeout(()=>commit(input),240);});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){clearTimeout(timer);commit(input);}});
  syncButtons(host,input);
}
function enhance(root=document){ensureCss();const inputs=[];if(root.nodeType===1&&root.matches?.(SELECTOR))inputs.push(root);root.querySelectorAll?.(SELECTOR).forEach(i=>inputs.push(i));inputs.forEach(enhanceInput);document.documentElement.dataset.ponderaAllocationControls=VERSION;}
function step(input,direction){const current=finite(input.value)?Number(input.value):0,next=clamp(input,current+direction);if(next===current)return;input.value=String(Number(next.toFixed(6)));const host=input.closest('.ppStepperV32');syncButtons(host,input);input.dataset.ppCommittingV32='1';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));delete input.dataset.ppCommittingV32;}
function clickCapture(e){const b=e.target.closest?.('[data-pp-step-v32]');if(!b)return;const host=b.closest('.ppStepperV32'),input=host?.querySelector('input');if(!input)return;e.preventDefault();e.stopImmediatePropagation();step(input,Number(b.dataset.ppStepV32));}
function schedule(root=document){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance(root);});}
function boot(){ensureCss();enhance();document.addEventListener('click',clickCapture,true);observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.addedNodes.length))schedule(document);});observer.observe(document.body,{childList:true,subtree:true});window.addEventListener('pondera:tabchange',()=>schedule(document));window.addEventListener('pondera:ready',()=>schedule(document));window.__PONDERA_ALLOCATION_CONTROLS_V32__=true;window.PonderaAllocationControlsV32={version:VERSION,enhance};document.documentElement.dataset.ponderaAllocationControls=VERSION;}
let tries=0;const wait=()=>{tries++;if(typeof state==='undefined'||typeof render!=='function'||!document.getElementById('tabMacroV22')){if(tries<500)setTimeout(wait,25);return;}boot();};wait();
})();
