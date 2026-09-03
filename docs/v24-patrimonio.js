(()=>{
'use strict';
const STYLE_ID='v24-patrimonio-layout-css';
const REVISION='2.4.5-stable';
let applying=false;

function ensureStyle(){
  let l=document.getElementById(STYLE_ID);
  if(!l){l=document.createElement('link');l.id=STYLE_ID;l.rel='stylesheet';document.head.appendChild(l);}
  if(!String(l.href||'').includes('v=24.5'))l.href='v24-patrimonio.css?v=24.5';
}

function arrangePatrimony(){
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
    kpis.style.order='1';
    grid.style.order='2';
    if(panel.firstElementChild!==kpis)panel.insertBefore(kpis,panel.firstChild);
    if(kpis.nextElementSibling!==grid)panel.insertBefore(grid,kpis.nextSibling);
    if(grid.firstElementChild!==distribution)grid.insertBefore(distribution,grid.firstChild);
    if(distribution.nextElementSibling!==evolution)grid.insertBefore(evolution,distribution.nextSibling);
    grid.classList.add('patrimonyChartsGridV242','patrimonySectionOrderV242');
    panel.querySelectorAll(':scope > .chartsCard').forEach(el=>el.classList.add('patrimonyLegacyHiddenV242'));
    document.getElementById('patrimonyOverviewGridV22')?.classList.add('hiddenPatrimonyOverviewV24');
    panel.dataset.patrimonyRevision=REVISION;
    return true;
  }finally{applying=false;}
}

function scheduleArrange(){
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(arrangePatrimony);
  else setTimeout(arrangePatrimony,0);
}

function boot(){
  ensureStyle();
  // Sem MutationObserver permanente e sem loader de V2.5. O bootstrap principal
  // controla a ordem dos scripts; esta camada apenas reorganiza o layout quando necessário.
  if(typeof render==='function'&&!window.__PONDERA_PATRIMONY_RENDER_WRAP__){
    window.__PONDERA_PATRIMONY_RENDER_WRAP__=true;
    const previousRender=render;
    render=function(){const result=previousRender();scheduleArrange();return result;};
  }
  arrangePatrimony();
  [80,250,700].forEach(ms=>setTimeout(arrangePatrimony,ms));
  window.addEventListener('hashchange',()=>setTimeout(arrangePatrimony,0));
  window.addEventListener('pageshow',()=>setTimeout(arrangePatrimony,0));
  window.addEventListener('pondera:ready',()=>setTimeout(arrangePatrimony,0));
}
boot();
})();