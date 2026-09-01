function renderTopPerformanceV19(){
  const host=document.getElementById('kpis');if(!host)return;
  const perf=portfolioPerformanceV19(),rows=getRows(),targets=normalizedTargets(rows),dispersion=dispersionIndex(rows.map(r=>r.currentWeight),targets),band=Math.max(0,+state.band||0),dispOk=dispersion<=band;
  const investedText=Number.isFinite(perf.invested)?fmt.format(perf.invested):'—',deltaText=Number.isFinite(perf.delta)?signedMoneyV19(perf.delta):'—',pctText=Number.isFinite(perf.pct)?signedPctV19(perf.pct):'—';
  host.innerHTML=`<article class="card kpi"><span class="kpiLabel">Patrimônio consolidado ${infoV16('Valor atual de mercado da carteira, calculado pelas quantidades e pelos últimos preços disponíveis.')}</span><strong>${fmt.format(perf.current)}</strong><small>Valor atual do patrimônio</small></article><article class="card kpi"><span class="kpiLabel">Valor investido ${infoV16('Custo das posições atuais calculado pela quantidade multiplicada pelo preço médio. Para posições internacionais antigas sem câmbio histórico, a conversão em reais é estimada pelo câmbio atual.')}</span><strong>${investedText}</strong><small>${perf.estimated?'Inclui conversão estimada em posições internacionais':'Custo médio consolidado'}</small></article><article class="card kpi performanceKpiV19 ${variationClassV19(perf.delta)}"><span class="kpiLabel">Variação total ${infoV16('Diferença entre o patrimônio atual e o custo investido das posições que ainda estão na carteira.')}</span><strong>${pctText}</strong><small>${deltaText}</small></article><article class="card kpi dispersion ${dispOk?'good':'bad'}"><span class="kpiLabel">Índice de dispersão ${infoV16('Distância entre a macro alocação atual e a meta. Verde quando está dentro da banda global definida.')}</span><strong>${pct(dispersion)}</strong><small>${dispOk?'Dentro':'Acima'} da banda de ±${state.band}%</small></article>`;
}

function enhanceAssetTableV19(article){
  const table=article.querySelector('.assetsTableV18'),head=table?.querySelector('thead tr');if(!table||!head)return;
  const originalHeads=[...head.children];if(originalHeads.length<8)return;
  const valueHead=originalHeads[5],weightHead=originalHeads[6];
  const investedHead=document.createElement('th');investedHead.textContent='Investido';head.insertBefore(investedHead,valueHead);
  valueHead.textContent='Valor atual';
  const variationHead=document.createElement('th');variationHead.textContent='Variação';valueHead.after(variationHead);
  table.querySelectorAll('tbody tr').forEach(tr=>{
    const edit=tr.querySelector('[data-edit-asset-v18]');if(!edit){const td=tr.querySelector('td[colspan]');if(td)td.colSpan=10;return;}
    const h=state.holdings.find(x=>x.id===edit.dataset.editAssetV18);if(!h)return;
    const before=[...tr.children],valueTd=before[5];if(!valueTd)return;const p=performanceV19(h);
    const investedTd=document.createElement('td');investedTd.innerHTML=`<div class="performanceCellV19"><strong>${Number.isFinite(p.invested)?fmt.format(p.invested):'—'}</strong><small>${p.estimated?'estimado em BRL':'custo atual'}</small></div>`;tr.insertBefore(investedTd,valueTd);
    const variationTd=document.createElement('td');variationTd.innerHTML=`<div class="performanceCellV19 ${variationClassV19(p.delta)}"><strong>${signedPctV19(p.pct)}</strong><small>${signedMoneyV19(p.delta)}</small></div>`;valueTd.after(variationTd);
  });
}

function enhanceClassDashboardV19(article){
  const className=article.dataset.classDashboardV18;if(!className)return;
  const header=article.querySelector('.classHeaderV18'),p=header?.querySelector('p'),pills=header?.querySelector('.classPillsV18'),grid=article.querySelector('.classGridV18'),a=state.assets.find(x=>x.name===className),perf=classPerformanceV19(className),macro=macroWeightV18(className),items=holdingsForClassV18(className);
  if(p)p.innerHTML=`${items.length} ativo${items.length===1?'':'s'} • ${pct(macro)} da carteira • meta macro ${pct(+a?.target||0)}`;
  if(header&&!header.querySelector('.classPerformanceV19'))header.insertAdjacentHTML('beforeend',`<div class="classPerformanceV19"><div><span>Investido</span><strong>${Number.isFinite(perf.invested)?fmt.format(perf.invested):'—'}</strong></div><div><span>Atual</span><strong>${fmt.format(perf.current)}</strong></div><div class="${variationClassV19(perf.delta)}"><span>Variação</span><strong>${signedPctV19(perf.pct)}</strong><small>${signedMoneyV19(perf.delta)}</small></div></div>`);
  const searchActive=String(v18Search||'').trim().length>0,collapsed=!searchActive&&!!v19Ui.collapsed[className];
  article.classList.toggle('collapsedV19',collapsed);if(grid)grid.classList.toggle('hiddenV19',collapsed);
  if(pills&&!pills.querySelector('[data-collapse-v19]'))pills.insertAdjacentHTML('afterbegin',`<button class="collapseButtonV19" data-collapse-v19="${escapeAttr(className)}" aria-expanded="${collapsed?'false':'true'}"><span>${collapsed?'▸':'▾'}</span>${collapsed?'Expandir':'Minimizar'}</button>`);
  enhanceAssetTableV19(article);
}

function enhanceHoldingsV19(){
  const card=document.querySelector('.holdingsCard');if(!card)return;
  const title=card.querySelector('.holdingsTitleV18 h2');if(title)title.innerHTML=`Micro alocação ${infoV16('Organiza cada classe em ativos individuais e distribuição por segmentos. As classes podem ser minimizadas para facilitar a navegação.')}`;
  const subtitle=card.querySelector('.holdingsTitleV18 p');if(subtitle)subtitle.textContent='Acompanhe custo, valor atual, variação e estrutura setorial de cada classe.';
  card.querySelectorAll('.classDashboardV18').forEach(enhanceClassDashboardV19);
  card.querySelectorAll('[data-collapse-v19]').forEach(b=>b.onclick=()=>toggleClassV19(b.dataset.collapseV19));
}
