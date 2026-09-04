(()=>{
const V24_UI_KEY='carteira-v24-ui';
const V24_COLORS=['#3aa7e3','#62d3d8','#ffd65c','#ff956f','#d95ba6','#8c7cf0','#51c18b','#f0b35b','#6ba6ff','#a8d46f','#d18cff','#5bc4a8'];
let v24Ready=false;
let v24DividendDb={events:[],updatedAt:null};
let v24DividendLoaded=false;
const v24Saved=(()=>{try{return JSON.parse(localStorage.getItem(V24_UI_KEY)||'null')||{};}catch(e){return {};}})();
let v24Scope=v24Saved.scope||'macro';
let v24Type=v24Saved.type||'all';
let v24DistributionView=v24Saved.distributionView||(v24Scope==='macro'?'macro':'segments');
let v24DistributionSegment=v24Saved.distributionSegment||null;

function escV24(v){return typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function finiteV24(v){return v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v));}
function moneyV24(v){return finiteV24(v)?fmt.format(Number(v)):'—';}
function pctV24(v){return finiteV24(v)?`${Number(v).toFixed(2).replace('.',',')}%`:'—';}
function signedPctV24(v){return finiteV24(v)?`${Number(v)>=0?'+':''}${pctV24(Number(v))}`:'—';}
function signedMoneyV24(v){return finiteV24(v)?`${Number(v)>=0?'+':''}${moneyV24(Number(v))}`:'—';}
function perfClassV24(v){return !finiteV24(v)?'neutral':Number(v)>0?'positive':Number(v)<0?'negative':'neutral';}
function tickerV24(v){const t=String(v||'').trim().toUpperCase();return t==='BTC'?'BTCUSD':t;}
function isoV24(v){const s=String(v||'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:null;}
function todayV24(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function fxV24(){try{const x=typeof fxUsdBrlV20==='function'?fxUsdBrlV20():null;return Number.isFinite(+x)?+x:null;}catch(e){return null;}}
function saveUiV24(){try{localStorage.setItem(V24_UI_KEY,JSON.stringify({scope:v24Scope,type:v24Type,distributionView:v24DistributionView,distributionSegment:v24DistributionSegment}));}catch(e){}}
function ensureCssV24(){if(document.querySelector('link[href^="v24.css"]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='v24.css?v=24.2';document.head.appendChild(l);}
function updateVersionV24(){const e=document.querySelector('.topbar .eyebrow');if(e)e.textContent='CARTEIRA • V2.4';}

function txHistoryV24(){if(typeof v14==='undefined')return[];if(Array.isArray(v14.executed))return v14.executed;if(Array.isArray(v14.history))return v14.history;return[];}
function historyV24(ticker){const key=tickerV24(ticker);return txHistoryV24().filter(t=>tickerV24(t.ticker)===key&&(+t.qty||0)>0&&isoV24(t.date));}
function currentQtyV24(ticker){const key=tickerV24(ticker),h=(state.holdings||[]).find(x=>tickerV24(x.ticker)===key);return Math.max(0,+h?.qty||0);}
function qtyAtTickerV24(ticker,date){const d=isoV24(date);if(!d)return currentQtyV24(ticker);let q=currentQtyV24(ticker);historyV24(ticker).filter(t=>String(t.date)>d).forEach(t=>{const n=Math.max(0,+t.qty||0);q+=t.side==='Venda'?n:-n;});return Math.max(0,q);}
function dividendStatsV24(){
  if(!v24DividendLoaded)return {loaded:false,received12:null,receivedTotal:null};
  const fx=fxV24(),today=todayV24(),d12=new Date();d12.setMonth(d12.getMonth()-12);const start=`${d12.getFullYear()}-${String(d12.getMonth()+1).padStart(2,'0')}-${String(d12.getDate()).padStart(2,'0')}`;
  let received12=0,receivedTotal=0;
  (v24DividendDb.events||[]).forEach(e=>{
    const pay=isoV24(e.paymentDate),ex=isoV24(e.exDate);if(!pay||pay>today)return;
    const q=qtyAtTickerV24(e.ticker,ex||pay);if(q<=1e-10)return;
    const amount=Math.max(0,+e.amount||0),cur=String(e.currency||'BRL').toUpperCase();let total=amount*q;if(cur==='USD'){if(!Number.isFinite(fx))return;total*=fx;}
    if(!Number.isFinite(total))return;receivedTotal+=total;if(pay>=start)received12+=total;
  });
  return {loaded:true,received12,receivedTotal};
}
async function loadDividendsV24(){try{const r=await fetch(`dividends.json?v=${Date.now()}`,{cache:'no-store'});if(r.ok){const j=await r.json();v24DividendDb={events:Array.isArray(j.events)?j.events:[],updatedAt:j.updatedAt||null};}}catch(e){console.warn('[V2.4] falha ao carregar proventos',e);}v24DividendLoaded=true;renderPatrimonyKpisV24();}

function renderPatrimonyKpisV24(){
  const host=document.getElementById('kpis');if(!host||typeof state==='undefined')return;
  const perf=typeof portfolioPerformanceV19==='function'?portfolioPerformanceV19():{current:(state.holdings||[]).reduce((s,h)=>s+(+h.value||0),0),invested:null,delta:null,pct:null};
  const d=dividendStatsV24(),capitalGain=finiteV24(perf.delta)?Number(perf.delta):null,totalProfit=finiteV24(capitalGain)&&d.loaded?capitalGain+d.receivedTotal:null;
  host.className='grid kpis patrimonyKpisV24';
  host.innerHTML=`
    <article class="card patrimonyKpiV24">
      <div class="kpiTitleV24"><span class="kpiIconV24">◈</span><span>Patrimônio total</span></div>
      <div class="kpiMainV24"><strong>${moneyV24(perf.current)}</strong><span class="kpiChangeV24 ${perfClassV24(perf.pct)}">${pctV24(perf.pct)}${finiteV24(perf.pct)&&Number(perf.pct)!==0?` <i>${Number(perf.pct)>0?'▲':'▼'}</i>`:''}</span></div>
      <div class="kpiSubV24"><span>Valor investido</span><strong>${moneyV24(perf.invested)}</strong></div>
    </article>
    <article class="card patrimonyKpiV24">
      <div class="kpiTitleV24"><span class="kpiIconV24">◎</span><span>Lucro total</span></div>
      <div class="kpiMainV24 ${perfClassV24(totalProfit)}"><strong>${d.loaded?moneyV24(totalProfit):'Calculando…'}</strong></div>
      <div class="kpiSplitV24"><div><span>Ganho de Capital</span><strong class="${perfClassV24(capitalGain)}">${moneyV24(capitalGain)}</strong></div><div><span>Dividendos Recebidos</span><strong>${d.loaded?moneyV24(d.receivedTotal):'—'}</strong></div></div>
    </article>
    <article class="card patrimonyKpiV24">
      <div class="kpiTitleV24"><span class="kpiIconV24">▤</span><span>Proventos Recebidos (12M)</span></div>
      <div class="kpiMainV24 positive"><strong>${d.loaded?moneyV24(d.received12):'Calculando…'}</strong></div>
      <div class="kpiSubV24"><span>Total</span><strong>${d.loaded?moneyV24(d.receivedTotal):'—'}</strong></div>
    </article>`;
}

function dispersionDataV24(){const rows=typeof getRows==='function'?getRows():[],targets=typeof normalizedTargets==='function'?normalizedTargets(rows):rows.map(r=>+r.target||0),weights=rows.map(r=>+r.currentWeight||0),disp=typeof dispersionIndex==='function'?dispersionIndex(weights,targets):0,band=Math.max(0,+state.band||0);let worst=null;rows.forEach((r,i)=>{const target=targets[i]??(+r.target||0),gap=Math.abs((+r.currentWeight||0)-target);if(!worst||gap>worst.gap)worst={name:r.name,gap,current:+r.currentWeight||0,target};});return {disp,band,ok:disp<=band,worst};}
function renderAllocationHealthV24(){
  const panel=document.getElementById('tabMacroV22');if(!panel)return;let card=document.getElementById('allocationHealthV24');if(!card){card=document.createElement('section');card.id='allocationHealthV24';card.className='card allocationHealthV24';const intro=panel.querySelector('.tabIntroV22');intro?.insertAdjacentElement('afterend',card);}const d=dispersionDataV24(),ratio=d.band>0?Math.min(100,d.disp/d.band*100):(d.disp>0?100:0);card.classList.toggle('good',d.ok);card.classList.toggle('bad',!d.ok);card.innerHTML=`<div class="allocationHealthHeadV24"><div><span class="tabEyebrowV22">ADERÊNCIA À ESTRATÉGIA</span><h2>Índice de dispersão</h2><p>Distância entre a macro alocação atual e os pesos-alvo definidos.</p></div><strong class="allocationHealthValueV24">${pctV24(d.disp)}</strong></div><div class="allocationHealthGridV24"><div><span>Banda global</span><strong>±${pctV24(d.band)}</strong></div><div><span>Situação</span><strong class="${d.ok?'positive':'negative'}">${d.ok?'Dentro da banda':'Acima da banda'}</strong></div><div><span>Maior desvio</span><strong>${d.worst?escV24(d.worst.name):'—'}</strong><small>${d.worst?`${pctV24(d.worst.current)} atual • ${pctV24(d.worst.target)} alvo`:'—'}</small></div></div><div class="allocationHealthTrackV24"><i style="width:${ratio}%"></i><b style="left:100%"></b></div>`;}

function activeHoldingsV24(){return (state.holdings||[]).filter(h=>(+h.qty||0)>1e-10&&(+h.value||0)>0);}
function scopesV24(){const set=[];activeHoldingsV24().forEach(h=>{if(h.className&&!set.includes(h.className))set.push(h.className);});return set;}
function rowsForScopeV24(scope,view='macro',segment=null){
  const items=activeHoldingsV24();if(scope==='macro'){
    const map=new Map();(state.assets||[]).forEach(a=>map.set(a.name,0));items.forEach(h=>map.set(h.className,(map.get(h.className)||0)+Math.max(0,+h.value||0)));return [...map.entries()].filter(([,value])=>value>0).map(([name,value])=>({name,value,key:name}));
  }
  const scoped=items.filter(h=>h.className===scope);
  if(view==='segments'){
    const map=new Map();scoped.forEach(h=>{const name=String(h.segment||'Sem segmento').trim()||'Sem segmento',entry=map.get(name)||{name,value:0,count:0,key:name};entry.value+=Math.max(0,+h.value||0);entry.count++;map.set(name,entry);});
    return [...map.values()].map(r=>({...r,subtitle:`${r.count} ${r.count===1?'ativo':'ativos'}`})).sort((a,b)=>b.value-a.value);
  }
  return scoped.filter(h=>!segment||(String(h.segment||'Sem segmento').trim()||'Sem segmento')===segment).map(h=>({name:tickerV24(h.ticker),subtitle:h.name||'',value:Math.max(0,+h.value||0),key:h.id||h.ticker})).sort((a,b)=>b.value-a.value);
}
function gradientV24(rows){const total=rows.reduce((s,r)=>s+r.value,0);if(total<=0)return '#14283d';let acc=0,stops=[];rows.forEach((r,i)=>{const start=acc,end=acc+r.value/total*100;stops.push(`${V24_COLORS[i%V24_COLORS.length]} ${start}% ${end}%`);acc=end;});return `conic-gradient(${stops.join(',')})`;}
function ensureDistributionCardV24(){
  const panel=document.getElementById('tabPatrimonioV22'),evo=document.querySelector('.evolutionCard');if(!panel||!evo)return null;let grid=document.getElementById('patrimonyChartsGridV24');if(!grid){grid=document.createElement('div');grid.id='patrimonyChartsGridV24';grid.className='patrimonyChartsGridV24';const kpis=document.getElementById('kpis');if(kpis)kpis.insertAdjacentElement('afterend',grid);else panel.appendChild(grid);}if(evo.parentElement!==grid)grid.appendChild(evo);let card=document.getElementById('portfolioDistributionV24');if(!card){card=document.createElement('section');card.id='portfolioDistributionV24';card.className='card portfolioDistributionV24';grid.appendChild(card);}else if(card.parentElement!==grid)grid.appendChild(card);return card;
}
function renderDistributionV24(){
  const card=ensureDistributionCardV24();if(!card)return;const classes=scopesV24();
  if(v24Scope!=='macro'&&!classes.includes(v24Scope)){v24Scope='macro';v24DistributionView='macro';v24DistributionSegment=null;}
  if(v24Scope==='macro')v24DistributionView='macro';
  if(v24Scope!=='macro'&&v24DistributionView==='macro')v24DistributionView='segments';
  const segmentRows=v24Scope==='macro'?[]:rowsForScopeV24(v24Scope,'segments');
  if(v24DistributionSegment&&!segmentRows.some(r=>r.name===v24DistributionSegment))v24DistributionSegment=null;
  const rows=rowsForScopeV24(v24Scope,v24DistributionView,v24DistributionView==='assets'?v24DistributionSegment:null),total=rows.reduce((s,r)=>s+r.value,0);
  const context=v24Scope==='macro'?'Macro alocação':v24DistributionView==='segments'?`${v24Scope} • Segmentos`:`${v24Scope}${v24DistributionSegment?` • ${v24DistributionSegment}`:''} • Ativos`;
  const interactive=v24DistributionView!=='assets';
  card.dataset.distributionViewV24=v24DistributionView;
  card.innerHTML=`<div class="distributionHeaderV24"><div><h2>Resumo da carteira</h2><p class="distributionContextV213">${escV24(context)}</p></div><div class="distributionHeaderToolsV213"><div class="distributionViewsV213" role="group" aria-label="Nível de visualização"><button type="button" data-distribution-view-v24="macro" class="${v24DistributionView==='macro'?'active':''}">Macro</button><button type="button" data-distribution-view-v24="segments" class="${v24DistributionView==='segments'?'active':''}" ${v24Scope==='macro'?'disabled':''}>Segmentos</button><button type="button" data-distribution-view-v24="assets" class="${v24DistributionView==='assets'?'active':''}" ${v24Scope==='macro'?'disabled':''}>Ativos</button></div><select id="distributionScopeV24" aria-label="Classe de ativos"><option value="macro">Carteira completa</option>${classes.map(c=>`<option value="${escV24(c)}">${escV24(c)}</option>`).join('')}</select></div></div><div class="distributionBodyV24"><div class="distributionDonutV24" style="background:${gradientV24(rows)}"><div aria-hidden="true"></div></div><div class="distributionLegendV24">${rows.map((r,i)=>{const w=total?r.value/total*100:0,drill=v24DistributionView==='macro'?`data-drill-v24="${escV24(r.name)}"`:v24DistributionView==='segments'?`data-segment-drill-v24="${escV24(r.name)}"`:'';return `<button type="button" ${drill} class="${interactive?'distributionDrillV213':''}"><i style="background:${V24_COLORS[i%V24_COLORS.length]}"></i><span><strong>${escV24(r.name)}</strong>${r.subtitle?`<small>${escV24(r.subtitle)}</small>`:''}</span><b>${pctV24(w)}</b>${interactive?'<em aria-hidden="true">›</em>':''}</button>`;}).join('')||'<div class="emptyState">Sem posições para exibir.</div>'}</div></div>${v24Scope!=='macro'?`<button type="button" id="distributionBackV24" class="ghost compact distributionBackV24">← ${v24DistributionView==='assets'?'Voltar aos segmentos':'Voltar à carteira'}</button>`:''}`;
  const sel=card.querySelector('#distributionScopeV24');if(sel){sel.value=v24Scope;sel.onchange=e=>{v24Scope=e.target.value;v24DistributionView=v24Scope==='macro'?'macro':'segments';v24DistributionSegment=null;saveUiV24();renderDistributionV24();};}
  card.querySelectorAll('[data-distribution-view-v24]').forEach(b=>b.onclick=()=>{const view=b.dataset.distributionViewV24;if(view==='macro'){v24Scope='macro';v24DistributionSegment=null;}else if(v24Scope!=='macro'){v24DistributionView=view;if(view==='assets')v24DistributionSegment=null;}v24DistributionView=view;saveUiV24();renderDistributionV24();});
  card.querySelectorAll('[data-drill-v24]').forEach(b=>b.onclick=()=>{v24Scope=b.dataset.drillV24;v24DistributionView='segments';v24DistributionSegment=null;saveUiV24();renderDistributionV24();});
  card.querySelectorAll('[data-segment-drill-v24]').forEach(b=>b.onclick=()=>{v24DistributionView='assets';v24DistributionSegment=b.dataset.segmentDrillV24;saveUiV24();renderDistributionV24();});
  card.querySelector('#distributionBackV24')?.addEventListener('click',()=>{if(v24DistributionView==='assets'){v24DistributionView='segments';v24DistributionSegment=null;}else{v24Scope='macro';v24DistributionView='macro';}saveUiV24();renderDistributionV24();});
}

function txBrlV24(t){if(finiteV24(t?.brlTotal))return Number(t.brlTotal);if(String(t?.currency||'').toUpperCase()==='USD'&&finiteV24(t?.totalNative)&&finiteV24(fxV24()))return Number(t.totalNative)*fxV24();return null;}
function scopePerfV24(scope){if(scope&&scope!=='all'&&typeof classPerformanceV19==='function')return classPerformanceV19(scope);return typeof portfolioPerformanceV19==='function'?portfolioPerformanceV19():{current:null,invested:null,delta:null,pct:null};}
function monthKeyV24(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
function monthLabelV24(k){const [y,m]=k.split('-');return `${m}/${String(y).slice(2)}`;}
function txMonthV24(t){const d=isoV24(t?.date);return d?d.slice(0,7):null;}
function compactMoneyV24(v){const n=Math.max(0,Number(v)||0);if(n>=1e6)return `R$ ${(n/1e6).toFixed(1).replace('.',',')} mi`;if(n>=1e3)return `R$ ${(n/1e3).toFixed(1).replace('.',',')} mil`;return `R$ ${Math.round(n).toLocaleString('pt-BR')}`;}
function patrimonySeriesV24(){
  const classes=scopesV24();if(v24Type!=='all'&&!classes.includes(v24Type))v24Type='all';
  const perf=scopePerfV24(v24Type),history=txHistoryV24().filter(t=>isoV24(t.date)&&(v24Type==='all'||t.className===v24Type)).map(t=>({...t,_brl:txBrlV24(t)})).filter(t=>finiteV24(t._brl));
  const range=typeof v14!=='undefined'?String(v14.chartRange||'12'):'12',now=new Date(),keys=[];
  if(range==='all'){
    const first=history.map(t=>txMonthV24(t)).filter(Boolean).sort()[0];if(first){let [y,m]=first.split('-').map(Number);const ey=now.getFullYear(),em=now.getMonth()+1;while(y<ey||(y===ey&&m<=em)){keys.push(`${y}-${String(m).padStart(2,'0')}`);m++;if(m>12){m=1;y++;}}}
  }else{const count=Math.max(1,Number(range)||12);for(let i=count-1;i>=0;i--){keys.push(monthKeyV24(new Date(now.getFullYear(),now.getMonth()-i,1)));}}
  if(!keys.length)keys.push(monthKeyV24(now));
  const signed=t=>(t.side==='Venda'?-1:1)*Number(t._brl||0),netAll=history.reduce((s,t)=>s+signed(t),0),investedNow=finiteV24(perf.invested)?Number(perf.invested):null;
  let applied=Math.max(0,(investedNow??Math.max(0,netAll))-netAll);const firstKey=keys[0];history.filter(t=>txMonthV24(t)<firstKey).forEach(t=>applied=Math.max(0,applied+signed(t)));
  const gainRate=investedNow&&finiteV24(perf.delta)?Number(perf.delta)/investedNow:0;
  const data=keys.map(key=>{history.filter(t=>txMonthV24(t)===key).forEach(t=>applied=Math.max(0,applied+signed(t)));const gain=applied*gainRate;return {key,label:monthLabelV24(key),applied,gain,total:Math.max(0,applied+gain)};});
  if(data.length&&investedNow!==null){const last=data[data.length-1];last.applied=investedNow;last.gain=finiteV24(perf.delta)?Number(perf.delta):0;last.total=Math.max(0,last.applied+last.gain);}
  return {data,perf,estimated:data.length>1};
}
function prepareEvolutionTemplateV24(){
  const card=document.querySelector('#patrimonyChartsGridV24 .evolutionCard')||document.querySelector('.evolutionCard');if(!card)return;
  const h2=card.querySelector('.evolutionHeader h2');if(h2)h2.textContent='Evolução do Patrimônio';const p=card.querySelector('.evolutionHeader p');if(p)p.textContent='Acompanhe valor aplicado e ganho de capital ao longo do tempo.';
  const monthly=document.getElementById('modeMonthly'),annual=document.getElementById('modeAnnual');if(monthly)monthly.style.display='none';if(annual)annual.style.display='none';if(typeof v14!=='undefined')v14.chartMode='monthly';
  const range=document.getElementById('chartRange');if(range){range.innerHTML='<option value="12">12 Meses</option><option value="24">24 Meses</option><option value="all">Todo o histórico</option>';range.value=String(v14?.chartRange||'12');range.disabled=false;}
  const controls=card.querySelector('.chartControls');if(controls&&!document.getElementById('patrimonyTypeV24')){const sel=document.createElement('select');sel.id='patrimonyTypeV24';controls.appendChild(sel);sel.onchange=e=>{v24Type=e.target.value;saveUiV24();renderPatrimonyEvolutionV24();};}
  const sel=document.getElementById('patrimonyTypeV24'),classes=scopesV24();if(v24Type!=='all'&&!classes.includes(v24Type))v24Type='all';if(sel){sel.innerHTML=`<option value="all">Todos os tipos</option>${classes.map(c=>`<option value="${escV24(c)}">${escV24(c)}</option>`).join('')}`;sel.value=v24Type;}
  const legend=card.querySelector('.chartLegendV14');if(legend)legend.innerHTML='<span><i class="legendBar"></i>Valor aplicado</span><span><i class="legendGainV24"></i>Ganho de Capital</span>';
}
function renderPatrimonyEvolutionV24(){
  prepareEvolutionTemplateV24();const box=document.getElementById('aportesChart');if(!box)return;const {data,perf}=patrimonySeriesV24();if(!data.length){box.innerHTML='<div class="chartEmpty">Não há dados suficientes para montar a evolução.</div>';return;}
  const W=1000,H=330,left=88,right=18,top=28,bottom=54,plotW=W-left-right,plotH=H-top-bottom,max=Math.max(...data.map(d=>Math.max(d.applied,d.total)),1)*1.08,steps=4;let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução do patrimônio"><g font-family="Inter,system-ui,sans-serif">`;
  for(let i=0;i<=steps;i++){const val=max*(steps-i)/steps,y=top+plotH*i/steps;svg+=`<line x1="${left}" y1="${y}" x2="${W-right}" y2="${y}" class="patrimonyGridV24"/><text x="${left-12}" y="${y+4}" text-anchor="end" class="patrimonyAxisTextV24">${escV24(compactMoneyV24(val))}</text>`;}
  const slot=plotW/data.length,barW=Math.max(12,Math.min(52,slot*.58));data.forEach((d,i)=>{const x=left+slot*i+slot/2,baseY=top+plotH,appliedH=(d.applied/max)*plotH,appliedY=baseY-appliedH,gainPos=Math.max(0,d.gain),gainH=(gainPos/max)*plotH,gainY=appliedY-gainH;svg+=`<rect x="${x-barW/2}" y="${appliedY}" width="${barW}" height="${Math.max(0,appliedH)}" rx="4" class="patrimonyAppliedV24"><title>${d.label}: Valor aplicado ${moneyV24(d.applied)}</title></rect>`;if(gainH>0.5)svg+=`<rect x="${x-barW/2}" y="${gainY}" width="${barW}" height="${gainH}" rx="4" class="patrimonyGainV24"><title>${d.label}: Ganho de Capital ${moneyV24(d.gain)}</title></rect>`;if(data.length<=16||i%Math.ceil(data.length/12)===0)svg+=`<text x="${x}" y="${H-18}" text-anchor="end" class="patrimonyAxisTextV24" transform="rotate(-45 ${x} ${H-18})">${d.label}</text>`;});svg+='</g></svg>';box.innerHTML=svg;
  const summary=document.getElementById('chartEvolutionSummary');if(summary)summary.innerHTML=`Atual: <strong>${moneyV24(perf.invested)}</strong> aplicado • <strong class="${perfClassV24(perf.delta)}">${moneyV24(perf.delta)}</strong> em ganho de capital`;
  const foot=box.closest('.evolutionCard')?.querySelector('.chartFootV14');if(foot){const spans=foot.querySelectorAll('span');if(spans[1])spans[1].textContent='Histórico de ganho de capital estimado pela rentabilidade atual; o ponto mais recente usa o valor real.';}
}

function hideOldPatrimonySummariesV24(){const grid=document.getElementById('patrimonyOverviewGridV22');if(grid)grid.classList.add('hiddenPatrimonyOverviewV24');}
function ensurePatrimonyLayoutV24(){const panel=document.getElementById('tabPatrimonioV22'),kpis=document.getElementById('kpis');if(!panel||!kpis)return;if(kpis.parentElement!==panel)panel.appendChild(kpis);renderPatrimonyKpisV24();hideOldPatrimonySummariesV24();renderDistributionV24();renderPatrimonyEvolutionV24();}

function afterRenderV24(){if(!v24Ready)return;updateVersionV24();ensurePatrimonyLayoutV24();renderAllocationHealthV24();}
function initV24(){
  if(v24Ready)return;v24Ready=true;ensureCssV24();
  if(typeof renderTopPerformanceV19==='function'){const prevTop=renderTopPerformanceV19;renderTopPerformanceV19=function(){const r=prevTop();renderPatrimonyKpisV24();return r;};}
  const previousRender=render;render=function(){const r=previousRender();afterRenderV24();return r;};
  afterRenderV24();loadDividendsV24();
  window.addEventListener('hashchange',()=>setTimeout(()=>{if(String(location.hash).includes('patrimonio')){ensurePatrimonyLayoutV24();}if(String(location.hash).includes('alocacao'))renderAllocationHealthV24();},0));
}
let attempts=0;const boot=()=>{attempts++;if(typeof render!=='function'||typeof portfolioPerformanceV19!=='function'||!document.getElementById('tabPatrimonioV22')||!document.getElementById('tabMacroV22')){if(attempts<400)setTimeout(boot,25);return;}initV24();};boot();
})();
