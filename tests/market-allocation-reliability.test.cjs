const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const updater = fs.readFileSync(path.join(root, 'scripts/update_prices.py'), 'utf8');
const prices = fs.readFileSync(path.join(root, 'docs/v17.js'), 'utf8');
const reliability = fs.readFileSync(path.join(root, 'docs/v43-allocation-market.js'), 'utf8');
const workflow = fs.readFileSync(path.join(root, '.github/workflows/update-prices.yml'), 'utf8');
const index = fs.readFileSync(path.join(root, 'docs/index.html'), 'utf8');

for (const ticker of ['BOVA11', 'IVVB11', 'HASH11']) {
  assert.match(updater, new RegExp(`['"]${ticker}['"]`), `${ticker} deve integrar o catálogo automático`);
  assert.match(prices, new RegExp(`${ticker}:`), `${ticker} deve ter taxonomia/segmento no cliente`);
}
assert.match(updater, /t \+ '\.SA'/, 'ativos B3 devem usar o símbolo Yahoo .SA');
assert.match(updater, /build_quote_diagnostics/, 'a rotina deve produzir diagnóstico estruturado');
assert.match(updater, /previous_prices/, 'a rotina deve preservar cache anterior');
assert.match(workflow, /quote-diagnostics\.json/, 'o workflow deve publicar o diagnóstico');
assert.match(prices, /stalePriceV17/, 'o cliente deve revalidar cotações vencidas');
assert.match(prices, /status:old\?'cached':'missing'/, 'o cliente deve registrar fallback de cache');
assert.match(reliability, /const classOrder=.*state\?\.assets/, 'a ordem persistida deve ser a fonte da UI');
assert.match(reliability, /lockTopLevelOrder/, 'a ordem dos blocos superiores deve ser estabilizada');
assert.match(reliability, /lockClassOrder/, 'macro, atalhos e microalocação devem ser sincronizados');
assert.match(reliability, /PonderaAllocationMarketV43/, 'a auditoria deve ser exposta para diagnóstico');
assert.match(index, /CARTEIRA • V3\.4\.0/, 'a versão publicada deve ser 3.4.0');

console.log('market-allocation-reliability: ok');
