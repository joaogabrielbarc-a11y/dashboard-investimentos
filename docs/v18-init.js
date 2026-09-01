function updateVersionV18(){const e=document.querySelector('.topbar .eyebrow');if(e)e.textContent='CARTEIRA • V1.8';}
function initV18(){
  if(!document.querySelector('link[href^="v18.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='v18.css?v=18.0';document.head.appendChild(l);}
  ensureAllSegmentsV18();setupSegmentDialogV18();addSegmentSuggestionsV18();
  renderHoldings=function(){};
  renderHoldingsV17=renderHoldingsV18;
  updateVersionV17=updateVersionV18;
  const oldOpen=openHoldingDialogV17;openHoldingDialogV17=function(id){oldOpen(id);setTimeout(refreshSegmentSuggestionsV18,0);};
  const txButton=document.getElementById('newTransaction');if(txButton){const prior=txButton.onclick;txButton.onclick=()=>{if(prior)prior();setTimeout(refreshSegmentSuggestionsV18,0);};}
  updateVersionV18();render();
}
initV18();
