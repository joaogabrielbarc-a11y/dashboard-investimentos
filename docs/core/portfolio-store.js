(()=>{
'use strict';
if(window.PonderaPortfolioStoreFactory)return;

const CONTEXT_KEY='pondera-ui-portfolio-context-v3';
const clone=value=>JSON.parse(JSON.stringify(value));
const normalizeContext=value=>value?.type==='portfolio'&&value.portfolioId?{type:'portfolio',portfolioId:String(value.portfolioId)}:{type:'consolidated',portfolioId:null};
const operationLabel=kind=>({buy:'Compra',sell:'Venda',dividend:'Provento',adjustment:'Ajuste'}[kind]||'Ajuste');
const transactionPayload=raw=>{const row=window.PonderaFinance.normalizeTransaction(raw);return{client_id:row.id,kind:row.kind,ticker:row.ticker,asset_name:row.name,class_name:row.className,segment_name:row.segment,trade_date:row.date,quantity:row.quantity,unit_price:row.unitPrice,currency:row.currency,native_total:row.nativeTotal,fx_rate:row.fxRate,base_total:row.baseTotal,fees_native:row.feesNative,source:row.source,external_id:raw.external_id||null,metadata:row.metadata};};

function create(repository){
  let snapshot={status:'idle',session:null,profile:null,portfolios:[],context:{type:'consolidated',portfolioId:null},data:null,derived:null,error:null},listeners=new Set(),requestId=0;
  const publish=patch=>{snapshot={...snapshot,...patch};for(const listener of listeners)listener(snapshot);window.dispatchEvent(new CustomEvent('pondera:storechange',{detail:{status:snapshot.status,context:snapshot.context}}));};
  const subscribe=listener=>{listeners.add(listener);listener(snapshot);return()=>listeners.delete(listener);};
  const getSnapshot=()=>snapshot;
  const currentPortfolio=()=>snapshot.context.type==='portfolio'?snapshot.portfolios.find(row=>String(row.id)===String(snapshot.context.portfolioId))||null:null;
  const canWrite=()=>snapshot.status==='ready'&&snapshot.context.type==='portfolio'&&!!currentPortfolio();

  function priceMap(){const prices={};try{for(const holding of state?.holdings||[]){const key=String(holding.ticker||'').toUpperCase();prices[key]={priceBase:Number(holding.currentPriceBRL??holding.price??0)||0};}}catch(e){}return prices;}
  function derive(data,context){
    const options={prices:priceMap()};
    if(context.type==='consolidated'){
      const consolidated=window.PonderaFinance.consolidate(data.portfolios,data.transactions,options),snapshots=window.PonderaFinance.portfolioSnapshots(data.portfolios.filter(row=>row.include_in_consolidated),data.transactions,options);
      return{...consolidated,targets:window.PonderaFinance.weightedTargets(snapshots,data.classes),snapshots,readOnly:true};
    }
    const portfolio=data.portfolios.find(row=>String(row.id)===String(context.portfolioId)),ledger=window.PonderaFinance.buildLedger(data.transactions,options);
    return{scope:'portfolio',portfolioIds:[context.portfolioId],portfolio,ledger,holdings:ledger.holdings,netWorth:ledger.currentValue,income:ledger.receivedIncome,classAllocation:window.PonderaFinance.allocationBy(ledger.holdings,'className'),segmentAllocation:window.PonderaFinance.allocationBy(ledger.holdings,'segment'),targets:data.classes.map(row=>({name:row.name,target:Number(row.target_pct)||0})),readOnly:false};
  }

  async function load(context=snapshot.context){
    const token=++requestId,normalized=normalizeContext(context);publish({status:'loading',context:normalized,error:null});
    try{
      const data=await repository.loadContext(normalized);if(token!==requestId)return snapshot;
      const validContext=normalized.type==='portfolio'&&data.portfolios.some(row=>String(row.id)===String(normalized.portfolioId))?normalized:{type:'consolidated',portfolioId:null};
      const loaded=validContext===normalized?data:await repository.loadContext(validContext),derived=derive(loaded,validContext);
      try{localStorage.setItem(CONTEXT_KEY,JSON.stringify(validContext));}catch(e){}
      publish({status:'ready',portfolios:loaded.portfolios,context:validContext,data:loaded,derived,error:null});return snapshot;
    }catch(error){if(token===requestId)publish({status:'error',error});throw error;}
  }

  async function initialize(){
    publish({status:'auth-loading',error:null});
    const currentSession=await repository.session();
    if(!currentSession){publish({status:'signed-out',session:null,profile:null,portfolios:[],data:null,derived:null});return snapshot;}
    const [profile,portfolios]=await Promise.all([repository.profile(),repository.portfolios()]);let saved=null;try{saved=JSON.parse(localStorage.getItem(CONTEXT_KEY)||'null');}catch(e){}
    snapshot={...snapshot,session:currentSession,profile,portfolios};
    const context=saved?.type==='portfolio'&&portfolios.some(row=>String(row.id)===String(saved.portfolioId))?saved:{type:'consolidated',portfolioId:null};
    return load(context);
  }

  async function setContext(context){return load(normalizeContext(context));}
  async function createPortfolio(input){const portfolio=await repository.createPortfolio(input);await load({type:'portfolio',portfolioId:portfolio.id});return portfolio;}
  async function updatePortfolio(id,input){const portfolio=await repository.updatePortfolio(id,input);await load(snapshot.context);return portfolio;}
  async function archivePortfolio(id){await repository.archivePortfolio(id);return load({type:'consolidated',portfolioId:null});}

  async function replaceTransactions(rows){if(!canWrite())throw new Error('Selecione uma carteira específica para alterar lançamentos.');await repository.replaceTransactions(snapshot.context.portfolioId,(rows||[]).map(transactionPayload));return load(snapshot.context);}
  async function replaceAllocations(classes,segments){if(!canWrite())throw new Error('Selecione uma carteira específica para alterar metas.');const classRows=(classes||[]).map((row,index)=>({client_id:String(row.id||row.name),name:row.name,target_pct:Number(row.target)||0,tolerance_pct:Number(row.band??row.tolerance??15)||15,display_order:index})),segmentRows=[];for(const [className,items] of Object.entries(segments||{})){const classRow=classRows.find(row=>row.name===className);if(!classRow)continue;(items||[]).forEach((row,index)=>segmentRows.push({class_client_id:classRow.client_id,client_id:String(row.id||row.name),name:row.name,target_pct:Number(row.target)||0,tolerance_pct:Number(row.band??row.tolerance??15)||15,display_order:index}));}await repository.replaceAllocations(snapshot.context.portfolioId,classRows,segmentRows);return load(snapshot.context);}

  function legacyPayload(){
    if(snapshot.status!=='ready'||!snapshot.data||!snapshot.derived)return null;const data=snapshot.data,derived=snapshot.derived,transactions=data.transactions.map(row=>({id:row.client_id||row.id,portfolioId:row.portfolio_id,ticker:String(row.ticker||'').toUpperCase(),name:row.asset_name||row.ticker,className:row.class_name,segment:row.segment_name||'Sem segmento',side:operationLabel(row.kind),operationType:operationLabel(row.kind),qty:Number(row.quantity)||0,unitPrice:Number(row.unit_price)||0,currency:row.currency||'BRL',totalNative:row.native_total==null?null:Number(row.native_total),fx:row.fx_rate==null?null:Number(row.fx_rate),brlTotal:row.base_total==null?null:Number(row.base_total),otherCostsNative:Number(row.fees_native)||0,date:row.trade_date,source:row.source||'nuvem',metadata:row.metadata||{}}));
    const holdings=(derived.holdings||[]).map(row=>({id:`cloud-${String(row.portfolioIds?.join('-')||row.portfolioId||'scope')}-${row.ticker}`.replace(/[^a-z0-9-]/gi,'-'),portfolioId:row.portfolioId||null,ticker:row.ticker,name:row.name,className:row.className,segment:row.segment,qty:row.quantity,avgPriceBRL:row.averagePriceBase,avgPriceNative:row.currency==='BRL'?row.averagePriceBase:null,avgCurrency:row.currency||'BRL',currentPriceBRL:row.currentPriceBase,currentPriceNative:row.currency==='BRL'?row.currentPriceBase:null,currentCurrency:row.currency||'BRL',price:row.currentPriceBase,value:row.currentValue,ledgerDerived:true}));
    const actualByClass=new Map();for(const row of holdings)actualByClass.set(row.className,(actualByClass.get(row.className)||0)+(Number(row.value)||0));const targetMap=new Map((derived.targets||[]).map(row=>[row.name,Number(row.target)||0])),names=new Set([...actualByClass.keys(),...targetMap.keys()]);const assets=[...names].map((name,index)=>({id:(data.classes.find(row=>row.name===name)?.client_id)||`cloud-class-${index}`,name,current:actualByClass.get(name)||0,target:targetMap.get(name)||0}));const segments={};for(const row of data.segments||[]){const className=data.classes.find(item=>item.client_id===row.class_client_id)?.name;if(!className)continue;(segments[className]||(segments[className]=[])).push({id:row.client_id,name:row.name,target:Number(row.target_pct)||0,band:Number(row.tolerance_pct)||15});}
    return{transactions,holdings,assets,segments,ledger:derived.ledger,readOnly:derived.readOnly,context:snapshot.context};
  }

  repository.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT')publish({status:'signed-out',session:null,profile:null,portfolios:[],data:null,derived:null});else if(['SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED'].includes(event)&&session){snapshot={...snapshot,session};initialize().catch(error=>publish({status:'error',error}));}});

  return Object.freeze({version:'3.0.0',subscribe,getSnapshot,initialize,setContext,createPortfolio,updatePortfolio,archivePortfolio,replaceTransactions,replaceAllocations,legacyPayload,canWrite,currentPortfolio,repository});
}

window.PonderaPortfolioStoreFactory=Object.freeze({version:'3.0.0',create});
})();
