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

const repository=context.PonderaLocalPortfolioRepository;
const consolidation=context.PonderaLocalConsolidation;
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

console.log('local-multi-portfolio: ok');
