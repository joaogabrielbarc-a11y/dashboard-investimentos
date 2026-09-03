(()=>{
'use strict';

const V26_UI_KEY='pondera-v26-ui';
const V26_COLORS=['#3aa7e3','#62d3d8','#ffd65c','#ff956f','#d95ba6','#8c7cf0','#51c18b','#f0b35b','#6ba6ff','#a8d46f','#d18cff','#5bc4a8'];
let v26Ready=false;
let v26Applying=false;
let dividendDbV26={loaded:false,events:[],updatedAt:null};
let uiV26=loadUiV26();

function loadUiV26(){
  try{
    const x=JSON.parse(localStorage.getItem(V26_UI_KEY)||'null')||{};
    return {
      plannerOpen:x.plannerOpen||{},
      historyOpen:!!x.historyOpen,
      historyClassOpen:x.historyClassOpen||{},
      impactMicroOpen:!!x.impactMicroOpen,
      impactClassOpen:x.impactClassOpen||{},
      dividendMode:x.dividendMode==='annual'?'annual':'monthly',
      dividendRange:['year','12','24','all'].includes(x.dividendRange)?x.dividendRange:'12',
      dividendStatus:['Todos','Recebidos','A receber'].includes(x.dividendStatus)?x.dividendStatus:'Todos'
    };
  }catch(e){return {plannerOpen:{},historyOpen:false,historyClassOpen:{},impactMicroOpen:false,impactClassOpen:{},dividendMode:'monthly',dividendRange:'12',dividendStatus:'Todos'};}
}
function saveUiV26(){try{localStorage.setItem(V26_UI_KEY,JSON.stringify(uiV26));}catch(e){}}
function escV26(v){return typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function attrV26(v){return typeof escapeAttr==='function'?escapeAttr(String(v??'')):escV26(v);}
function moneyV26(v){return typeof fmt!=='undefined'&&fmt?.format&&Number.isFinite(Number(v))?fmt.format(Number(v)):'—';}
function pctV26(v,d=1){return Number.isFinite(Number(v))?`${Number(v).toFixed(d).replace('.',',')}%`:'—';}
function qtyV26(v){return Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:6});}
function normV26(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();}
function tickerV26(v){const t=String(v||'').trim().toUpperCase();return t==='BTC'?'BTCUSD':t;}
function isoV26(v){const s=String(v||'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:null;}
function todayV26(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function fxV26(){try{const x=typeof fxUsdBrlV20==='function'?fxUsdBrlV20():null;return Number.isFinite(+x)?+x:null;}catch(e){return null;}}
function ensureCssV26(){if(document.querySelector('link[href^="v26.css"]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='v26.css?v=26.0';document.head.appendChild(l);}

function updateBrandV26(){
  document.title='Pondera | Carteira';
  const h1=document.querySelector('.topbar h1');if(h1)h1.textContent='Pondera';
  const e=document.querySelector('.topbar .eyebrow');if(e)e.textContent='CARTEIRA • V2.6';
  const p=document.querySelector('.topbar p');if(p)p.textContent='Consolidação, alocação estruturada, aportes e proventos em uma única visão.';
}

function rowsV26(){return typeof getRows==='function'?getRows():[];}
function targetsV26(rows){return typeof normalizedTargets==='function'?normalizedTargets(rows):rows.map(r=>Number(r.target)||0);}
function dispersionV26(weights,targets){return typeof dispersionIndex==='function'?dispersionIndex(weights,targets):0;}
function pendingV26(){return typeof v14!=='undefined'&&Array.isArray(v14.pending)?v14.pending:[];}
function executedV26(){return typeof v14!=='undefined'&&Array.isArray(v14.executed)?v14.executed:[];}
function txBrlV26(t){
  if(t&&t.brlTotal!==null&&t.brlTotal!==undefined&&Number.isFinite(Number(t.brlTotal)))return Number(t.brlTotal);
  if(String(t?.currency||'BRL').toUpperCase()==='BRL'&&Number.isFinite(Number(t?.totalNative)))return Number(t.totalNative);
  const fx=Number(t?.fx)||fxV26();return Number.isFinite(Number(t?.totalNative))&&Number.isFinite(fx)?Number(t.totalNative)*fx:null;
}
function txSegmentV26(t){return String(t?.segment||'Sem segmento').trim()||'Sem segmento';}
function plannedTotalV26(){return typeof plannedTotal==='function'?plannedTotal():rowsV26().reduce((s,r)=>s+Math.max(0,Number(r.aporte)||0),0);}
function suggestionsV26(){return typeof getSuggestions==='function'?getSuggestions():{};}

function bindPatrimonyInteractionsV26(){
  const panel=document.getElementById('tabPatrimonioV22');if(!panel)return;
  const donut=panel.querySelector('#portfolioDistributionV24 .distributionDonutV24');
  const legendButtons=[...panel.querySelectorAll('#portfolioDistributionV24 .distributionLegendV24 button[data-drill-v24]')];
  if(donut&&legendButtons.length&&!donut.dataset.v26Interactive){
    donut.dataset.v26Interactive='1';donut.tabIndex=0;donut.setAttribute('role','button');donut.setAttribute('aria-label','Clique em uma fatia para abrir os ativos da classe');
    const activate=e=>{
      const rect=donut.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2,clientX=e.clientX??cx,clientY=e.clientY??(cy-rect.height*.35),dx=clientX-cx,dy=clientY-cy,dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<rect.width*.23)return;
      const items=(state.assets||[]).map(a=>({name:a.name,value:(state.holdings||[]).filter(h=>h.className===a.name&&(+h.qty||0)>1e-10).reduce((s,h)=>s+Math.max(0,+h.value||0),0)})).filter(x=>x.value>0),total=items.reduce((s,x)=>s+x.value,0);if(!total)return;
      const angle=(Math.atan2(dy,dx)*180/Math.PI+90+360)%360,point=angle/360;let acc=0,idx=-1;
      for(let i=0;i<items.length;i++){acc+=items[i].value/total;if(point<=acc){idx=i;break;}}
      if(idx>=0)legendButtons[idx]?.click();
    };
    donut.addEventListener('click',activate);donut.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();legendButtons[0]?.focus();}});
  }
  panel.querySelectorAll('.patrimonyAppliedV24,.patrimonyGainV24').forEach(r=>{if(r.dataset.v26Bar)return;r.dataset.v26Bar='1';r.style.cursor='pointer';r.addEventListener('click',()=>{panel.querySelectorAll('.patrimonyAppliedV24,.patrimonyGainV24').forEach(x=>x.classList.remove('v26BarSelected'));r.classList.add('v26BarSelected');});});
}

function activeHoldingsV26(){return (state.holdings||[]).filter(h=>(+h.qty||0)>1e-10&&(+h.value||0)>0);}
function renderAllocationPulseV26(){
  const panel=document.getElementById('tabMacroV22');if(!panel)return;
  let host=document.getElementById('allocationPulseV26');if(!host){host=document.createElement('section');host.id='allocationPulseV26';host.className='allocationPulseV26';}
  const intro=panel.querySelector('.tabIntroV22');if(intro&&intro.nextElementSibling!==host)intro.insertAdjacentElement('afterend',host);
  const holdings=activeHoldingsV26(),total=holdings.reduce((s,h)=>s+Math.max(0,+h.value||0),0),top=[...holdings].sort((a,b)=>(+b.value||0)-(+a.value||0)).slice(0,3);
  const rows=rowsV26(),behind=rows.map(r=>({...r,deficit:(Number(r.target)||0)-(Number(r.currentWeight)||0)})).filter(r=>r.deficit>0.001).sort((a,b)=>b.deficit-a.deficit).slice(0,3);
  const targets=targetsV26(rows),disp=dispersionV26(rows.map(r=>Number(r.currentWeight)||0),targets),band=Math.max(0,Number(state.band)||0),ok=disp<=band;
  host.innerHTML=`
    <article class="card pulseCardV26"><div class="pulseTitleV26"><span>MAIORES POSIÇÕES</span><strong>Top 3 ativos</strong></div><div class="pulseRowsV26">${top.length?top.map((h,i)=>`<div><b>${i+1}</b><span><strong>${escV26(h.ticker)}</strong><small>${escV26(h.className||'')}</small></span><em>${pctV26(total?(+h.value||0)/total*100:0,2)}</em></div>`).join(''):'<p class="pulseEmptyV26">Sem posições.</p>'}</div></article>
    <article class="card pulseCardV26"><div class="pulseTitleV26"><span>MAIOR DEFASAGEM</span><strong>Classes mais para trás</strong></div><div class="pulseRowsV26">${behind.length?behind.map((r,i)=>`<div><b>${i+1}</b><span><strong>${escV26(r.name)}</strong><small>${pctV26(r.currentWeight)} atual • ${pctV26(r.target)} alvo</small></span><em class="negative">-${pctV26(r.deficit,2)} p.p.</em></div>`).join(''):'<p class="pulseEmptyV26">Nenhuma classe abaixo do alvo.</p>'}</div></article>
    <article class="card pulseCardV26 dispersionPulseV26 ${ok?'good':'bad'}"><div class="pulseTitleV26"><span>ADERÊNCIA À ESTRATÉGIA</span><strong>Índice de dispersão</strong></div><div class="dispersionMainV26"><strong>${pctV26(disp,2)}</strong><span class="pill ${ok?'ok':'warn'}">${ok?'Dentro da banda':'Fora da banda'}</span></div><div class="dispersionMetaV26"><span>Banda global <b>±${pctV26(band,0)}</b></span><span>${ok?'Estrutura dentro da tolerância definida.':'Priorize classes mais defasadas.'}</span></div></article>`;
  document.getElementById('allocationHealthV24')?.classList.add('v26Hidden');
}
function ensureMacroBandSelectorV26(){
  const macro=document.getElementById('allocationMacroSnapshotV23');if(!macro)return;
  const actions=macro.querySelector('.allocationMacroActionsV25,.sectionActions');if(!actions)return;
  let wrap=actions.querySelector('.macroBandV26');if(!wrap){wrap=document.createElement('label');wrap.className='macroBandV26';actions.insertBefore(wrap,actions.firstChild);}
  wrap.innerHTML=`<span>Banda geral</span><div><b>±</b><input id="macroBandInputV26" type="number" min="0" max="100" step="1" value="${Math.max(0,Number(state.band)||0)}"><b>%</b></div>`;
  wrap.querySelector('input').onchange=e=>{const value=Math.min(100,Math.max(0,Number(e.target.value)||0));state.band=value;const old=document.getElementById('band');if(old)old.value=value;save();render();};
  macro.querySelector('.allocationBandEditorV25')?.classList.add('v26Hidden');
}

function segmentRowsSafeV26(className){try{return typeof segmentRowsV18==='function'?segmentRowsV18(className):[];}catch(e){return [];}}
function classTotalSafeV26(className){try{return typeof classTotalV18==='function'?classTotalV18(className):(state.holdings||[]).filter(h=>h.className===className).reduce((s,h)=>s+Math.max(0,+h.value||0),0);}catch(e){return 0;}}
function microSuggestionV26(className,budget){
  const rows=segmentRowsSafeV26(className).filter(r=>(Number(r.target)||0)>0||(Number(r.value)||0)>0),currentTotal=classTotalSafeV26(className),b=Math.max(0,Number(budget)||0),targetSum=rows.reduce((s,r)=>s+Math.max(0,Number(r.target)||0),0),future=currentTotal+b;
  const plannedBySeg={};pendingV26().filter(t=>t.className===className&&t.side==='Compra').forEach(t=>{const v=txBrlV26(t);if(!Number.isFinite(v))return;const key=normV26(txSegmentV26(t));plannedBySeg[key]=(plannedBySeg[key]||0)+v;});
  if(!rows.length)return [];
  const ideal=rows.map(r=>{const normalized=targetSum>0?Math.max(0,Number(r.target)||0)/targetSum:0;return {...r,normalized,gap:Math.max(0,future*normalized-Math.max(0,Number(r.value)||0))};});
  const gapSum=ideal.reduce((s,r)=>s+r.gap,0);
  return ideal.map(r=>{const suggested=b>0?(gapSum>1e-9?b*r.gap/gapSum:b*r.normalized):0,launched=plannedBySeg[normV26(r.name)]||0;return {...r,suggested,launched,remaining:Math.max(0,suggested-launched)};});
}
function renderContributionPlannerV26(){
  const panel=document.getElementById('tabMicroV22');if(!panel)return;
  let card=document.getElementById('contributionPlannerV26');if(!card){card=document.createElement('section');card.id='contributionPlannerV26';card.className='card contributionPlannerV26';}
  const intro=panel.querySelector('.tabIntroV22');if(intro&&intro.nextElementSibling!==card)intro.insertAdjacentElement('afterend',card);
  const rows=rowsV26(),suggestions=suggestionsV26(),budget=Math.max(0,Number(state.contribution)||0),pending=pendingV26(),pendingTotal=pending.filter(t=>t.side==='Compra').reduce((s,t)=>s+(txBrlV26(t)||0),0);
  card.innerHTML=`<div class="plannerHeadV26"><div><span class="tabEyebrowV22">AUTOMAÇÃO DE APORTES</span><h2>Distribuição planejada</h2><p>Otimize primeiro a macro alocação e, ao expandir uma classe, veja a distribuição sugerida entre os segmentos.</p></div><div class="plannerActionsV26"><span>Orçamento <strong>${moneyV26(budget)}</strong></span><button type="button" id="applyPlannerV26" class="primary compactPrimary">Aplicar sugestão macro</button></div></div><div class="plannerSummaryV26"><span>Ideal macro <strong>${moneyV26(Object.values(suggestions).reduce((s,v)=>s+(Number(v)||0),0))}</strong></span><span>Lançado na simulação <strong>${moneyV26(pendingTotal)}</strong></span><span>Falta lançar <strong>${moneyV26(Math.max(0,budget-pendingTotal))}</strong></span></div><div class="plannerRowsV26">${rows.map((r,i)=>{const ideal=Math.max(0,Number(suggestions[r.id])||0),launched=pending.filter(t=>t.className===r.name&&t.side==='Compra').reduce((s,t)=>s+(txBrlV26(t)||0),0),remaining=Math.max(0,ideal-launched),open=!!uiV26.plannerOpen[r.name],micro=microSuggestionV26(r.name,ideal);return `<article class="plannerClassV26 ${open?'open':''}"><button type="button" class="plannerClassHeadV26" data-planner-class-v26="${attrV26(r.name)}"><i style="background:${typeof colorForIndex==='function'?colorForIndex(i):V26_COLORS[i%V26_COLORS.length]}"></i><span class="plannerClassNameV26"><strong>${escV26(r.name)}</strong><small>${pctV26(r.currentWeight)} atual • ${pctV26(r.target)} alvo</small></span><span><small>Aporte ideal</small><strong>${moneyV26(ideal)}</strong></span><span><small>Lançado</small><strong>${moneyV26(launched)}</strong></span><span><small>Falta</small><strong>${moneyV26(remaining)}</strong></span><b>${open?'▾':'▸'}</b></button><div class="plannerMicroV26"><div class="plannerMicroHeadV26"><span>Otimização micro por segmento</span><small>Valores sugeridos dentro do aporte ideal da classe.</small></div>${micro.length?micro.map(m=>`<div class="plannerMicroRowV26"><span><strong>${escV26(m.name)}</strong><small>${pctV26(m.real)} atual • ${pctV26(m.target)} alvo</small></span><span><small>Ideal</small><b>${moneyV26(m.suggested)}</b></span><span><small>Lançado</small><b>${moneyV26(m.launched)}</b></span><span><small>Falta</small><b>${moneyV26(m.remaining)}</b></span></div>`).join(''):'<div class="emptyState compactEmptyV18">Defina segmentos e metas nesta classe para ativar o otimizador micro.</div>'}</div></article>`;}).join('')||'<div class="emptyState">Nenhuma classe cadastrada.</div>'}</div>`;
  card.querySelector('#applyPlannerV26').onclick=()=>{const btn=document.getElementById('applySuggestion');if(btn)btn.click();else{state.autoAportes=true;state.aportes={};try{save();}catch(e){}render();}};
  card.querySelectorAll('[data-planner-class-v26]').forEach(b=>b.onclick=()=>{const name=b.dataset.plannerClassV26;uiV26.plannerOpen[name]=!uiV26.plannerOpen[name];saveUiV26();renderContributionPlannerV26();});
}

function ensureSimulatorV26(){
  const panel=document.getElementById('tabMicroV22'),tx=document.getElementById('transactionsSection');if(!panel||!tx)return;
  const planner=document.getElementById('contributionPlannerV26');if(planner&&planner.nextElementSibling!==tx)planner.insertAdjacentElement('afterend',tx);
  document.getElementById('macroBudgetCardV22')?.classList.add('v26Hidden');
  panel.querySelector('.recommendation')?.classList.add('v26Hidden');
  const oldSummary=document.getElementById('txSummary');if(oldSummary)oldSummary.classList.add('v26Hidden');
  const oldControls=document.getElementById('txBudgetControlsV16');if(oldControls)oldControls.classList.add('v26ControlsHidden');
  document.getElementById('microProjectionV19')?.classList.add('v26Hidden');
  const title=tx.querySelector('.sectionTitle h2');if(title)title.childNodes[0].nodeValue='Simulador de aportes ';
  const sub=tx.querySelector('.sectionTitle p');if(sub)sub.textContent='Edite o orçamento e lance as compras abaixo. Os valores calculados são atualizados automaticamente.';
  let kpis=document.getElementById('simulatorKpisV26');if(!kpis){kpis=document.createElement('div');kpis.id='simulatorKpisV26';kpis.className='simulatorKpisV26';const firstTable=tx.querySelector('.tableWrap');tx.insertBefore(kpis,firstTable||oldSummary||null);kpis.innerHTML=`<div class="simKpiV26 editable"><span>Orçamento de aportes</span><div id="budgetInputV26"></div><small>Editável</small></div><div class="simKpiV26 calculated"><span>Aporte planejado</span><strong id="simPlannedV26">—</strong><small>Calculado</small></div><div class="simKpiV26 calculated"><span>Saldo do orçamento</span><strong id="simBalanceV26">—</strong><small>Calculado</small></div><div class="simKpiV26 calculated"><span>Dispersão macro após aporte</span><strong id="simDispV26">—</strong><small>Calculado</small></div><div class="simKpiV26 calculated"><span>Simulações</span><strong id="simCountV26">0</strong><small>Lançamentos em teste</small></div>`;}
  const input=document.getElementById('contribution'),moneyWrap=input?.closest('.inputMoney');if(moneyWrap&&moneyWrap.parentElement?.id!=='budgetInputV26')document.getElementById('budgetInputV26')?.appendChild(moneyWrap);
  const rows=rowsV26(),planned=plannedTotalV26(),balance=Math.max(0,Number(state.contribution)||0)-planned,disp=dispersionV26(rows.map(r=>Number(r.postWeight)||0),targetsV26(rows));
  const p=document.getElementById('simPlannedV26'),b=document.getElementById('simBalanceV26'),d=document.getElementById('simDispV26'),c=document.getElementById('simCountV26');if(p)p.textContent=moneyV26(planned);if(b){b.textContent=moneyV26(balance);b.className=balance<0?'negative':balance>0?'warning':'positive';}if(d)d.textContent=pctV26(disp,2);if(c)c.textContent=String(pendingV26().length);
}

function txMoneyNativeV26(t){const cur=String(t?.currency||'BRL').toUpperCase(),v=Number(t?.totalNative)||0;return cur==='USD'?`US$ ${v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}`:moneyV26(v);}
function renderHistoryGroupsV26(){
  const block=document.querySelector('#transactionsSection .historyBlock');if(!block)return;
  const original=block.querySelector('.tableWrap');if(original)original.classList.add('v26Hidden');
  let host=document.getElementById('historyGroupsV26');if(!host){host=document.createElement('div');host.id='historyGroupsV26';host.className='historyGroupsV26';block.appendChild(host);}
  const toggle=document.getElementById('toggleHistory');if(toggle){toggle.textContent=uiV26.historyOpen?'Minimizar histórico':'Expandir histórico';toggle.onclick=()=>{uiV26.historyOpen=!uiV26.historyOpen;saveUiV26();renderHistoryGroupsV26();};}
  host.classList.toggle('v26Hidden',!uiV26.historyOpen);if(!uiV26.historyOpen){host.innerHTML='';return;}
  const rows=executedV26().slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))),groups=new Map();rows.forEach(t=>{const c=t.className||'Sem classe';if(!groups.has(c))groups.set(c,[]);groups.get(c).push(t);});
  host.innerHTML=[...groups.entries()].map(([className,items])=>{const open=!!uiV26.historyClassOpen[className],total=items.filter(t=>t.side==='Compra').reduce((s,t)=>s+(txBrlV26(t)||0),0);return `<section class="historyClassV26 ${open?'open':''}"><button type="button" class="historyClassHeadV26" data-history-class-v26="${attrV26(className)}"><span><strong>${escV26(className)}</strong><small>${items.length} lançamento(s) • compras ${moneyV26(total)}</small></span><b>${open?'▾':'▸'}</b></button><div class="historyClassBodyV26"><div class="tableWrap"><table><thead><tr><th>Ativo</th><th>Ordem</th><th>Quantidade</th><th>Preço unitário</th><th>Total</th><th>Segmento</th><th>Data</th></tr></thead><tbody>${items.map(t=>`<tr><td><strong>${escV26(t.ticker)}</strong></td><td><span class="txSide ${t.side==='Compra'?'buy':'sell'}">${escV26(t.side)}</span></td><td>${qtyV26(t.qty)}</td><td>${String(t.currency||'BRL').toUpperCase()==='USD'?`US$ ${Number(t.unitPrice||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}`:moneyV26(t.unitPrice)}</td><td><strong>${txMoneyNativeV26(t)}</strong>${String(t.currency||'BRL').toUpperCase()==='USD'&&Number.isFinite(txBrlV26(t))?`<small class="currencyNote">${moneyV26(txBrlV26(t))} em BRL</small>`:''}</td><td>${escV26(txSegmentV26(t))}</td><td>${escV26(typeof dateBr==='function'?dateBr(t.date):t.date||'—')}</td></tr>`).join('')}</tbody></table></div></div></section>`;}).join('')||'<div class="emptyState">Nenhum lançamento executado.</div>';
  host.querySelectorAll('[data-history-class-v26]').forEach(b=>b.onclick=()=>{const c=b.dataset.historyClassV26;uiV26.historyClassOpen[c]=!uiV26.historyClassOpen[c];saveUiV26();renderHistoryGroupsV26();});
}

function pendingSignedBySegmentV26(className){const map={};pendingV26().filter(t=>t.className===className).forEach(t=>{const v=txBrlV26(t);if(!Number.isFinite(v))return;const k=normV26(txSegmentV26(t));map[k]=(map[k]||0)+(t.side==='Venda'?-v:v);});return map;}
function projectedMicroV26(className){
  const rows=segmentRowsSafeV26(className),delta=pendingSignedBySegmentV26(className),currentTotal=classTotalSafeV26(className),classDelta=Object.values(delta).reduce((s,v)=>s+v,0),postTotal=Math.max(0,currentTotal+classDelta),band=(typeof classBandV18==='function'?classBandV18(className):Number(state.band)||0)/100;
  return rows.map(r=>{const d=delta[normV26(r.name)]||0,postValue=Math.max(0,(Number(r.value)||0)+d),post=postTotal?postValue/postTotal*100:0,target=Math.max(0,Number(r.target)||0),min=Math.max(0,target*(1-band)),max=target*(1+band),before=target>0&&(Number(r.real)||0)>=min&&(Number(r.real)||0)<=max,after=target>0&&post>=min&&post<=max;return {...r,delta:d,postValue,post,min,max,before,after};});
}
function renderContributionImpactV26(){
  const panel=document.getElementById('tabMicroV22'),tx=document.getElementById('transactionsSection');if(!panel||!tx)return;
  document.getElementById('contributionImpactV25')?.classList.add('v26Hidden');
  const layout=panel.querySelector('.layout');if(layout)layout.classList.add('v26LegacyLayout');
  let card=document.getElementById('contributionImpactV26');if(!card){card=document.createElement('section');card.id='contributionImpactV26';card.className='card contributionImpactV26';tx.insertAdjacentElement('afterend',card);}
  const rows=rowsV26(),planned=plannedTotalV26(),postPat=(typeof totalAtual==='function'?totalAtual():rows.reduce((s,r)=>s+(Number(r.current)||0),0))+planned,disp=dispersionV26(rows.map(r=>Number(r.postWeight)||0),targetsV26(rows));
  card.innerHTML=`<div class="impactHeaderV26"><div><span class="tabEyebrowV22">EFEITO DO PLANO</span><h2>Impacto dos aportes</h2><p>Macro alocação projetada com o plano atual e detalhamento micro opcional.</p></div><div class="impactMetricsV26"><span><small>Aporte planejado</small><strong>${moneyV26(planned)}</strong></span><span><small>Patrimônio após aporte</small><strong>${moneyV26(postPat)}</strong></span><span><small>Dispersão macro após aporte</small><strong>${pctV26(disp,2)}</strong></span></div></div><div class="impactMacroRowsV26">${rows.map((r,i)=>{const delta=(Number(r.postWeight)||0)-(Number(r.currentWeight)||0);return `<div class="impactMacroRowV26"><i style="background:${typeof colorForIndex==='function'?colorForIndex(i):V26_COLORS[i%V26_COLORS.length]}"></i><span><strong>${escV26(r.name)}</strong><small>${moneyV26(r.aporte)} de aporte</small></span><b>${pctV26(r.currentWeight)} → ${pctV26(r.postWeight)}</b><em class="${delta>0?'positive':delta<0?'negative':''}">${delta>0?'+':''}${pctV26(delta,2)} p.p.</em><span class="pill ${r.postBalanced?'ok':'warn'}">${r.postBalanced?'Dentro da banda':'Fora da banda'}</span></div>`;}).join('')}</div><section class="impactMicroSectionV26 ${uiV26.impactMicroOpen?'open':''}"><button type="button" id="toggleImpactMicroV26" class="impactMicroToggleV26"><span><strong>Micro alocação após o aporte</strong><small>Compare a situação de cada segmento antes e depois das simulações.</small></span><b>${uiV26.impactMicroOpen?'▾':'▸'}</b></button><div class="impactMicroBodyV26">${rows.map(r=>{const micro=projectedMicroV26(r.name),eligible=micro.filter(x=>(Number(x.target)||0)>0),before=eligible.filter(x=>x.before).length,after=eligible.filter(x=>x.after).length,open=!!uiV26.impactClassOpen[r.name];return `<article class="impactMicroClassV26 ${open?'open':''}"><button type="button" class="impactMicroClassHeadV26" data-impact-class-v26="${attrV26(r.name)}"><span><strong>${escV26(r.name)}</strong><small>Na banda: ${before}/${eligible.length} antes → ${after}/${eligible.length} após</small></span><b>${open?'▾':'▸'}</b></button><div class="impactMicroClassBodyV26"><div class="tableWrap"><table><thead><tr><th>Segmento</th><th>Atual</th><th>Pós-aporte</th><th>Alvo</th><th>Movimento</th><th>Antes</th><th>Depois</th></tr></thead><tbody>${micro.length?micro.map(m=>`<tr><td><strong>${escV26(m.name)}</strong></td><td>${pctV26(m.real)}</td><td><strong>${pctV26(m.post)}</strong></td><td>${pctV26(m.target)}</td><td>${m.delta>=0?'+':''}${moneyV26(m.delta)}</td><td><span class="pill ${m.before?'ok':'warn'}">${m.before?'Na banda':'Fora'}</span></td><td><span class="pill ${m.after?'ok':'warn'}">${m.after?'Na banda':'Fora'}</span></td></tr>`).join(''):`<tr><td colspan="7"><div class="emptyState">Nenhum segmento configurado.</div></td></tr>`}</tbody></table></div></div></article>`;}).join('')}</div></section>`;
  card.querySelector('#toggleImpactMicroV26').onclick=()=>{uiV26.impactMicroOpen=!uiV26.impactMicroOpen;saveUiV26();renderContributionImpactV26();};
  card.querySelectorAll('[data-impact-class-v26]').forEach(b=>b.onclick=()=>{const c=b.dataset.impactClassV26;uiV26.impactClassOpen[c]=!uiV26.impactClassOpen[c];saveUiV26();renderContributionImpactV26();});
}

function firstContributionDateV26(){return executedV26().filter(t=>t.side==='Compra'&&isoV26(t.date)).map(t=>isoV26(t.date)).sort()[0]||null;}
function historyForTickerStrictV26(ticker){const key=tickerV26(ticker);return executedV26().filter(t=>tickerV26(t.ticker)===key&&(+t.qty||0)>0&&isoV26(t.date)).sort((a,b)=>String(a.date).localeCompare(String(b.date)));}
function qtyAtHistoryV26(ticker,date,exclusive=false){const d=isoV26(date);if(!d)return 0;let q=0;historyForTickerStrictV26(ticker).forEach(t=>{const td=isoV26(t.date);if(!td||(exclusive?td>=d:td>d))return;const n=Math.max(0,Number(t.qty)||0);q+=t.side==='Venda'?-n:n;});return Math.max(0,q);}
function tickerMetaV26(ticker){const key=tickerV26(ticker),holding=(state.holdings||[]).find(h=>tickerV26(h.ticker)===key),hist=historyForTickerStrictV26(key),last=hist[hist.length-1];return {name:holding?.name||last?.name||key,className:holding?.className||last?.className||''};}
function dividendRowsStrictV26(){
  if(!dividendDbV26.loaded)return [];const first=firstContributionDateV26();if(!first)return [];
  const tickers=new Set(executedV26().filter(t=>t.side==='Compra').map(t=>tickerV26(t.ticker))),today=todayV26(),fx=fxV26(),out=[];
  dividendDbV26.events.forEach(e=>{const key=tickerV26(e.ticker);if(!tickers.has(key))return;const ex=isoV26(e.exDate),pay=isoV26(e.paymentDate),eligibility=ex||pay;if(!eligibility||eligibility<first)return;const future=eligibility>today,cutoff=future?today:eligibility,qty=qtyAtHistoryV26(key,cutoff,!!ex&&!future);if(qty<=1e-10)return;const amount=Math.max(0,Number(e.amount)||0),currency=String(e.currency||'BRL').toUpperCase(),nativeTotal=qty*amount,brlTotal=currency==='USD'?(Number.isFinite(fx)?nativeTotal*fx:null):nativeTotal,meta=tickerMetaV26(key),status=pay&&pay<=today?'Recebido':'A receber';out.push({...e,ticker:key,holdingName:meta.name,className:meta.className,qtyEligible:qty,historyBased:true,futureEstimate:future,nativeTotal,brlTotal,status});});return out;
}
function dividendMetricsStrictV26(){const rows=dividendRowsStrictV26(),today=todayV26(),year=today.slice(0,4),d12=new Date();d12.setMonth(d12.getMonth()-12);const start=`${d12.getFullYear()}-${String(d12.getMonth()+1).padStart(2,'0')}-${String(d12.getDate()).padStart(2,'0')}`,finite=r=>Number.isFinite(Number(r.brlTotal));return {rows,receivedYear:rows.filter(r=>r.status==='Recebido'&&String(r.paymentDate||'').startsWith(year)&&finite(r)).reduce((s,r)=>s+Number(r.brlTotal),0),received12:rows.filter(r=>r.status==='Recebido'&&r.paymentDate>=start&&r.paymentDate<=today&&finite(r)).reduce((s,r)=>s+Number(r.brlTotal),0),receivedTotal:rows.filter(r=>r.status==='Recebido'&&finite(r)).reduce((s,r)=>s+Number(r.brlTotal),0),upcoming:rows.filter(r=>r.status==='A receber'&&finite(r)).reduce((s,r)=>s+Number(r.brlTotal),0),next:rows.filter(r=>r.status==='A receber'&&isoV26(r.paymentDate)).sort((a,b)=>String(a.paymentDate).localeCompare(String(b.paymentDate)))[0]||null};}
function monthKeyV26(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
function monthLabelV26(k){const [y,m]=k.split('-');return `${m}/${String(y).slice(2)}`;}
function dividendKeysV26(rows){const dates=rows.map(r=>isoV26(r.paymentDate)).filter(Boolean).sort(),now=new Date();if(uiV26.dividendMode==='annual'){const first=firstContributionDateV26()?.slice(0,4)||String(now.getFullYear());const last=dates.at(-1)?.slice(0,4)||String(now.getFullYear());const out=[];for(let y=Number(first);y<=Number(last);y++)out.push(String(y));return out;}if(uiV26.dividendRange==='year'){const y=String(now.getFullYear());return Array.from({length:12},(_,i)=>`${y}-${String(i+1).padStart(2,'0')}`);}if(uiV26.dividendRange==='all'){const first=(firstContributionDateV26()||todayV26()).slice(0,7),last=(dates.at(-1)||todayV26()).slice(0,7);let [y,m]=first.split('-').map(Number),[ey,em]=last.split('-').map(Number),out=[];while(y<ey||(y===ey&&m<=em)){out.push(`${y}-${String(m).padStart(2,'0')}`);m++;if(m>12){m=1;y++;}if(out.length>120)break;}return out;}const n=Number(uiV26.dividendRange)||12;return Array.from({length:n},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-(n-1-i),1);return monthKeyV26(d);});}
function renderDividendChartV26(rows){const host=document.getElementById('dividendChartV22'),foot=document.getElementById('dividendChartFootV22');if(!host)return;const keys=dividendKeysV26(rows),map=new Map(keys.map(k=>[k,{received:0,upcoming:0}]));rows.filter(r=>isoV26(r.paymentDate)&&Number.isFinite(Number(r.brlTotal))).forEach(r=>{const k=uiV26.dividendMode==='annual'?r.paymentDate.slice(0,4):r.paymentDate.slice(0,7);if(map.has(k))map.get(k)[r.status==='Recebido'?'received':'upcoming']+=Number(r.brlTotal);});const data=keys.map(k=>({key:k,label:uiV26.dividendMode==='annual'?k:monthLabelV26(k),...(map.get(k)||{received:0,upcoming:0})}));if(!data.length){host.innerHTML='<div class="chartEmptyV22">Nenhum provento encontrado no histórico.</div>';return;}const W=1000,H=310,left=80,right=20,top=22,bottom=52,pw=W-left-right,ph=H-top-bottom,max=Math.max(...data.map(d=>d.received+d.upcoming),1)*1.12,slot=pw/data.length,bw=Math.max(12,Math.min(50,slot*.58));let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Proventos históricos"><g font-family="Inter,system-ui,sans-serif">`;for(let i=0;i<=4;i++){const val=max*(4-i)/4,y=top+ph*i/4;svg+=`<line x1="${left}" y1="${y}" x2="${W-right}" y2="${y}" stroke="#20344d"/><text x="${left-10}" y="${y+4}" text-anchor="end" fill="#8da3bd" font-size="11">${val>=1000?`R$ ${(val/1000).toFixed(1).replace('.',',')}k`:`R$ ${Math.round(val)}`}</text>`;}data.forEach((d,i)=>{const x=left+slot*i+slot/2,rv=d.received/max*ph,uv=d.upcoming/max*ph,y0=top+ph;svg+=`<rect x="${x-bw/2}" y="${y0-rv}" width="${bw}" height="${rv}" rx="4" fill="#30b77b"><title>${d.label}: recebidos ${moneyV26(d.received)}</title></rect><rect x="${x-bw/2}" y="${y0-rv-uv}" width="${bw}" height="${uv}" rx="4" fill="#8ee2bd" opacity=".86"><title>${d.label}: a receber ${moneyV26(d.upcoming)}</title></rect>`;if(data.length<=18||i%Math.ceil(data.length/14)===0)svg+=`<text x="${x}" y="${H-18}" text-anchor="middle" fill="#8da3bd" font-size="11" transform="rotate(-35 ${x} ${H-18})">${d.label}</text>`;});svg+='</g></svg>';host.innerHTML=svg;const rec=data.reduce((s,d)=>s+d.received,0),up=data.reduce((s,d)=>s+d.upcoming,0);if(foot)foot.innerHTML=`Histórico exibido: <strong>${moneyV26(rec)}</strong> recebidos • <strong>${moneyV26(up)}</strong> a receber. Quantidades reconstruídas exclusivamente pelos lançamentos executados.`;}
function renderDividendsV26(){
  const panel=document.getElementById('tabProventosV22');if(!panel||!dividendDbV26.loaded)return;const m=dividendMetricsStrictV26(),first=firstContributionDateV26();
  const kpis=document.getElementById('dividendKpisV22');if(kpis)kpis.innerHTML=`<article class="card dividendKpiV22"><span>Recebidos em ${todayV26().slice(0,4)}</span><strong>${moneyV26(m.receivedYear)}</strong><small>histórico de quantidades</small></article><article class="card dividendKpiV22"><span>A receber</span><strong>${moneyV26(m.upcoming)}</strong><small>eventos já mapeados</small></article><article class="card dividendKpiV22"><span>Recebidos 12 meses</span><strong>${moneyV26(m.received12)}</strong><small>desde posições elegíveis</small></article><article class="card dividendKpiV22"><span>Primeiro aporte</span><strong>${first?first.split('-').reverse().join('/'):'—'}</strong><small>início da contabilização</small></article>`;
  const monthly=document.getElementById('divModeMonthlyV22'),annual=document.getElementById('divModeAnnualV22'),range=document.getElementById('divRangeV22'),status=document.getElementById('divStatusV22');if(monthly){monthly.classList.toggle('active',uiV26.dividendMode==='monthly');monthly.onclick=()=>{uiV26.dividendMode='monthly';saveUiV26();renderDividendsV26();};}if(annual){annual.classList.toggle('active',uiV26.dividendMode==='annual');annual.onclick=()=>{uiV26.dividendMode='annual';saveUiV26();renderDividendsV26();};}if(range){range.value=uiV26.dividendRange;range.disabled=uiV26.dividendMode==='annual';range.onchange=e=>{uiV26.dividendRange=e.target.value;saveUiV26();renderDividendsV26();};}if(status){status.value=uiV26.dividendStatus;status.onchange=e=>{uiV26.dividendStatus=e.target.value;saveUiV26();renderDividendsV26();};}
  renderDividendChartV26(m.rows);
  const body=document.getElementById('dividendRowsV22'),cov=document.getElementById('dividendCoverageV22');let rows=m.rows;if(uiV26.dividendStatus==='Recebidos')rows=rows.filter(r=>r.status==='Recebido');if(uiV26.dividendStatus==='A receber')rows=rows.filter(r=>r.status==='A receber');rows.sort((a,b)=>a.status!==b.status?(a.status==='A receber'?-1:1):(a.status==='A receber'?String(a.paymentDate||'9999').localeCompare(String(b.paymentDate||'9999')):String(b.paymentDate||'').localeCompare(String(a.paymentDate||''))));if(body)body.innerHTML=rows.length?rows.map(r=>`<tr><td><div class="divAssetV22"><strong>${escV26(r.ticker)}</strong><small>${escV26(r.holdingName||'')}</small></div></td><td><span class="classBadge">${escV26(r.className||'—')}</span></td><td>${escV26(r.type||'Provento')}</td><td>${escV26(r.exDate?String(r.exDate).slice(0,10).split('-').reverse().join('/'):'—')}</td><td>${escV26(r.paymentDate?String(r.paymentDate).slice(0,10).split('-').reverse().join('/'):'—')}</td><td>${String(r.currency||'BRL').toUpperCase()==='USD'?`US$ ${Number(r.amount||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:6})}`:`R$ ${Number(r.amount||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:6})}`}</td><td>${qtyV26(r.qtyEligible)}<small class="estimatedV22"> histórico</small></td><td><strong>${Number.isFinite(Number(r.brlTotal))?moneyV26(r.brlTotal):'—'}</strong>${String(r.currency||'BRL').toUpperCase()==='USD'?'<small class="estimatedV22"> câmbio atual</small>':''}</td><td><span class="dividendStatusV22 ${r.status==='Recebido'?'received':'upcoming'}">${r.status}</span></td></tr>`).join(''):'<tr><td colspan="9"><div class="emptyState">Nenhum provento encontrado para este filtro.</div></td></tr>';
  if(cov){const upd=dividendDbV26.updatedAt?new Date(dividendDbV26.updatedAt).toLocaleString('pt-BR'):'—';cov.innerHTML=`<span>Base atualizada: <strong>${escV26(upd)}</strong></span><span>Contabilização iniciada em: <strong>${first?first.split('-').reverse().join('/'):'sem histórico'}</strong></span><span>Regra: quantidade reconstruída somente pelos lançamentos executados.</span>`;}
  syncPatrimonyDividendsV26(m);
}
function syncPatrimonyDividendsV26(m=dividendMetricsStrictV26()){
  const cards=document.querySelectorAll('#tabPatrimonioV22 .patrimonyKpiV24');if(cards.length<3)return;const perf=typeof portfolioPerformanceV19==='function'?portfolioPerformanceV19():null,capital=Number.isFinite(Number(perf?.delta))?Number(perf.delta):null,totalProfit=capital!==null?capital+m.receivedTotal:null;
  const second=cards[1],third=cards[2];const secondMain=second.querySelector('.kpiMainV24 strong');if(secondMain&&totalProfit!==null)secondMain.textContent=moneyV26(totalProfit);const split=second.querySelectorAll('.kpiSplitV24 strong');if(split[1])split[1].textContent=moneyV26(m.receivedTotal);const thirdMain=third.querySelector('.kpiMainV24 strong');if(thirdMain)thirdMain.textContent=moneyV26(m.received12);const thirdSub=third.querySelector('.kpiSubV24 strong');if(thirdSub)thirdSub.textContent=moneyV26(m.receivedTotal);
}
async function loadDividendDbV26(){try{const r=await fetch(`dividends.json?v=26.0-${Date.now()}`,{cache:'no-store'});if(r.ok){const j=await r.json();dividendDbV26={loaded:true,events:Array.isArray(j.events)?j.events:[],updatedAt:j.updatedAt||null};}}catch(e){console.warn('[V2.6] falha ao carregar proventos',e);dividendDbV26.loaded=true;}renderDividendsV26();syncPatrimonyDividendsV26();}

function postV26(){
  if(!v26Ready||v26Applying)return;v26Applying=true;
  try{
    ensureCssV26();updateBrandV26();
    renderAllocationPulseV26();ensureMacroBandSelectorV26();
    renderContributionPlannerV26();ensureSimulatorV26();renderHistoryGroupsV26();renderContributionImpactV26();
    bindPatrimonyInteractionsV26();if(dividendDbV26.loaded){renderDividendsV26();syncPatrimonyDividendsV26();}
  }finally{v26Applying=false;}
}
function initV26(){
  if(v26Ready)return;v26Ready=true;ensureCssV26();
  const prev=render;render=function(){const r=prev();setTimeout(postV26,0);setTimeout(postV26,40);return r;};
  document.addEventListener('click',e=>{const tab=e.target.closest?.('[data-tab-v23]')?.dataset.tabV23;if(tab==='proventos'||tab==='patrimonio'||tab==='alocacao'||tab==='aportes')setTimeout(postV26,60);},true);
  window.addEventListener('hashchange',()=>setTimeout(postV26,60));
  postV26();loadDividendDbV26();
}
let attempts=0;const boot=()=>{attempts++;if(typeof state==='undefined'||typeof render!=='function'||!document.getElementById('tabMacroV22')||!document.getElementById('tabMicroV22')||!document.getElementById('tabPatrimonioV22')){if(attempts<500)setTimeout(boot,25);return;}initV26();};boot();
})();
