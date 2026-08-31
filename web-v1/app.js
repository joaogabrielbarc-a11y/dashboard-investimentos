const initialAssets=[
{id:'acoes',name:'Ações BR',current:2819.15,target:25},
{id:'fiis',name:'FIIs',current:2056.56,target:20},
{id:'etfs',name:'ETFs Internacionais',current:1958.255148,target:39},
{id:'cripto',name:'Cripto',current:375.119212,target:5},
{id:'rf',name:'Renda fixa',current:491.05,target:1},
{id:'stocks',name:'Stocks',current:0,target:10}
];

const colors=['#69a7ff','#43d39e','#c084fc','#ffbd66','#ff7b86','#5bd7e5'];
const fmt=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const pct=v=>`${(Number.isFinite(v)?v:0).toFixed(1).replace('.',',')}%`;
const $=s=>document.querySelector(s);

function loadState(){
  let saved=null;
  try{saved=JSON.parse(localStorage.getItem('carteira-v1')||'null')}catch(e){}
  const assets=initialAssets.map(base=>{
    const old=saved?.assets?.find(a=>a.id===base.id);
    return old?{...base,...old}:structuredClone(base);
  });
  const savedContribution=+saved?.contribution;
  return {
    assets,
    contribution:Number.isFinite(savedContribution)?Math.max(0,savedContribution):1500,
    band:Math.min(100,Math.max(0,Number.isFinite(+saved?.band)?+saved.band:25)),
    aportes:saved?.aportes&&typeof saved.aportes==='object'?saved.aportes:{},
    autoAportes:saved?.autoAportes??true,
    showIdeal:saved?.showIdeal??false
  };
}

let state=loadState();

function save(){localStorage.setItem('carteira-v1',JSON.stringify(state));}
function totalAtual(){return state.assets.reduce((s,a)=>s+(+a.current||0),0)}

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
  state.assets.forEach(a=>{if(!Number.isFinite(+state.aportes[a.id]))state.aportes[a.id]=0});
}

function plannedTotal(){return state.assets.reduce((s,a)=>s+Math.max(0,+state.aportes[a.id]||0),0)}

function getRows(){
  syncAutoAportes();
  const total=totalAtual();
  const planned=plannedTotal();
  const futureTotal=total+planned;
  const band=Math.max(0,+state.band||0)/100;
  const suggestions=getSuggestions();
  return state.assets.map((a,index)=>{
    const current=+a.current||0;
    const target=+a.target||0;
    const aporte=Math.max(0,+state.aportes[a.id]||0);
    const currentWeight=total?current/total*100:0;
    const postWeight=futureTotal?(current+aporte)/futureTotal*100:0;
    const min=Math.max(0,target*(1-band));
    const max=target*(1+band);
    const balanced=currentWeight>=min&&currentWeight<=max;
    const postBalanced=postWeight>=min&&postWeight<=max;
    const priorityScore=target>0?currentWeight/target:999;
    return {...a,index,current,target,aporte,currentWeight,postWeight,min,max,balanced,postBalanced,priorityScore,suggested:suggestions[a.id]||0};
  });
}

function pieGradient(values){
  const sum=values.reduce((s,v)=>s+Math.max(0,+v||0),0);
  if(sum<=0)return '#14263b';
  let cursor=0;
  const parts=values.map((v,i)=>{
    const start=cursor;
    cursor+=Math.max(0,+v||0)/sum*100;
    return `${colors[i%colors.length]} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${parts.join(',')})`;
}

function renderLegend(containerId,values){
  const sum=values.reduce((s,v)=>s+Math.max(0,+v||0),0);
  $(containerId).innerHTML=state.assets.map((a,i)=>{
    const value=sum?Math.max(0,+values[i]||0)/sum*100:0;
    return `<div class="legendItem"><span class="legendDot" style="background:${colors[i%colors.length]}"></span><strong>${a.name}</strong><span>${pct(value)}</span></div>`;
  }).join('');
}

function renderCharts(rows){
  const currentValues=rows.map(r=>r.current);
  const idealValues=rows.map(r=>r.target);
  $('#currentPie').style.background=pieGradient(currentValues);
  $('#idealPie').style.background=pieGradient(idealValues);
  renderLegend('#currentLegend',currentValues);
  renderLegend('#idealLegend',idealValues);
  const targetTotal=idealValues.reduce((s,v)=>s+(+v||0),0);
  $('#idealTotal').textContent=pct(targetTotal);
  $('#idealPanel').classList.toggle('hidden',!state.showIdeal);
  $('#charts').classList.toggle('compare',state.showIdeal);
  $('#toggleIdeal').textContent=state.showIdeal?'Ocultar ideal':'Mostrar ideal';
}

function render(){
  const rows=getRows();
  const total=totalAtual();
  const planned=plannedTotal();
  const budget=Math.max(0,+state.contribution||0);
  let remaining=budget-planned;
  if(Math.abs(remaining)<0.005)remaining=0;
  const balanced=rows.filter(r=>r.balanced).length;
  const priority=[...rows].sort((a,b)=>a.priorityScore-b.priorityScore)[0];

  $('#kpis').innerHTML=`
    <article class="card kpi"><span>Patrimônio consolidado</span><strong>${fmt.format(total)}</strong><small>Carteira de longo prazo</small></article>
    <article class="card kpi"><span>Aporte do mês</span><strong>${fmt.format(budget)}</strong><small>Orçamento disponível</small></article>
    <article class="card kpi"><span>Aportes planejados</span><strong>${fmt.format(planned)}</strong><small>Soma dos valores editados</small></article>
    <article class="card kpi"><span>Classes balanceadas</span><strong>${balanced}/${rows.length}</strong><small>Banda atual de ±${state.band}%</small></article>
    <article class="card kpi accent"><span>Maior prioridade</span><strong>${priority?.name||'—'}</strong><small>${priority?`${pct(priority.currentWeight)} atual vs ${pct(priority.target)} alvo`:'—'}</small></article>`;

  $('#contribution').value=state.contribution;
  $('#band').value=state.band;

  const balance=$('#contributionBalance');
  balance.className='balanceBox '+(remaining<0?'over':remaining>0?'warn':'good');
  balance.innerHTML=remaining<0
    ?`<strong>${fmt.format(remaining)}</strong><small>Excedeu o orçamento</small>`
    :remaining>0
      ?`<strong>${fmt.format(remaining)}</strong><small>Ainda falta distribuir</small>`
      :`<strong>${fmt.format(0)}</strong><small>Aporte fechado</small>`;

  const targetTotal=state.assets.reduce((s,a)=>s+(+a.target||0),0);
  $('#targetTotal').className=`pill ${Math.abs(targetTotal-100)<.01?'ok':'warn'}`;
  $('#targetTotal').textContent=`Metas: ${pct(targetTotal)}`;

  $('#rows').innerHTML=rows.map(a=>`<tr>
    <td><div class="assetName"><span class="dot" style="background:${colors[a.index%colors.length]}"></span>${a.name}</div></td>
    <td><div class="cellInput"><span>R$</span><input data-id="${a.id}" data-field="current" type="number" min="0" step="10" value="${a.current}"></div></td>
    <td><strong>${pct(a.currentWeight)}</strong><div class="bar"><i style="width:${Math.min(100,a.currentWeight/Math.max(1,a.target)*70)}%"></i></div></td>
    <td><div class="targetInput"><input data-id="${a.id}" data-field="target" type="number" min="0" max="100" step="1" value="${a.target}"><span>%</span></div></td>
    <td>${pct(a.min)} – ${pct(a.max)}</td>
    <td><span class="pill ${a.balanced?'ok':'warn'}">${a.balanced?'OK':'NOK'}</span></td>
    <td><div class="cellInput aporteInput"><span>R$</span><input data-aporte="${a.id}" type="number" min="0" step="10" value="${a.aporte.toFixed(2)}"></div></td>
    <td><div class="postWeight"><strong class="${a.postBalanced?'positive':''}">${pct(a.postWeight)}</strong><small>${a.postBalanced?'dentro':'fora'} da banda após aporte</small></div></td>
  </tr>`).join('');

  $('#ranking').innerHTML=[...rows].sort((a,b)=>b.aporte-a.aporte).map((a,i)=>`<div class="rank"><span class="rankNo">${i+1}</span><div><strong>${a.name}</strong><small>${pct(a.currentWeight)} → ${pct(a.postWeight)} • sugestão ${fmt.format(a.suggested)}</small></div><b>${fmt.format(a.aporte)}</b></div>`).join('');

  renderCharts(rows);

  document.querySelectorAll('input[data-id]').forEach(el=>el.onchange=e=>{
    const a=state.assets.find(x=>x.id===e.target.dataset.id);
    a[e.target.dataset.field]=Math.max(0,+e.target.value||0);
    save();render();
  });

  document.querySelectorAll('input[data-aporte]').forEach(el=>el.onchange=e=>{
    state.aportes[e.target.dataset.aporte]=Math.max(0,+e.target.value||0);
    state.autoAportes=false;
    save();render();
  });

  save();
}

$('#contribution').onchange=e=>{
  state.contribution=Math.max(0,+e.target.value||0);
  if(state.autoAportes)state.aportes={};
  save();render();
};

$('#band').onchange=e=>{
  state.band=Math.min(100,Math.max(0,+e.target.value||0));
  save();render();
};

$('#applySuggestion').onclick=()=>{
  state.autoAportes=true;
  state.aportes={};
  save();render();
};

$('#toggleIdeal').onclick=()=>{
  state.showIdeal=!state.showIdeal;
  save();render();
};

$('#reset').onclick=()=>{
  state={assets:structuredClone(initialAssets),contribution:1500,band:25,aportes:{},autoAportes:true,showIdeal:false};
  save();render();
};

render();
