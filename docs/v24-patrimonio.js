(()=>{
const STYLE_ID='v24-patrimonio-layout-css';
const REVISION='2.4.2';
let applying=false;
let observer=null;

function ensureStyle(){
  let l=document.getElementById(STYLE_ID);
  if(!l){
    l=document.createElement('link');
    l.id=STYLE_ID;
    l.rel='stylesheet';
    document.head.appendChild(l);
  }
  if(!String(l.href||'').includes('v=24.4'))l.href='v24-patrimonio.css?v=24.4';
}

function ensureV25(){
  if(document.querySelector('script[data-v25-structured-loader]'))return;
  const s=document.createElement('script');
  s.src='v25-structured.js?v=25.1';
  s.dataset.v25StructuredLoader='1';
  document.body.appendChild(s);
}

function arrangePatrimonyV241(){
  if(applying)return false;
  const panel=document.getElementById('tabPatrimonioV22');
  const kpis=document.getElementById('kpis');
  const grid=document.getElementById('patrimonyChartsGridV24');
  const distribution=document.getElementById('portfolioDistributionV24');
  const evolution=grid?.querySelector('.evolutionCard')||panel?.querySelector('.evolutionCard');
  if(!panel||!kpis||!grid||!distribution||!evolution)return false;

  applying=true;
  try{
    ensureStyle();

    // Ordem oficial da aba Patrimônio (V2.4.2):
    // 1. KPIs patrimoniais
    // 2. Grid de gráficos
    // A V2.2 usa flex + order, então além da ordem no DOM também fixamos
    // explicitamente o order inline para impedir regressões em renders futuros.
    kpis.style.order='1';
    grid.style.order='2';
    panel.insertBefore(kpis,panel.firstChild);
    panel.insertBefore(grid,kpis.nextSibling);

    // Mantém a composição atual dos gráficos: Ativos à esquerda e Evolução à direita.
    if(grid.firstElementChild!==distribution)grid.insertBefore(distribution,grid.firstChild);
    if(distribution.nextElementSibling!==evolution)grid.insertBefore(evolution,distribution.nextSibling);

    grid.classList.add('patrimonyChartsGridV242','patrimonySectionOrderV242');

    // Resumos legados permanecem nas abas específicas e não aparecem aqui.
    panel.querySelectorAll(':scope > .chartsCard').forEach(el=>el.classList.add('patrimonyLegacyHiddenV242'));
    const oldOverview=document.getElementById('patrimonyOverviewGridV22');
    if(oldOverview)oldOverview.classList.add('hiddenPatrimonyOverviewV24');

    const version=document.querySelector('.topbar .eyebrow');
    if(version&&!document.querySelector('script[data-v25-structured-loader]'))version.textContent=`CARTEIRA • V${REVISION}`;
    panel.dataset.patrimonyRevision=REVISION;
    return true;
  }finally{
    applying=false;
  }
}

function enforceRepeatedly(){
  let count=0;
  const timer=setInterval(()=>{
    count++;
    arrangePatrimonyV241();
    if(count>=40)clearInterval(timer);
  },250);
}

function boot(){
  ensureStyle();
  ensureV25();
  enforceRepeatedly();

  const bindObserver=()=>{
    const panel=document.getElementById('tabPatrimonioV22');
    if(!panel){setTimeout(bindObserver,50);return;}
    if(observer)return;
    observer=new MutationObserver(()=>requestAnimationFrame(arrangePatrimonyV241));
    observer.observe(panel,{childList:true,subtree:true});
    arrangePatrimonyV241();
  };
  bindObserver();

  window.addEventListener('hashchange',()=>{
    setTimeout(arrangePatrimonyV241,0);
    setTimeout(arrangePatrimonyV241,150);
  });
  window.addEventListener('pageshow',()=>{ensureV25();setTimeout(arrangePatrimonyV241,0);});
}

boot();
})();
