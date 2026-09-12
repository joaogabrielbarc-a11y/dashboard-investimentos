(()=>{
'use strict';
if(window.__PONDERA_ATOMIC_RENDER_V42__)return;
window.__PONDERA_ATOMIC_RENDER_V42__=true;

const baseRender=window.render;
let ready=false;

if(typeof baseRender==='function'){
  window.render=function(...args){
    if(!ready)return;
    return baseRender.apply(this,args);
  };
}

window.addEventListener('pondera:ready',()=>{
  ready=true;
  document.documentElement.dataset.ponderaRenderCycle='atomic';
  if(typeof window.render==='function')window.render();
},{once:true});
})();
