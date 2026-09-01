function finiteFieldV19(v){return v!==null&&v!==undefined&&v!==''&&Number.isFinite(+v);}
unitCostBRLV19=function(h){
  if(!h)return null;if(finiteFieldV19(h.avgPriceBRL)&&+h.avgPriceBRL>=0)return +h.avgPriceBRL;if(!finiteFieldV19(h.avgPriceNative))return null;if((h.avgCurrency||'BRL')==='BRL')return +h.avgPriceNative;const fx=currentFxForHoldingV19(h);return Number.isFinite(fx)?+h.avgPriceNative*fx:null;
};
currentFxForHoldingV19=function(h){
  if(!h)return null;if((h.avgCurrency||h.currentCurrency)==='BRL')return 1;if(finiteFieldV19(h.avgPriceBRL)&&finiteFieldV19(h.avgPriceNative)&&+h.avgPriceNative>0)return +h.avgPriceBRL/+h.avgPriceNative;if(finiteFieldV19(h.currentPriceBRL)&&finiteFieldV19(h.currentPriceNative)&&+h.currentPriceNative>0)return +h.currentPriceBRL/+h.currentPriceNative;const rec=typeof v17PriceCache!=='undefined'?v17PriceCache[tickerV19(h.ticker)]:null;if(rec&&finiteFieldV19(rec.priceBRL)&&finiteFieldV19(rec.priceNative)&&+rec.priceNative>0)return +rec.priceBRL/+rec.priceNative;return null;
};
performanceV19=function(h){
  const current=Math.max(0,+h?.value||0),invested=investedValueV19(h),estimated=!finiteFieldV19(h?.avgPriceBRL)&&h?.avgCurrency==='USD';const nativePct=finiteFieldV19(h?.avgPriceNative)&&+h.avgPriceNative>0&&finiteFieldV19(h?.currentPriceNative)?((+h.currentPriceNative/+h.avgPriceNative)-1)*100:null,delta=Number.isFinite(invested)?current-invested:null,pctValue=Number.isFinite(invested)&&invested>0?delta/invested*100:null;return {current,invested,delta,pct:Number.isFinite(nativePct)?nativePct:pctValue,estimated};
};
latestPriceForTickerV19=function(ticker,className){
  const key=tickerV19(ticker),h=holdingByTickerV19(key),rec=typeof v17PriceCache!=='undefined'?v17PriceCache[key]:null;if(rec&&finiteFieldV19(rec.priceNative))return {price:+rec.priceNative,currency:rec.currency||'BRL',date:rec.date||null,source:rec.source||'cotação'};if(h){const native=finiteFieldV19(h.currentPriceNative)?+h.currentPriceNative:(finiteFieldV19(h.currentPriceBRL)?+h.currentPriceBRL:null),currency=finiteFieldV19(h.currentPriceNative)?(h.currentCurrency||priceCurrencyV17(h)):'BRL';if(Number.isFinite(native))return {price:native,currency,date:h.priceDate||null,source:h.priceSource||'cotação'};}return null;
};
fxForTickerV19=function(ticker){const h=holdingByTickerV19(ticker),rec=typeof v17PriceCache!=='undefined'?v17PriceCache[tickerV19(ticker)]:null;if(rec&&finiteFieldV19(rec.priceBRL)&&finiteFieldV19(rec.priceNative)&&+rec.priceNative>0)return +rec.priceBRL/+rec.priceNative;return currentFxForHoldingV19(h);};
const savePendingV19Base=savePendingV19;
savePendingV19=function(e){const c=txFormCalc();if(document.getElementById('txCurrency').value==='USD'&&(c.brlTotal===null||!Number.isFinite(c.brlTotal))){e.preventDefault();alert('Informe o câmbio USD/BRL para consolidar a simulação.');return;}return savePendingV19Base(e);};
const updateTxImpactV19Base=updateTxImpactV19;
updateTxImpactV19=function(){const c=txFormCalc(),box=document.getElementById('txImpactV19');if(c.brlTotal===null||!Number.isFinite(c.brlTotal)){if(box)box.innerHTML='<span>Informe quantidade, preço e câmbio quando necessário para visualizar o impacto da micro alocação.</span>';return;}return updateTxImpactV19Base();};
