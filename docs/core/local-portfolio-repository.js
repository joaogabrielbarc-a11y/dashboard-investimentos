(()=>{
'use strict';
if(window.PonderaLocalPortfolioRepository)return;

const VERSION='3.1.0';
const SCHEMA_VERSION=1;
const REGISTRY_KEY='pondera:v3:portfolios';
const ACTIVE_KEY='pondera:v3:active-portfolio';
const DATA_PREFIX='pondera:v3:portfolio:';
const DATASETS=Object.freeze({
  state:'carteira-v1',
  transactions:'carteira-v14-transactions',
  patrimony:'carteira-v15-patrimony',
  planning:'carteira-v16-planning',
  segments:'carteira-v18-segment-plan'
});

const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
const now=()=>new Date().toISOString();
const parse=(raw,fallback=null)=>{try{return raw==null?fallback:JSON.parse(raw);}catch(error){return fallback;}};
const slug=value=>String(value||'portfolio').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,36)||'portfolio';
const makeId=name=>`${slug(name)}-${window.crypto?.randomUUID?.().slice(0,8)||Math.random().toString(36).slice(2,10)}`;
const storageKey=(portfolioId,dataset)=>`${DATA_PREFIX}${portfolioId}:${dataset}`;
const normalizePortfolio=row=>({
  id:String(row.id),
  name:String(row.name||'Carteira').trim().slice(0,80)||'Carteira',
  description:String(row.description||'').trim().slice(0,240),
  baseCurrency:String(row.baseCurrency||row.base_currency||'BRL').toUpperCase(),
  includeInConsolidated:row.includeInConsolidated??row.include_in_consolidated??true,
  createdAt:row.createdAt||row.created_at||now(),
  updatedAt:row.updatedAt||row.updated_at||now(),
  archivedAt:row.archivedAt||row.archived_at||null
});

function readRegistry(){
  const saved=parse(localStorage.getItem(REGISTRY_KEY));
  if(saved?.schemaVersion===SCHEMA_VERSION&&Array.isArray(saved.portfolios)&&saved.portfolios.length){
    return{schemaVersion:SCHEMA_VERSION,portfolios:saved.portfolios.map(normalizePortfolio)};
  }
  const createdAt=now(),portfolio=normalizePortfolio({id:'carteira-principal',name:'Carteira principal',description:'Dados migrados da versão local anterior.',includeInConsolidated:true,createdAt,updatedAt:createdAt});
  const registry={schemaVersion:SCHEMA_VERSION,portfolios:[portfolio]};
  localStorage.setItem(REGISTRY_KEY,JSON.stringify(registry));
  localStorage.setItem(ACTIVE_KEY,portfolio.id);
  return registry;
}

function writeRegistry(registry){
  const normalized={schemaVersion:SCHEMA_VERSION,portfolios:(registry.portfolios||[]).map(normalizePortfolio)};
  localStorage.setItem(REGISTRY_KEY,JSON.stringify(normalized));
  return normalized;
}

function portfolios({includeArchived=false}={}){
  const rows=readRegistry().portfolios;
  return clone(includeArchived?rows:rows.filter(row=>!row.archivedAt));
}

function activePortfolioId(){
  const rows=portfolios(),requested=localStorage.getItem(ACTIVE_KEY),active=rows.find(row=>row.id===requested)||rows[0];
  if(!active)throw new Error('Nenhuma carteira ativa foi encontrada.');
  if(requested!==active.id)localStorage.setItem(ACTIVE_KEY,active.id);
  return active.id;
}

function activePortfolio(){return portfolios().find(row=>row.id===activePortfolioId())||null;}

function hasScopedData(portfolioId){return Object.keys(DATASETS).some(dataset=>localStorage.getItem(storageKey(portfolioId,dataset))!=null);}

function persistLegacyKey(legacyKey,portfolioId=activePortfolioId()){
  const dataset=Object.keys(DATASETS).find(name=>DATASETS[name]===legacyKey);
  if(!dataset)return;
  const value=localStorage.getItem(legacyKey);
  if(value==null)localStorage.removeItem(storageKey(portfolioId,dataset));
  else localStorage.setItem(storageKey(portfolioId,dataset),value);
}

function persistActiveLegacy(){
  const portfolioId=activePortfolioId();
  Object.values(DATASETS).forEach(key=>persistLegacyKey(key,portfolioId));
  const registry=readRegistry(),row=registry.portfolios.find(item=>item.id===portfolioId);
  if(row){row.updatedAt=now();writeRegistry(registry);}
}

function hydrate(portfolioId){
  const row=portfolios().find(item=>item.id===String(portfolioId));
  if(!row)throw new Error('Carteira não encontrada.');
  for(const [dataset,legacyKey] of Object.entries(DATASETS)){
    const value=localStorage.getItem(storageKey(row.id,dataset));
    if(value==null)localStorage.removeItem(legacyKey);
    else localStorage.setItem(legacyKey,value);
  }
  localStorage.setItem(ACTIVE_KEY,row.id);
  return row;
}

function migrateLegacyIntoActive(){
  const portfolioId=activePortfolioId();
  if(hasScopedData(portfolioId))return false;
  let migrated=false;
  for(const [dataset,legacyKey] of Object.entries(DATASETS)){
    const value=localStorage.getItem(legacyKey);
    if(value!=null){localStorage.setItem(storageKey(portfolioId,dataset),value);migrated=true;}
  }
  return migrated;
}

function bootstrap(){
  readRegistry();
  const portfolioId=activePortfolioId();
  migrateLegacyIntoActive();
  if(hasScopedData(portfolioId))hydrate(portfolioId);
  document.documentElement.dataset.ponderaStorage='local-multi-portfolio';
  return activePortfolio();
}

function emptyData(){
  const today=new Date().toISOString().slice(0,10);
  return{
    state:{assets:[{id:'sem-classe',name:'Sem classe',current:0,target:100}],contribution:1500,band:25,aportes:{'sem-classe':0},autoAportes:false,showIdeal:false,holdings:[],showAllHoldings:false},
    transactions:{pending:[],executed:[],chartMode:'monthly',chartRange:'12',showAllHistory:false},
    patrimony:[{date:today,value:0,estimated:false,live:true}],
    planning:{suggestionApplied:false},
    segments:{segments:{},bands:{}}
  };
}

function createPortfolio(input={}){
  persistActiveLegacy();
  const registry=readRegistry(),name=String(input.name||'Nova carteira').trim()||'Nova carteira',portfolio=normalizePortfolio({id:makeId(name),name,description:input.description||'',baseCurrency:input.baseCurrency||'BRL',includeInConsolidated:input.includeInConsolidated!==false});
  registry.portfolios.push(portfolio);writeRegistry(registry);
  const data=emptyData();Object.keys(DATASETS).forEach(dataset=>localStorage.setItem(storageKey(portfolio.id,dataset),JSON.stringify(data[dataset])));
  return clone(portfolio);
}

function updatePortfolio(id,input={}){
  const registry=readRegistry(),row=registry.portfolios.find(item=>item.id===String(id));
  if(!row)throw new Error('Carteira não encontrada.');
  if(Object.prototype.hasOwnProperty.call(input,'name'))row.name=String(input.name||'').trim().slice(0,80)||row.name;
  if(Object.prototype.hasOwnProperty.call(input,'description'))row.description=String(input.description||'').trim().slice(0,240);
  if(Object.prototype.hasOwnProperty.call(input,'baseCurrency'))row.baseCurrency=String(input.baseCurrency||'BRL').toUpperCase();
  if(Object.prototype.hasOwnProperty.call(input,'includeInConsolidated'))row.includeInConsolidated=input.includeInConsolidated!==false;
  row.updatedAt=now();writeRegistry(registry);return clone(row);
}

function updateConsolidation(ids){
  const selected=new Set((ids||[]).map(String)),registry=readRegistry();
  registry.portfolios.forEach(row=>{if(!row.archivedAt){row.includeInConsolidated=selected.has(row.id);row.updatedAt=now();}});
  writeRegistry(registry);return portfolios();
}

function setActivePortfolio(id){persistActiveLegacy();return hydrate(String(id));}

function readPortfolioData(id){
  const portfolio=portfolios().find(row=>row.id===String(id));if(!portfolio)return null;
  const data={portfolio};
  for(const dataset of Object.keys(DATASETS))data[dataset]=parse(localStorage.getItem(storageKey(portfolio.id,dataset)));
  return clone(data);
}

function snapshots(){return portfolios().map(row=>readPortfolioData(row.id)).filter(Boolean);}

window.PonderaLocalPortfolioRepository=Object.freeze({version:VERSION,schemaVersion:SCHEMA_VERSION,keys:Object.freeze({registry:REGISTRY_KEY,active:ACTIVE_KEY,prefix:DATA_PREFIX,datasets:DATASETS}),storageKey,bootstrap,portfolios,activePortfolioId,activePortfolio,persistLegacyKey,persistActiveLegacy,hydrate,createPortfolio,updatePortfolio,updateConsolidation,setActivePortfolio,readPortfolioData,snapshots,emptyData});
if(!(window.PONDERA_CONFIG?.supabaseUrl&&window.PONDERA_CONFIG?.supabaseAnonKey))bootstrap();
})();
