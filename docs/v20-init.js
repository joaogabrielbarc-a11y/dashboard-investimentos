function updateVersionV20(){const e=document.querySelector('.topbar .eyebrow');if(e)e.textContent='CARTEIRA • V2.0';}
function postRenderV20(){
  applySpecialPricesV20();removeClassEyebrowsV20();renderPendingV20();renderHistoryV20();renderTxSummaryV20();renderMicroProjectionV20();updateVersionV20();saveV20Ui();
  const exec=document.getElementById('executeTransactions');if(exec)exec.onclick=executePendingV20;
  const txP=document.querySelector('#transactionsSection .sectionTitle p');if(txP)txP.textContent='Escolha a classe, teste o lançamento, edite a simulação quando quiser e execute somente depois de conferir o impacto na macro e na micro alocação.';
}
renderPendingV19=renderPendingV20;renderTxSummaryV19=renderTxSummaryV20;renderMicroProjectionV19=renderMicroProjectionV20;
const renderBeforeV20=render;
render=function(){renderBeforeV20();postRenderV20();save();};
function initV20(){
  if(!document.querySelector('link[href^="v20.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='v20.css?v=20.0';document.head.appendChild(l);}
  buildTxDialogV20();const btn=document.getElementById('newTransaction');if(btn)btn.onclick=()=>openLaunchV20();
  const dialog=document.getElementById('txDialog');if(dialog)dialog.addEventListener('close',()=>{v20EditingPendingId=null;});
  updateVersionV20();render();loadExtraMarketDataV20();
}
initV20();
