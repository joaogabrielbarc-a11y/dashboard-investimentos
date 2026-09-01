const executePendingV20Original=executePendingV20;
executePendingV20=function(){
  if(!v14.pending.length)return;
  const snapshot=v14.pending.map(t=>JSON.parse(JSON.stringify(t))),before=v14.pending.length;
  executePendingV17();
  if(v14.pending.length===before)return;
  snapshot.forEach(t=>{
    const h=state.holdings.find(x=>tickerKeyV20(x.ticker)===tickerKeyV20(t.ticker));
    if(h&&t.fixedIncomeMeta){
      h.fixedIncomeMeta=t.fixedIncomeMeta;h.segment=t.segment||h.segment;
      h.avgPriceBRL=t.fixedIncomeMeta.principal;h.avgPriceNative=t.fixedIncomeMeta.principal;h.avgCurrency='BRL';
    }
  });
  applySpecialPricesV20();save();render();
};
