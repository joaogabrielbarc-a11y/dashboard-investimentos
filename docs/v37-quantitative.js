(()=>{
'use strict';
if(window.__PONDERA_QUANT_V37__)return;

const VERSION='2.19.0',MS_DAY=86400000,DATA_CACHE_TTL=MS_DAY,DATA_CACHE_PREFIX='pondera-quant-daily-v38:';
let data={history:null,indexes:null,prices:null,failed:[],cacheHits:0},curveMode='nominal',rendering=false,revealTimer=null,analysisMemo=null;
const finite=value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value));
const esc=value=>typeof escapeHtml==='function'?escapeHtml(String(value??'')):String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const ticker=value=>{const key=String(value||'').trim().toUpperCase();return key==='BTC'?'BTCUSD':key;};
const date=value=>{const key=String(value||'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(key)?key:null;};
const pct=(value,digits=2)=>finite(value)?`${Number(value).toFixed(digits).replace('.',',')}%`:'—';
const num=(value,digits=2)=>finite(value)?Number(value).toFixed(digits).replace('.',','):'—';
const brDate=value=>{const key=date(value);if(!key)return'—';const[y,m,d]=key.split('-');return`${d}/${m}/${y}`;};
const executed=()=>typeof v14!=='undefined'&&Array.isArray(v14.executed)?v14.executed:[];
const sampleStd=values=>{if(values.length<2)return null;const mean=values.reduce((sum,value)=>sum+value,0)/values.length;return Math.sqrt(values.reduce((sum,value)=>sum+(value-mean)**2,0)/(values.length-1));};
const tone=value=>!finite(value)?'neutral':Number(value)>0?'positive':Number(value)<0?'negative':'neutral';

function ensurePanel(){
  const nav=document.getElementById('portfolioTabsV22');
  if(nav&&!nav.querySelector('[data-tab-v23="quantitativa"]'))nav.insertAdjacentHTML('beforeend','<button type="button" data-tab-v23="quantitativa" role="tab"><span class="tabIconV22">∿</span><span>Análise Quantitativa</span></button>');
  let panel=document.getElementById('tabQuantitativaV37');
  if(!panel){panel=document.createElement('section');panel.id='tabQuantitativaV37';panel.className='tabPanelV22 hiddenV22 quantPanelV37';panel.setAttribute('aria-hidden','true');panel.innerHTML='<div class="tabIntroV22"><div><span class="tabEyebrowV22">RETORNO, RISCO E MERCADO</span><h2>Análise Quantitativa</h2><p>Rentabilidade da carteira sem confundir aportes com desempenho, risco histórico e relações entre classes.</p></div></div><section id="quantBodyV37" class="card quantLoadingV37"><div><strong>Preparando a análise</strong><span>Consolidando lançamentos, preços históricos e indicadores de mercado.</span><div class="quantLoadingBarV37"><i></i></div></div></section>';document.querySelector('main.shell')?.insertBefore(panel,document.querySelector('main.shell > footer'));
  }
  return panel;
}

function revealAllocation(){
  const panel=document.getElementById('tabMacroV22');if(!panel)return;
  clearTimeout(revealTimer);panel.classList.add('allocationEnteringV37');panel.classList.remove('allocationReadyV37');
  revealTimer=setTimeout(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{panel.classList.remove('allocationEnteringV37');panel.classList.add('allocationReadyV37');})),110);
}

function readCache(key,allowExpired=false){try{const parsed=JSON.parse(localStorage.getItem(key)||'null');if(!parsed||!parsed.savedAt||parsed.value===undefined)return null;const age=Date.now()-Number(parsed.savedAt);return allowExpired||age<DATA_CACHE_TTL?{...parsed,age}:null;}catch(e){return null;}}
function writeCache(key,value){try{localStorage.setItem(key,JSON.stringify({savedAt:Date.now(),value}));}catch(e){}}
async function fetchJson(path){
  const key=DATA_CACHE_PREFIX+path,fresh=readCache(key);
  if(fresh){data.cacheHits++;return fresh.value;}
  try{const response=await fetch(`${path}?v=${VERSION}`,{cache:'default'});if(!response.ok)throw new Error(`${path}: HTTP ${response.status}`);const value=await response.json();writeCache(key,value);return value;}
  catch(error){const stale=readCache(key,true);if(stale){data.cacheHits++;return stale.value;}throw error;}
}
async function load(){
  const jobs=[['history','quant-market-history.json'],['indexes','market-indexes.json'],['prices','prices.json']];
  const results=await Promise.allSettled(jobs.map(([,path])=>fetchJson(path)));
  results.forEach((result,index)=>{const[key,path]=jobs[index];if(result.status==='fulfilled')data[key]=result.value;else data.failed.push(path);});
  render();
}

function priceMaps(){
  const output=new Map();
  Object.entries(data.history?.prices||{}).forEach(([key,rows])=>{const clean=(Array.isArray(rows)?rows:[]).map(row=>[date(row?.[0]),Number(row?.[1])]).filter(row=>row[0]&&finite(row[1])&&row[1]>0).sort((a,b)=>a[0].localeCompare(b[0]));if(clean.length)output.set(ticker(key),clean);});
  return output;
}
function fingerprint(transactions){let hash=2166136261;const text=transactions.map(item=>[item.id,item.ticker,item.className,item.side,item.qty,item.date].join('|')).join('~');for(let index=0;index<text.length;index++){hash^=text.charCodeAt(index);hash=Math.imul(hash,16777619);}return(hash>>>0).toString(36);}
function seriesFromCache(value){if(!value||!Array.isArray(value.returns)||!Array.isArray(value.curve))return null;return{...value,classReturns:new Map(Object.entries(value.classReturns||{})),_cached:true};}
function persistAnalysis(key,series,metrics){const value={key,series:{returns:series.returns,curve:series.curve,classReturns:Object.fromEntries(series.classReturns),covered:series.covered,total:series.total,start:series.start,end:series.end},metrics};writeCache(DATA_CACHE_PREFIX+'analysis',value);analysisMemo={key,series,metrics};}
function valueAt(rows,key){
  let low=0,high=rows.length-1,found=null;
  while(low<=high){const middle=(low+high)>>1;if(rows[middle][0]<=key){found=rows[middle][1];low=middle+1;}else high=middle-1;}
  return found;
}
function quantitativeSeries(){
  const transactions=executed().filter(item=>date(item.date)&&Number(item.qty)>0).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))),maps=priceMaps();
  const cacheKey=[data.history?.updatedAt||'',data.indexes?.updatedAt||'',fingerprint(transactions)].join('|');
  if(analysisMemo?.key===cacheKey)return analysisMemo.series;
  const stored=readCache(DATA_CACHE_PREFIX+'analysis');
  if(stored?.value?.key===cacheKey){const restored=seriesFromCache(stored.value.series);if(restored){analysisMemo={key:cacheKey,series:restored,metrics:stored.value.metrics};data.cacheHits++;return restored;}}
  const allTickers=[...new Set(transactions.map(item=>ticker(item.ticker)))],covered=allTickers.filter(key=>maps.has(key)),firstTx=transactions[0]?.date;
  if(!firstTx||!covered.length)return{returns:[],curve:[],classReturns:new Map(),covered,total:allTickers.length,start:null,end:null,_cacheKey:cacheKey};
  const txByDate=new Map(),classByTicker=new Map();
  transactions.forEach(item=>{const key=date(item.date);if(!txByDate.has(key))txByDate.set(key,[]);txByDate.get(key).push(item);classByTicker.set(ticker(item.ticker),item.className||'Sem classe');});
  const dateSet=new Set(txByDate.keys());maps.forEach(rows=>rows.forEach(([key])=>{if(key>=firstTx)dateSet.add(key);}));
  const dates=[...dateSet].filter(key=>key>=firstTx).sort(),quantities=new Map(),previousPrices=new Map(),returns=[],curve=[],classReturns=new Map();let cumulative=1,peak=1;
  for(const key of dates){
    const currentPrices=new Map();covered.forEach(symbol=>{const value=valueAt(maps.get(symbol),key);if(finite(value))currentPrices.set(symbol,value);});
    let priorValue=0,pnl=0;const classPrior=new Map(),classPnl=new Map();
    covered.forEach(symbol=>{const qty=Math.max(0,quantities.get(symbol)||0),previous=previousPrices.get(symbol),current=currentPrices.get(symbol),className=classByTicker.get(symbol)||'Sem classe';if(qty>0&&finite(previous)&&finite(current)){const base=qty*previous,gain=qty*(current-previous);priorValue+=base;pnl+=gain;classPrior.set(className,(classPrior.get(className)||0)+base);classPnl.set(className,(classPnl.get(className)||0)+gain);}});
    const isWeekday=new Date(`${key}T12:00:00`).getDay()%6!==0;
    if(priorValue>0&&isWeekday){const daily=pnl/priorValue;if(Number.isFinite(daily)&&Math.abs(daily)<1){returns.push({date:key,value:daily});cumulative*=1+daily;peak=Math.max(peak,cumulative);curve.push({date:key,value:cumulative-1,drawdown:cumulative/peak-1});}}
    if(isWeekday)classPrior.forEach((base,className)=>{if(base<=0)return;const daily=(classPnl.get(className)||0)/base;if(!Number.isFinite(daily)||Math.abs(daily)>=1)return;if(!classReturns.has(className))classReturns.set(className,[]);classReturns.get(className).push({date:key,value:daily});});
    (txByDate.get(key)||[]).forEach(item=>{const symbol=ticker(item.ticker);if(!maps.has(symbol))return;const qty=Math.max(0,Number(item.qty)||0),before=quantities.get(symbol)||0;quantities.set(symbol,item.side==='Venda'?Math.max(0,before-qty):before+qty);});
    currentPrices.forEach((value,symbol)=>previousPrices.set(symbol,value));
  }
  return{returns,curve,classReturns,covered,total:allTickers.length,start:returns[0]?.date||firstTx,end:returns[returns.length-1]?.date||firstTx,_cacheKey:cacheKey};
}

function riskMetrics(series){
  const values=series.returns.map(row=>row.value),count=values.length;if(count<2)return{count,total:null,cagr:null,volatility:null,drawdown:null,sharpe:null,sortino:null};
  const total=series.curve.at(-1)?.value??null,days=Math.max(1,(new Date(`${series.end}T12:00:00`)-new Date(`${series.start}T12:00:00`))/MS_DAY),cagr=finite(total)&&total>-1?(Math.pow(1+total,365.25/days)-1):null,std=sampleStd(values),volatility=finite(std)?std*Math.sqrt(252):null,drawdown=Math.min(0,...series.curve.map(row=>row.drawdown));
  const selic=Number(data.indexes?.indexes?.SELIC?.annualPct),rfAnnual=finite(selic)?selic/100:0,rfDaily=Math.pow(1+rfAnnual,1/252)-1,excess=values.map(value=>value-rfDaily),mean=excess.reduce((sum,value)=>sum+value,0)/excess.length,excessStd=sampleStd(excess),downside=Math.sqrt(excess.reduce((sum,value)=>sum+Math.min(0,value)**2,0)/excess.length),sharpe=excessStd>0?mean/excessStd*Math.sqrt(252):null,sortino=downside>0?mean/downside*Math.sqrt(252):null;
  return{count,total:total*100,cagr:cagr*100,volatility:volatility*100,drawdown:drawdown*100,sharpe,sortino};
}
function correlation(a,b){const right=new Map(b.map(row=>[row.date,row.value])),pairs=a.filter(row=>right.has(row.date)).map(row=>[row.value,right.get(row.date)]);if(pairs.length<20)return null;const xs=pairs.map(row=>row[0]),ys=pairs.map(row=>row[1]),mx=xs.reduce((s,v)=>s+v,0)/xs.length,my=ys.reduce((s,v)=>s+v,0)/ys.length,num=xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0),dx=Math.sqrt(xs.reduce((s,x)=>s+(x-mx)**2,0)),dy=Math.sqrt(ys.reduce((s,y)=>s+(y-my)**2,0));return dx>0&&dy>0?num/(dx*dy):null;}
function heat(value){if(!finite(value))return'#0a1928';const magnitude=Math.min(1,Math.abs(value)),rgb=value>=0?'67,211,158':'255,143,155';return`rgba(${rgb},${.08+magnitude*.48})`;}

function lineChart(series){
  if(series.curve.length<2)return'<div class="quantEmptyV37">Ainda não há histórico de mercado suficiente para calcular a trajetória da carteira.</div>';
  const rows=series.curve,W=1000,H=310,L=62,R=18,T=18,B=42,pw=W-L-R,ph=H-T-B,min=Math.min(-.02,...rows.flatMap(row=>[row.value,row.drawdown])),max=Math.max(.02,...rows.map(row=>row.value)),span=Math.max(.01,max-min),x=index=>L+pw*index/Math.max(1,rows.length-1),y=value=>T+(max-value)/span*ph,path=field=>rows.map((row,index)=>`${index?'L':'M'}${x(index).toFixed(1)},${y(row[field]).toFixed(1)}`).join(' ');let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Retorno acumulado e drawdown da carteira">`;
  for(let index=0;index<=4;index++){const value=max-span*index/4,py=y(value);svg+=`<line x1="${L}" y1="${py}" x2="${W-R}" y2="${py}" stroke="#20344d"/><text x="${L-9}" y="${py+4}" text-anchor="end" fill="#7890aa" font-size="10">${pct(value*100,0)}</text>`;}
  svg+=`<path d="${path('drawdown')} L${x(rows.length-1)},${y(0)} L${x(0)},${y(0)} Z" fill="rgba(255,143,155,.12)"/><path d="${path('drawdown')}" fill="none" stroke="#ff8f9b" stroke-width="2"/><path d="${path('value')}" fill="none" stroke="#43d39e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  const marks=[0,Math.floor((rows.length-1)/2),rows.length-1];marks.forEach(index=>svg+=`<text x="${x(index)}" y="${H-14}" text-anchor="${index===0?'start':index===rows.length-1?'end':'middle'}" fill="#7890aa" font-size="10">${brDate(rows[index].date)}</text>`);return svg+'</svg>';
}
function curveChart(){
  const block=data.indexes?.indexes?.YIELD_CURVE_BR,rows=Array.isArray(block?.[curveMode])?block[curveMode].filter(row=>finite(row.annualPct)):[];
  if(rows.length<2)return'<div class="quantEmptyV37">Curva indisponível na atualização mais recente.</div>';
  const W=520,H=215,L=42,R=15,T=18,B=42,min=Math.min(...rows.map(row=>Number(row.annualPct)))-.5,max=Math.max(...rows.map(row=>Number(row.annualPct)))+.5,span=Math.max(1,max-min),x=index=>L+(W-L-R)*index/(rows.length-1),y=value=>T+(max-value)/span*(H-T-B),path=rows.map((row,index)=>`${index?'L':'M'}${x(index)},${y(row.annualPct)}`).join(' ');let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Curva de juros do Tesouro Nacional"><path d="${path}" fill="none" stroke="#69a7ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">`;
  svg+='</path>';rows.forEach((row,index)=>{svg+=`<circle cx="${x(index)}" cy="${y(row.annualPct)}" r="4" fill="#43d39e"><title>${esc(row.label)}: ${pct(row.annualPct)}</title></circle>`;if(index===0||index===rows.length-1||rows.length<=6)svg+=`<text x="${x(index)}" y="${H-16}" text-anchor="middle" fill="#7890aa" font-size="9">${row.maturity.slice(0,4)}</text>`;});return svg+'</svg>';
}
function macroCards(){
  const indexes=data.indexes?.indexes||{},fx=data.prices?.fxUsdBrl,items=[['USD / BRL',finite(fx)?`R$ ${Number(fx).toFixed(4).replace('.',',')}`:'—',data.prices?.updatedAt?'Cotação mais recente disponível':'Sem atualização'],['Selic',pct(indexes.SELIC?.annualPct),'Taxa anual efetiva • '+(indexes.SELIC?.date||'—')],['IPCA 12 meses',pct(indexes.IPCA?.annualPct),'Último mês: '+pct(indexes.IPCA?.lastMonthlyPct)+' • '+(indexes.IPCA?.date||'—')],['Fed Funds',pct(indexes.FED_FUNDS?.annualPct),'Taxa efetiva • '+(indexes.FED_FUNDS?.date||'—')]];return items.map(([label,value,detail])=>`<div class="quantMacroV37"><span>${label}</span><strong>${value}</strong><small>${detail}</small></div>`).join('');
}
function renderCorrelation(series){
  const classes=[...series.classReturns.entries()].filter(([,rows])=>rows.length>=20).map(([name])=>name).sort();if(classes.length<2)return'<div class="quantEmptyV37">São necessárias ao menos duas classes com 20 pregões em comum para calcular correlação.</div>';
  return`<div class="correlationWrapV37"><table class="correlationTableV37"><thead><tr><th>Classe</th>${classes.map(name=>`<th>${esc(name)}</th>`).join('')}</tr></thead><tbody>${classes.map(left=>`<tr><th>${esc(left)}</th>${classes.map(right=>{const value=left===right?1:correlation(series.classReturns.get(left),series.classReturns.get(right));return`<td class="${finite(value)?'':'na'}" style="background:${heat(value)}" title="${esc(left)} × ${esc(right)}">${finite(value)?num(value,2):'—'}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function render(){
  if(rendering)return;rendering=true;try{
    const panel=ensurePanel(),host=document.getElementById('quantBodyV37');if(!host)return;const series=quantitativeSeries(),memoMetrics=analysisMemo?.key===series._cacheKey||series._cached?analysisMemo?.metrics:null,metrics=memoMetrics||riskMetrics(series),enough=metrics.count>=30,coverage=series.total?series.covered.length/series.total:0,updated=data.history?.updatedAt||data.indexes?.updatedAt;
    if(series._cacheKey&&!series._cached)persistAnalysis(series._cacheKey,series,metrics);
    host.className='quantBodyV37';host.innerHTML=`<div class="quantQualityV37"><span><strong class="${coverage>=.75?'good':'warn'}">${series.covered.length} de ${series.total} ativos cobertos</strong> • ${metrics.count} pregões válidos • ${brDate(series.start)} a ${brDate(series.end)}</span><span>Dados de mercado: <strong>${updated?new Date(updated).toLocaleString('pt-BR'):'indisponíveis'}</strong></span></div><section class="quantKpisV37">${[['Rentabilidade acumulada',metrics.total,'Retorno ponderado pelo tempo, líquido do efeito dos aportes.','pct'],['Retorno anualizado',metrics.cagr,'Crescimento anual composto no período observado.','pct'],['Volatilidade',metrics.volatility,'Desvio-padrão diário anualizado em 252 pregões.','pct'],['Drawdown máximo',metrics.drawdown,'Maior queda acumulada desde um pico histórico.','pct'],['Índice de Sharpe',metrics.sharpe,'Excesso de retorno sobre a Selic por unidade de volatilidade.','num'],['Índice de Sortino',metrics.sortino,'Excesso de retorno dividido apenas pelo risco de queda.','num']].map(([label,value,detail,format])=>`<article class="card quantKpiV37 ${tone(value)}"><span>${label}</span><strong>${enough?(format==='pct'?pct(value):num(value)):'—'}</strong><small>${enough?detail:'Histórico mínimo: 30 pregões com posição e preço.'}</small></article>`).join('')}</section><section class="quantGridV37"><article class="card quantCardV37"><div class="quantCardHeadV37"><div><h2>Evolução do retorno e drawdown</h2><p>Retorno total em BRL reconstruído com preços ajustados e lançamentos executados.</p></div></div><div class="quantChartV37">${lineChart(series)}</div><div class="quantLegendV37"><span><i class="portfolio"></i>Retorno acumulado</span><span><i class="drawdown"></i>Drawdown</span></div></article><article class="card quantCardV37"><div class="quantCardHeadV37"><div><h2>Indicadores de mercado</h2><p>Referências macro usadas para interpretar a carteira.</p></div></div><div class="quantMacroGridV37">${macroCards()}</div><div class="quantCardHeadV37" style="margin-top:19px"><div><h2>Curva de juros brasileira</h2><p>Títulos públicos disponíveis no Tesouro Transparente.</p></div><div class="curveToggleV37"><button type="button" data-curve-v37="nominal" class="${curveMode==='nominal'?'active':''}">Nominal</button><button type="button" data-curve-v37="real" class="${curveMode==='real'?'active':''}">Real (IPCA+)</button></div></div><div class="curveChartV37">${curveChart()}</div></article></section><section class="card quantCardV37"><div class="quantCardHeadV37"><div><h2>Correlação entre classes</h2><p>Correlação de Pearson dos retornos diários em BRL nas datas em comum.</p></div></div>${renderCorrelation(series)}<p class="correlationNoteV37">Valores próximos de 1 indicam movimentos semelhantes; próximos de −1 indicam movimentos opostos. Classes sem histórico suficiente permanecem sem valor.</p></section><section class="card quantMethodV37"><h2>Metodologia e limites</h2><p>Sharpe, Sortino, volatilidade e drawdown seguem as definições usuais de avaliação conjunta de retorno e risco apresentadas pela <a href="https://quantumfinance.com.br/indicadores-financeiros/" target="_blank" rel="noopener noreferrer">Quantum Finance</a>. Os cálculos usam retorno ponderado pelo tempo para neutralizar compras e vendas. A Selic é a taxa livre de risco; preços ajustados incorporam proventos e desdobramentos, e ativos em dólar são convertidos pelo câmbio diário. Resultados com menos de 30 pregões não são exibidos e não representam previsão de retorno.</p></section>`;
    host.querySelectorAll('[data-curve-v37]').forEach(button=>button.onclick=()=>{curveMode=button.dataset.curveV37;render();});panel.dataset.ponderaOwner='v37';document.documentElement.dataset.ponderaQuant=VERSION;
  }finally{rendering=false;}
}
function audit(){const panel=document.getElementById('tabQuantitativaV37'),result={version:VERSION,panel:!!panel,nav:!!document.querySelector('[data-tab-v23="quantitativa"]'),kpis:panel?.querySelectorAll('.quantKpiV37').length===6,portfolioChart:!!panel?.querySelector('.quantChartV37 svg'),correlation:!!panel?.querySelector('.correlationTableV37'),marketCards:panel?.querySelectorAll('.quantMacroV37').length===4,dailyCache:DATA_CACHE_TTL===MS_DAY,allocationUnified:!document.getElementById('tabMacroV22')?.classList.contains('allocationEnteringV37')};result.ok=Object.values(result).every(value=>value!==false);window.__PONDERA_QUANT_AUDIT__=result;document.documentElement.dataset.ponderaQuantAudit=result.ok?'ok':'review';document.documentElement.dataset.ponderaQuantCache='24h';return result;}
function boot(){ensurePanel();window.__PONDERA_QUANT_V37__=true;window.PonderaQuantV37={version:VERSION,render,audit,quantitativeSeries};window.addEventListener('pondera:tabchange',event=>{if(event.detail?.tab==='alocacao')revealAllocation();if(event.detail?.tab==='quantitativa')render();});window.addEventListener('pondera:ready',()=>{if(location.hash==='#alocacao')revealAllocation();setTimeout(audit,180);});if(location.hash==='#quantitativa'||localStorage.getItem('carteira-v23-tab')==='quantitativa')window.PonderaShellV31?.activate?.('quantitativa',{emit:false});load();}
let attempts=0;const wait=()=>{attempts++;if(typeof state==='undefined'||typeof v14==='undefined'||!window.PonderaShellV31||!window.PonderaLedgerV29){if(attempts<500)setTimeout(wait,25);return;}boot();};wait();
})();
