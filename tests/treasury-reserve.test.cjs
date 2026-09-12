const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const context={console,Date,Math,JSON,Object,Number,String,Array};
context.window=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../docs/core/treasury-reserve.js'),'utf8'),context);

const reserve=context.PonderaTreasuryReserve;
assert.equal(reserve.ticker,'TESOURO RESERVA');
assert.equal(reserve.isReserve(' tesouro   reserva '),true);

const index={
  annualPct:14,
  date:'15/05/2026',
  dailyRates:[
    {date:'2026-05-11',value:.05},
    {date:'2026-05-12',value:.05},
    {date:'2026-05-13',value:.05},
    {date:'2026-05-14',value:.05},
    {date:'2026-05-15',value:.05}
  ]
};
const result=reserve.position([
  {ticker:'TESOURO RESERVA',side:'Compra',qty:1,unitPrice:1000,totalNative:1000,currency:'BRL',date:'2026-05-11'}
],index);
assert.equal(result.exact,true);
assert.ok(Math.abs(result.value-1000*Math.pow(1.0005,4))<1e-8,'deve acumular somente as taxas posteriores à compra');

const holding={ticker:'TESOURO RESERVA',className:'Tesouro Direto',qty:1};
assert.equal(reserve.applyHolding(holding,[{ticker:'TESOURO RESERVA',side:'Compra',qty:1,brlTotal:1000,date:'2026-05-11'}],index),true);
assert.ok(holding.value>1000);
assert.equal(holding.automaticVariation,true);
assert.match(holding.priceSource,/Selic Over/);

const withSale=reserve.position([
  {ticker:'TESOURO RESERVA',side:'Compra',qty:2,brlTotal:2000,date:'2026-05-11'},
  {ticker:'TESOURO RESERVA',side:'Venda',qty:1,brlTotal:1001,date:'2026-05-13'}
],index);
assert.equal(withSale.quantity,1);
assert.ok(Math.abs(withSale.value-1000*Math.pow(1.0005,4))<1e-8,'venda deve retirar a fração correspondente sem alterar o rendimento remanescente');

console.log('treasury-reserve: ok');
