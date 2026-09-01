function ensureProjectionLayoutV19(){
  const controls=document.getElementById('txBudgetControlsV16'),tx=document.getElementById('transactionsSection');if(!controls||!tx)return;
  controls.classList.add('txBudgetControlsV19');const source=controls.querySelector('.sourceControlV16');if(source)source.remove();
  if(!document.getElementById('microProjectionV19')){const div=document.createElement('div');div.id='microProjectionV19';div.className='microProjectionV19';controls.insertAdjacentElement('afterend',div);}
}
function renderTxSummaryV19(){
  const host=document.getElementById('txSummary');if(!host)return;const budget=Math.max(0,+state.contribution||0),planned=plannedTotal(),remaining=budget-planned,disp=typeof currentProjectedDispersion==='function'?currentProjectedDispersion():0,count=v14.pending.length;
  host.innerHTML=`<div class="txStat"><span>Aporte planejado</span><strong>${fmt.format(planned)}</strong></div><div class="txStat ${remaining<0?'bad':remaining>0?'warn':'good'}"><span>Saldo do orçamento</span><strong>${fmt.format(remaining)}</strong></div><div class="txStat"><span>Dispersão macro projetada</span><strong>${pct(disp)}</strong></div><div class="txStat"><span>Lançamentos simulados</span><strong>${count}</strong></div>`;
}
function projectionRowHtmlV19(r){
  const changed=Math.abs(r.post-r.current)>.005,cls=segmentStatusClassV18(r.status);return `<div class="projectionSegmentV19 ${cls}"><div class="projectionSegmentNameV19"><strong>${escapeHtml(r.name)}</strong><small>${fmt.format(r.postValue)}</small></div><div class="projectionNumbersV19"><span>${pct(r.current)}</span><b>→</b><strong class="${changed?'changed':''}">${pct(r.post)}</strong><em>alvo ${pct(r.target)}</em></div><div class="projectionTrackV19"><i class="current" style="width:${Math.min(100,Math.max(0,r.current))}%"></i><i class="post" style="width:${Math.min(100,Math.max(0,r.post))}%"></i></div></div>`;
}
function renderMicroProjectionV19(){
  ensureProjectionLayoutV19();const host=document.getElementById('microProjectionV19');if(!host)return;
  const cards=state.assets.map(a=>{const rows=projectedSegmentsV19(a.name),active=projectedClassHasActivityV19(a.name),postTotal=projectedClassTotalV19(a.name);return `<article class="projectionClassV19 ${active?'active':''}"><header><div><strong>${escapeHtml(a.name)}</strong><small>${active?'com simulação':'sem alteração simulada'}</small></div><span>${fmt.format(postTotal)}</span></header><div class="projectionSegmentsV19">${rows.length?rows.map(projectionRowHtmlV19).join(''):'<div class="projectionEmptyV19">Nenhum segmento planejado nesta classe.</div>'}</div></article>`;}).join('');
  host.innerHTML=`<div class="microProjectionHeaderV19"><div><h3>Micro alocação após o aporte ${infoV16('Compara o peso atual de cada segmento com o peso projetado depois dos lançamentos em simulação e com os alvos definidos em Micro alocação.')}</h3><p>Atual → pós-simulação, sempre comparado ao alvo setorial definido em cada classe.</p></div><span class="simulationStateV19 ${v14.pending.length?'active':''}">${v14.pending.length?v14.pending.length+' lançamento(s) em teste':'Sem simulação ativa'}</span></div><div class="microProjectionGridV19">${cards}</div>`;
}
