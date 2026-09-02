(()=>{
const STYLE_ID='v24-patrimonio-layout-css';
const REVISION='2.4.2';
let applying=false;
let observer=null;
function ensureStyle(){let l=document.getElementById(STYLE_ID);if(!l){l=document.createElement('link');l.id=STYLE_ID;l.rel='stylesheet';document.head.appendChild(l);}if(!String(l.href||'').includes('v=24.4'))l.href='v24-patrimonio.css?v=24.4';}
function arrangePatrimonyV242(){
  if(applying)return false;
  const panel=document.getElementById('tabPatrimonioV22'),kpis=document.getElementById('kpis'),grid=document.getElementById('patrimonyChartsGridV24'),distribution=document.getElementById('portfolioDistributionV24'),evolution=grid?.querySelector('.evolutionCard')||panel?.querySelector('.evolutionCard');
  if(!panel||!kpis||!grid||!distribution||!evolution)return false;
  applying=true;
  try{
    ensureStyle();
    kpis.style.order='1';grid.style.order='2';
    panel.insertBefore(kpis,panel.firstChild);panel.insertBefore(grid,kpis.nextSibling);
    grid.classList.add('patrimonyChartsGridV242','patrimonySectionOrderV242');
    if(grid.firstElementChild!==distribution)grid.insertBefore(distribution,grid.firstElementChild);
    if(distribution.nextElementSibling!==evolution)grid.insertBefore(evolution,distribution.nextSibling);
    panel.querySelectorAll(':scope > .chartsCard').forEach(el=>el.classList.add('patrimonyLegacyHiddenV242'));
    const oldOverview=document.getElementById('patrimonyOverviewGridV22');if(oldOverview)oldOverview.classList.add('hiddenPatrimonyOverviewV24');
    const version=document.querySelector('.topbar .eyebrow');if(version)version.textContent=`CARTEIRA • V${REVISION}`;
    panel.dataset.patrimonyRevision=REVISION;
    return true;
  }finally{applying=false;}
}
function enforceRepeatedly(){let count=0;const timer=setInterval(()=>{count++;arrangePatrimonyV242();if(count>=40)clearInterval(timer);},250);}
function boot(){ensureStyle();enforceRepeatedly();const bindObserver=()=>{const panel=document.getElementById('tabPatrimonioV22');if(!panel){setTimeout(bindObserver,50);return;}if(observer)return;observer=new MutationObserver(()=>requestAnimationFrame(arrangePatrimonyV242));observer.observe(panel,{childList:true,subtree:true});arrangePatrimonyV242();};bindObserver();window.addEventListener('hashchange',()=>{setTimeout(arrangePatrimonyV242,0);setTimeout(arrangePatrimonyV242,150);});window.addEventListener('pageshow',()=>setTimeout(arrangePatrimonyV242,0));}
boot();
})();
