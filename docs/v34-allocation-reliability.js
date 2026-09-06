(()=>{
'use strict';
if(window.__PONDERA_RELIABILITY_V34__)return;

const VERSION='2.14.0';
let auditTimer=null,profitTimer=null,profitObserver=null;
const ticker=value=>{const key=String(value||'').trim().toUpperCase();return key==='BTC'?'BTCUSD':key;};
const finite=value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value));

function ensureCss(){
  let link=document.querySelector('link[href^="v34-allocation-reliability.css"]');
  if(!link){link=document.createElement('link');link.rel='stylesheet';document.head.appendChild(link);}
  link.href='v34-allocation-reliability.css?v=34.0';
}

function ensureEditorFields(){
  const form=document.getElementById('holdingForm');
  if(!form)return null;
  const classLabel=document.getElementById('holdingClass')?.closest('label');
  let metadata=document.getElementById('holdingMetadataV17');
  if(!metadata&&classLabel){
    metadata=document.createElement('div');
    metadata.id='holdingMetadataV17';
    metadata.className='modalGrid';
    metadata.innerHTML='<label>Segmento<input id="holdingSegmentV17" type="text" maxlength="60" placeholder="Ex.: Bancos, Logística, Small Cap Value"></label><label>Micro alocação ideal (%)<input id="holdingMicroTargetV17" type="number" min="0" max="100" step="1" placeholder="Opcional"></label>';
    classLabel.insertAdjacentElement('afterend',metadata);
  }
  const segment=document.getElementById('holdingSegmentV17');
  if(segment){
    let list=document.getElementById('holdingSegmentsListV18');
    if(!list){list=document.createElement('datalist');list.id='holdingSegmentsListV18';document.body.appendChild(list);}
    segment.setAttribute('list',list.id);
  }
  const help=form.querySelector('.modalHelp');
  if(help){
    help.classList.add('metadataSyncNoteV34');
    help.textContent='Nome, classe, segmento e meta são metadados atuais do ativo. Ao salvar, a classificação é sincronizada com o histórico para manter todos os painéis consistentes.';
  }
  return form;
}

function segmentSuggestions(className){
  const names=new Set();
  try{(state.holdings||[]).filter(h=>h.className===className).forEach(h=>{const name=String(h.segment||'').trim();if(name)names.add(name);});}catch(e){}
  try{(v18Plan?.segments?.[className]||[]).forEach(s=>{const name=String(s.name||'').trim();if(name)names.add(name);});}catch(e){}
  return [...names].sort((a,b)=>a.localeCompare(b,'pt-BR'));
}

function refreshEditorSuggestions(){
  const className=document.getElementById('holdingClass')?.value||'';
  const list=document.getElementById('holdingSegmentsListV18');
  if(!list)return;
  list.replaceChildren(...segmentSuggestions(className).map(name=>{const option=document.createElement('option');option.value=name;return option;}));
}

function fillClassOptions(select,selected){
  if(!select)return;
  const names=[...new Set([...(state.assets||[]).map(a=>String(a.name||'').trim()),String(selected||'').trim()].filter(Boolean))];
  select.replaceChildren(...names.map(name=>{const option=document.createElement('option');option.value=name;option.textContent=name;return option;}));
  select.value=selected||names[0]||'';
}

function syncMicroStepper(input){
  const host=input?.closest('.ppStepperV32');
  if(!host)return;
  const value=finite(input.value)?Number(input.value):0;
  const min=finite(input.min)?Number(input.min):0,max=finite(input.max)?Number(input.max):100;
  const minus=host.querySelector('[data-pp-step-v32="-1"]'),plus=host.querySelector('[data-pp-step-v32="1"]');
  if(minus)minus.disabled=value<=min;
  if(plus)plus.disabled=value>=max;
}

function openAssetEditor(id){
  const form=ensureEditorFields(),holding=(state.holdings||[]).find(item=>String(item.id)===String(id));
  if(!form||!holding)return false;
  const dialog=document.getElementById('holdingDialog'),select=document.getElementById('holdingClass');
  document.getElementById('holdingDialogTitle').textContent='Editar ativo';
  document.getElementById('holdingEditId').value=holding.id;
  const tickerInput=document.getElementById('holdingTicker');tickerInput.value=holding.ticker||'';tickerInput.readOnly=true;tickerInput.title='O ticker é definido pelos lançamentos e não pode ser alterado aqui.';
  document.getElementById('holdingName').value=holding.name||'';
  fillClassOptions(select,holding.className);
  document.getElementById('holdingSegmentV17').value=holding.segment||'Sem segmento';
  const micro=document.getElementById('holdingMicroTargetV17');micro.value=finite(holding.microTarget)?Number(holding.microTarget):'';syncMicroStepper(micro);
  const numericGrid=document.getElementById('holdingQty')?.closest('.modalGrid');if(numericGrid)numericGrid.classList.add('hiddenV17');
  refreshEditorSuggestions();
  if(dialog&&!dialog.open)dialog.showModal();
  return true;
}

function synchronizeAssetMetadata(holding,metadata){
  Object.assign(holding,metadata);
  const key=ticker(holding.ticker),collections=[];
  try{if(Array.isArray(v14?.executed))collections.push(v14.executed);if(Array.isArray(v14?.pending))collections.push(v14.pending);}catch(e){}
  for(const items of collections){
    for(const transaction of items){
      if(ticker(transaction.ticker)!==key)continue;
      transaction.name=metadata.name;
      transaction.className=metadata.className;
      transaction.segment=metadata.segment;
      transaction.microTarget=metadata.microTarget;
      transaction.metadataUpdatedAt=new Date().toISOString();
    }
  }
  try{if(typeof saveV14==='function')saveV14();}catch(e){console.warn('[Pondera V2.14] Não foi possível persistir o histórico atualizado.',e);}
  try{if(typeof save==='function')save();}catch(e){console.warn('[Pondera V2.14] Não foi possível persistir os metadados do ativo.',e);}
}

function saveAssetEditor(event){
  const form=event.target;if(form?.id!=='holdingForm')return;
  event.preventDefault();event.stopImmediatePropagation();
  const id=document.getElementById('holdingEditId')?.value,holding=(state.holdings||[]).find(item=>String(item.id)===String(id));
  if(!holding)return;
  const rawTarget=document.getElementById('holdingMicroTargetV17')?.value??'';
  const metadata={
    name:document.getElementById('holdingName')?.value.trim()||holding.ticker,
    className:document.getElementById('holdingClass')?.value||holding.className||'Sem classe',
    segment:document.getElementById('holdingSegmentV17')?.value.trim()||'Sem segmento',
    microTarget:rawTarget===''?null:Math.min(100,Math.max(0,Number(rawTarget)||0))
  };
  synchronizeAssetMetadata(holding,metadata);
  document.getElementById('holdingDialog')?.close();
  try{render();}catch(e){console.error('[Pondera V2.14] Falha ao atualizar a alocação após editar o ativo.',e);}
  scheduleAudit(260);
}

function editCapture(event){
  const button=event.target.closest?.('[data-edit-asset-v18],[data-edit-holding-v17]');
  if(!button)return;
  const id=button.dataset.editAssetV18||button.dataset.editHoldingV17;
  if(!id)return;
  event.preventDefault();event.stopImmediatePropagation();openAssetEditor(id);
}

function parseMoney(text){
  const normalized=String(text||'').replace(/\s/g,'');
  if(!/\d/.test(normalized))return null;
  const value=Number(normalized.replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',','.'));
  return Number.isFinite(value)?value:null;
}

function enhanceProfitShare(){
  const totalCard=document.querySelector('#kpis [data-v301-kpi="patrimonio"]'),profitCard=document.querySelector('#kpis [data-v301-kpi="lucro"]');
  const total=parseMoney(totalCard?.querySelector('.kpiMainV24 strong')?.textContent),profit=parseMoney(profitCard?.querySelector('.kpiMainV24 strong')?.textContent),main=profitCard?.querySelector('.kpiMainV24');
  if(!main)return;
  let badge=main.querySelector('.profitShareV34');
  if(!badge){badge=document.createElement('span');badge.className='kpiChangeV24 profitShareV34 neutral';main.appendChild(badge);}
  const share=finite(total)&&total!==0&&finite(profit)?profit/total*100:null;
  const text=finite(share)?`${Math.abs(share)<.005?'0,00':Number(share).toFixed(2).replace('.',',')}% do patrimônio`:'— do patrimônio';
  const tone=finite(share)?(share>0?'positive':share<0?'negative':'neutral'):'neutral';
  if(badge.textContent!==text)badge.textContent=text;
  badge.className=`kpiChangeV24 profitShareV34 ${tone}`;
  badge.setAttribute('aria-label',finite(share)?`O lucro total representa ${Number(share).toFixed(2).replace('.',',')} por cento do patrimônio atual`:'Percentual do lucro em relação ao patrimônio indisponível');
}

function scheduleProfit(ms=40){clearTimeout(profitTimer);profitTimer=setTimeout(enhanceProfitShare,ms);}

function audit(){
  const macroRows=[...document.querySelectorAll('#allocationMacroSnapshotV23 tbody tr')],macroTargets=[...document.querySelectorAll('#allocationMacroSnapshotV23 input[data-target-v25]')];
  const classes=[...document.querySelectorAll('#tabMacroV22 .classDashboardV18')],activeHoldings=(state.holdings||[]).filter(h=>(Number(h.qty)||0)>1e-10),editButtons=[...document.querySelectorAll('#tabMacroV22 [data-edit-asset-v18]')];
  const segmentTargets=[...document.querySelectorAll('#tabMacroV22 input[data-segment-target-v18]')],allIds=[...document.querySelectorAll('[id]')].map(node=>node.id),duplicates=[...new Set(allIds.filter((id,index)=>allIds.indexOf(id)!==index))];
  const visiblePanels=[...document.querySelectorAll('[id^="tab"][id$="V22"]')].filter(panel=>getComputedStyle(panel).display!=='none').map(panel=>panel.id);
  const text=document.getElementById('tabMacroV22')?.innerText||'';
  const result={
    version:VERSION,
    runtimeReady:document.documentElement.dataset.ponderaRuntimeState==='ready',
    oneTabVisible:visiblePanels.length===1,
    visiblePanels,
    macro:{classes:(state.assets||[]).length,rows:macroRows.length,targetInputs:macroTargets.length,targetSteppers:document.querySelectorAll('#allocationMacroSnapshotV23 input[data-target-v25] + .ppPercentV32').length,bandControl:!!document.getElementById('macroBandInputV26')},
    micro:{classCards:classes.length,activeHoldings:activeHoldings.length,editButtons:editButtons.length,segmentTargets:segmentTargets.length,bandControls:document.querySelectorAll('#tabMacroV22 input[data-band-class-v18]').length,addSegmentButtons:document.querySelectorAll('#tabMacroV22 [data-add-segment-v18]').length,collapseButtons:document.querySelectorAll('#tabMacroV22 [data-collapse-v19]').length},
    editor:{form:!!document.getElementById('holdingForm'),segment:!!document.getElementById('holdingSegmentV17'),microTarget:!!document.getElementById('holdingMicroTargetV17')},
    data:{targetTotal:(state.assets||[]).reduce((sum,item)=>sum+Math.max(0,Number(item.target)||0),0),zeroPositionClasses:(state.assets||[]).filter(item=>!(Number(item.current)>0)).map(item=>item.name),duplicateDomIds:duplicates,containsInvalidText:/\b(?:NaN|undefined)\b/.test(text)},
    checks:{
      macroCoverage:macroRows.length===(state.assets||[]).length&&macroTargets.length===(state.assets||[]).length,
      classCoverage:classes.length===(state.assets||[]).length,
      assetEditCoverage:editButtons.length===activeHoldings.length,
      classCommandCoverage:document.querySelectorAll('#tabMacroV22 input[data-band-class-v18]').length===classes.length&&document.querySelectorAll('#tabMacroV22 [data-add-segment-v18]').length===classes.length&&document.querySelectorAll('#tabMacroV22 [data-collapse-v19]').length===classes.length,
      editorReady:!!document.getElementById('holdingSegmentV17')&&!!document.getElementById('holdingMicroTargetV17'),
      uniqueDomIds:duplicates.length===0,
      finiteRendering:!/\b(?:NaN|undefined)\b/.test(text)
    }
  };
  result.ok=Object.values(result.checks).every(Boolean)&&result.runtimeReady&&result.oneTabVisible;
  document.documentElement.dataset.ponderaAllocationAudit=result.ok?'ok':'review';
  return result;
}

function scheduleAudit(ms=80){clearTimeout(auditTimer);auditTimer=setTimeout(()=>{try{audit();}catch(e){console.warn('[Pondera V2.14] Auditoria funcional incompleta.',e);}},ms);}

function boot(){
  ensureCss();ensureEditorFields();refreshEditorSuggestions();
  document.addEventListener('click',editCapture,true);
  document.addEventListener('submit',saveAssetEditor,true);
  document.getElementById('holdingClass')?.addEventListener('change',refreshEditorSuggestions);
  const kpis=document.getElementById('kpis');
  if(kpis){profitObserver=new MutationObserver(()=>scheduleProfit(0));profitObserver.observe(kpis,{childList:true,subtree:true,characterData:true});}
  if(typeof render==='function'&&!window.__PONDERA_V34_RENDER_WRAP__){window.__PONDERA_V34_RENDER_WRAP__=true;const previous=render;render=function(){const result=previous.apply(this,arguments);scheduleProfit(220);scheduleAudit(260);return result;};}
  window.addEventListener('pondera:tabchange',()=>{scheduleProfit(20);scheduleAudit(120);});
  window.addEventListener('hashchange',()=>{scheduleProfit(40);scheduleAudit(140);});
  window.PonderaReliabilityV34={version:VERSION,audit,openAssetEditor,enhanceProfitShare};
  window.__PONDERA_RELIABILITY_V34__=true;
  document.documentElement.dataset.ponderaReliability=VERSION;
  scheduleProfit(0);scheduleAudit(180);
}

let attempts=0;const wait=()=>{attempts++;if(typeof state==='undefined'||typeof render!=='function'||!window.PonderaLedgerV29||!document.getElementById('tabMacroV22')){if(attempts<500)setTimeout(wait,25);return;}boot();};wait();
})();
