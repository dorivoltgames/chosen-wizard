import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import {game,root,html} from './helpers/game.mjs';
const api=game();
// Only story traversal uses fixed scores/outcomes. Actual combat is covered separately.
function run(seed,home=false,legacy=null) {
  const L=api.newLife(seed),g=api.lifeScript(L),steps=[];let input;
  if(legacy)L.legacy=legacy;
  for(let n=0;n<600;n++) {
    const step=g.next(input);input=undefined;
    if(step.done||step.value.t==='end')return {L,steps};
    const s=step.value;steps.push(s);
    if(s.t==='choice')input=home&&s.e.age===18?1:0;
    if(s.t==='mini')input=s.kind==='quiz'?{c:18,int:110}:s.kind==='speed'?{avg:250,perfect:3,spd:60}:{taps:40,hp:300};
    if(s.t==='battle')input={win:true,levels:0};
  }
  throw new Error('Story failed to terminate');
}
test('39 original endings stay active; 8 previous discoveries remain readable',()=>{
  assert.equal(api.ENDINGS.length,39);assert.equal(new Set(api.ENDINGS.map(e=>e.id)).size,39);
  assert.equal(api.ENDINGS[38].id,'quiet');assert.equal(api.FATE.endings.length,8);
});
test('both life choices keep all three original trials and the school years',()=>{
  for(let seed=1;seed<=80;seed++)for(const home of [false,true]){
    const {L,steps}=run(seed,home);
    assert.ok(api.ENDINGS.some(e=>e.id===L.ending),`${seed}:${home} lacks an ending`);
    assert.deepEqual(steps.filter(s=>s.t==='mini').map(s=>s.kind),['quiz','speed','mash']);
    assert.equal(steps.some(s=>s.e?.fateKey==='school_path'||s.e?.fateKey==='adult_path'),false);
    assert.equal(L.fate.path,home?'home':'hero');assert.equal(!!L.adventure,!home);
    if(home)assert.ok(steps.some(s=>s.e?.age>=24));
  }
});
test('legacy flavor changes no birth stats or random events',()=>{
  const a=run(88,true),b=run(88,true,{name:'나비',end:'hero'});
  assert.ok(b.steps.some(s=>s.e?.text?.includes('옛 마법사 나비')));
  assert.equal(b.L.ending,a.L.ending);assert.deepEqual(b.L.st,a.L.st);
  assert.deepEqual(a.L.traits,b.L.traits);assert.deepEqual(a.L.route,b.L.route);
});
test('old and new friend links retain their birth and past result',()=>{
  const v=vm.createContext({});vm.runInContext(readFileSync(new URL('fate-ui.js',root),'utf8'),v);
  const all=[...api.ENDINGS,...api.FATE.endings];
  const UI=v.createFateUI({fate:api.FATE,context:()=>({endings:all,shareURL:'https://example.test/',dailySeed:()=>123})});
  const L=api.newLife(123);api.FATE.state(L).path='hero';L.ending='hero';
  assert.equal(UI.parseHash(UI.link(L).split('#')[1]).result.end,'hero');
  assert.equal(UI.parseHash('#f3f~bread_peace~home').result.end,'bread_peace');
  assert.equal(UI.parseHash('#f3f').seed,123);assert.equal(UI.parseHash('#f0').seed,0);
  assert.equal(UI.parseHash('#d2026-02-31'),null);assert.equal(UI.parseHash('#fzzzzzzz'),null);
  assert.equal(UI.parseHash('#f3f~<script>~home'),null);
});
test('save keys and unlocked archived endings survive history updates',()=>{
  const v=vm.createContext({});vm.runInContext(readFileSync(new URL('fate-ui.js',root),'utf8'),v);
  const UI=v.createFateUI({fate:api.FATE,context:()=>({endings:[...api.ENDINGS,...api.FATE.endings],dailyKey:()=> '2026-11-06',saveDex(){}})});
  const dx={lives:12,end:{hero:3,bread_peace:1},o:{potato:1},daily:{'2026-11-01':'hero'}};
  const L=run(1,true).L;for(let n=0;n<30;n++)UI.remember(L,dx);
  assert.equal(dx.end.hero,3);assert.equal(dx.end.bread_peace,1);assert.equal(dx.lives,12);
  assert.equal(dx.daily['2026-11-01'],'hero');assert.equal(dx.crossroads.history.length,12);
  assert.equal(UI.legacy({crossroads:{legacy:{name:'A',end:'truth'}}}).end,'truth');
});
test('next-life targets point to active endings',()=>{
  for(const L of [api.newLife(1),run(1,true).L])assert.ok(api.ENDINGS.some(e=>e.id===api.FATE.target({},L)));
});
test('scripts parse and inlined UI matches its editable source',()=>{
  for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
  for(const f of ['resonance.js','resonance-ui.js','fate-update.js','fate-ui.js','fate-telemetry.js'])new vm.Script(readFileSync(new URL(f,root),'utf8'));
  assert.ok(html.includes(readFileSync(new URL('resonance-ui.js',root),'utf8')));
});
