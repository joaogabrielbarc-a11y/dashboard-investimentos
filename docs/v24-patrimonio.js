(()=>{
const STYLE_ID='v24-patrimonio-layout-css';
let applying=false;

function ensureStyle(){
  if(document.getElementById(STYLE_ID))return;
  const l=document.createElement('link');
  l.id=STYLE_ID;
  l.rel='stylesheet';
  l.href='v24-patrimonio.css?v=24.2';
  document.head.appendChild(l);
}

function arrangePatrimonyV242(){
  if(applying)return;
  const panel=document.getElementById('tabPatrimonioV22');
  const kpis=document.getElementById('kpis');
  const grid=document.getElementById('patrimonyChartsGridV24');
  const distribution=document.getElementById('portfolioDistributionV24');
  const evolution=grid?.querySelector('.evolutionCard')||panel?.querySelector('.evolutionCard');
  if(!panel||!kpis||!grid||!distribution||!evolution)return false;
  applying=true;
  try{
    ensureStyle();

    // 1) Os três indicadores patrimoniais são sempre o primeiro conteúdo da aba.
    if(panel.firstElementChild!==kpis)panel.prepend(kpis);

    // 2) Os gráficos vêm imediatamente depois dos indicadores.
    if(kpis.nextElementSibling!==grid)kpis.insertAdjacentElement('afterend',grid);
    grid.classList.add('patrimonyChartsGridV242','patrimonySectionOrderV242');

    // 3) Ordem solicitada: Ativos na Carteira -> Evolução do Patrimônio.
    if(grid.firstElementChild!==distribution)grid.insertBefore(distribution,grid.firstElementChild);
    if(distribution.nextElementSibling!==evolution)distribution.insertAdjacentElement('afterend',evolution);

    // 4) O resumo de macro alocação permanece disponível na aba própria e não
    // compete visualmente com os gráficos patrimoniais.
    panel.querySelectorAll(':scope > .chartsCard').forEach(el=>el.classList.add('patrimonyLegacyHiddenV242'));
    const oldOverview=document.getElementById('patrimonyOverviewGridV22');
    if(oldOverview)oldOverview.classList.add('hiddenPatrimonyOverviewV24');

    const version=document.querySelector('.topbar .eyebrow');
    if(version)version.textContent='CARTEIRA • V2.4';
    return true;
  }finally{
    applying=false;
  }
}

function boot(){
  ensureStyle();
  let tries=0;
  const wait=()=>{
    tries++;
    if(arrangePatrimonyV242()){
      const panel=document.getElementById('tabPatrimonioV22');
      if(panel&&!panel.dataset.v242Observed){
        panel.dataset.v242Observed='1';
        const observer=new MutationObserver(()=>requestAnimationFrame(arrangePatrimonyV242));
        observer.observe(panel,{childList:true});
      }
      return;
    }
    if(tries<400)setTimeout(wait,25);
  };
  wait();
  window.addEventListener('hashchange',()=>setTimeout(arrangePatrimonyV242,0));
}

boot();
})();
