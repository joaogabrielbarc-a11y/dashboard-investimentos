const V15_PATRIMONY_KEY='carteira-v15-patrimony';
const classMigrationV15={'Ações BR':'Ações','FIIs':'Fundos Imobiliários','Cripto':'Criptomoedas','Renda fixa':'Tesouro Direto','Renda Fixa':'Tesouro Direto'};
const patrimonySeedV15=[
  {date:'2025-08-31',value:1400,estimated:true},
  {date:'2025-09-30',value:1400,estimated:true},
  {date:'2025-10-31',value:1400,estimated:true},
  {date:'2025-11-30',value:1500,estimated:true},
  {date:'2025-12-31',value:1500,estimated:true},
  {date:'2026-01-31',value:1600,estimated:true},
  {date:'2026-02-28',value:1650,estimated:true},
  {date:'2026-03-31',value:2100,estimated:true},
  {date:'2026-04-30',value:2100,estimated:true},
  {date:'2026-05-31',value:4650,estimated:true},
  {date:'2026-06-30',value:6400,estimated:true},
  {date:'2026-07-31',value:7700,estimated:true},
  {date:'2026-08-31',value:7700,estimated:true}
];
function cloneV15(v){return JSON.parse(JSON.stringify(v));}
function loadPatrimonyV15(){let x=null;try{x=JSON.parse(localStorage.getItem(V15_PATRIMONY_KEY)||'null')}catch(e){}return Array.isArray(x)&&x.length?x:cloneV15(patrimonySeedV15);}
let patrimonySnapshotsV15=loadPatrimonyV15();
function savePatrimonyV15(){localStorage.setItem(V15_PATRIMONY_KEY,JSON.stringify(patrimonySnapshotsV15));}
function canonicalClassV15(name){return classMigrationV15[name]||name;}
function migratePortfolioV15(){
  const merged=[],idMap={};
  state.assets.forEach(a=>{
    const name=canonicalClassV15(a.name),existing=merged.find(x=>x.name===name);
    if(existing){existing.target=(+existing.target||0)+(+a.target||0);idMap[a.id]=existing.id;}
    else{a.name=name;merged.push(a);idMap[a.id]=a.id;}
  });
  const newAportes={};Object.entries(state.aportes||{}).forEach(([id,val])=>{const nid=idMap[id]||id;newAportes[nid]=(newAportes[nid]||0)+Math.max(0,+val||0);});
  state.assets=merged;state.aportes=newAportes;
  state.holdings.forEach(h=>{
    h.className=canonicalClassV15(h.className);
    if(String(h.ticker||'').toUpperCase()==='RF'||String(h.name||'').toLowerCase().includes('posição agregada')){
      h.ticker='TESOURO RENDA+ 2060';h.name='Tesouro Renda+ Aposentadoria Extra 2060';h.className='Tesouro Direto';
      if((+h.qty||0)<=1.000001){h.qty=1.9;h.price=(+h.value||0)/1.9;}
    }
  });
  if(!state.assets.some(a=>a.name==='Tesouro Direto'))state.assets.push({id:'tesouro-direto',name:'Tesouro Direto',current:0,target:0});
}
function syncMacroFromHoldingsV15(){
  const sums={};state.holdings.forEach(h=>{const cls=canonicalClassV15(h.className);h.className=cls;sums[cls]=(sums[cls]||0)+Math.max(0,+h.value||0);});
  state.assets.forEach(a=>{a.current=sums[a.name]||0;});
}
function totalPatrimonyV15(){return state.holdings.reduce((s,h)=>s+Math.max(0,+h.value||0),0);}
function todayIsoV15(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function upsertCurrentPatrimonyV15(){
  const date=todayIsoV15(),value=totalPatrimonyV15(),month=date.slice(0,7);
  patrimonySnapshotsV15=patrimonySnapshotsV15.filter(s=>!(s.live&&String(s.date).slice(0,7)===month));
  patrimonySnapshotsV15.push({date,value,estimated:false,live:true});patrimonySnapshotsV15.sort((a,b)=>a.date.localeCompare(b.date));savePatrimonyV15();
}
function latestSnapshotPerPeriodV15(mode){
  const map={};[...patrimonySnapshotsV15].sort((a,b)=>a.date.localeCompare(b.date)).forEach(s=>{const k=mode==='annual'?s.date.slice(0,4):s.date.slice(0,7);map[k]=s;});return map;
}
function monthKeyV15(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
function monthLabelV15(k){const [y,m]=k.split('-');return `${m}/${String(y).slice(2)}`;}
function getPatrimonySeriesV15(){
  const mode=v14.chartMode,map=latestSnapshotPerPeriodV15(mode),now=new Date();let keys=[];
  if(mode==='monthly'){
    const range=v14.chartRange==='all'?null:+v14.chartRange;
    if(range){for(let i=range-1;i>=0;i--){keys.push(monthKeyV15(new Date(now.getFullYear(),now.getMonth()-i,1)));}}
    else{const all=Object.keys(map).sort();if(all.length){let [y,m]=all[0].split('-').map(Number);const endY=now.getFullYear(),endM=now.getMonth()+1;while(y<endY||(y===endY&&m<=endM)){keys.push(`${y}-${String(m).padStart(2,'0')}`);m++;if(m>12){m=1;y++;}}}}
  }else{const all=Object.keys(map).sort();if(all.length){for(let y=+all[0];y<=now.getFullYear();y++)keys.push(String(y));}}
  let carry=null;return keys.map(k=>{if(map[k])carry=map[k];return carry?{key:k,label:mode==='annual'?k:monthLabelV15(k),value:+carry.value||0,estimated:!!carry.estimated,date:carry.date}:null;}).filter(Boolean);
}
function compactBRLV15(v){if(v>=1000000)return `R$ ${(v/1000000).toFixed(1).replace('.',',')} mi`;if(v>=1000)return `R$ ${(v/1000).toFixed(1).replace('.',',')} mil`;return `R$ ${Math.round(v)}`;}
function renderPatrimonyEvolutionV15(){
  const data=getPatrimonySeriesV15(),box=document.getElementById('aportesChart');if(!box)return;
  document.getElementById('modeMonthly').classList.toggle('active',v14.chartMode==='monthly');document.getElementById('modeAnnual').classList.toggle('active',v14.chartMode==='annual');
  const range=document.getElementById('chartRange');range.value=v14.chartRange;range.disabled=v14.chartMode==='annual';
  if(!data.length){box.innerHTML='<div class="chartEmpty">Ainda não há histórico de patrimônio suficiente.</div>';document.getElementById('chartEvolutionSummary').textContent='';return;}
  const W=1000,H=300,left=76,right=18,top=20,bottom=46,plotW=W-left-right,plotH=H-top-bottom,max=Math.max(...data.map(d=>d.value),1)*1.08,steps=4,slot=plotW/data.length,barW=Math.max(10,Math.min(58,slot*.62));
  let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução do patrimônio total"><g font-family="Inter,system-ui,sans-serif">`;
  for(let i=0;i<=steps;i++){const val=max*(steps-i)/steps,y=top+plotH*i/steps;svg+=`<line x1="${left}" y1="${y}" x2="${W-right}" y2="${y}" stroke="#20344d" stroke-width="1"/><text x="${left-10}" y="${y+4}" text-anchor="end" fill="#7890aa" font-size="10">${escapeHtml(compactBRLV15(val))}</text>`;}
  data.forEach((d,i)=>{const x=left+slot*i+slot/2,y=top+plotH-(d.value/max)*plotH,h=top+plotH-y;svg+=`<rect x="${x-barW/2}" y="${y}" width="${barW}" height="${h}" rx="5" fill="#30b77b" opacity="${d.estimated?.78:1}"><title>${d.label}: patrimônio ${fmt.format(d.value)}${d.estimated?' • referência histórica aproximada':''}</title></rect>`;if(data.length<=16||i%Math.ceil(data.length/12)===0)svg+=`<text x="${x}" y="${H-18}" text-anchor="middle" fill="#7890aa" font-size="10" transform="rotate(-38 ${x} ${H-18})">${d.label}</text>`;});svg+='</g></svg>';box.innerHTML=svg;
  const first=data[0],last=data[data.length-1],delta=last.value-first.value,pctDelta=first.value?delta/first.value*100:0,cls=delta>0?'positive':delta<0?'negative':'neutral';
  document.getElementById('chartEvolutionSummary').innerHTML=`Patrimônio no início do período: <strong>${fmt.format(first.value)}</strong> • atual: <strong>${fmt.format(last.value)}</strong> • variação: <strong class="patrimonyDelta ${cls}">${delta>=0?'+':''}${fmt.format(delta)} (${delta>=0?'+':''}${pct(pctDelta)})</strong>`;
}
function configureEvolutionUiV15(){
  const card=document.querySelector('.evolutionCard');if(!card)return;card.classList.add('v15Patrimony');
  const kpis=document.getElementById('kpis');if(kpis&&card.previousElementSibling!==kpis)kpis.insertAdjacentElement('afterend',card);
  const h=card.querySelector('.evolutionHeader h2');if(h)h.innerHTML='Evolução do patrimônio <span class="infoTip" tabindex="0" data-tip="Mostra o valor total consolidado da carteira ao longo do tempo. O ponto atual é calculado pela soma das posições cadastradas; o histórico inicial anterior à V1.5 usa a referência visual do gráfico que você enviou.">?</span>';
  const p=card.querySelector('.evolutionHeader p');if(p)p.textContent='Acompanhe o patrimônio total e alterne entre visão mensal e anual.';
  const legend=card.querySelector('.chartLegendV14');if(legend)legend.innerHTML='<span><i class="legendBar"></i>Patrimônio total</span>';
  const foot=card.querySelector('.chartFootV14');if(foot&&foot.children[1])foot.children[1].textContent='O histórico visual inicial é aproximado; novos pontos passam a usar o consolidado real dos ativos no dashboard.';
}
function makeMacroReadOnlyV15(){
  document.querySelectorAll('#rows input[data-field="current"]').forEach(input=>{const a=state.assets.find(x=>x.id===input.dataset.id),td=input.closest('td');if(a&&td)td.innerHTML=`<div class="readonlyCurrent"><strong>${fmt.format(+a.current||0)}</strong><small>Soma dos ativos da classe</small></div>`;});
  const p=document.querySelector('.tableCard .sectionTitle p');if(p)p.innerHTML='O valor atual é calculado automaticamente pelos ativos cadastrados. Edite apenas metas e aportes. <span class="macroAutoBadge">automático</span>';
  const currentInput=document.getElementById('classCurrent');if(currentInput){currentInput.value=0;const label=currentInput.closest('label');if(label)label.classList.add('classCurrentHidden');const grid=currentInput.closest('.modalGrid');if(grid&&!grid.querySelector('.autoValueNote'))grid.insertAdjacentHTML('beforeend','<div class="autoValueNote">Novas classes começam com R$ 0,00. O valor aparece automaticamente quando você cadastrar ou executar um lançamento de ativo nessa classe.</div>');}
}
function patchHoldingsRefreshV15(){
  const form=document.getElementById('holdingForm');if(form&&!form.dataset.v15Bound){form.dataset.v15Bound='1';form.addEventListener('submit',()=>setTimeout(()=>render(),0));}
  document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('[data-remove-holding]'))setTimeout(()=>render(),0);});
}
function updateVersionV15(){const e=document.querySelector('.eyebrow');if(e)e.textContent='CARTEIRA • V1.5';}

renderEvolution=renderPatrimonyEvolutionV15;
const renderBeforeV15=render;
render=function(){migratePortfolioV15();syncMacroFromHoldingsV15();upsertCurrentPatrimonyV15();renderBeforeV15();makeMacroReadOnlyV15();renderPatrimonyEvolutionV15();save();};

function initV15(){
  if(!document.querySelector('link[href="v15.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='v15.css';document.head.appendChild(l);}
  migratePortfolioV15();syncMacroFromHoldingsV15();configureEvolutionUiV15();patchHoldingsRefreshV15();updateVersionV15();upsertCurrentPatrimonyV15();save();render();
}
initV15();
