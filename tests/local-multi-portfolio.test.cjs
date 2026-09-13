const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

class MemoryStorage{
  constructor(){this.values=new Map();}
  getItem(key){return this.values.has(key)?this.values.get(key):null;}
  setItem(key,value){this.values.set(String(key),String(value));}
  removeItem(key){this.values.delete(String(key));}
}

const context={console,Date,Math,JSON,Set,Map,Intl,localStorage:new MemoryStorage(),document:{documentElement:{dataset:{}}},sequence:1};
context.crypto={randomUUID:()=>('00000000-0000-4000-8000-'+String(context.sequence++).padStart(12,'0'))};
context.window=context;
vm.createContext(context);

const root=path.resolve(__dirname,'..');
vm.runInContext(fs.readFileSync(path.join(root,'docs/core/local-portfolio-repository.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'docs/core/local-consolidation.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'docs/core/finance-service.js'),'utf8'),context);

const repository=context.PonderaLocalPortfolioRepository;
const consolidation=context.PonderaLocalConsolidation;
const finance=context.PonderaFinance;
const main=repository.activePortfolio();

context.localStorage.setItem('carteira-v14-transactions',JSON.stringify({pending:[],executed:[{id:'a-1',ticker:'AAA3'}]}));
repository.persistLegacyKey('carteira-v14-transactions');
const second=repository.createPortfolio({name:'Previdência',includeInConsolidated:true});
repository.setActivePortfolio(second.id);
assert.deepEqual(JSON.parse(context.localStorage.getItem('carteira-v14-transactions')).executed,[],'nova carteira deve iniciar sem lançamentos');

context.localStorage.setItem('carteira-v14-transactions',JSON.stringify({pending:[],executed:[{id:'b-1',ticker:'BBB3'}]}));
repository.persistLegacyKey('carteira-v14-transactions');
repository.setActivePortfolio(main.id);
assert.equal(JSON.parse(context.localStorage.getItem('carteira-v14-transactions')).executed[0].id,'a-1','troca de carteira não pode sobrepor o histórico anterior');
assert.equal(repository.readPortfolioData(second.id).transactions.executed[0].id,'b-1','segunda carteira mantém histórico próprio');

const atomicSnapshot=repository.runtimeSnapshot(main.id);
assert.equal(atomicSnapshot.transactions.executed[0].id,'a-1','snapshot atômico deve carregar o histórico completo da carteira alvo');
atomicSnapshot.transactions.executed[0].id='mutado-fora-do-repositorio';
assert.equal(repository.runtimeSnapshot(main.id).transactions.executed[0].id,'a-1','snapshot atômico deve ser uma cópia isolada');

const mainState={assets:[],holdings:[{ticker:'AAA3',name:'Ativo A',className:'Ações',segment:'Teste',qty:1,value:100}],contribution:0,band:25,aportes:{}};
const secondState={assets:[],holdings:[{ticker:'AAA3',name:'Ativo A',className:'Ações',segment:'Teste',qty:2,value:250}],contribution:0,band:25,aportes:{}};
context.localStorage.setItem(repository.storageKey(main.id,'state'),JSON.stringify(mainState));
context.localStorage.setItem(repository.storageKey(second.id,'state'),JSON.stringify(secondState));

repository.updateConsolidation([main.id]);
let summary=consolidation.build(repository.snapshots());
assert.equal(summary.netWorth,100,'consolidado deve somar somente carteiras marcadas');
assert.equal(summary.portfolioCount,1);

repository.updateConsolidation([main.id,second.id]);
summary=consolidation.build(repository.snapshots());
assert.equal(summary.netWorth,350,'consolidado deve somar os valores das carteiras selecionadas');
assert.equal(summary.positions[0].quantity,3,'posição repetida deve ser agregada sem alterar as carteiras de origem');
assert.equal(summary.positions[0].portfolioIds.length,2);

repository.updateConsolidation([second.id]);
context.localStorage.setItem(repository.storageKey(second.id,'state'),JSON.stringify({assets:[{name:'Caixa',current:80}],holdings:[]}));
summary=consolidation.build(repository.snapshots());
assert.equal(summary.netWorth,80,'saldo por classe deve ser consolidado quando a carteira ainda não possui posições detalhadas');

repository.updateConsolidation([main.id]);
context.localStorage.setItem(repository.storageKey(main.id,'state'),JSON.stringify({assets:[],holdings:[{ticker:'TESOURO RESERVA',name:'Tesouro Reserva',className:'Tesouro Reserva',qty:1,value:500}]}));
summary=consolidation.build(repository.snapshots());
assert.equal(summary.classAllocation[0].name,'Tesouro Direto','Tesouro Reserva deve ser consolidado na classe Tesouro Direto');
assert.equal(finance.normalizeTransaction({ticker:'TESOURO RESERVA',className:'Tesouro Reserva'}).className,'Tesouro Direto','serviço financeiro deve aplicar a taxonomia canônica');

let integrity=repository.auditIntegrity();
assert.equal(integrity.ok,true,'namespaces válidos devem passar na auditoria de integridade');
assert.equal(integrity.duplicateIds.length,0,'não deve haver IDs de carteira duplicados');
assert.equal(integrity.invalidDatasets.length,0,'datasets válidos não devem ser reportados como corrompidos');

const emptySummary=consolidation.build([]);
assert.equal(emptySummary.netWorth,0,'consolidação vazia deve retornar patrimônio zero');
assert.deepEqual(Array.from(emptySummary.classAllocation),[],'consolidação vazia não deve criar percentuais inválidos');
assert.equal(Number.isFinite(emptySummary.netWorth),true,'consolidação vazia não pode produzir NaN ou Infinity');

const ledger=finance.buildLedger([
  {id:'buy-1',portfolioId:'p1',kind:'buy',ticker:'ABC3',className:'Ações',date:'2026-01-02',quantity:10,unitPrice:10,baseTotal:100},
  {id:'buy-2',portfolioId:'p1',kind:'buy',ticker:'ABC3',className:'Ações',date:'2026-01-03',quantity:10,unitPrice:20,baseTotal:200},
  {id:'sell-1',portfolioId:'p1',kind:'sell',ticker:'ABC3',className:'Ações',date:'2026-01-04',quantity:5,unitPrice:20,baseTotal:100},
  {id:'income-1',portfolioId:'p1',kind:'dividend',ticker:'ABC3',className:'Ações',date:'2026-01-05',baseTotal:10}
],{prices:{ABC3:{priceBRL:30}}});
assert.equal(ledger.holdings[0].quantity,15,'venda deve reduzir a quantidade sem alterar o custo médio remanescente');
assert.equal(ledger.holdings[0].averagePriceBase,15,'custo médio ponderado deve permanecer matematicamente correto');
assert.equal(ledger.realizedGain,25,'ganho realizado deve descontar o custo proporcional vendido');
assert.equal(ledger.unrealizedGain,225,'ganho não realizado deve usar o preço atual');
assert.equal(ledger.totalProfit,260,'lucro total deve combinar valorização, vendas e proventos sem dupla contagem');
assert.deepEqual(Array.from(finance.weightedTargets([],[])),[],'metas consolidadas sem patrimônio não devem dividir por zero');

const corruptKey=repository.storageKey(main.id,'planning'),previousPlanning=context.localStorage.getItem(corruptKey);
context.localStorage.setItem(corruptKey,'{json-incompleto');
integrity=repository.auditIntegrity();
assert.equal(integrity.ok,false,'dataset corrompido deve reprovar a auditoria');
assert.equal(integrity.invalidDatasets[0].dataset,'planning','auditoria deve identificar o dataset corrompido');
context.localStorage.setItem(corruptKey,previousPlanning);
assert.equal(repository.auditIntegrity().ok,true,'integridade deve ser restabelecida após restaurar o dataset');

console.log('local-multi-portfolio: ok');
