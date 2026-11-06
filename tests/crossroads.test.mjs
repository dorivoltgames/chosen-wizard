import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const html=readFileSync(new URL('index.html',root),'utf8');
// Run the actual DOM-free game engine and story generator, including all original events.
function game(lang='ko') {
  const sandbox=vm.createContext({console});
  const core=html.slice(html.indexOf('// Crossroads content is pure story logic;'),html.indexOf('// ---------- rendering (pixel art:'));
  vm.runInContext(`const LANG=${JSON.stringify(lang)};const TT_=(id,ko)=>ko;const FUNNEL={track(){}};`+
    readFileSync(new URL('fate-update.js',root),'utf8')+'\n'+readFileSync(new URL('fate-ui.js',root),'utf8')+'\n'+core+
    '\nglobalThis.api={newLife,lifeScript,FATE,FATE_UI,ENDINGS,heroEnding:FATE.heroEnding,createBattle,battleFor};',sandbox);
  return sandbox.api;
}
const api=game();
function run(api,seed,choices={},options={}) {
  const L=api.newLife(seed),g=api.lifeScript(L),steps=[];let input;
  if(options.legacy)L.legacy=options.legacy;
  for(let n=0;n<600;n++) {
    const step=g.next(input);input=undefined;
    if(step.done)return {L,steps};
    const s=step.value;steps.push(s);
    if(s.t==='end')return {L,steps};
    if(s.t==='choice')input=s.e.fateKey?choices[s.e.fateKey]??0:0;
    if(s.t==='mini')input=s.kind==='quiz'?{c:18,int:110}:s.kind==='speed'?{avg:250,perfect:3,spd:60}:{taps:40,hp:300};
    if(s.t==='battle')input={win:true,levels:0};
  }
  throw new Error('Story failed to terminate');
}

test('all 39 previous ending IDs are preserved; the update adds 8 unique endings',()=>{
  assert.equal(api.ENDINGS.length,47);assert.equal(new Set(api.ENDINGS.map(e=>e.id)).size,47);
  assert.equal(api.ENDINGS[38].id,'quiet');assert.equal(api.ENDINGS[39].id,'oathkeeper');
});
test('births and their random sequence are unchanged by the chosen route or a legacy',()=>{
  const a=api.newLife(123456),b=api.newLife(123456);
  a.legacy={name:'old',end:'hero'};
  api.FATE.state(a).path='home';
  assert.deepEqual(JSON.parse(JSON.stringify([a.origin,a.family,a.element,a.traits])),JSON.parse(JSON.stringify([b.origin,b.family,b.element,b.traits])));
  assert.equal(a.rng(),b.rng());
});
test('all 9 school/adult route combinations finish across 80 deterministic births',()=>{
  for(let seed=1;seed<=80;seed++)for(let school=0;school<3;school++)for(let adult=0;adult<3;adult++){
    const {L,steps}=run(api,seed,{school_path:school,adult_path:adult});
    assert.ok(api.ENDINGS.some(e=>e.id===L.ending),`${seed}:${school}:${adult} lacks an ending`);
    assert.equal(L.fate.path,['hero','forbidden','home'][adult]);
    assert.equal(steps.filter(s=>s.t==='mini').length,school===0?3:0);
  }
});
test('each new ending is reachable through its documented decisions',()=>{
  const base={school_path:1,adult_path:1};
  const cases=[
    ['sealed',{...base,forbidden_final:0}],
    ['truth',{...base,archive_entry:0,archive_echo:1,archive_oath:0,forbidden_gate:0,forbidden_price:0,forbidden_final:1}],
    ['nameless',{...base,archive_entry:1,archive_echo:0,forbidden_gate:1,forbidden_price:1,forbidden_final:1}],
    ['village_union',{school_path:2,adult_path:2,village_craft:2,home_final:1}],
    ['dream_school',{school_path:2,adult_path:2,village_craft:1,home_final:2}],
    ['bread_peace',{school_path:2,adult_path:2,village_craft:0,home_crisis:1,home_final:2}],
    ['oathkeeper',{school_path:0,adult_path:0,hero_promise:0,hero_friend:0,hero_final:0}],
    ['unchosen',{school_path:0,adult_path:0,hero_final:1}],
  ];
  for(const [end,choices]of cases){let seen=false;for(let seed=1;seed<=100;seed++){if(run(api,seed,choices).L.ending===end){seen=true;break}}assert.ok(seen,`${end} unreachable`)}
});
test('trust gates the collective spell, while research gates the name sacrifice',()=>{
  const {steps}=run(api,123,{school_path:2,adult_path:1,forbidden_gate:1,forbidden_price:0});
  const final=steps.find(s=>s.e?.fateKey==='forbidden_final');
  assert.equal(final.e.opts.length,2); // seal and research sacrifice, but no trust ending
  assert.ok(!final.e.opts.some(x=>x.includes('공개')));
});
test('a previous life changes the story without modifying starting stats',()=>{
  const original=run(api,88,{school_path:2,adult_path:2});
  const old=run(api,88,{school_path:2,adult_path:2},{legacy:{name:'나비',end:'hero'}});
  assert.ok(old.steps.some(s=>s.e?.text?.includes('옛 마법사 나비')));
  assert.equal(old.L.ending,original.L.ending);assert.deepEqual(old.L.st,original.L.st);
});
test('friend links round-trip result metadata, preserve day and accept old links',()=>{
  // UI context is only consulted when a link is actually used.
  const script=readFileSync(new URL('fate-ui.js',root),'utf8');
  const uiContext=vm.createContext({console,createFateUI:undefined});vm.runInContext(script,uiContext);
  const UI=uiContext.createFateUI({fate:api.FATE,context:()=>({endings:api.ENDINGS,shareURL:'https://example.test/',dailySeed:day=>day==='2026-11-06'?123:0})});
  const L=api.newLife(123);api.FATE.state(L).path='home';L.ending='bread_peace';
  assert.equal(UI.parseHash(UI.link(L).split('#')[1]).result.end,'bread_peace');
  assert.equal(UI.parseHash('#f3f').seed,123);assert.equal(UI.parseHash('#f0').seed,0);
  L.mode='daily';L.dkey='2026-11-06';const daily=UI.parseHash(UI.link(L).split('#')[1]);
  assert.equal(daily.dkey,'2026-11-06');assert.equal(daily.seed,123);assert.equal(daily.result.path,'home');
  assert.equal(UI.parseHash('#d2026-02-31'),null);
  assert.equal(UI.parseHash('#fzzzzzzz'),null);
  assert.equal(UI.parseHash('#f3f~<script>~home'),null);
  assert.equal(UI.parseHash('#f3f~does_not_exist~home').result,undefined);
});
test('all new narrative is localized in Korean, English and Japanese',()=>{
  for(const lang of ['en','ja']){
    const localized=game(lang);
    for(const path of [1,2]){
      const {steps}=run(localized,46,{school_path:path,adult_path:path});
      const events=steps.filter(s=>s.e?.fateKey).map(s=>s.e);
      for(const e of events){assert.ok(!/[가-힣]/.test(e.text),`${lang}:${e.fateKey}`);for(const label of e.opts)assert.ok(!/[가-힣]/.test(label))}
    }
  }
});
test('existing save progress is retained and new history stays bounded',()=>{
  const script=readFileSync(new URL('fate-ui.js',root),'utf8'),v=vm.createContext({});vm.runInContext(script,v);
  const UI=v.createFateUI({fate:api.FATE,context:()=>({endings:api.ENDINGS,dailyKey:()=> '2026-11-06',saveDex(){}})});
  const dx={lives:12,end:{hero:3},o:{potato:1},daily:{'2026-11-01':'hero'}};
  const L=run(api,1,{school_path:2,adult_path:2}).L;
  for(let n=0;n<30;n++)UI.remember(L,dx);
  assert.equal(dx.end.hero,3);assert.equal(dx.lives,12);assert.equal(dx.daily['2026-11-01'],'hero');
  assert.equal(dx.crossroads.history.length,12);assert.equal(UI.legacy(dx).end,L.ending);
});

test('all inline scripts and extension files parse',()=>{
  for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
  for(const f of ['fate-update.js','fate-ui.js','fate-telemetry.js'])new vm.Script(readFileSync(new URL(f,root),'utf8'));
});
