const V17_PRICE_CACHE_KEY='carteira-v17-price-cache';
const V17_MODEL_VERSION='17.0';

const v17AvgSeeds={
  CPFE3:{price:45.645,currency:'BRL'},BBSE3:{price:34.02,currency:'BRL'},BBAS3:{price:24.254,currency:'BRL'},PETR4:{price:30.19,currency:'BRL'},SAPR4:{price:6.973333,currency:'BRL'},ISAE4:{price:23.49,currency:'BRL'},VALE3:{price:53.44,currency:'BRL'},ITSA4:{price:13.096,currency:'BRL'},WIZC3:{price:8.52,currency:'BRL'},TAEE11:{price:35.25,currency:'BRL'},CMIG4:{price:10.677,currency:'BRL'},ITUB4:{price:38.78,currency:'BRL'},BBDC3:{price:14.43,currency:'BRL'},FIQE3:{price:3.98,currency:'BRL'},BRBI11:{price:14.75,currency:'BRL'},
  GGRC11:{price:9.938594,currency:'BRL'},XPML11:{price:105.854,currency:'BRL'},GARE11:{price:8.243,currency:'BRL'},HGCR11:{price:89.05,currency:'BRL'},LVBI11:{price:103.90,currency:'BRL'},TRXF11:{price:91.32,currency:'BRL'},
  VOO:{price:712.87,currency:'USD'},AVUV:{price:128.35,currency:'USD'},VEA:{price:73.89,currency:'USD'},TFLO:{price:50.651793,currency:'USD'},
  BTCUSD:{price:326030.26,currency:'BRL'},BTC:{price:326030.26,currency:'BRL'},'TESOURO RENDA+ 2060':{price:272.97,currency:'BRL'}
};
const v17SegmentSeeds={
  CPFE3:'Energia elétrica',BBSE3:'Seguros',BBAS3:'Bancos',PETR4:'Petróleo e gás',SAPR4:'Saneamento',ISAE4:'Transmissão de energia',VALE3:'Mineração',ITSA4:'Holding financeira',WIZC3:'Corretagem de seguros',TAEE11:'Transmissão de energia',CMIG4:'Energia elétrica',ITUB4:'Bancos',BBDC3:'Bancos',FIQE3:'Telecomunicações',BRBI11:'Mercado de capitais',
  GGRC11:'Logística',XPML11:'Shoppings',GARE11:'Renda urbana / híbrido',HGCR11:'Recebíveis',LVBI11:'Logística',TRXF11:'Renda urbana',
  VOO:'EUA • Large Caps',AVUV:'EUA • Small Cap Value',VEA:'Desenvolvidos ex-EUA',TFLO:'Renda fixa em dólar',BTCUSD:'Criptomoedas','TESOURO RENDA+ 2060':'Renda futura / inflação'
};
const v17MicroTargetSeeds={VOO:20,AVUV:10,VEA:30,TFLO:5,BTCUSD:100,'TESOURO RENDA+ 2060':100};
const v17InternationalClasses=new Set(['ETFs Internacionais','Stocks','REITs']);
let v17PriceCache=(()=>{try{return JSON.parse(localStorage.getItem(V17_PRICE_CACHE_KEY)||'{}')||{};}catch(e){return {};}})();
let v17PriceLoadStarted=false;

function tickerKeyV17(t){return String(t||'').trim().toUpperCase()==='BTC'?'BTCUSD':String(t||'').trim().toUpperCase();}
function priceCurrencyV17(h){return h.avgCurrency||h.currentCurrency||(v17InternationalClasses.has(h.className)?'USD':'BRL');}
function formatPriceV17(v,currency='BRL'){
  if(!Number.isFinite(+v))return '—';
  return currency==='USD'?'US$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}):fmt.format(+v);
}
function normalizeHoldingModelV17(){
  state.holdings.forEach(h=>{
    const key=tickerKeyV17(h.ticker);h.ticker=key;
    const seed=v17AvgSeeds[key];
    if(!Number.isFinite(+h.avgPriceNative)){h.avgPriceNative=seed?.price??null;h.avgCurrency=seed?.currency||(v17InternationalClasses.has(h.className)?'USD':'BRL');}
    if(!h.avgCurrency)h.avgCurrency=seed?.currency||(v17InternationalClasses.has(h.className)?'USD':'BRL');
    if(!Number.isFinite(+h.avgPriceBRL)&&h.avgCurrency==='BRL'&&Number.isFinite(+h.avgPriceNative))h.avgPriceBRL=+h.avgPriceNative;
    if(h.segment===undefined||h.segment===null||h.segment==='')h.segment=v17SegmentSeeds[key]||'';
    if(h.microTarget===undefined)h.microTarget=v17MicroTargetSeeds[key]??null;
    if(!Number.isFinite(+h.currentPriceBRL)&&Number.isFinite(+h.price))h.currentPriceBRL=+h.price;
    if(!h.priceDate)h.priceDate=null;
  });
}
function applyPriceCacheV17(){
  state.holdings.forEach(h=>{
    const rec=v17PriceCache[tickerKeyV17(h.ticker)];
    if(rec){
      if(Number.isFinite(+rec.priceNative))h.currentPriceNative=+rec.priceNative;
      if(Number.isFinite(+rec.priceBRL))h.currentPriceBRL=+rec.priceBRL;
      h.currentCurrency=rec.currency||h.currentCurrency||priceCurrencyV17(h);
      h.priceDate=rec.date||h.priceDate||null;h.priceSource=rec.source||'cotação';
    }
    if(Number.isFinite(+h.currentPriceBRL)){h.value=Math.max(0,(+h.qty||0)*(+h.currentPriceBRL));h.price=+h.currentPriceBRL;}
  });
}
function classHoldingTotalV17(className){return state.holdings.filter(h=>h.className===className).reduce((s,h)=>s+Math.max(0,+h.value||0),0);}
function microCurrentV17(h){const t=classHoldingTotalV17(h.className);return t?Math.max(0,+h.value||0)/t*100:0;}
function microIdealV17(h){const n=+h.microTarget;return Number.isFinite(n)&&n>=0?n:null;}
function microBarV17(label,value,type){
  const known=Number.isFinite(value),width=known?Math.max(0,Math.min(100,value)):0;
  return `<div class="microLineV17 ${type}"><div class="microLineHeadV17"><span>${label}</span><strong>${known?pct(value):'não definido'}</strong></div><div class="microTrackV17"><i style="width:${width}%"></i></div></div>`;
}
function priceDateTextV17(h){if(!h.priceDate)return 'fallback local';return `fechamento ${dateBr(h.priceDate)}`;}
function renderHoldingsV17(){
  const card=document.querySelector('.holdingsCard'),head=document.querySelector('.holdingsTable thead tr'),body=document.getElementById('holdingRows');if(!card||!head||!body)return;
  const title=card.querySelector('.holdingsTitle h2');if(title)title.innerHTML=`Ativos na carteira ${infoV16('A lista é formada exclusivamente por lançamentos executados. Quantidade e preço médio vêm do histórico de compras e vendas; preço atual usa o último fechamento disponível.')}`;
  const subtitle=card.querySelector('.holdingsTitle p');if(subtitle)subtitle.textContent='Posições consolidadas pelos lançamentos executados. Edite apenas metadados, segmento e meta de microalocação.';
  const add=document.getElementById('addHolding');if(add)add.remove();
  head.innerHTML=`<th>Ativo</th><th>Quantidade</th><th>Preço médio ${infoV16('Preço médio ponderado das compras executadas. Vendas reduzem quantidade, mas não alteram o custo médio remanescente.')}</th><th>Preço atual ${infoV16('Último preço de fechamento do dia útil anterior disponível no arquivo de cotações. Para ativos internacionais, o preço é exibido na moeda do ativo e o valor consolidado é convertido para reais.')}</th><th>Valor ${infoV16('Valor de mercado da posição: quantidade × preço atual, consolidado em reais.')}</th><th>Peso na lista ${infoV16('Participação do ativo no valor total de mercado dos ativos cadastrados.')}</th><th>Ações</th>`;
  const classes=[...new Set([...state.assets.map(a=>a.name),...state.holdings.map(h=>h.className)].filter(Boolean))];
  if(activeHoldingFilter!=='Todos'&&!classes.includes(activeHoldingFilter))activeHoldingFilter='Todos';
  const filters=document.getElementById('holdingFilters');filters.innerHTML=['Todos',...classes].map(c=>`<button class="filterChip ${activeHoldingFilter===c?'active':''}" data-filter="${escapeAttr(c)}">${c==='Todos'?'Todos ativos':escapeHtml(c)}</button>`).join('');
  filters.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{activeHoldingFilter=b.dataset.filter;renderHoldingsV17();});
  const q=(document.getElementById('holdingSearch')?.value||holdingSearchText||'').trim().toLowerCase();holdingSearchText=q;
  let items=state.holdings.filter(h=>(+h.qty||0)>1e-10&&(activeHoldingFilter==='Todos'||h.className===activeHoldingFilter)&&(!q||String(h.ticker).toLowerCase().includes(q)||String(h.name||'').toLowerCase().includes(q)||String(h.segment||'').toLowerCase().includes(q)));
  items.sort((a,b)=>(+b.value||0)-(+a.value||0));
  const total=items.length?state.holdings.reduce((s,h)=>s+Math.max(0,+h.value||0),0):holdingTotal(),visible=state.showAllHoldings?items:items.slice(0,10);
  body.innerHTML=visible.length?visible.map(h=>{
    const weight=total?Math.max(0,+h.value||0)/total*100:0,cur=microCurrentV17(h),ideal=microIdealV17(h),currency=priceCurrencyV17(h),hasNative=Number.isFinite(+h.currentPriceNative),currentDisplay=hasNative?+h.currentPriceNative:+h.currentPriceBRL,currentDisplayCurrency=hasNative?(h.currentCurrency||currency):'BRL';
    return `<tr class="holdingRowV17"><td><div class="holdingTicker holdingTickerV17"><div><strong>${escapeHtml(h.ticker)}</strong><small>${escapeHtml(h.name||'')}</small></div><div class="holdingMetaV17"><span class="classBadge">${escapeHtml(h.className||'Sem classe')}</span>${h.segment?`<span class="segmentBadgeV17">${escapeHtml(h.segment)}</span>`:''}</div><div class="microBoxV17"><div class="microTitleV17">Micro alocação na classe</div>${microBarV17('Atual',cur,'current')}${microBarV17('Ideal',ideal,'ideal')}</div></div></td><td><strong>${qtyFmt.format(+h.qty||0)}</strong></td><td><div class="priceCellV17"><strong>${formatPriceV17(h.avgPriceNative,currency)}</strong><small>custo médio</small></div></td><td><div class="priceCellV17"><strong>${formatPriceV17(currentDisplay,currentDisplayCurrency)}</strong><small>${escapeHtml(priceDateTextV17(h))}</small></div></td><td><strong>${fmt.format(+h.value||0)}</strong></td><td>${pct(weight)}</td><td><div class="rowActions"><button class="editButton" data-edit-holding-v17="${escapeAttr(h.id)}">Editar</button><button class="dangerButton" data-remove-holding-v17="${escapeAttr(h.id)}">Excluir</button></div></td></tr>`;
  }).join(''):`<tr><td colspan="7"><div class="emptyState">Nenhum ativo encontrado neste filtro. Novos ativos entram aqui somente após a execução de um lançamento de compra.</div></td></tr>`;
  document.getElementById('holdingSummary').textContent=`${items.length} ativo${items.length===1?'':'s'} no filtro • ${fmt.format(items.reduce((s,h)=>s+(+h.value||0),0))} em valor de mercado`;
  const toggle=document.getElementById('toggleHoldings');toggle.classList.toggle('hidden',items.length<=10);toggle.textContent=state.showAllHoldings?'Ver menos':`Ver todos (${items.length})`;
  document.querySelectorAll('[data-edit-holding-v17]').forEach(b=>b.onclick=()=>openHoldingDialogV17(b.dataset.editHoldingV17));
  document.querySelectorAll('[data-remove-holding-v17]').forEach(b=>b.onclick=()=>{const h=state.holdings.find(x=>x.id===b.dataset.removeHoldingV17);if(h&&confirm(`Excluir ${h.ticker} da carteira atual? O histórico de lançamentos será preservado.`)){state.holdings=state.holdings.filter(x=>x.id!==h.id);save();render();}});
}
function configureHoldingDialogV17(){
  const form=document.getElementById('holdingForm');if(!form||form.dataset.v17Configured)return;form.dataset.v17Configured='1';
  const title=document.getElementById('holdingDialogTitle');if(title)title.textContent='Editar ativo';
  const ticker=document.getElementById('holdingTicker');ticker.readOnly=true;ticker.title='O ticker é definido pelos lançamentos e não pode ser alterado aqui.';
  const numericGrid=document.getElementById('holdingQty')?.closest('.modalGrid');if(numericGrid)numericGrid.classList.add('hiddenV17');
  const help=form.querySelector('.modalHelp');if(help)help.textContent='Quantidade, preço médio e valor de mercado são controlados pelos lançamentos e pelas cotações. Aqui você edita apenas os metadados da posição.';
  const cls=document.getElementById('holdingClass')?.closest('label');if(cls&&!document.getElementById('holdingMetadataV17'))cls.insertAdjacentHTML('afterend',`<div id="holdingMetadataV17" class="modalGrid"><label>Segmento<input id="holdingSegmentV17" type="text" maxlength="60" placeholder="Ex.: Bancos, Logística, Small Cap Value"></label><label>Micro alocação ideal (%)<input id="holdingMicroTargetV17" type="number" min="0" max="100" step="0.1" placeholder="Opcional"></label></div>`);
  form.onsubmit=e=>{e.preventDefault();const id=document.getElementById('holdingEditId').value,h=state.holdings.find(x=>x.id===id);if(!h)return;h.name=document.getElementById('holdingName').value.trim()||h.ticker;h.className=document.getElementById('holdingClass').value||h.className;h.segment=document.getElementById('holdingSegmentV17').value.trim();const raw=document.getElementById('holdingMicroTargetV17').value;h.microTarget=raw===''?null:Math.min(100,Math.max(0,+raw||0));document.getElementById('holdingDialog').close();save();render();};
}
function openHoldingDialogV17(id){
  configureHoldingDialogV17();const h=state.holdings.find(x=>x.id===id);if(!h)return;const select=document.getElementById('holdingClass');select.innerHTML=state.assets.map(a=>`<option value="${escapeAttr(a.name)}">${escapeHtml(a.name)}</option>`).join('');document.getElementById('holdingEditId').value=h.id;document.getElementById('holdingTicker').value=h.ticker;document.getElementById('holdingName').value=h.name||'';select.value=h.className;document.getElementById('holdingSegmentV17').value=h.segment||'';document.getElementById('holdingMicroTargetV17').value=Number.isFinite(+h.microTarget)?+h.microTarget:'';document.getElementById('holdingDialog').showModal();
}
function configureTransactionMetadataV17(){
  const form=document.getElementById('txForm');if(!form||form.dataset.v17Configured)return;form.dataset.v17Configured='1';
  const dateGrid=document.getElementById('txDate')?.closest('.txFormGrid');if(dateGrid&&!document.getElementById('txMetaV17'))dateGrid.insertAdjacentHTML('beforebegin',`<div id="txMetaV17" class="txFormGrid"><label>Segmento<input id="txSegmentV17" type="text" maxlength="60" placeholder="Ex.: Bancos, Logística, Small Cap Value"></label><label>Micro alocação ideal (%)<input id="txMicroTargetV17" type="number" min="0" max="100" step="0.1" placeholder="Opcional"></label></div>`);
  document.getElementById('txTicker').addEventListener('change',syncTxMetadataV17);document.getElementById('txSide').addEventListener('change',syncTxMetadataV17);
  form.onsubmit=addPendingFromFormV17;
}
function syncTxMetadataV17(){const ticker=tickerKeyV17(document.getElementById('txTicker').value),h=state.holdings.find(x=>tickerKeyV17(x.ticker)===ticker);if(h){document.getElementById('txSegmentV17').value=h.segment||'';document.getElementById('txMicroTargetV17').value=Number.isFinite(+h.microTarget)?+h.microTarget:'';}else{document.getElementById('txSegmentV17').value=v17SegmentSeeds[ticker]||'';document.getElementById('txMicroTargetV17').value=v17MicroTargetSeeds[ticker]??'';}}
function addPendingFromFormV17(e){
  e.preventDefault();const ticker=tickerKeyV17(document.getElementById('txTicker').value),name=document.getElementById('txName').value.trim(),className=document.getElementById('txClass').value,side=document.getElementById('txSide').value,date=document.getElementById('txDate').value,c=txFormCalc(),segment=document.getElementById('txSegmentV17').value.trim(),rawTarget=document.getElementById('txMicroTargetV17').value,microTarget=rawTarget===''?null:Math.min(100,Math.max(0,+rawTarget||0));
  if(!ticker||!className||!date||c.qty<=0||c.price<=0){alert('Preencha ativo, classe, quantidade, preço e data.');return;}if(c.currency==='USD'&&c.brlTotal===null){alert('Informe o câmbio USD/BRL para que o lançamento possa ser projetado na macro alocação.');return;}const existing=state.holdings.find(x=>tickerKeyV17(x.ticker)===ticker);if(side==='Venda'&&!existing){alert('Para vender um ativo, ele precisa existir na carteira atual.');return;}
  v14.pending.push({id:`pending-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,ticker,name:name||existing?.name||ticker,className,side,qty:c.qty,unitPrice:c.price,currency:c.currency,fx:c.fx,totalNative:c.totalNative,brlTotal:c.brlTotal,date,source:'simulação',segment:segment||existing?.segment||'',microTarget:microTarget??existing?.microTarget??null});saveV14();document.getElementById('txDialog').close();syncPendingToMacro();save();render();
}
function validatePendingV17(){
  for(const t of v14.pending){const cls=classForName(t.className),brl=txBrl(t),h=state.holdings.find(x=>tickerKeyV17(x.ticker)===tickerKeyV17(t.ticker));if(!cls||brl===null){alert(`Não foi possível executar ${t.ticker}: classe ou valor em BRL inválido.`);return false;}if(t.side==='Venda'&&(!h||(+h.qty||0)+1e-9<t.qty)){alert(`Venda de ${t.ticker} maior que a quantidade cadastrada.`);return false;}}return true;
}
function executePendingV17(){
  if(!v14.pending.length||!validatePendingV17())return;const buys=v14.pending.filter(t=>t.side==='Compra').reduce((s,t)=>s+(txBrl(t)||0),0),sales=v14.pending.filter(t=>t.side==='Venda').reduce((s,t)=>s+(txBrl(t)||0),0);if(!confirm(`Executar ${v14.pending.length} lançamento(s)?\n\nCompras: ${fmt.format(buys)}\nVendas: ${fmt.format(sales)}\n\nAs posições serão atualizadas pelo livro de lançamentos.`))return;
  const executed=[];
  for(const t of v14.pending){const key=tickerKeyV17(t.ticker),sign=t.side==='Compra'?1:-1,brl=txBrl(t),unitBRL=brl/t.qty;let h=state.holdings.find(x=>tickerKeyV17(x.ticker)===key);if(!h&&t.side==='Compra'){h={id:`h-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,ticker:key,name:t.name||key,className:t.className,qty:0,avgPriceNative:null,avgPriceBRL:null,avgCurrency:t.currency,currentPriceNative:t.unitPrice,currentPriceBRL:unitBRL,currentCurrency:t.currency,priceDate:t.date,segment:t.segment||'',microTarget:t.microTarget??null,price:unitBRL,value:0};state.holdings.push(h);}if(!h)continue;
    const prevQty=Math.max(0,+h.qty||0);
    if(t.side==='Compra'){
      if(prevQty<=1e-10||!Number.isFinite(+h.avgPriceNative)||h.avgCurrency!==t.currency){h.avgPriceNative=t.unitPrice;h.avgCurrency=t.currency;}else h.avgPriceNative=((+h.avgPriceNative*prevQty)+(t.unitPrice*t.qty))/(prevQty+t.qty);
      if(prevQty<=1e-10||!Number.isFinite(+h.avgPriceBRL))h.avgPriceBRL=unitBRL;else h.avgPriceBRL=((+h.avgPriceBRL*prevQty)+(unitBRL*t.qty))/(prevQty+t.qty);
      h.qty=prevQty+t.qty;h.className=t.className;h.name=t.name||h.name||key;if(t.segment)h.segment=t.segment;if(t.microTarget!==null&&t.microTarget!==undefined)h.microTarget=t.microTarget;
      if(!Number.isFinite(+h.currentPriceBRL)){h.currentPriceBRL=unitBRL;h.currentPriceNative=t.unitPrice;h.currentCurrency=t.currency;h.priceDate=t.date;}
    }else h.qty=Math.max(0,prevQty-t.qty);
    if(Number.isFinite(+h.currentPriceBRL)){h.value=h.qty*(+h.currentPriceBRL);h.price=+h.currentPriceBRL;}else h.value=Math.max(0,(+h.value||0)+sign*brl);
    executed.push({...t,id:`exec-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,source:'dashboard',quantityAfter:h.qty,executedAt:new Date().toISOString()});
  }
  state.holdings=state.holdings.filter(h=>(+h.qty||0)>1e-10);v14.executed.push(...executed);v14.pending=[];state.aportes={};state.autoAportes=false;if(typeof v16Plan!=='undefined'){v16Plan.suggestionApplied=false;saveV16Plan();}saveV14();save();render();loadPricesV17(true);
}
function customizeTxOpenV17(){
  const button=document.getElementById('newTransaction'),oldOpen=window.openTxDialog;
  if(button&&typeof oldOpen==='function')button.onclick=()=>{oldOpen();setTimeout(syncTxMetadataV17,0);};
}
function renderPendingFlowHintV17(){const section=document.getElementById('transactionsSection'),p=section?.querySelector('.sectionTitle p');if(p)p.textContent='1) teste compras ou vendas na simulação; 2) execute a lista; 3) as operações entram no histórico e atualizam automaticamente a lista de ativos.';}
async function loadPricesV17(force=false){
  if(v17PriceLoadStarted&&!force)return;v17PriceLoadStarted=true;
  try{const r=await fetch(`prices.json?v=${Date.now()}`,{cache:'no-store'});if(r.ok){const j=await r.json();if(j&&j.prices){v17PriceCache={...v17PriceCache,...j.prices};localStorage.setItem(V17_PRICE_CACHE_KEY,JSON.stringify(v17PriceCache));applyPriceCacheV17();save();render();}}}catch(e){console.warn('Falha ao carregar cotações publicadas',e);}finally{v17PriceLoadStarted=false;}
  fetchMissingYahooV17();
}
function yahooSymbolV17(h){const key=tickerKeyV17(h.ticker);if(key==='BTCUSD')return 'BTC-USD';if(v17InternationalClasses.has(h.className))return key;if(['Ações','Fundos Imobiliários','Fiagros','BDRs','ETFs Nacionais'].includes(h.className))return key+'.SA';return null;}
async function fetchYahooOneV17(h,fx){
  const symbol=yahooSymbolV17(h);if(!symbol||h.className==='Tesouro Direto')return null;
  try{const r=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=7d&interval=1d`,{mode:'cors'});if(!r.ok)return null;const j=await r.json(),res=j?.chart?.result?.[0],ts=res?.timestamp||[],cl=res?.indicators?.quote?.[0]?.close||[];const today=new Date().toISOString().slice(0,10);let chosen=null;for(let i=0;i<ts.length;i++){const d=new Date(ts[i]*1000).toISOString().slice(0,10);if(d<today&&Number.isFinite(+cl[i]))chosen={date:d,priceNative:+cl[i]};}if(!chosen)return null;const currency=v17InternationalClasses.has(h.className)||tickerKeyV17(h.ticker)==='BTCUSD'?'USD':'BRL';chosen.currency=currency;chosen.priceBRL=currency==='USD'&&Number.isFinite(fx)?chosen.priceNative*fx:chosen.priceNative;chosen.source='Yahoo Finance';return chosen;}catch(e){return null;}
}
async function fetchFxV17(){try{const r=await fetch('https://query1.finance.yahoo.com/v8/finance/chart/BRL=X?range=7d&interval=1d',{mode:'cors'});if(!r.ok)return null;const j=await r.json(),res=j?.chart?.result?.[0],ts=res?.timestamp||[],cl=res?.indicators?.quote?.[0]?.close||[],today=new Date().toISOString().slice(0,10);let x=null;for(let i=0;i<ts.length;i++){const d=new Date(ts[i]*1000).toISOString().slice(0,10);if(d<today&&Number.isFinite(+cl[i]))x=+cl[i];}return x;}catch(e){return null;}}
async function fetchMissingYahooV17(){const missing=state.holdings.filter(h=>!v17PriceCache[tickerKeyV17(h.ticker)]&&h.className!=='Tesouro Direto');if(!missing.length)return;const fx=await fetchFxV17();let changed=false;for(const h of missing){const rec=await fetchYahooOneV17(h,fx);if(rec){v17PriceCache[tickerKeyV17(h.ticker)]=rec;changed=true;}}if(changed){localStorage.setItem(V17_PRICE_CACHE_KEY,JSON.stringify(v17PriceCache));applyPriceCacheV17();save();render();}}
function postRenderV17(){normalizeHoldingModelV17();applyPriceCacheV17();renderHoldingsV17();renderPendingFlowHintV17();const execute=document.getElementById('executeTransactions');if(execute)execute.onclick=executePendingV17;updateVersionV17();}
function updateVersionV17(){const e=document.querySelector('.eyebrow');if(e)e.textContent='CARTEIRA • V1.7';}

const renderBeforeV17=render;
render=function(){normalizeHoldingModelV17();applyPriceCacheV17();renderBeforeV17();postRenderV17();save();};
function initV17(){
  if(!document.querySelector('link[href^="v17.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='v17.css?v=17.0';document.head.appendChild(l);}
  configureHoldingDialogV17();configureTransactionMetadataV17();customizeTxOpenV17();
  const add=document.getElementById('addHolding');if(add)add.remove();
  document.getElementById('toggleHoldings').onclick=()=>{state.showAllHoldings=!state.showAllHoldings;save();renderHoldingsV17();};
  document.getElementById('holdingSearch').oninput=e=>{holdingSearchText=e.target.value;renderHoldingsV17();};
  const execute=document.getElementById('executeTransactions');if(execute)execute.onclick=executePendingV17;
  render();loadPricesV17();
}
initV17();
