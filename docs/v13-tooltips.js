let activeTooltipEl=null;
function tooltipBox(){return document.getElementById('globalTooltip');}
function positionTooltip(target){const tip=tooltipBox();if(!tip||!target)return;const r=target.getBoundingClientRect();tip.style.left='12px';tip.style.top='12px';const tr=tip.getBoundingClientRect();let left=r.left+r.width/2-tr.width/2;left=Math.max(10,Math.min(window.innerWidth-tr.width-10,left));let top=r.top-tr.height-10;if(top<8)top=r.bottom+10;if(top+tr.height>window.innerHeight-8)top=Math.max(8,window.innerHeight-tr.height-8);tip.style.left=left+'px';tip.style.top=top+'px';}
function showGlobalTooltip(target){const text=target&&target.dataset?target.dataset.tip:'';if(!text)return;const tip=tooltipBox();if(!tip)return;activeTooltipEl=target;tip.textContent=text;tip.classList.add('show');tip.setAttribute('aria-hidden','false');positionTooltip(target);}
function hideGlobalTooltip(){const tip=tooltipBox();if(!tip)return;activeTooltipEl=null;tip.classList.remove('show');tip.setAttribute('aria-hidden','true');}
document.addEventListener('mouseover',e=>{const t=e.target.closest&&e.target.closest('.infoTip');if(t)showGlobalTooltip(t);});
document.addEventListener('mouseout',e=>{const t=e.target.closest&&e.target.closest('.infoTip');if(t&&!t.contains(e.relatedTarget))hideGlobalTooltip();});
document.addEventListener('focusin',e=>{const t=e.target.closest&&e.target.closest('.infoTip');if(t)showGlobalTooltip(t);});
document.addEventListener('focusout',e=>{if(e.target.closest&&e.target.closest('.infoTip'))hideGlobalTooltip();});
document.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('.infoTip');if(t){e.preventDefault();e.stopPropagation();if(activeTooltipEl===t)hideGlobalTooltip();else showGlobalTooltip(t);return;}hideGlobalTooltip();});
window.addEventListener('resize',()=>{if(activeTooltipEl)positionTooltip(activeTooltipEl);});
window.addEventListener('scroll',()=>{if(activeTooltipEl)positionTooltip(activeTooltipEl);},{passive:true});
window.addEventListener('load',()=>{if(document.querySelector('script[data-v15-loader]'))return;const s=document.createElement('script');s.src='v15.js?v=15.3';s.dataset.v15Loader='1';s.onload=()=>{if(document.querySelector('script[data-v16-loader]'))return;const n=document.createElement('script');n.src='v16.js?v=16.3';n.dataset.v16Loader='1';document.body.appendChild(n);};document.body.appendChild(s);});