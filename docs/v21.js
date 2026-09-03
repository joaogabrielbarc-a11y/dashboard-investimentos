(()=>{
'use strict';

const RUNTIME_VERSION='2.10.0';
if(window.__PONDERA_STABLE_BOOTSTRAP__)return;
window.__PONDERA_STABLE_BOOTSTRAP__={state:'booting',version:RUNTIME_VERSION};

const eye=()=>document.querySelector('.topbar .eyebrow');
const setBootState=(state)=>{
  window.__PONDERA_STABLE_BOOTSTRAP__.state=state;
  document.documentElement.dataset.ponderaRuntimeState=state;
};

if(!document.getElementById('ponderaStableRuntimeStyle')){
  const st=document.createElement('style');
  st.id='ponderaStableRuntimeStyle';
  st.textContent='.topbar .eyebrow{font-size:0!important}.topbar .eyebrow::after{content:"CARTEIRA • V2.10.0";font-size:11px;letter-spacing:.08em;font-weight:800}';
  document.head.appendChild(st);
}

const legacyHistory=typeof renderHistory==='function'?renderHistory:null;
if(legacyHistory&&!renderHistory.__ponderaSafeHistory){
  const safeHistory=function(){if(!document.getElementById('historyRows'))return;return legacyHistory.apply(this,arguments);};
  safeHistory.__ponderaSafeHistory=true;
  renderHistory=safeHistory;
}

function loadScript(src,datasetKey){
  return new Promise((resolve,reject)=>{
    const clean=src.split('?')[0];
    const existing=[...document.scripts].find(s=>{try{return new URL(s.src,location.href).pathname.endsWith('/'+clean);}catch(e){return false;}});
    if(existing&&!existing.dataset.ponderaStable)return resolve(existing);
    if(existing){
      if(existing.dataset.ponderaLoaded==='1')return resolve(existing);
      existing.addEventListener('load',()=>resolve(existing),{once:true});
      existing.addEventListener('error',()=>reject(new Error('Falha ao carregar '+src)),{once:true});
      return;
    }
    const s=document.createElement('script');s.src=src;s.async=false;s.dataset.ponderaStable='1';if(datasetKey)s.dataset[datasetKey]='1';
    s.onload=()=>{s.dataset.ponderaLoaded='1';resolve(s);};s.onerror=()=>reject(new Error('Falha ao carregar '+src));document.body.appendChild(s);
  });
}
function waitFor(test,label,timeout=18000){return new Promise((resolve,reject)=>{const started=Date.now();const tick=()=>{let ok=false;try{ok=!!test();}catch(e){}if(ok)return resolve();if(Date.now()-started>timeout)return reject(new Error('Timeout aguardando '+label));setTimeout(tick,25);};tick();});}
function recoverV20(){
  if(window.__PONDERA_V21_RECOVERY__)return;window.__PONDERA_V21_RECOVERY__=true;
  if(typeof renderHistoryV20==='function')renderHistory=renderHistoryV20;if(typeof renderPendingV20==='function')renderPending=renderPendingV20;if(typeof renderTxSummaryV20==='function')renderTxSummary=renderTxSummaryV20;
  if(typeof postRenderV20==='function'&&!postRenderV20.__ponderaRecovered){const previous=postRenderV20;const wrapped=function(){const result=previous.apply(this,arguments);try{if(typeof renderTopPerformanceV19==='function')renderTopPerformanceV19();}catch(e){}const title=document.querySelector('.holdingsTitleV18 h2');if(title&&title.innerHTML.includes('último fechamento'))title.innerHTML=title.innerHTML.replace('último fechamento disponível','cotação mais recente disponível');const subtitle=document.querySelector('.holdingsTitleV18 p');if(subtitle&&subtitle.textContent.includes('preço atual'))subtitle.textContent='Acompanhe custo, cotação mais recente, variação e estrutura setorial de cada classe.';return result;};wrapped.__ponderaRecovered=true;postRenderV20=wrapped;}
}

async function boot(){
  setBootState('loading');const versionEl=eye();if(versionEl)versionEl.style.visibility='hidden';
  const legacyStack=['v15.js?v=15.2','v16.js?v=16.2','v17.js?v=17.2','v18-core.js?v=18.2','v18-ui.js?v=18.2','v18-dialogs.js?v=18.2','v18-init.js?v=18.2','v19-core.js?v=19.2','v19-holdings.js?v=19.2','v19-transactions.js?v=19.2','v19-planning.js?v=19.2','v19-fixes.js?v=19.2','v19-init.js?v=19.2','v20-core.js?v=20.2','v20-ui.js?v=20.2','v20-fixes.js?v=20.2','v20-init.js?v=20.2'];
  for(const src of legacyStack)await loadScript(src);
  await waitFor(()=>typeof postRenderV20==='function'&&typeof openLaunchV20==='function'&&typeof segmentRowsV18==='function'&&typeof portfolioPerformanceV19==='function','núcleo V2.0');recoverV20();
  await loadScript('v22.js?v=22.2','v22Loader');await waitFor(()=>document.getElementById('tabPatrimonioV22')&&document.getElementById('tabMacroV22')&&document.getElementById('tabMicroV22'),'abas V2.2');
  await loadScript('v23.js?v=23.2','v23Loader');
  await loadScript('v24.js?v=24.2','v24Loader');
  await loadScript('v24-patrimonio.js?v=24.5','v24PatrimonioLoader');
  await loadScript('v25-structured.js?v=25.3','v25StructuredLoader');
  await loadScript('v26.js?v=26.2','v26Loader');
  await waitFor(()=>document.getElementById('contributionPlannerV26')&&document.getElementById('allocationPulseV26'),'camada V2.6');
  await loadScript('v28.js?v=28.2','v28Loader');
  await waitFor(()=>document.getElementById('macroStageV28')||document.getElementById('patPointV28'),'camada V2.8');
  await loadScript('v29.js?v=29.0','v29Loader');
  await waitFor(()=>window.__PONDERA_LEDGER_V29__&&window.PonderaLedgerV29?.version==='2.9.0','ledger V2.9');
  await loadScript('v30.js?v=30.0','v30Loader');
  await waitFor(()=>window.__PONDERA_UI_V30__&&document.documentElement.dataset.ponderaUi==='2.10.0','integração V2.10');

  window.__PONDERA_RUNTIME_VERSION__=RUNTIME_VERSION;document.documentElement.dataset.ponderaRuntime=RUNTIME_VERSION;setBootState('ready');
  const e=eye();if(e){e.textContent='CARTEIRA • V'+RUNTIME_VERSION;e.style.visibility='';}document.title='Pondera | Carteira';window.dispatchEvent(new CustomEvent('pondera:ready',{detail:{version:RUNTIME_VERSION}}));
}
boot().catch(err=>{console.error('[Pondera bootstrap]',err);setBootState('error');const e=eye();if(e){e.textContent='PONDERA • ERRO DE CARREGAMENTO';e.style.visibility='';}let box=document.getElementById('ponderaRuntimeError');if(!box){box=document.createElement('div');box.id='ponderaRuntimeError';box.style.cssText='margin:12px 0;padding:12px 14px;border:1px solid #7f3640;border-radius:10px;background:#2b151a;color:#ffd7dc;font:600 13px/1.4 system-ui';document.querySelector('.topbar')?.insertAdjacentElement('afterend',box);}if(box)box.textContent='O Pondera encontrou um erro ao carregar uma camada do dashboard. Recarregue a página com Ctrl+F5. Detalhe: '+err.message;});
})();