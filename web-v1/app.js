const initialAssets=[
{id:'acoes',name:'Ações BR',current:2819.15,target:25},
{id:'fiis',name:'FIIs',current:2056.56,target:20},
{id:'etfs',name:'ETFs Internacionais',current:1958.255148,target:39},
{id:'cripto',name:'Cripto',current:375.119212,target:5},
{id:'rf',name:'Renda fixa',current:491.05,target:1},
{id:'stocks',name:'Stocks',current:0,target:10}
];

const initialHoldings=[
{id:'h-cpfe3',ticker:'CPFE3',name:'CPFL Energia',className:'Ações BR',qty:10,price:44.80,value:448.00},
{id:'h-bbse3',ticker:'BBSE3',name:'BB Seguridade',className:'Ações BR',qty:10,price:40.02,value:400.20},
{id:'h-bbas3',ticker:'BBAS3',name:'Banco do Brasil',className:'Ações BR',qty:20,price:20.17,value:403.40},
{id:'h-petr4',ticker:'PETR4',name:'Petrobras',className:'Ações BR',qty:7,price:43.55,value:304.85},
{id:'h-sapr4',ticker:'SAPR4',name:'Sanepar',className:'Ações BR',qty:30,price:6.50,value:195.00},
{id:'h-isae4',ticker:'ISAE4',name:'ISA Energia Brasil',className:'Ações BR',qty:7,price:26.70,value:186.90},
{id:'h-vale3',ticker:'VALE3',name:'Vale',className:'Ações BR',qty:2,price:78.58,value:157.16},
{id:'h-itsa4',ticker:'ITSA4',name:'Itaúsa',className:'Ações BR',qty:10,price:12.95,value:129.50},
{id:'h-wizc3',ticker:'WIZC3',name:'Wiz Co',className:'Ações BR',qty:15,price:7.89,value:118.35},
{id:'h-taee11',ticker:'TAEE11',name:'Taesa',className:'Ações BR',qty:3,price:38.68,value:116.04},
{id:'h-cmig4',ticker:'CMIG4',name:'Cemig',className:'Ações BR',qty:10,price:10.51,value:105.10},
{id:'h-itub4',ticker:'ITUB4',name:'Itaú Unibanco',className:'Ações BR',qty:2,price:39.19,value:78.38},
{id:'h-bbdc3',ticker:'BBDC3',name:'Bradesco',className:'Ações BR',qty:5,price:15.04,value:75.20},
{id:'h-fiqe3',ticker:'FIQE3',name:'Unifique',className:'Ações BR',qty:13,price:4.74,value:61.62},
{id:'h-brbi11',ticker:'BRBI11',name:'BR Partners',className:'Ações BR',qty:3,price:13.15,value:39.45},
{id:'h-ggrc11',ticker:'GGRC11',name:'GGR Covepi Renda',className:'FIIs',qty:64,price:9.06,value:579.84},
{id:'h-xpml11',ticker:'XPML11',name:'XP Malls',className:'FIIs',qty:5,price:99.90,value:499.50},
{id:'h-gare11',ticker:'GARE11',name:'Guardian Real Estate',className:'FIIs',qty:40,price:8.43,value:337.20},
{id:'h-hgcr11',ticker:'HGCR11',name:'Pátria Recebíveis',className:'FIIs',qty:3,price:94.86,value:284.58},
{id:'h-lvbi11',ticker:'LVBI11',name:'VBI Logístico',className:'FIIs',qty:2,price:99.41,value:198.82},
{id:'h-trxf11',ticker:'TRXF11',name:'TRX Real Estate',className:'FIIs',qty:2,price:78.31,value:156.62},
{id:'h-voo',ticker:'VOO',name:'Vanguard S&P 500 ETF',className:'ETFs Internacionais',qty:0.105,price:3667.534468,value:385.0911191},
{id:'h-avuv',ticker:'AVUV',name:'Avantis U.S. Small Cap Value',className:'ETFs Internacionais',qty:0.56,price:651.168349,value:364.6542754},
{id:'h-vea',ticker:'VEA',name:'Vanguard FTSE Developed Markets',className:'ETFs Internacionais',qty:1.11,price:378.867242,value:420.5426386},
{id:'h-tflo',ticker:'TFLO',name:'iShares Treasury Floating Rate Bond',className:'ETFs Internacionais',qty:3,price:262.655705,value:787.967115},
{id:'h-btc',ticker:'BTCUSD',name:'Bitcoin',className:'Cripto',qty:0.00092016,price:407667.3752,value:375.119212},
{id:'h-rf',ticker:'RF',name:'Renda fixa — posição agregada',className:'Renda fixa',qty:1,price:491.05,value:491.05}
];

const colors=['#69a7ff','#43d39e','#c084fc','#ffbd66','#ff7b86','#5bd7e5','#f472b6','#a3e635','#fb923c','#818cf8','#2dd4bf','#facc15'];
const fmt=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const qtyFmt=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:6});
const pct=v=>`${(Number.isFinite(v)?v:0).toFixed(1).replace('.',',')}%`;
const $=s=>document.querySelector(s);
const escapeHtml=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const escapeAttr=escapeHtml;
const info=text=>`<span class="infoTip" tabindex="0" data-tip="${escapeAttr(text)}">?</span>`;
let selectedPieId=null;
let activeHoldingFilter='Todos';
let holdingSearchText='';

function clone(v){return JSON.parse(JSON.stringify(v));}
function safeId(name){const base=String(name||'classe').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'classe';let id=base,n=2;while(state?.assets?.some(a=>a.id===id)){id=`${base}-${n++}`;}return id;}
function colorForIndex(i){return colors[i%colors.length];}
function rgba(hex,alpha){const h=hex.replace('#','');const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);return `rgba(${r},${g},${b},${alpha})`;}

function loadState(){
  let saved=null;
  try{saved=JSON.parse(localStorage.getItem('carteira-v1')||'null')}catch(e){}
  const assets=Array.isArray(saved?.assets)&&saved.assets.length?saved.assets.map(a=>({...a,current:Math.max(0,+a.current||0),target:Math.max(0,+a.target||0)})):clone(initialAssets);
  const savedContribution=+saved?.contribution;
  return {
    assets,
    contribution:Number.isFinite(savedContribution)?Math.max(0,savedContribution):1500,
    band:Math.min(100,Math.max(0,Number.isFinite(+saved?.band)?+saved.band:25)),
    aportes:saved?.aportes&&typeof saved.aportes==='object'?saved.aportes:{},
    autoAportes:saved?.autoAportes??true,
    showIdeal:saved?.showIdeal??false,
    holdings:Array.isArray(saved?.holdings)?saved.holdings.map(h=>({...h,qty:Math.max(0,+h.qty||0),price:Math.max(0,+h.price||0),value:Math.max(0,+h.value||0)})):clone(initialHoldings),
    showAllHoldings:saved?.showAllHoldings??false
  };
}

let state=loadState();
function save(){localStorage.setItem('carteira-v1',JSON.stringify(state));}
function totalAtual(){return state.assets.reduce((s,a)=>s+(+a.current||0),0);}
function holdingTotal(){return state.holdings.reduce((s,h)=>s+Math.max(0,+h.value||0),0);}

function getSuggestions(){
  const total=totalAtual();
  const budget=Math.max(0,+state.contribution||0);
  const future=total+budget;
  const gaps=state.assets.map(a=>({id:a.id,gap:Math.max(0,future*((+a.target||0)/100)-(+a.current||0))}));
  const sum=gaps.reduce((s,a)=>s+a.gap,0);
  const out={};
  gaps.forEach(a=>out[a.id]=budget>0&&sum>0?budget*a.gap/sum:0);
  return out;
}

function syncAutoAportes(){
  if(state.autoAportes) state.aportes=getSuggestions();
  state.assets.forEach(a=>{if(!Number.isFinite(+state.aportes[a.id]))state.aportes[a.id]=0;});
}
function plannedTotal(){return state.assets.reduce((s,a)=>s+Math.max(0,+state.aportes[a.id]||0),0);}

function getRows(){
  syncAutoAportes();
  const total=totalAtual();
  const planned=plannedTotal();
  const futureTotal=total+planned;
  const band=Math.max(0,+state.band||0)/100;
  const suggestions=getSuggestions();
  return state.assets.map((a,index)=>{
    const current=+a.current||0,target=+a.target||0,aporte=Math.max(0,+state.aportes[a.id]||0);
    const currentWeight=total?current/total*100:0;
    const postWeight=futureTotal?(current+aporte)/futureTotal*100:0;
    const min=Math.max(0,target*(1-band)),max=target*(1+band);
    const balanced=currentWeight>=min&&currentWeight<=max;
    const postBalanced=postWeight>=min&&postWeight<=max;
    const priorityScore=target>0?currentWeight/target:999;
    return {...a,index,current,target,aporte,currentWeight,postWeight,min,max,balanced,postBalanced,priorityScore,suggested:suggestions[a.id]||0};
  });
}

function normalizedTargets(rows){
  const sum=rows.reduce((s,r)=>s+Math.max(0,+r.target||0),0);
  if(sum<=0)return rows.map(()=>0);
  return rows.map(r=>Math.max(0,+r.target||0)/sum*100);
}
function dispersionIndex(weights,targets){
  if(!weights.length||weights.length!==targets.length)return 0;
  return .5*weights.reduce((s,w,i)=>s+Math.abs((+w||0)-(+targets[i]||0)),0);
}

function pieGradient(values,rows){
  const sum=values.reduce((s,v)=>s+Math.max(0,+v||0),0);
  if(sum<=0)return '#14263b';
  let cursor=0;
  const parts=values.map((v,i)=>{
    const start=cursor;
    cursor+=Math.max(0,+v||0)/sum*100;
    const base=colorForIndex(i);
    const color=selectedPieId&&rows[i]?.id!==selectedPieId?rgba(base,.22):base;
    return `${color} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${parts.join(',')})`;
}

function renderLegend(containerId,values,rows){
  const sum=values.reduce((s,v)=>s+Math.max(0,+v||0),0);
  $(containerId).innerHTML=rows.map((a,i)=>{
    const value=sum?Math.max(0,+values[i]||0)/sum*100:0;
    const cls=selectedPieId?(a.id===selectedPieId?' selected':' dimmed'):'';
    return `<div class="legendItem${cls}" data-legend-id="${escapeAttr(a.id)}"><span class="legendDot" style="background:${colorForIndex(i)}"></span><strong>${escapeHtml(a.name)}</strong><span>${pct(value)}</span></div>`;
  }).join('');
  $(containerId).querySelectorAll('[data-legend-id]').forEach(el=>el.onclick=()=>{selectedPieId=selectedPieId===el.dataset.legendId?null:el.dataset.legendId;renderCharts(getRows());});
}

function selectedPercent(values,rows){
  if(!selectedPieId)return null;
  const idx=rows.findIndex(r=>r.id===selectedPieId);
  if(idx<0)return null;
  const sum=values.reduce((s,v)=>s+Math.max(0,+v||0),0);
  return {row:rows[idx],value:sum?Math.max(0,+values[idx]||0)/sum*100:0};
}

function bindPieClick(el,values,rows){
  el.onclick=e=>{
    const rect=el.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    const dx=e.clientX-cx,dy=e.clientY-cy,dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<rect.width*.28){selectedPieId=null;renderCharts(rows);return;}
    let angle=(Math.atan2(dy,dx)*180/Math.PI+90+360)%360;
    const point=angle/360;
    const sum=values.reduce((s,v)=>s+Math.max(0,+v||0),0);
    if(sum<=0)return;
    let cursor=0,found=null;
    for(let i=0;i<values.length;i++){
      cursor+=Math.max(0,+values[i]||0)/sum;
      if(point<=cursor){found=rows[i]?.id;break;}
    }
    selectedPieId=selectedPieId===found?null:found;
    renderCharts(rows);
  };
}

function renderCharts(rows){
  const currentValues=rows.map(r=>r.current),idealValues=rows.map(r=>r.target);
  $('#currentPie').style.background=pieGradient(currentValues,rows);
  $('#idealPie').style.background=pieGradient(idealValues,rows);
  renderLegend('#currentLegend',currentValues,rows);
  renderLegend('#idealLegend',idealValues,rows);
  const targetTotal=idealValues.reduce((s,v)=>s+(+v||0),0);
  const curSel=selectedPercent(currentValues,rows),idealSel=selectedPercent(idealValues,rows);
  $('#currentPieLabel').textContent=curSel?curSel.row.name:'Atual';
  $('#currentPieValue').textContent=curSel?pct(curSel.value):'100%';
  $('#idealPieLabel').textContent=idealSel?idealSel.row.name:'Ideal';
  $('#idealTotal').textContent=idealSel?pct(idealSel.value):pct(targetTotal);
  $('#idealPanel').classList.toggle('hidden',!state.showIdeal);
  $('#charts').classList.toggle('compare',state.showIdeal);
  $('#toggleIdeal').textContent=state.showIdeal?'Ocultar ideal':'Mostrar ideal';
  bindPieClick($('#currentPie'),currentValues,rows);
  bindPieClick($('#idealPie'),idealValues,rows);
}

function renderHoldings(){
  const classes=[...new Set([...state.assets.map(a=>a.name),...state.holdings.map(h=>h.className)].filter(Boolean))];
  if(activeHoldingFilter!=='Todos'&&!classes.includes(activeHoldingFilter))activeHoldingFilter='Todos';
  $('#holdingFilters').innerHTML=['Todos',...classes].map(c=>`<button class="filterChip ${activeHoldingFilter===c?'active':''}" data-filter="${escapeAttr(c)}">${c==='Todos'?'Todos ativos':escapeHtml(c)}</button>`).join('');
  $('#holdingFilters').querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{activeHoldingFilter=b.dataset.filter;renderHoldings();});
  const q=holdingSearchText.trim().toLowerCase();
  let items=state.holdings.filter(h=>(activeHoldingFilter==='Todos'||h.className===activeHoldingFilter)&&(!q||String(h.ticker).toLowerCase().includes(q)||String(h.name||'').toLowerCase().includes(q)));
  items.sort((a,b)=>(+b.value||0)-(+a.value||0));
  const total=holdingTotal();
  const visible=state.showAllHoldings?items:items.slice(0,10);
  $('#holdingRows').innerHTML=visible.length?visible.map(h=>{
    const weight=total?Math.max(0,+h.value||0)/total*100:0;
    return `<tr><td><div class="holdingTicker"><strong>${escapeHtml(h.ticker)}</strong><small>${escapeHtml(h.name||'')}</small></div></td><td><span class="classBadge">${escapeHtml(h.className||'Sem classe')}</span></td><td>${qtyFmt.format(+h.qty||0)}</td><td>${fmt.format(+h.price||0)}</td><td><strong>${fmt.format(+h.value||0)}</strong></td><td>${pct(weight)}</td><td><div class="rowActions"><button class="editButton" data-edit-holding="${escapeAttr(h.id)}">Editar</button><button class="dangerButton" data-remove-holding="${escapeAttr(h.id)}">Excluir</button></div></td></tr>`;
  }).join(''):`<tr><td colspan="7"><div class="emptyState">Nenhum ativo encontrado neste filtro.</div></td></tr>`;
  $('#holdingSummary').textContent=`${items.length} ativo${items.length===1?'':'s'} no filtro • ${fmt.format(items.reduce((s,h)=>s+(+h.value||0),0))} cadastrados`;
  $('#toggleHoldings').classList.toggle('hidden',items.length<=10);
  $('#toggleHoldings').textContent=state.showAllHoldings?'Ver menos':`Ver todos (${items.length})`;
  document.querySelectorAll('[data-remove-holding]').forEach(b=>b.onclick=()=>{const h=state.holdings.find(x=>x.id===b.dataset.removeHolding);if(h&&confirm(`Excluir ${h.ticker} da lista de ativos?`)){state.holdings=state.holdings.filter(x=>x.id!==h.id);save();renderHoldings();}});
  document.querySelectorAll('[data-edit-holding]').forEach(b=>b.onclick=()=>openHoldingDialog(b.dataset.editHolding));
  const select=$('#holdingClass');
  select.innerHTML=classes.map(c=>`<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('')||'<option value="Sem classe">Sem classe</option>';
}

function render(){
  const rows=getRows(),total=totalAtual(),planned=plannedTotal(),budget=Math.max(0,+state.contribution||0);
  let remaining=budget-planned;if(Math.abs(remaining)<0.005)remaining=0;
  const balanced=rows.filter(r=>r.balanced).length;
  const priority=[...rows].sort((a,b)=>a.priorityScore-b.priorityScore)[0];
  const normTargets=normalizedTargets(rows);
  const dispersion=dispersionIndex(rows.map(r=>r.currentWeight),normTargets);
  const postDispersion=dispersionIndex(rows.map(r=>r.postWeight),normTargets);

  $('#kpis').innerHTML=`
    <article class="card kpi"><span class="kpiLabel">Patrimônio consolidado ${info('Soma dos valores atuais de todas as classes incluídas na macro alocação.')}</span><strong>${fmt.format(total)}</strong><small>Carteira de longo prazo</small></article>
    <article class="card kpi"><span class="kpiLabel">Aporte do mês ${info('Orçamento mensal informado no planejador de aportes.')}</span><strong>${fmt.format(budget)}</strong><small>Orçamento disponível</small></article>
    <article class="card kpi"><span class="kpiLabel">Aportes planejados ${info('Soma dos aportes preenchidos na tabela, incluindo alterações manuais.')}</span><strong>${fmt.format(planned)}</strong><small>Soma dos valores editados</small></article>
    <article class="card kpi"><span class="kpiLabel">Classes balanceadas ${info('Quantidade de classes cujo peso atual está dentro da banda permitida em torno da meta.')}</span><strong>${balanced}/${rows.length}</strong><small>Banda atual de ±${state.band}%</small></article>
    <article class="card kpi dispersion"><span class="kpiLabel">Índice de dispersão da meta ${info('Mede a distância entre a alocação atual e a ideal. 0% significa carteira exatamente na meta. O cálculo usa metade da soma dos desvios absolutos entre os pesos atuais e os pesos-alvo normalizados.')}</span><strong>${pct(dispersion)}</strong><small>Após o aporte planejado: ${pct(postDispersion)}</small></article>
    <article class="card kpi accent"><span class="kpiLabel">Maior prioridade ${info('Classe com menor relação entre peso atual e peso-alvo. Em geral, é a classe mais subalocada proporcionalmente.')}</span><strong>${priority?.name||'—'}</strong><small>${priority?`${pct(priority.currentWeight)} atual vs ${pct(priority.target)} alvo`:'—'}</small></article>`;

  $('#contribution').value=state.contribution;$('#band').value=state.band;
  const balance=$('#contributionBalance');
  balance.className='balanceBox '+(remaining<0?'over':remaining>0?'warn':'good');
  balance.innerHTML=remaining<0?`<strong>${fmt.format(remaining)}</strong><small>Excedeu o orçamento</small>`:remaining>0?`<strong>${fmt.format(remaining)}</strong><small>Ainda falta distribuir</small>`:`<strong>${fmt.format(0)}</strong><small>Aporte fechado</small>`;
  const targetTotal=state.assets.reduce((s,a)=>s+(+a.target||0),0);
  $('#targetTotal').className=`pill ${Math.abs(targetTotal-100)<.01?'ok':'warn'}`;$('#targetTotal').textContent=`Metas: ${pct(targetTotal)}`;

  $('#rows').innerHTML=rows.map(a=>`<tr>
    <td><div class="assetName"><span class="dot" style="background:${colorForIndex(a.index)}"></span>${escapeHtml(a.name)}</div></td>
    <td><div class="cellInput"><span>R$</span><input data-id="${escapeAttr(a.id)}" data-field="current" type="number" min="0" step="10" value="${a.current}"></div></td>
    <td><strong>${pct(a.currentWeight)}</strong><div class="bar"><i style="width:${Math.min(100,a.currentWeight/Math.max(1,a.target)*70)}%"></i></div></td>
    <td><div class="targetInput"><input data-id="${escapeAttr(a.id)}" data-field="target" type="number" min="0" max="100" step="1" value="${a.target}"><span>%</span></div></td>
    <td>${pct(a.min)} – ${pct(a.max)}</td>
    <td><span class="pill ${a.balanced?'ok':'warn'}">${a.balanced?'OK':'NOK'}</span></td>
    <td><div class="cellInput aporteInput"><span>R$</span><input data-aporte="${escapeAttr(a.id)}" type="number" min="0" step="10" value="${a.aporte.toFixed(2)}"></div></td>
    <td><div class="postWeight"><strong class="${a.postBalanced?'positive':''}">${pct(a.postWeight)}</strong><small>${a.postBalanced?'dentro':'fora'} da banda após aporte</small></div></td>
    <td><button class="dangerButton" data-remove-class="${escapeAttr(a.id)}">Excluir</button></td>
  </tr>`).join('');

  $('#ranking').innerHTML=[...rows].sort((a,b)=>b.aporte-a.aporte).map((a,i)=>`<div class="rank"><span class="rankNo">${i+1}</span><div><strong>${escapeHtml(a.name)}</strong><small>${pct(a.currentWeight)} → ${pct(a.postWeight)} • sugestão ${fmt.format(a.suggested)}</small></div><b>${fmt.format(a.aporte)}</b></div>`).join('')||'<div class="emptyState">Adicione uma classe para começar.</div>';

  renderCharts(rows);renderHoldings();

  document.querySelectorAll('input[data-id]').forEach(el=>el.onchange=e=>{const a=state.assets.find(x=>x.id===e.target.dataset.id);if(!a)return;a[e.target.dataset.field]=Math.max(0,+e.target.value||0);save();render();});
  document.querySelectorAll('input[data-aporte]').forEach(el=>el.onchange=e=>{state.aportes[e.target.dataset.aporte]=Math.max(0,+e.target.value||0);state.autoAportes=false;save();render();});
  document.querySelectorAll('[data-remove-class]').forEach(b=>b.onclick=()=>{const a=state.assets.find(x=>x.id===b.dataset.removeClass);if(!a)return;const linked=state.holdings.filter(h=>h.className===a.name).length;const extra=linked?`\n\nHá ${linked} ativo(s) cadastrado(s) nessa classe. Eles continuarão na Lista de ativos, que é independente da macro.`:'';if(confirm(`Excluir a classe “${a.name}” da macro alocação?${extra}`)){state.assets=state.assets.filter(x=>x.id!==a.id);delete state.aportes[a.id];if(selectedPieId===a.id)selectedPieId=null;save();render();}});
  save();
}

function openHoldingDialog(id=null){
  const dialog=$('#holdingDialog'),h=id?state.holdings.find(x=>x.id===id):null;
  renderHoldings();
  $('#holdingDialogTitle').textContent=h?'Editar ativo':'Adicionar ativo';
  $('#holdingEditId').value=h?.id||'';$('#holdingTicker').value=h?.ticker||'';$('#holdingName').value=h?.name||'';$('#holdingQty').value=h?.qty??0;$('#holdingPrice').value=h?.price??0;$('#holdingValue').value=h?.value??'';
  if(h){const select=$('#holdingClass');if(![...select.options].some(o=>o.value===h.className)){select.insertAdjacentHTML('beforeend',`<option value="${escapeAttr(h.className)}">${escapeHtml(h.className)}</option>`);}select.value=h.className;}
  dialog.showModal();
}

$('#contribution').onchange=e=>{state.contribution=Math.max(0,+e.target.value||0);if(state.autoAportes)state.aportes={};save();render();};
$('#band').onchange=e=>{state.band=Math.min(100,Math.max(0,+e.target.value||0));save();render();};
$('#applySuggestion').onclick=()=>{state.autoAportes=true;state.aportes={};save();render();};
$('#toggleIdeal').onclick=()=>{state.showIdeal=!state.showIdeal;save();render();};
$('#addClass').onclick=()=>{$('#className').value='';$('#classCurrent').value=0;$('#classTarget').value=0;$('#classDialog').showModal();};
$('#addHolding').onclick=()=>openHoldingDialog();
$('#toggleHoldings').onclick=()=>{state.showAllHoldings=!state.showAllHoldings;save();renderHoldings();};
$('#holdingSearch').oninput=e=>{holdingSearchText=e.target.value;renderHoldings();};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close).close());

$('#classForm').onsubmit=e=>{
  e.preventDefault();const name=$('#className').value.trim();if(!name)return;if(state.assets.some(a=>a.name.toLowerCase()===name.toLowerCase())){alert('Já existe uma classe com esse nome.');return;}
  const id=safeId(name);state.assets.push({id,name,current:Math.max(0,+$('#classCurrent').value||0),target:Math.max(0,+$('#classTarget').value||0)});state.aportes[id]=0;state.autoAportes=true;$('#classDialog').close();save();render();
};

$('#holdingForm').onsubmit=e=>{
  e.preventDefault();const ticker=$('#holdingTicker').value.trim().toUpperCase(),name=$('#holdingName').value.trim(),className=$('#holdingClass').value||'Sem classe',qty=Math.max(0,+$('#holdingQty').value||0),price=Math.max(0,+$('#holdingPrice').value||0);if(!ticker)return;
  const rawValue=$('#holdingValue').value.trim(),value=rawValue===''?qty*price:Math.max(0,+rawValue||0);const editId=$('#holdingEditId').value;
  if(editId){const h=state.holdings.find(x=>x.id===editId);if(h)Object.assign(h,{ticker,name,className,qty,price,value});}
  else state.holdings.push({id:`h-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,ticker,name,className,qty,price,value});
  $('#holdingDialog').close();save();renderHoldings();
};

$('#reset').onclick=()=>{if(!confirm('Restaurar os dados-base do dashboard? Suas alterações locais de classes, aportes e lista de ativos serão substituídas.'))return;state={assets:clone(initialAssets),contribution:1500,band:25,aportes:{},autoAportes:true,showIdeal:false,holdings:clone(initialHoldings),showAllHoldings:false};selectedPieId=null;activeHoldingFilter='Todos';holdingSearchText='';$('#holdingSearch').value='';save();render();};

render();