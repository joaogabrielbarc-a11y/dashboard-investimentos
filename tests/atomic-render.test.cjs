const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const listeners=new Map();
let baseRenders=0,wrapperCalls=0;
const context={
  console,
  document:{documentElement:{dataset:{}}},
  addEventListener(type,listener){listeners.set(type,listener);},
  render(){baseRenders+=1;}
};
context.window=context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../docs/v42-runtime.js'),'utf8'),context);

const gatedRender=context.render;
context.render=function(){wrapperCalls+=1;return gatedRender();};
context.render();
assert.equal(baseRenders,0,'renders intermediários devem permanecer bloqueados durante o bootstrap');

listeners.get('pondera:ready')();
assert.equal(baseRenders,1,'o estado final deve ser renderizado uma única vez quando o runtime ficar pronto');
assert.equal(wrapperCalls,2,'a camada final deve preservar os wrappers instalados durante o bootstrap');
assert.equal(context.document.documentElement.dataset.ponderaRenderCycle,'atomic');

console.log('atomic-render: ok');
