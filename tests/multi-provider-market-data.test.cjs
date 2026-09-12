const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const history = JSON.parse(read('docs/quant-market-history.json'));
const validation = JSON.parse(read('docs/quant-validation.json'));
const base = read('scripts/market_data/base.py');
const providers = read('scripts/market_data/providers.py');
const router = read('scripts/market_data/orchestrator.py');
const quant = read('docs/v38-quantitative.js');

for (const method of ['get_latest_prices', 'get_historical_data', 'get_economic_indicators', 'getLatestPrices', 'getHistoricalData', 'getEconomicIndicators']) {
  assert.match(base, new RegExp(`def ${method}\\(`), `contrato deve expor ${method}`);
}
for (const provider of ['YahooFinanceProvider', 'BcbSgsProvider', 'TesouroTransparenteProvider', 'CvmFundProvider', 'BrapiProvider', 'Up2DataProvider']) {
  assert.match(providers, new RegExp(`class ${provider}\\(`), `${provider} deve existir`);
}
assert.match(router, /class MarketDataRouter/, 'roteador multi-provider deve existir');
assert.equal(history.schemaVersion, 2);
assert.equal(history.period, '5y');
for (const benchmark of ['IBOV', 'IFIX', 'SP500', 'CDI']) {
  assert.ok(history.benchmarks[benchmark]?.length >= 30, `${benchmark} deve possuir histórico`);
}
assert.match(quant, /betaAgainst/, 'motor da tela deve calcular Beta');
assert.match(quant, /quantBenchmarkCardV44/, 'tela deve exibir painel de benchmarks');
assert.equal(validation.status, 'ok');
assert.equal(Object.values(validation.checks).every(Boolean), true);

console.log('multi-provider-market-data: ok');
