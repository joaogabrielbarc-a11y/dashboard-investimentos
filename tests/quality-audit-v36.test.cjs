const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const index=read('docs/index.html'),platformCss=read('docs/v40-platform.css'),platform=read('docs/v40-platform.js'),quotes=read('docs/v17.js'),quant=read('docs/v38-quantitative.js'),quality=read('docs/v45-quality-audit.js'),repository=read('docs/core/local-portfolio-repository.js'),runtimeUi=read('docs/v30.js');

assert.match(index,/CARTEIRA • V3\.6\.0/,'documento deve identificar a V3.6.0');
assert.match(index,/v45-quality-audit\.js\?v=45\.0/,'módulo de QA deve carregar após a plataforma');
assert.doesNotMatch(platformCss,/ponderaPortfolioSwitching[^}]*opacity:\s*0/,'troca de carteira não deve apagar a página');
assert.match(platform,/ponderaPortfolioTransition='applying'/,'transição deve ter estado explícito');
assert.match(platform,/ponderaPortfolioTransition='stable'/,'transição deve terminar em estado estável');
assert.match(platform,/pondera:storageerror/,'falha de persistência deve ser observável');
assert.match(repository,/function auditIntegrity\(/,'repositório deve auditar todos os namespaces');
assert.match(quotes,/await fetchMissingYahooV17/,'verificação deve aguardar o fallback do navegador');
assert.match(quotes,/fetchMissingYahooV17\(force\)/,'verificação manual deve revalidar até preços ainda frescos');
assert.match(quotes,/if\(v17PriceLoadStarted\)return/,'verificações concorrentes devem ser deduplicadas');
assert.match(quotes,/pondera:quote-status/,'status de cotações deve ser exposto à interface');
assert.match(quant,/benchmarks\?\.CDI/,'métricas devem consumir o histórico de CDI');
assert.match(quant,/riskFreeSource/,'origem da taxa livre de risco deve ser rastreável');
for(const area of ['hierarchy','rendering','storage','allocation','finance','layout','quotes'])assert.match(quality,new RegExp(`${area}:`),`auditoria deve cobrir ${area}`);
assert.match(quality,/runtimeErrors/,'auditoria deve capturar erros não tratados');
assert.doesNotMatch(runtimeUi,/'"':'&quot'(?!;)/,'aspas em conteúdo dinâmico devem usar entidade HTML completa');

console.log('quality-audit-v36: ok');
