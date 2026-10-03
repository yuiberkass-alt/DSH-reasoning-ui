import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const source=await readFile(new URL('../src/client.template.js',import.meta.url),'utf8');
let moduleEntry;
vm.runInNewContext(source,{window:{__ModuleLoader__:{load:entry=>moduleEntry=entry}}});
const imports=[];
const plugin=moduleEntry.factory(name=>{imports.push(name);if(name==='react')return {};throw new Error('Unexpected dependency '+name);});
const {percentToIndex,indexToPercent,isMaxEffort,frameAt}=plugin.__test;
test('drag clamps outside track, snaps at four boundaries and supports single/no levels',()=>{
  assert.deepEqual([-2,0,.16,.17,.49,.51,.83,.84,1,7].map(x=>percentToIndex(x,4)),[0,0,0,1,1,2,2,3,3,3]);
  assert.equal(percentToIndex(.99,1),0);assert.equal(percentToIndex(1,0),0);
  assert.equal(indexToPercent(0,1),0);assert.equal(indexToPercent(3,4),1);
  for(let n=2;n<12;n++)for(let i=0;i<n;i++)assert.equal(percentToIndex(indexToPercent(i,n),n),i);
});
test('purple requires Max, including when High is the last available level',()=>{
  for(const id of ['off','low','high','xhigh','ultra',''])assert.equal(isMaxEffort({id,name:id}),false);
  assert.equal(isMaxEffort({id:'max',name:'Max'}),true);
  assert.equal(isMaxEffort({id:'vendor-id',name:'Max'}),true);
});
test('start, six-frame running cycle, stop and idle blink are reachable',()=>{
  assert.equal(frameAt('moving',0),4);assert.equal(frameAt('moving',150),5);
  assert.deepEqual(Array.from({length:7},(_,i)=>frameAt('moving',220+85*i)),[6,7,8,9,10,11,6]);
  assert.deepEqual([0,80,160,240,320].map(x=>frameAt('stopping',x)),[12,13,14,15,0]);
  assert.equal(frameAt('idle',3380),2);
});
test('reduced motion freezes every animation state at idle',()=>{
  for(const phase of ['idle','moving','stopping'])for(const t of [0,150,3380,5000])assert.equal(frameAt(phase,t,true),0);
});
test('only React baseline is imported, factory registers without side effects',()=>{
  assert.deepEqual(imports,['react']);assert.equal(moduleEntry.id,'@local/dsh-chibi-slider');
});
test('registration uses DSH shared directory and refuses addressed subagent operations',async()=>{
  assert.ok(plugin.inject.includes('remote'));
  assert.ok(plugin.inject.includes('remote.session'));
  let options,component, selected=null,loads=0;const disposers=[];
  const store={getSnapshot(){return{};}};
  const directory={store,load:async()=>{loads++;},select:async x=>{selected=x;return {ok:true};}};
  const ctx={effect:f=>disposers.push(f()),locale:{register:()=>()=>{}},
    slots:{inject:(name,f)=>{assert.equal(name,'conversation.input.model');disposers.push(f());},register:(opts,c)=>{options=opts;component=c;return()=>{};}},
    modelDirectories:{directoryFor:id=>{assert.ok(['ordinary','subagent'].includes(id));return directory;}},
    sessions:{subagentAddress:id=>id==='subagent'?{}:undefined}};
  plugin.apply(ctx);assert.equal(options.priority,-40);assert.equal(typeof component,'function');
  const props=options.inject('ordinary');assert.equal(props.directory,store);props.load();
  const selection={provider:'p',model:'m',reasoningEffort:'max'};await props.select(selection);assert.equal(selected,selection);assert.equal(loads,1);
  const sub=options.inject('subagent');assert.equal(sub.available,false);sub.load();await sub.select({});assert.equal(loads,1);assert.equal(selected,selection);
  disposers.forEach(x=>x?.());
});
