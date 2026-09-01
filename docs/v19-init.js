function updateVersionV19(){const e=document.querySelector('.topbar .eyebrow');if(e)e.textContent='CARTEIRA • V1.9';}
function postRenderV19(){
  renderTopPerformanceV19();enhanceHoldingsV19();renderPendingV19();renderTxSummaryV19();renderMicroProjectionV19();updateVersionV19();saveV19Ui();
  const txP=document.querySelector('#transactionsSection .sectionTitle p');if(txP)txP.textContent='Teste a configuração, edite quantidade ou preço quando quiser e execute somente depois de conferir o impacto na macro e na micro alocação.';
}
const renderBeforeV19=render;
render=function(){renderBeforeV19();postRenderV19();save();};
function initV19(){
  if(!document.querySelector('link[href^="v19.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='v19.css?v=19.0';document.head.appendChild(l);}
  setupTransactionDialogV19();renderPending=renderPendingV19;
  const newBtn=document.getElementById('newTransaction');if(newBtn)newBtn.onclick=resetNewTransactionV19;
  const dialog=document.getElementById('txDialog');if(dialog&&!dialog.dataset.v19CloseBound){dialog.dataset.v19CloseBound='1';dialog.addEventListener('close',()=>{v19EditingPendingId=null;const ticker=document.getElementById('txTicker');if(ticker)ticker.readOnly=false;});}
  updateVersionV19();render();
}
initV19();
