(()=>{
'use strict';
let applying=false;
const esc=v=>typeof escapeAttr==='function'?escapeAttr(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function executed(){return typeof v14!=='undefined'&&Array.isArray(v14.executed)?v14.executed:[];}
function fixVersion(){const e=document.querySelector('.topbar .eyebrow');if(e)e.textContent='CARTEIRA • V2.7.1';}
function correctHistoryActions(){
  if(typeof openHistoryEdit!=='function'||typeof deleteHistory!=='function')return;
  document.querySelectorAll('#historyGroupsV26 .historyClassV26').forEach(group=>{
    const className=group.querySelector('.historyClassHeadV26 strong')?.textContent?.trim();
    if(!className)return;
    const items=executed().filter(t=>(t.className||'Sem classe')===className).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
    group.querySelectorAll('.historyClassBodyV26 tbody tr').forEach((tr,i)=>{
      const t=items[i];if(!t)return;
      let td=tr.querySelector('[data-hist-actions-v27]');
      if(!td){td=document.createElement('td');td.dataset.histActionsV27='1';tr.appendChild(td);}
      td.innerHTML=`<div class="rowActions"><button class="editButton" type="button" data-edit-hist-v271="${esc(t.id)}">Editar</button><button class="dangerButton" type="button" data-del-hist-v271="${esc(t.id)}">Excluir</button></div>`;
      const head=tr.closest('table')?.querySelector('thead tr');
      if(head&&!head.querySelector('[data-hist-head-v27]')){const th=document.createElement('th');th.dataset.histHeadV27='1';th.textContent='Ações';head.appendChild(th);}
    });
  });
  document.querySelectorAll('[data-edit-hist-v271]').forEach(b=>b.onclick=()=>openHistoryEdit(b.dataset.editHistV271));
  document.querySelectorAll('[data-del-hist-v271]').forEach(b=>b.onclick=()=>deleteHistory(b.dataset.delHistV271));
}
function cleanDividendCoverage(){
  const cov=document.getElementById('dividendCoverageV22');if(!cov)return;
  cov.innerHTML='<span>Elegibilidade: <strong>histórico executado × data-com</strong></span><span>Quantidade reconstruída cronologicamente para cada ativo</span><span>USD recebido: câmbio de fechamento da data do pagamento • futuro: câmbio atual</span>';
}
function reinforce(){
  if(applying)return;applying=true;
  try{fixVersion();correctHistoryActions();cleanDividendCoverage();}
  finally{setTimeout(()=>{applying=false;},60);}
}
function boot(){
  let tries=0;const wait=()=>{tries++;if(!document.getElementById('tabMicroV22')||!document.getElementById('tabProventosV22')||typeof v14==='undefined'){if(tries<500)setTimeout(wait,25);return;}reinforce();
    const micro=document.getElementById('tabMicroV22'),pro=document.getElementById('tabProventosV22');
    const obs=new MutationObserver(()=>requestAnimationFrame(reinforce));obs.observe(micro,{childList:true,subtree:true});obs.observe(pro,{childList:true,subtree:true});
    [150,400,900,1800,3500].forEach(ms=>setTimeout(reinforce,ms));
  };wait();
}
boot();
})();