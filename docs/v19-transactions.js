function globalFxV19(){for(const h of state.holdings){const fx=currentFxForHoldingV19(h);if(Number.isFinite(fx)&&fx>1)return fx;}return null;}
function setPriceHintV19(text=''){const el=document.getElementById('txPriceHintV19');if(el)el.textContent=text;}
function setTxCurrencyForClassV19(className){
  const currency=v17InternationalClasses.has(className)?'USD':'BRL',c=document.getElementById('txCurrency');if(c)c.value=currency;
  const fx=document.getElementById('txFx');if(currency==='USD'&&fx&&!fx.value){const x=globalFxV19();if(Number.isFinite(x))fx.value=x.toFixed(4);}
  syncTxFx();
}
function setupTransactionDialogV19(){
  const form=document.getElementById('txForm');if(!form||form.dataset.v19Configured)return;form.dataset.v19Configured='1';
  const ticker=document.getElementById('txTicker'),name=document.getElementById('txName'),price=document.getElementById('txPrice'),segment=document.getElementById('txSegmentV17');
  name.readOnly=true;name.title='Nome identificado pelo ticker; não é alterado manualmente.';ticker.autocomplete='off';
  if(price&&!document.getElementById('txPriceHintV19'))price.insertAdjacentHTML('afterend','<small id="txPriceHintV19" class="fieldHintV19">Digite um ticker para buscar o último fechamento disponível.</small>');
  if(segment)segment.placeholder='Informe o segmento para este lançamento';
  const ideal=document.getElementById('txIdealPreview')?.closest('.txPreviewBox');if(ideal)ideal.classList.add('hiddenV19');
  const preview=document.querySelector('#txForm .txPreview');if(preview&&!document.getElementById('txImpactV19'))preview.insertAdjacentHTML('afterend','<div id="txImpactV19" class="txImpactV19"></div>');
  form.onsubmit=savePendingV19;
  ticker.addEventListener('change',()=>{if(!v19EditingPendingId)setTimeout(()=>prefillTickerV19(),0);});
  ticker.addEventListener('blur',()=>{if(!v19EditingPendingId)setTimeout(()=>prefillTickerV19(),0);});
  document.getElementById('txClass').addEventListener('change',()=>{if(!v19EditingPendingId)setTxCurrencyForClassV19(document.getElementById('txClass').value);setTimeout(updateTxImpactV19,0);});
  ['txQty','txPrice','txFx','txSegmentV17','txMicroTargetV17'].forEach(id=>document.getElementById(id)?.addEventListener('input',updateTxImpactV19));
  ['txSide','txCurrency'].forEach(id=>document.getElementById(id)?.addEventListener('change',updateTxImpactV19));
}
function resetNewTransactionV19(){
  setupTransactionDialogV19();v19EditingPendingId=null;
  const first=state.assets[0]?.name||'';document.getElementById('txDialog').dataset.mode='new';document.querySelector('#txDialog .modalHeader h3').textContent='Novo lançamento';
  const ticker=document.getElementById('txTicker');ticker.readOnly=false;ticker.value='';document.getElementById('txName').value='';document.getElementById('txClass').innerHTML=activeClassesOptions(first);document.getElementById('txSide').value='Compra';document.getElementById('txQty').value='';document.getElementById('txPrice').value='';document.getElementById('txFx').value='';document.getElementById('txDate').value=new Date().toISOString().slice(0,10);document.getElementById('txSegmentV17').value='';document.getElementById('txMicroTargetV17').value='';
  setTxCurrencyForClassV19(first);setPriceHintV19('Digite um ticker para buscar o último fechamento disponível.');refreshSegmentSuggestionsV18();updateTxPreview();updateTxImpactV19();document.getElementById('txDialog').showModal();
}
async function prefillTickerV19(){
  const ticker=tickerV19(document.getElementById('txTicker').value);if(!ticker)return;document.getElementById('txTicker').value=ticker;
  const h=holdingByTickerV19(ticker),classSelect=document.getElementById('txClass');if(h&&[...classSelect.options].some(o=>o.value===h.className))classSelect.value=h.className;
  const className=classSelect.value;setTxCurrencyForClassV19(className);document.getElementById('txName').value=h?.name||ticker;document.getElementById('txSegmentV17').value='';document.getElementById('txQty').value='';document.getElementById('txMicroTargetV17').value=Number.isFinite(+h?.microTarget)?+h.microTarget:'';
  const known=latestPriceForTickerV19(ticker,className);if(known){document.getElementById('txPrice').value=known.price;document.getElementById('txCurrency').value=known.currency;const fx=fxForTickerV19(ticker);if(known.currency==='USD'&&Number.isFinite(fx))document.getElementById('txFx').value=fx.toFixed(4);syncTxFx();setPriceHintV19(`${known.date?`Fechamento ${dateBr(known.date)}`:'Última cotação salva'} • ${known.source}`);}
  else setPriceHintV19('Buscando último fechamento...');
  const lookup=await yahooLookupV19(ticker,className);if(lookup&&!v19EditingPendingId&&tickerV19(document.getElementById('txTicker').value)===ticker){document.getElementById('txName').value=h?.name||lookup.name||ticker;if(Number.isFinite(lookup.price)){document.getElementById('txPrice').value=lookup.price;document.getElementById('txCurrency').value=lookup.currency||document.getElementById('txCurrency').value;syncTxFx();setPriceHintV19(`${lookup.date?`Fechamento ${dateBr(lookup.date)}`:'Último fechamento disponível'} • Yahoo Finance`);}}
  else if(!known)setPriceHintV19('Cotação automática não encontrada; informe o preço manualmente.');
  refreshSegmentSuggestionsV18();updateTxPreview();updateTxImpactV19();
}
function openPendingEditV19(id){
  setupTransactionDialogV19();const t=v14.pending.find(x=>x.id===id);if(!t)return;v19EditingPendingId=id;document.getElementById('txDialog').dataset.mode='edit';document.querySelector('#txDialog .modalHeader h3').textContent='Editar lançamento simulado';
  const ticker=document.getElementById('txTicker');ticker.value=t.ticker;ticker.readOnly=true;document.getElementById('txName').value=t.name||holdingByTickerV19(t.ticker)?.name||t.ticker;document.getElementById('txClass').innerHTML=activeClassesOptions(t.className);document.getElementById('txClass').value=t.className;document.getElementById('txSide').value=t.side;document.getElementById('txCurrency').value=t.currency;document.getElementById('txQty').value=t.qty;document.getElementById('txPrice').value=t.unitPrice;document.getElementById('txFx').value=t.currency==='USD'?(t.fx||fxForTickerV19(t.ticker)||''):'';document.getElementById('txDate').value=t.date;document.getElementById('txSegmentV17').value=t.segment||'';document.getElementById('txMicroTargetV17').value=Number.isFinite(+t.microTarget)?+t.microTarget:'';
  syncTxFx();setPriceHintV19('Preço da simulação atual. Você pode alterá-lo antes de salvar.');refreshSegmentSuggestionsV18();updateTxPreview();updateTxImpactV19();document.getElementById('txDialog').showModal();
}
function candidateTxV19(){
  const c=txFormCalc(),ticker=tickerV19(document.getElementById('txTicker').value),existing=holdingByTickerV19(ticker),rawSeg=document.getElementById('txSegmentV17').value.trim(),rawTarget=document.getElementById('txMicroTargetV17').value;
  return {ticker,name:document.getElementById('txName').value.trim()||existing?.name||ticker,className:document.getElementById('txClass').value,side:document.getElementById('txSide').value,qty:c.qty,unitPrice:c.price,currency:c.currency,fx:c.fx,totalNative:c.totalNative,brlTotal:c.brlTotal,date:document.getElementById('txDate').value,segment:rawSeg||existing?.segment||'Sem segmento',microTarget:rawTarget===''?null:Math.min(100,Math.max(0,+rawTarget||0))};
}
function savePendingV19(e){
  e.preventDefault();const t=candidateTxV19();if(!t.ticker||!t.className||!t.date||t.qty<=0||t.unitPrice<=0){alert('Preencha ticker, classe, quantidade, preço e data.');return;}if(t.currency==='USD'&&!Number.isFinite(+t.brlTotal)){alert('Informe o câmbio USD/BRL para consolidar a simulação.');return;}const existing=holdingByTickerV19(t.ticker);if(t.side==='Venda'&&!existing){alert('Para vender um ativo, ele precisa existir na carteira atual.');return;}
  if(v19EditingPendingId){const idx=v14.pending.findIndex(x=>x.id===v19EditingPendingId);if(idx>=0)v14.pending[idx]={...v14.pending[idx],...t};}
  else v14.pending.push({id:`pending-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,...t,source:'simulação'});
  v19EditingPendingId=null;if(typeof v16Plan!=='undefined'){v16Plan.suggestionApplied=false;saveV16Plan();}saveV14();syncPendingToMacro();save();document.getElementById('txDialog').close();render();
}
function renderPendingV19(){
  const table=document.querySelector('.pendingTable'),head=table?.querySelector('thead tr'),body=document.getElementById('pendingRows');if(!head||!body)return;
  head.innerHTML=`<th>Ativo</th><th>Classe</th><th>Ordem</th><th>Quantidade</th><th>Preço unitário</th><th>Total</th><th>Segmento</th><th>Data</th><th>Ações</th>`;
  const rows=v14.pending;body.innerHTML=rows.length?rows.map(t=>{const brl=txBrl(t);return `<tr><td><div class="historyTicker"><strong>${escapeHtml(t.ticker)}</strong><small>${escapeHtml(t.name||'')}</small></div></td><td><span class="classBadge">${escapeHtml(t.className)}</span></td><td><span class="txSide ${t.side==='Compra'?'buy':'sell'}">${t.side}</span></td><td><strong>${qtyFmt.format(t.qty)}</strong></td><td>${moneyNative(t.unitPrice,t.currency)}</td><td><strong>${moneyNative(t.totalNative,t.currency)}</strong>${t.currency==='USD'?`<small class="currencyNote">${Number.isFinite(brl)?fmt.format(brl)+' em BRL':'sem câmbio'}</small>`:''}</td><td><span class="segmentBadgeV18">${escapeHtml(pendingSegmentV19(t))}</span></td><td>${dateBr(t.date)}</td><td><div class="rowActions"><button class="editButton" data-edit-pending-v19="${escapeAttr(t.id)}">Editar</button><button class="dangerButton" data-remove-pending-v19="${escapeAttr(t.id)}">Excluir</button></div></td></tr>`;}).join(''):`<tr><td colspan="9"><div class="emptyState">Nenhum lançamento em simulação. Use “Novo lançamento” para testar um aporte.</div></td></tr>`;
  document.querySelectorAll('[data-edit-pending-v19]').forEach(b=>b.onclick=()=>openPendingEditV19(b.dataset.editPendingV19));
  document.querySelectorAll('[data-remove-pending-v19]').forEach(b=>b.onclick=()=>{v14.pending=v14.pending.filter(t=>t.id!==b.dataset.removePendingV19);if(!v14.pending.length){state.aportes={};state.autoAportes=false;}saveV14();syncPendingToMacro();save();render();});
  const execute=document.getElementById('executeTransactions');if(execute)execute.disabled=!rows.length;
}
function updateTxImpactV19(){
  const box=document.getElementById('txImpactV19');if(!box)return;const t=candidateTxV19();if(!t.className||!Number.isFinite(+t.brlTotal)||t.qty<=0){box.innerHTML='<span>Preencha quantidade e preço para visualizar o impacto da micro alocação.</span>';return;}
  const className=t.className,segment=t.segment,currentTotal=classTotalV18(className),currentSeg=holdingsForClassV18(className).filter(h=>normSegmentV18(h.segment)===normSegmentV18(segment)).reduce((s,h)=>s+Math.max(0,+h.value||0),0);let otherClass=0,otherSeg=0;
  v14.pending.filter(x=>x.id!==v19EditingPendingId&&x.className===className&&Number.isFinite(txBrl(x))).forEach(x=>{const d=(x.side==='Compra'?1:-1)*txBrl(x);otherClass+=d;if(normSegmentV18(pendingSegmentV19(x))===normSegmentV18(segment))otherSeg+=d;});
  const d=(t.side==='Compra'?1:-1)*t.brlTotal,postTotal=Math.max(0,currentTotal+otherClass+d),postSeg=Math.max(0,currentSeg+otherSeg+d),currentPct=currentTotal?currentSeg/currentTotal*100:0,postPct=postTotal?postSeg/postTotal*100:0,plan=ensureSegmentPlanV18(className),target=plan.find(s=>normSegmentV18(s.name)===normSegmentV18(segment))?.target;
  box.innerHTML=`<div><span>Impacto em ${escapeHtml(className)} • ${escapeHtml(segment)}</span><strong>${pct(currentPct)} → ${pct(postPct)}</strong></div><small>${Number.isFinite(+target)?`Alvo definido: ${pct(+target)}`:'Segmento sem alvo definido'} • total da classe após a simulação: ${fmt.format(postTotal)}</small>`;
}
