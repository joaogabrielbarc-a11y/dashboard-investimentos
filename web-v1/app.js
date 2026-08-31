const initialAssets=[
{id:'acoes',name:'Ações BR',current:2819.15,target:25},
{id:'fiis',name:'FIIs',current:2056.56,target:20},
{id:'etfs',name:'ETFs Internacionais',current:1958.255148,target:39},
{id:'cripto',name:'Cripto',current:375.119212,target:5},
{id:'rf',name:'Renda fixa',current:491.05,target:1},
{id:'stocks',name:'Stocks',current:0,target:10}
];
const fmt=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}),pct=v=>`${v.toFixed(1).replace('.',',')}%`;
let state=JSON.parse(localStorage.getItem('carteira-v1')||'null')||{assets:structuredClone(initialAssets),contribution:1500};
const $=s=>document.querySelector(s);
function allocate(){
 const total=state.assets.reduce((s,a)=>s+(+a.current||0),0), future=total+(+state.contribution||0);
 const gaps=state.assets.map(a=>({...a,gap:Math.max(0,future*((+a.target||0)/100)-(+a.current||0))}));
 const sum=gaps.reduce((s,a)=>s+a.gap,0);
 return gaps.map(a=>({...a,suggested:state.contribution>0&&sum>0?state.contribution*a.gap/sum:0}));
}
function render(){
 const total=state.assets.reduce((s,a)=>s+(+a.current||0),0),futureTotal=total+(+state.contribution||0),alloc=allocate();
 const rows=alloc.map(a=>{const cw=total?+a.current/total*100:0,min=a.target*.75,max=a.target*1.25,balanced=cw>=min&&cw<=max,fw=futureTotal?(+a.current+a.suggested)/futureTotal*100:0;return {...a,currentWeight:cw,min,max,balanced,futureWeight:fw,delta:cw-a.target}});
 const priority=[...rows].sort((a,b)=>a.delta-b.delta)[0],balanced=rows.filter(a=>a.balanced).length;
 $('#kpis').innerHTML=`<article class="card kpi"><span>Patrimônio consolidado</span><strong>${fmt.format(total)}</strong><small>Carteira de longo prazo</small></article><article class="card kpi"><span>Próximo aporte</span><strong>${fmt.format(+state.contribution||0)}</strong><small>Distribuído por déficit de peso</small></article><article class="card kpi"><span>Classes balanceadas</span><strong>${balanced}/${rows.length}</strong><small>Banda de ±25% do alvo</small></article><article class="card kpi accent"><span>Maior prioridade</span><strong>${priority?.name||'—'}</strong><small>${priority?`${pct(priority.currentWeight)} atual vs ${pct(priority.target)} alvo`:'—'}</small></article>`;
 $('#contribution').value=state.contribution;
 const target=state.assets.reduce((s,a)=>s+(+a.target||0),0); $('#targetTotal').className=`pill ${Math.abs(target-100)<.01?'ok':'warn'}`;$('#targetTotal').textContent=`Metas: ${pct(target)}`;
 $('#rows').innerHTML=rows.map(a=>`<tr><td><div class="assetName"><span class="dot"></span>${a.name}</div></td><td><div class="cellInput"><span>R$</span><input data-id="${a.id}" data-field="current" type="number" min="0" step="10" value="${a.current}"></div></td><td><strong>${pct(a.currentWeight)}</strong><div class="bar"><i style="width:${Math.min(100,a.currentWeight/Math.max(1,a.target)*70)}%"></i></div></td><td><div class="targetInput"><input data-id="${a.id}" data-field="target" type="number" min="0" max="100" step="1" value="${a.target}"><span>%</span></div></td><td>${pct(a.min)} – ${pct(a.max)}</td><td><span class="pill ${a.balanced?'ok':'warn'}">${a.balanced?'OK':'NOK'}</span></td><td><strong class="${a.suggested>1?'positive':''}">${fmt.format(a.suggested)}</strong></td></tr>`).join('');
 $('#ranking').innerHTML=[...rows].sort((a,b)=>b.suggested-a.suggested).map((a,i)=>`<div class="rank"><span class="rankNo">${i+1}</span><div><strong>${a.name}</strong><small>${pct(a.currentWeight)} → ${pct(a.futureWeight)}</small></div><b>${fmt.format(a.suggested)}</b></div>`).join('');
 document.querySelectorAll('input[data-id]').forEach(el=>el.onchange=e=>{const a=state.assets.find(x=>x.id===e.target.dataset.id);a[e.target.dataset.field]=Math.max(0,+e.target.value||0);save();render();});
}
function save(){localStorage.setItem('carteira-v1',JSON.stringify(state));}
$('#contribution').oninput=e=>{state.contribution=Math.max(0,+e.target.value||0);save();render();};
$('#reset').onclick=()=>{state={assets:structuredClone(initialAssets),contribution:1500};save();render();};
render();
