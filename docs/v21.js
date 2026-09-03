(()=>{
  const legacyHistory=typeof renderHistory==='function'?renderHistory:null;
  if(legacyHistory){
    renderHistory=function(){
      if(!document.getElementById('historyRows'))return;
      return legacyHistory();
    };
  }

  let attempts=0;
  const refreshCopy=()=>{
    const title=document.querySelector('.holdingsTitleV18 h2');
    if(title&&title.innerHTML.includes('último fechamento'))title.innerHTML=title.innerHTML.replace('último fechamento disponível','cotação mais recente disponível');
    const subtitle=document.querySelector('.holdingsTitleV18 p');
    if(subtitle&&subtitle.textContent.includes('preço atual'))subtitle.textContent='Acompanhe custo, cotação mais recente, variação e estrutura setorial de cada classe.';
  };
  const boot=()=>{
    attempts++;
    if(typeof renderHistoryV20!=='function'||typeof renderPendingV20!=='function'||typeof renderTxSummaryV20!=='function'||typeof postRenderV20!=='function'||typeof render!=='function'){
      if(attempts<240)setTimeout(boot,25);
      return;
    }
    renderHistory=renderHistoryV20;
    renderPending=renderPendingV20;
    renderTxSummary=renderTxSummaryV20;
    const previousPostRenderV20=postRenderV20;
    postRenderV20=function(){
      previousPostRenderV20();
      if(typeof renderTopPerformanceV19==='function')renderTopPerformanceV19();
      refreshCopy();
    };
    try{render();}catch(err){console.error('[V2.1] falha na recuperação do render',err);}
  };
  boot();
})();

(()=>{
  const loadV26=()=>{
    if(document.querySelector('script[data-v26-loader]'))return;
    const z=document.createElement('script');z.src='v26.js?v=26.0';z.dataset.v26Loader='1';document.body.appendChild(z);
  };
  const loadV25=()=>{
    const existing=document.querySelector('script[data-v25-structured-loader]');
    if(existing){setTimeout(loadV26,0);return;}
    const r=document.createElement('script');
    r.src='v25-structured.js?v=25.2';
    r.dataset.v25StructuredLoader='1';
    r.onload=loadV26;
    document.body.appendChild(r);
  };
  const ensurePatrimonyLayer=()=>{
    const existing=document.querySelector('script[data-v24-patrimonio-loader]');
    if(existing){setTimeout(loadV25,0);return;}
    const q=document.createElement('script');
    q.src='v24-patrimonio.js?v=24.4';
    q.dataset.v24PatrimonioLoader='1';
    q.onload=loadV25;
    document.body.appendChild(q);
  };
  if(document.querySelector('script[data-v22-loader]')){setTimeout(ensurePatrimonyLayer,0);return;}
  const s=document.createElement('script');
  s.src='v22.js?v=22.0';
  s.dataset.v22Loader='1';
  s.onload=()=>{
    if(document.querySelector('script[data-v23-loader]')){setTimeout(ensurePatrimonyLayer,0);return;}
    const n=document.createElement('script');
    n.src='v23.js?v=23.1';
    n.dataset.v23Loader='1';
    n.onload=()=>{
      if(document.querySelector('script[data-v24-loader]')){setTimeout(ensurePatrimonyLayer,0);return;}
      const p=document.createElement('script');
      p.src='v24.js?v=24.1';
      p.dataset.v24Loader='1';
      p.onload=ensurePatrimonyLayer;
      document.body.appendChild(p);
    };
    document.body.appendChild(n);
  };
  document.body.appendChild(s);
})();