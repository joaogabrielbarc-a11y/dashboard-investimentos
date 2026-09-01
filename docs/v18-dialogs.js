function setupSegmentDialogV18(){
  if(document.getElementById('segmentDialogV18'))return;
  const d=document.createElement('dialog');d.id='segmentDialogV18';d.className='modal';
  d.innerHTML=`<form id="segmentFormV18" method="dialog" class="modalCard"><div class="modalHeader"><div><span class="eyebrow">DISTRIBUIÇÃO SETORIAL</span><h3 id="segmentDialogTitleV18">Adicionar segmento</h3></div><button type="button" class="iconButton" data-close-segment-v18>×</button></div><input id="segmentEditIdV18" type="hidden"><input id="segmentClassV18" type="hidden"><label>Classe<input id="segmentClassLabelV18" type="text" disabled></label><div class="modalGrid"><label>Segmento<input id="segmentNameV18" type="text" required placeholder="Ex.: Varejo"></label><label>Peso ideal (%)<input id="segmentTargetDialogV18" type="number" min="0" max="100" step="0.5" value="0"></label></div><div class="modalHelp">O segmento pode ficar com valor real zerado. Isso permite planejar setores que você pretende adicionar futuramente.</div><div class="modalActions"><button type="button" class="ghost" data-close-segment-v18>Cancelar</button><button type="submit" class="primary">Salvar segmento</button></div></form>`;
  document.body.appendChild(d);d.querySelectorAll('[data-close-segment-v18]').forEach(b=>b.onclick=()=>d.close());document.getElementById('segmentFormV18').onsubmit=saveSegmentDialogV18;
}
function openSegmentDialogV18(className,id=null){
  setupSegmentDialogV18();const plan=ensureSegmentPlanV18(className),seg=id?plan.find(s=>s.id===id):null;
  document.getElementById('segmentDialogTitleV18').textContent=seg?'Editar segmento':'Adicionar segmento';
  document.getElementById('segmentEditIdV18').value=seg?.id||'';document.getElementById('segmentClassV18').value=className;document.getElementById('segmentClassLabelV18').value=className;document.getElementById('segmentNameV18').value=seg?.name||'';document.getElementById('segmentTargetDialogV18').value=seg?.target??0;document.getElementById('segmentDialogV18').showModal();
}
function saveSegmentDialogV18(e){
  e.preventDefault();const className=document.getElementById('segmentClassV18').value,name=document.getElementById('segmentNameV18').value.trim(),target=Math.min(100,Math.max(0,+document.getElementById('segmentTargetDialogV18').value||0)),id=document.getElementById('segmentEditIdV18').value,plan=ensureSegmentPlanV18(className);if(!name)return;
  if(plan.some(s=>s.id!==id&&normSegmentV18(s.name)===normSegmentV18(name))){alert('Esse segmento já existe nesta classe.');return;}
  if(id){const seg=plan.find(s=>s.id===id);if(seg){const old=seg.name;seg.name=name;seg.target=target;holdingsForClassV18(className).filter(h=>normSegmentV18(h.segment)===normSegmentV18(old)).forEach(h=>h.segment=name);v14.pending.filter(t=>t.className===className&&normSegmentV18(t.segment)===normSegmentV18(old)).forEach(t=>t.segment=name);}}
  else plan.push({id:segmentIdV18(name),name,target});
  document.getElementById('segmentDialogV18').close();saveV18Plan();saveV14();save();render();
}
function removeSegmentV18(className,id){
  const plan=ensureSegmentPlanV18(className),seg=plan.find(s=>s.id===id);if(!seg)return;
  if(holdingsForClassV18(className).some(h=>normSegmentV18(h.segment)===normSegmentV18(seg.name))){alert('Esse segmento possui ativos. Mude o segmento dos ativos antes de excluí-lo.');return;}
  if(confirm(`Excluir “${seg.name}” do planejamento de ${className}?`)){v18Plan.segments[className]=plan.filter(s=>s.id!==id);saveV18Plan();render();}
}

function addSegmentSuggestionsV18(){
  const holding=document.getElementById('holdingSegmentV17'),tx=document.getElementById('txSegmentV17');
  if(holding&&!document.getElementById('holdingSegmentsListV18')){const dl=document.createElement('datalist');dl.id='holdingSegmentsListV18';document.body.appendChild(dl);holding.setAttribute('list',dl.id);document.getElementById('holdingClass')?.addEventListener('change',refreshSegmentSuggestionsV18);}
  if(tx&&!document.getElementById('txSegmentsListV18')){const dl=document.createElement('datalist');dl.id='txSegmentsListV18';document.body.appendChild(dl);tx.setAttribute('list',dl.id);document.getElementById('txClass')?.addEventListener('change',refreshSegmentSuggestionsV18);}
  refreshSegmentSuggestionsV18();
}
function refreshSegmentSuggestionsV18(){
  const hc=document.getElementById('holdingClass')?.value,tc=document.getElementById('txClass')?.value,hd=document.getElementById('holdingSegmentsListV18'),td=document.getElementById('txSegmentsListV18');
  if(hd&&hc)hd.innerHTML=ensureSegmentPlanV18(hc).map(s=>`<option value="${escapeAttr(s.name)}"></option>`).join('');
  if(td&&tc)td.innerHTML=ensureSegmentPlanV18(tc).map(s=>`<option value="${escapeAttr(s.name)}"></option>`).join('');
}
