(()=>{
  // Proteção imediata: a V2.0 substitui o tbody legado do histórico. Até o novo
  // renderizador carregar, a função V1.4 não pode abortar a cadeia inteira.
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
    // A V2.0 remodelou o histórico. A cadeia antiga ainda chamava renderizadores
    // que dependiam de #historyRows e interrompiam qualquer render posterior.
    renderHistory=renderHistoryV20;
    renderPending=renderPendingV20;
    renderTxSummary=renderTxSummaryV20;

    const previousPostRenderV20=postRenderV20;
    postRenderV20=function(){
      previousPostRenderV20();
      // As rotinas especiais de preço rodam dentro do post-render V2.0; recalcular
      // os KPIs depois delas mantém Patrimônio/Investido/Variação sincronizados.
      if(typeof renderTopPerformanceV19==='function')renderTopPerformanceV19();
      refreshCopy();
      const e=document.querySelector('.topbar .eyebrow');if(e)e.textContent='CARTEIRA • V2.1';
    };
    try{render();}catch(err){console.error('[V2.1] falha na recuperação do render',err);}
  };
  boot();
})();
