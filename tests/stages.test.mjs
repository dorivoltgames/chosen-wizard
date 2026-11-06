import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {game,root,html} from './helpers/game.mjs';
import {EXTRA_ENDINGS} from '../stats-extension/funnel.mjs';
const a=game(),E=a.EXPANSION;

function sample(rid,seed=30){
  const stage=a.TIERS.findIndex(t=>t.includes(rid)),L=a.newLife(seed),lv=4+stage*2;
  L.st={int:110+stage*6,spd:55+stage*2,hp:850+stage*70};
  L.element=a.ELEMENTS.find(e=>e.id==='fire');L.traits=[];L.flags={};L.allies=[];L.pets=[];L.stage=stage;L.region=rid;L.route=a.TIERS.slice(0,stage).map(t=>t[0]).concat(rid);
  L.W={hp:L.st.hp,max:L.st.hp,lv,exp:0,pow:Math.pow(1.07,lv-1)};L.mods={dmg:1+stage*.1,chill:1};L.cards=['chill'];return L;
}
function play(B){
  for(let i=0;i<9000&&!B.result;i++){
    if(B.clash||B.notes.some(n=>!n.done&&n.lane===B.wiz.lane&&n.t<.42))B.tap();
    B.update(.02);
    assert.ok(Number.isFinite(B.wiz.hp));for(const m of B.mobs)assert.ok(Number.isFinite(m.hp)&&Number.isFinite(m.atk));
  }
  return B;
}
test('the eight-stage route includes every previous region and three new regions before the castle',()=>{
  assert.equal(a.TIERS.length,8);assert.equal(a.LAST_STAGE,7);
  assert.deepEqual(JSON.parse(JSON.stringify(a.TIERS.slice(2))),[['crystal'],['ice','volcano'],['clockwork'],['dungeon','ruins'],['astral'],['castle']]);
  assert.equal(new Set(a.TIERS.flat()).size,13);
  for(const name of ['HPMUL','ATKMUL','MOB_HP','BOSS_HP','DPS_REF','HIT_CAP','BOSS_ATK','CLASH_PULL','SPECIAL_HIT','BPM_N','TRAVEL_N','TAP_MIN','HOP_K','UNFAIR_N','REST_N','HAZ_DMG','MONOX','BOSSX']){
    assert.equal(a[name].length,8,name);assert.ok(a[name].every(Number.isFinite),name);
  }
});
test('nine new mobs and three bosses have distinct original palette sprites',()=>{
  const monsters=Object.values(E.regions).flatMap(r=>[...r.mobs,r.boss]);assert.equal(monsters.length,12);
  assert.equal(new Set(monsters.map(m=>m.s)).size,12);
  assert.equal(new Set(monsters.map(m=>JSON.stringify(E.sprites[m.s]))).size,12);
  for(const m of monsters){const grid=E.sprites[m.s];assert.ok(grid);assert.ok(grid.every(row=>row.length===24));assert.match(grid.join(''),/^[.kwpPsSvVyYrRobBgGmMcCneEDluUtTxz]+$/);assert.ok(grid.join('').replaceAll('.','').length>60)}
});
test('all new region food, bounties, death outcomes and backend IDs resolve',()=>{
  for(const rid of Object.keys(E.regions)){
    assert.ok(a.FOODS[rid]);assert.ok(a.WANTED[rid].every(w=>E.regions[rid].mobs.some(m=>m.s===w.s)));
    assert.ok(a.ENDINGS.some(e=>e.id==='death_'+rid));assert.ok(EXTRA_ENDINGS.includes('death_'+rid));
  }
});
test('new ordinary encounters and bosses run with the same tap control and produce their signature patterns',()=>{
  for(const rid of Object.keys(E.regions))for(let seed=1;seed<=4;seed++){
    const L=sample(rid,seed);
    for(const boss of [false,true]){
      const B=play(a.battleFor(L,{stage:L.stage,region:rid,boss},100+seed));
      assert.equal(B.result,'win',rid+'/'+boss+'/'+seed);
      if(boss){assert.ok(B.patternCounts[E.regions[rid].boss.patterns[0]],rid+' signature attack must be used');assert.ok(B.patternCounts[E.regions[rid].boss.phase2.at(-1)],rid+' phase two must use its new attack')}
    }
  }
});
test('the penultimate boss sustains a late-game build while the three-act final remains longer',()=>{
  for(const seed of [30,55,91]){
    const L=sample('astral'),nova=play(a.battleFor(L,{stage:6,region:'astral',boss:true},seed)),final=play(a.battleFor(L,{stage:7,region:'castle',boss:true},seed));
    assert.equal(nova.result,'win');assert.equal(final.result,'win');
    // Same character and dodge policy: guard against late-game burst deleting
    // Nova before its second phase has time to matter. This is not a player win rate.
    assert.ok(nova.t>=final.t*.55,`${seed}: Nova ${nova.t}s / final ${final.t}s`);
    assert.ok(final.t>nova.t,`${seed}: the final should retain its three-act endurance`);
  }
});
test('boss relics are guaranteed only after a boss victory and never enter the random card pool',()=>{
  for(const rid of Object.keys(E.regions)){
    const L=sample(rid),id=E.regions[rid].relic;
    const B=play(a.battleFor(L,{stage:L.stage,region:rid,boss:true},55));assert.equal(B.result,'win');a.afterBattle(L,B);
    const g=a.awardStageRelic(L,rid);while(!g.next().done){}
    assert.ok(L.cards.includes(id));assert.equal(L.mods[id],1);
    const again=a.awardStageRelic(L,rid);assert.equal(again.next().done,true);assert.equal(L.cards.filter(c=>c===id).length,1);
    for(let n=0;n<60;n++)assert.ok(a.drawCards(L,4,'r').every(c=>!c.bossOnly));
  }
});
test('relics really add homing shards, shorten cooldowns, and spend counterattack stars',()=>{
  function setup(mods){
    const L=sample('crystal');Object.assign(L.mods,mods);const B=a.battleFor(L,{stage:L.stage,region:'crystal',boss:true},91);B.wiz.atkT=999;B.wiz.gcd=999;B.clashOn=false;
    for(let t=0;t<4;t+=.02)B.update(.02);const m=B.mobs[0];m.hp=m.max=100000;m.sched=[];m.rest=999;B.notes=[];B.inv=0;B.wiz.ifr=0;B.clockDodges=0;B.starGuard=mods.starlamp?3:0;if(B.resonance)B.resonance.charge=0;return {B,m};
  }
  function dodge(B,m){B.notes.push({lane:B.wiz.lane,t:.08,dur:.08,threat:true,src:m,dmg:20,kind:'star',x0:m.x,y0:m.y,pat:'test'});B.tap();B.update(.1);B.update(.22)}
  const prism=setup({prismcore:1});for(let i=0;i<3;i++)dodge(prism.B,prism.m);assert.ok(prism.B.shots.filter(s=>s.resonance&&s.look==='ice').length===2);
  const clock=setup({clockspring:1});clock.B.wiz.cds.test=10;for(let i=0;i<4;i++)dodge(clock.B,clock.m);assert.ok(clock.B.wiz.cds.test<8);assert.equal(clock.B.clockDodges,4);
  const star=setup({starlamp:1});const hp=star.B.wiz.hp;star.B.notes.push({lane:star.B.wiz.lane,t:.01,threat:true,src:star.m,sure:true,dmg:100,kind:'star',x0:star.m.x,y0:star.m.y,pat:'hit'});star.B.update(.02);
  assert.equal(star.B.starGuard,2);assert.equal(hp-star.B.wiz.hp,70);assert.ok(star.B.shots.some(s=>s.look==='star'&&s.tg===star.m));
});
test('new region and monster copy is localized and visual source is installed exactly',()=>{
  for(const lang of ['en','ja']){
    const x=game(lang).EXPANSION;
    for(const rg of Object.values(x.regions))assert.ok(!/[가-힣]/.test(rg.name+rg.hint+[...rg.mobs,rg.boss].map(m=>m.n).join('')));
    for(const r of x.relics)assert.ok(!/[가-힣]/.test(r.name+r.desc));
  }
  assert.ok(html.includes(readFileSync(new URL('stage-visuals.js',root),'utf8')));
});
