(()=>{
'use strict';
if(window.PonderaLocalConsolidation)return;

const VERSION='3.2.0';
const EPS=1e-10;
const finite=value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value));
const number=value=>finite(value)?Number(value):0;
const ticker=value=>String(value||'').trim().toUpperCase()==='BTC'?'BTCUSD':String(value||'').trim().toUpperCase();
const operation=value=>{const text=String(value||'').trim().toLowerCase();if(['provento','dividend'].includes(text))return'dividend';if(['compra','buy'].includes(text))return'buy';if(['venda','sell'].includes(text))return'sell';return'adjustment';};
const canonicalClass=value=>String(value||'').trim().toLowerCase()==='tesouro reserva'?'Tesouro Direto':String(value||'Sem classe');

function holdingValue(holding){
  if(finite(holding.value))return Math.max(0,number(holding.value));
  const price=number(holding.currentPriceBRL??holding.currentPriceBase??holding.price);
  return Math.max(0,number(holding.qty??holding.quantity)*price);
}

function build(rawSnapshots){
  const snapshots=(rawSnapshots||[]).filter(Boolean),included=snapshots.filter(item=>item.portfolio?.includeInConsolidated!==false&&!item.portfolio?.archivedAt);
  const positions=new Map(),classes=new Map(),portfolioRows=[];
  let netWorth=0,receivedIncome=0,transactionCount=0;

  for(const snapshot of included){
    const portfolioId=String(snapshot.portfolio.id),holdings=Array.isArray(snapshot.state?.holdings)?snapshot.state.holdings:[],assets=Array.isArray(snapshot.state?.assets)?snapshot.state.assets:[],transactions=Array.isArray(snapshot.transactions?.executed)?snapshot.transactions.executed:[];
    let portfolioValue=0,portfolioIncome=0;
    for(const holding of holdings){
      const quantity=Math.max(0,number(holding.qty??holding.quantity));if(quantity<=EPS)continue;
      const currentValue=holdingValue(holding),symbol=ticker(holding.ticker),className=canonicalClass(holding.className),segment=String(holding.segment||'Sem segmento'),key=[symbol,className,segment].join('::');
      const row=positions.get(key)||{ticker:symbol,name:String(holding.name||symbol),className,segment,quantity:0,currentValue:0,costBase:0,portfolioIds:new Set()};
      row.quantity+=quantity;row.currentValue+=currentValue;row.portfolioIds.add(portfolioId);
      const average=number(holding.avgPriceBRL??holding.averagePriceBase??holding.avgPriceNative);if(average>0)row.costBase+=average*quantity;
      positions.set(key,row);classes.set(className,(classes.get(className)||0)+currentValue);portfolioValue+=currentValue;
    }
    if(portfolioValue<=EPS){
      for(const asset of assets){const currentValue=Math.max(0,number(asset.current));if(currentValue<=EPS)continue;const className=canonicalClass(asset.name);classes.set(className,(classes.get(className)||0)+currentValue);portfolioValue+=currentValue;}
    }
    for(const transaction of transactions){
      transactionCount+=1;
      if(operation(transaction.kind||transaction.operationType||transaction.side||transaction.type)!=='dividend')continue;
      const amount=transaction.base_total??transaction.baseTotal??transaction.brlTotal;
      if(finite(amount))portfolioIncome+=number(amount);
    }
    netWorth+=portfolioValue;receivedIncome+=portfolioIncome;
    portfolioRows.push({id:portfolioId,name:snapshot.portfolio.name,netWorth:portfolioValue,receivedIncome:portfolioIncome,positions:holdings.filter(row=>number(row.qty??row.quantity)>EPS).length,transactions:transactions.length});
  }

  const consolidatedPositions=[...positions.values()].map(row=>({...row,portfolioIds:[...row.portfolioIds],averagePriceBase:row.quantity>EPS&&row.costBase>0?row.costBase/row.quantity:null,currentPriceBase:row.quantity>EPS?row.currentValue/row.quantity:0})).sort((a,b)=>b.currentValue-a.currentValue);
  const classAllocation=[...classes.entries()].map(([name,value])=>({name,value,weight:netWorth>EPS?value/netWorth*100:0})).sort((a,b)=>b.value-a.value);
  portfolioRows.forEach(row=>row.weight=netWorth>EPS?row.netWorth/netWorth*100:0);portfolioRows.sort((a,b)=>b.netWorth-a.netWorth);
  return{scope:'consolidated',portfolioIds:included.map(item=>String(item.portfolio.id)),portfolioCount:included.length,netWorth,receivedIncome,transactionCount,positions:consolidatedPositions,classAllocation,portfolios:portfolioRows,readOnly:true};
}

window.PonderaLocalConsolidation=Object.freeze({version:VERSION,build,holdingValue,canonicalClass});
})();
