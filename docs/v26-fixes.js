(()=>{
'use strict';
let reasserting=false;
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();

function fixImpactOrder(){
  const tx=document.getElementById('transactionsSection');
  const impact=document.getElementById('contributionImpactV26');
  if(tx&&impact&&tx.nextElementSibling!==impact)tx.insertAdjacentElement('afterend',impact);
}

function fixImpactAssetCounts(){
  if(typeof state==='undefined'||!Array.isArray(state.holdings))return;
  document.querySelectorAll('#contributionImpactV26 .impactMicroClassV26').forEach(card=>{
    const title=card.querySelector('.impactMicroClassHeadV26 strong')?.textContent?.trim();
    const small=card.querySelector('.impactMicroClassHeadV26 small');
    if(!title||!small)return;
    const statuses=new Map();
    card.querySelectorAll('.impactMicroClassBodyV26 tbody tr').forEach(tr=>{
      const cells=tr.querySelectorAll('td');
      if(cells.length<7)return;
      statuses.set(norm(cells[0].textContent),{
        before:/na banda/i.test(cells[5].textContent),
        after:/na banda/i.test(cells[6].textContent)
      });
    });
    const assets=state.holdings.filter(h=>h.className===title&&(+h.qty||0)>1e-10);
    let before=0,after=0;
    assets.forEach(h=>{
      const s=statuses.get(norm(h.segment||'Sem segmento'));
      if(s?.before)before++;
      if(s?.after)after++;
    });
    const segmentTotal=statuses.size;
    const beforeSeg=[...statuses.values()].filter(s=>s.before).length;
    const afterSeg=[...statuses.values()].filter(s=>s.after).length;
    small.textContent=`Ativos em segmentos balanceados: ${before}/${assets.length} antes → ${after}/${assets.length} após • Segmentos na banda: ${beforeSeg}/${segmentTotal} → ${afterSeg}/${segmentTotal}`;
  });
}

function dividendsLookHistorical(){
  const panel=document.getElementById('tabProventosV22');
  if(!panel)return true;
  const kpi=[...panel.querySelectorAll('#dividendKpisV22 .dividendKpiV22 span')].map(x=>x.textContent.trim());
  const coverage=panel.querySelector('#dividendCoverageV22')?.textContent||'';
  return kpi.includes('Primeiro aporte')&&/lançamentos executados|reconstruída somente/i.test(coverage);
}

function reassertV26(){
  if(reasserting)return;
  reasserting=true;
  try{
    fixImpactOrder();
    fixImpactAssetCounts();
    if(!dividendsLookHistorical())window.dispatchEvent(new HashChangeEvent('hashchange'));
  }finally{setTimeout(()=>{reasserting=false;},80);}
}

function boot(){
  let tries=0;
  const wait=()=>{
    tries++;
    if(!document.getElementById('tabMicroV22')||!document.getElementById('tabProventosV22')||!document.getElementById('contributionImpactV26')){
      if(tries<400)setTimeout(wait,25);
      return;
    }
    reassertV26();
    const micro=document.getElementById('tabMicroV22');
    const pro=document.getElementById('tabProventosV22');
    const observer=new MutationObserver(()=>requestAnimationFrame(reassertV26));
    observer.observe(micro,{childList:true,subtree:true});
    observer.observe(pro,{childList:true,subtree:true});
    [250,750,1500,3000].forEach(ms=>setTimeout(reassertV26,ms));
  };
  wait();
}
boot();
})();