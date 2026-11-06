import test from 'node:test';
import assert from 'node:assert/strict';
import {game} from './helpers/game.mjs';
const api=game(),R=api.RESONANCE;
const base={fire:'fire',ice:'ice',bolt:'bolt',echo:'none',wind:'wind',earth:'earth',life:'light',dark:'dark'};
const support={fire:'burn',ice:'chill',bolt:'chainplus',echo:'twin',wind:'swift',earth:'guardian',life:'regen',dark:'vampire'};
function loadout(recipe){
  const L=api.newLife(123);L.element=api.ELEMENTS.find(e=>e.id===base[recipe.parts[0]]);L.cards=[support[recipe.parts[1]]];L.mods={dmg:1};L.st={int:110,spd:55,hp:850};L.W={hp:600,max:850,lv:4,exp:0,pow:1.1};L.traits=[];L.allies=[];L.route=['grass'];L.flags={};L.resonance=recipe.id;
  const c=api.CARDS.find(c=>c.id===L.cards[0]);if(c.r!=='n')L.mods[c.id]=1;if(c.apply)c.apply(L);return L;
}
function prepared(recipe){
  const L=loadout(recipe),B=api.battleFor(L,{stage:0,region:'grass',boss:true},1234);
  B.wiz.atkT=999;B.wiz.gcd=999;B.clashOn=false;
  for(let t=0;t<4;t+=0.02)B.update(0.02);
  const m=B.mobs[0];assert.ok(m?.ready);m.sched=[];m.rest=999;m.hp=m.max=100000;B.notes=[];
  return {L,B,m};
}
function dodge(B,m){
  B.notes.push({lane:B.wiz.lane,t:0.08,dur:0.08,threat:true,src:m,dmg:20,kind:'star',x0:m.x,y0:m.y,pat:'test'});
  assert.equal(B.tap(),true);B.update(0.1);B.update(0.22);
}
test('all eight birth elements can complete a combination with an earned card',()=>{
  for(const element of api.ELEMENTS){
    const L=api.newLife(4);L.element=element;L.cards=[];
    assert.equal(R.active(L),null,element.id);assert.ok(R.bridge(L,api.CARDS).length,element.id);
    const hand=api.drawCards(L,3);assert.ok(hand.some(c=>R.project(L,c)),element.id);
  }
});
test('offering a card changes no inventory; a generic buff unlocks no recipe',()=>{
  const L=api.newLife(1);L.cards=[];L.element={id:'fire'};
  api.drawCards(L,3);assert.equal(L.cards.length,0);assert.equal(R.active(L),null);
  L.mods.chill=1;assert.equal(R.active(L),null);L.cards=['chill'];assert.equal(R.active(L).id,'thermal');
});
test('actual lane taps and resolved danger notes charge all six combat effects',()=>{
  for(const recipe of R.recipes){
    const {B,m}=prepared(recipe),hp=B.wiz.hp;
    dodge(B,m);assert.equal(B.resonance.charge,1);dodge(B,m);assert.equal(B.resonance.charge,2);
    dodge(B,m);assert.equal(B.resonance.procs,1,recipe.id);assert.equal(B.resonance.charge,0);
    assert.ok(B.fx.some(f=>f.type==='resonance'&&f.id===recipe.id));
    for(let t=0;t<2;t+=0.02)B.update(0.02);
    if(recipe.effect==='ward'){assert.ok(B.wiz.hp>hp);assert.ok(B.shieldHP>0);assert.ok(B.resonance.healed>0);assert.ok(B.resonance.shield>0)}
    else{assert.ok(m.hp<100000,recipe.id+' must deal real damage');assert.ok(B.resonance.damage>0,recipe.id+' must record damage')}
    if(recipe.effect==='drain')assert.ok(B.wiz.hp>hp);
  }
});
test('random taps, safe notes and tutorial notes grant no free charges',()=>{
  const {B,m}=prepared(R.recipes[0]);for(let n=0;n<15;n++){B.tap();B.update(0.25)}assert.equal(B.resonance.charge,0);
  B.notes.push({lane:(B.wiz.lane+1)%3,t:0.01,threat:false,src:m,dmg:10,kind:'star',x0:m.x,y0:m.y,pat:'safe'});B.update(0.02);assert.equal(B.resonance.charge,0);
  B.tut={step:1,done:0,wait:999};B.notes.push({lane:(B.wiz.lane+1)%3,t:0.01,threat:true,tut:true,src:m,dmg:0,kind:'star',x0:m.x,y0:m.y});B.update(0.02);assert.equal(B.resonance.charge,0);
});
test('real damage costs one charge and barrier rewards stay capped',()=>{
  const {B,m}=prepared(R.recipes[0]);dodge(B,m);dodge(B,m);
  B.notes.push({lane:B.wiz.lane,t:0.01,threat:true,src:m,sure:true,dmg:20,kind:'star',x0:m.x,y0:m.y,pat:'hit'});B.update(0.02);assert.equal(B.resonance.charge,1);
  const ward=prepared(R.recipes.find(r=>r.id==='bloom'));for(let n=0;n<12;n++){ward.B.resonance.cooldown=0;dodge(ward.B,ward.m)}assert.ok(ward.B.shieldHP<=ward.B.wiz.max*0.25);
});
test('supporting cards raise ranks and multiple recipes equip only one',()=>{
  const L=loadout(R.recipes[0]);assert.equal(R.active(L).rank,1);L.cards.push('frostarmor','burn');assert.equal(R.active(L).rank,2);
  L.cards.push('swift');assert.equal(R.available(L).length,2);L.resonance='firestorm';assert.equal(R.active(L).id,'firestorm');
  const B=api.battleFor(L,{stage:0,region:'grass',boss:false},123);assert.equal(B.resonance.recipe.id,'firestorm');assert.equal(B.resonance.procs,0);
  assert.equal(api.battleFor(L,{stage:0,region:'grass',noResonance:true},123).resonance,undefined);
});
test('results carry resonance totals, health and earned gold back to the life',()=>{
  const {L,B,m}=prepared(R.recipes[0]);dodge(B,m);dodge(B,m);dodge(B,m);B.result='win';B.kills=1;const result=api.afterBattle(L,B);
  assert.equal(result.win,true);assert.equal(L.resonanceTotals.procs,1);assert.ok(L.resonanceTotals.damage>0);assert.ok(result.gold>0);assert.equal(L.W.hp,Math.round(B.wiz.hp));
});
test('recipe names and descriptions are localized',()=>{for(const lang of ['en','ja'])for(const r of game(lang).RESONANCE.recipes)assert.ok(!/[가-힣]/.test(r.name+r.desc))});
test('six sample builds finish actual seeded boss fights with and without resonance',()=>{
  for(const recipe of R.recipes)for(const enabled of [false,true])for(let seed=1;seed<=3;seed++){
    const L=loadout(recipe);L.W.hp=L.W.max;
    const B=api.battleFor(L,{stage:0,region:'grass',boss:true,noResonance:!enabled},seed);
    // A simple input driver calls the same tap used by the UI; it changes no HP,
    // damage, cooldowns, mob state, victory flag or experience.
    for(let tick=0;tick<6000&&!B.result;tick++){
      if(B.clash||B.notes.some(n=>!n.done&&n.lane===B.wiz.lane&&n.t<0.42))B.tap();
      B.update(0.02);
    }
    assert.equal(B.result,'win',`${recipe.id}/${enabled}/${seed}`);
    if(enabled)assert.ok(B.resonance.procs>0,recipe.id);
  }
});
