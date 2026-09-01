const V16_PLAN_KEY='carteira-v16-planning';
function loadV16Plan(){let x=null;try{x=JSON.parse(localStorage.getItem(V16_PLAN_KEY)||'null')}catch(e){}return x&&typeof x==='object'?x:{suggestionApplied:false};}
let v16Plan=loadV16Plan();
function saveV16Plan(){localStorage.setItem(V16_PLAN_KEY,JSON.stringify(v16Plan));}
function simulationActiveV16(){return !!(window.v14&&Array.isArray(v14.pending)&&v14.pending.length);}
function planningModeV16(){return simulationActiveV16()?'simulation':(v16Plan.suggestionApplied?'suggestion':'none');}
function zeroAportesV16(){state.assets.forEach(a=>state.aportes[a.id]=0);}
function preparePlanningStateV16(){
  if(simulationActiveV16()){
    v16Plan.suggestionApplied=false;
    state.autoAportes=false;
    if(typeof syncPendingToMacro==='function')syncPendingToMacro();
  }else if(v16Plan.suggestionApplied){
    state.autoAportes=true;
  }else{
    state.autoAportes=false;
    zeroAportesV16();
  }
  saveV16Plan();
}
function infoV16(text){return typeof info==='function'?info(text):'';}
function ensurePlanningLayoutV16(){
  const contribution=document.querySelector('.contribution');
  const tx=document.getElementById('transactionsSection');
  const recommendation=document.querySelector('.recommendation');
  if(!tx||!recommendation)return;

  if(!document.getElementById('txBudgetControlsV16')){
    const holder=document.createElement('div');holder.id='txBudgetControlsV16';holder.className='txBudgetControlsV16';
    holder.innerHTML=`<div class="budgetControlV16"><span class="controlLabelV16">Aporte do mês ${infoV16('Orçamento total que você pretende investir no mês. Este valor alimenta a sugestão automática e serve de referência para a simulação de lançamentos.')}</span><div id="budgetInputHostV16"></div></div><div class="budgetControlV16"><span class="controlLabelV16">Saldo do aporte ${infoV16('Diferença entre o orçamento do mês e o total atualmente planejado. Valor negativo significa que o plano ultrapassou o orçamento.')}</span><div id="budgetBalanceHostV16"></div></div><div class="budgetControlV16 sourceControlV16"><span class="controlLabelV16">Origem do plano</span><div id="planningSourceV16" class="planningSourceV16"></div></div>`;
    const summary=document.getElementById('txSummary');tx.insertBefore(holder,summary||tx.children[1]||null);
  }
  if(!document.getElementById('distributionControlsV16')){
    const controls=document.createElement('div');controls.id='distributionControlsV16';controls.className='distributionControlsV16';
    controls.innerHTML=`<div class="distributionBandV16"><span>Banda de desbalanceamento ${infoV16('Tolerância aceita ao redor da meta de cada classe. As faixas calculadas aparecem ao lado dos nomes em Distribuição planejada.')}</span><div id="bandHostV16"></div></div><div id="applyHostV16" class="applyHostV16"></div>`;
    const priority=document.getElementById('priorityCard');recommendation.insertBefore(controls,priority||recommendation.children[1]||null);
  }

  const inputMoney=document.getElementById('contribution')?.closest('.inputMoney');
  const balance=document.getElementById('contributionBalance');
  const bandInput=document.getElementById('band')?.closest('.bandInput');
  const apply=document.getElementById('applySuggestion');
  if(inputMoney)document.getElementById('budgetInputHostV16').appendChild(inputMoney);
  if(balance)document.getElementById('budgetBalanceHostV16').appendChild(balance);
  if(bandInput)document.getElementById('bandHostV16').appendChild(bandInput);
  if(apply)document.getElementById('applyHostV16').appendChild(apply);
  if(contribution&&contribution.isConnected)contribution.remove();
}
function bindSuggestionButtonV16(){
  const btn=document.getElementById('applySuggestion');if(!btn)return;
  btn.onclick=()=>{
    if(simulationActiveV16())return;
    v16Plan.suggestionApplied=true;
    state.autoAportes=true;
    state.aportes={};
    saveV16Plan();save();render();
  };
}
function renderSourceV16(){
  const mode=planningModeV16(),host=document.getElementById('planningSourceV16'),btn=document.getElementById('applySuggestion');if(!host)return;
  const data=mode==='simulation'?['Simulação ativa','simulation','As compras testadas substituem integralmente a sugestão automática.']:mode==='suggestion'?['Sugestão aplicada','suggestion','A coluna Aporte foi preenchida pelo cálculo automático.']:['Sem plano aplicado','none','Use a sugestão ou adicione lançamentos para preencher a coluna Aporte.'];
  host.className=`planningSourceV16 ${data[1]}`;host.innerHTML=`<strong>${data[0]}</strong><small>${data[2]}</small>`;
  if(btn){btn.disabled=mode==='simulation';btn.textContent=mode==='simulation'?'Simulação sobrepõe a sugestão':mode==='suggestion'?'Recalcular sugestão':'Aplicar sugestão';}
}
function removeRangeColumnV16(){
  const table=document.querySelector('.tableCard table');if(!table)return;
  const head=[...table.querySelectorAll('thead th')];const faixa=head.find(th=>th.textContent.trim().startsWith('Faixa'));if(faixa)faixa.remove();
  table.querySelectorAll('#rows tr').forEach(tr=>{if(tr.children.length>=9&&tr.children[4])tr.children[4].remove();});
  const p=document.querySelector('.tableCard .sectionTitle p');if(p)p.innerHTML='Valores atuais são consolidados automaticamente pelos ativos. Metas permanecem editáveis; aportes são definidos somente pela sugestão ou pela simulação. <span class="macroAutoBadge">automático</span>';
}
function lockAporteColumnV16(){
  const mode=planningModeV16();
  document.querySelectorAll('#rows input[data-aporte]').forEach(input=>{
    const id=input.dataset.aporte,a=state.assets.find(x=>x.id===id),value=Math.max(0,+state.aportes[id]||0),wrap=input.closest('.cellInput'),td=wrap?.closest('td');if(!a||!td)return;
    const source=mode==='simulation'?'Simulação':mode==='suggestion'?'Sugestão':'—';
    td.innerHTML=`<div class="readonlyAporteV16 ${mode}"><strong>${fmt.format(value)}</strong><small>${source}</small></div>`;
  });
  const th=[...document.querySelectorAll('.tableCard thead th')].find(x=>x.textContent.trim().startsWith('Aporte'));
  if(th)th.innerHTML=`Aporte ${infoV16('Campo somente leitura. É preenchido pelo botão Aplicar sugestão ou pela soma das compras em simulação. Quando existe simulação, ela tem prioridade sobre a sugestão.')}`;
}
function rangeTextV16(row){return `(${pct(row.min)} – ${pct(row.max)})`;}
function enhanceDistributionRangesV16(){
  const rows=getRows(),byName=new Map(rows.map(r=>[r.name,r]));
  document.querySelectorAll('#ranking .rank').forEach(rank=>{
    const strong=rank.querySelector('div strong');if(!strong)return;
    const raw=strong.dataset.baseName||strong.textContent.trim();strong.dataset.baseName=raw;
    const row=byName.get(raw);if(!row)return;
    strong.innerHTML=`${escapeHtml(raw)} <span class="rangeInlineV16">${rangeTextV16(row)}</span>`;
  });
  const priority=document.getElementById('priorityCard');if(priority){const strong=priority.querySelector('strong');if(strong){const raw=strong.dataset.baseName||strong.textContent.trim();strong.dataset.baseName=raw;const row=byName.get(raw);if(row){const meta=priority.querySelector('.priorityMeta');if(meta&&!meta.querySelector('.priorityRangeV16'))meta.insertAdjacentHTML('beforeend',`<span class="priorityRangeV16">Faixa ${pct(row.min)} – ${pct(row.max)}</span>`);}}}
  }
  const note=document.querySelector('.recommendation .note p');if(note)note.textContent='A banda define a faixa aceitável de cada classe. “Aplicar sugestão” preenche a coluna Aporte automaticamente; se houver lançamentos em simulação, eles passam a ter prioridade.';
}
function renderTransactionSummaryV16(){
  const host=document.getElementById('txSummary');if(!host)return;
  const budget=Math.max(0,+state.contribution||0),planned=plannedTotal(),remaining=budget-planned,disp=typeof currentProjectedDispersion==='function'?currentProjectedDispersion():0,mode=planningModeV16();
  host.innerHTML=`<div class="txStat"><span>Aporte planejado</span><strong>${fmt.format(planned)}</strong></div><div class="txStat ${remaining<0?'bad':remaining>0?'warn':'good'}"><span>Saldo do orçamento</span><strong>${fmt.format(remaining)}</strong></div><div class="txStat"><span>Dispersão projetada</span><strong>${pct(disp)}</strong></div><div class="txStat"><span>Fonte</span><strong class="sourceTextV16 ${mode}">${mode==='simulation'?'Simulação':mode==='suggestion'?'Sugestão':'Nenhuma'}</strong></div>`;
}
function bindLifecycleV16(){
  const clear=document.getElementById('clearSimulation');if(clear&&!clear.dataset.v16Bound){clear.dataset.v16Bound='1';const old=clear.onclick;clear.onclick=function(e){const had=simulationActiveV16();if(old)old.call(this,e);setTimeout(()=>{if(had&&!simulationActiveV16()){v16Plan.suggestionApplied=false;saveV16Plan();preparePlanningStateV16();save();render();}},0);};}
  const execute=document.getElementById('executeTransactions');if(execute&&!execute.dataset.v16Bound){execute.dataset.v16Bound='1';const old=execute.onclick;execute.onclick=function(e){v16Plan.suggestionApplied=false;saveV16Plan();if(old)old.call(this,e);};}
}
function updateVersionV16(){const e=document.querySelector('.eyebrow');if(e)e.textContent='CARTEIRA • V1.6';}
function postRenderV16(){ensurePlanningLayoutV16();bindSuggestionButtonV16();bindLifecycleV16();renderSourceV16();removeRangeColumnV16();lockAporteColumnV16();enhanceDistributionRangesV16();renderTransactionSummaryV16();updateVersionV16();}

const renderBeforeV16=render;
render=function(){preparePlanningStateV16();renderBeforeV16();postRenderV16();save();};

function initV16(){if(!document.querySelector('link[href="v16.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='v16.css';document.head.appendChild(l);}preparePlanningStateV16();postRenderV16();save();render();}
initV16();