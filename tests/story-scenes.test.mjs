import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {game,root,html} from './helpers/game.mjs';
const a=game(),S=a.STORY;
const plain=x=>JSON.parse(JSON.stringify(x));
function life(){const L=a.newLife(6718);L.pets=[];L.allies=[];L.cards=[];L.flags={};L.mods={dmg:1};L.age=5;return L}
test('visual planning neither changes life state nor consumes its random sequence',()=>{
  const A=life(),B=life(),before=plain(A);
  S.plan({eventId:'find_dog_child',icon:'dog'},A);S.choice({eventId:'forbidden',icon:'book'},0,A);S.snapshot(A);S.changes(S.snapshot(A),A);
  assert.deepEqual(plain(A),before);assert.equal(A.rng(),B.rng());
});
test('pet acceptance has a real joining effect; declining never claims a companion',()=>{
  for(const pick of [0,1]){
    const L=life(),g=a.doEvent(L,a.EVI.find_dog_child),choice=g.next().value;
    assert.equal(choice.e.eventId,'find_dog_child');assert.equal(S.plan(choice.e,L).actor,'dog');
    const outcome=g.next(pick).value.e;
    assert.equal(L.pets.includes('dog'),pick===0);
    assert.equal(outcome.visuals.some(v=>v.kind==='companion'&&v.id==='dog'),pick===0);
    assert.equal(S.choice(choice.e,pick,L).action,pick===0?'approach':'wave');
  }
});
test('home career effects correspond to the actual hometown ending flags',()=>{
  const L=life();L.age=30;const g=a.say(L,'work','heart',{f:'end_bakery'},true),e=g.next().value.e;
  assert.equal(S.snapshot(L).job,'bakery');assert.ok(e.visuals.some(v=>v.kind==='career'&&v.id==='bakery'));
  const g2=a.say(L,'trade','coin',{f:'end_merchant'},true);assert.equal(g2.next().value.e.visuals.find(v=>v.kind==='career').id,'merchant');
});
test('transformation reactions follow the accepted result and never transform a declined life',()=>{
  for(const pick of [0,1]){
    const L=life();L.age=19;const g=a.doEvent(L,a.EVI.xwerewolf);g.next();const e=g.next(pick).value.e;
    assert.equal(L.form==='werewolf',pick===0);
    assert.equal(e.visuals.some(v=>v.kind==='transform'&&v.id==='werewolf'),pick===0);
  }
});
test('spell rewards show the chosen card and the combination it really unlocked',()=>{
  const L=life();L.element=a.ELEMENTS.find(e=>e.id==='fire');L.stage=0;L.W={hp:900,max:900,lv:4,exp:0,pow:1.2};
  const g=a.levelPerk(L,{levels:1,min:'r'}),e=g.next().value.e,k=e.buildCards.findIndex(Boolean);assert.ok(k>=0);
  const r=g.next(k).value.e.visuals.find(v=>v.kind==='spell');
  assert.ok(L.cards.includes(r.id));assert.equal(r.recipe.id,e.buildCards[k].id);assert.equal(a.RESONANCE.active(L).id,r.recipe.id);
});
test('each new boss relic has an explicit acquisition scene only when actually awarded',()=>{
  for(const rid of Object.keys(a.EXPANSION.regions)){
    const L=life();L.W={hp:700,max:900,lv:8,exp:0,pow:1.6};
    const g=a.awardStageRelic(L,rid),e=g.next().value.e,id=a.EXPANSION.regions[rid].relic;
    assert.ok(e.visuals.some(v=>v.kind==='relic'&&v.id===id));assert.ok(L.cards.includes(id));assert.equal(L.mods[id],1);
    assert.equal(a.awardStageRelic(L,rid).next().done,true);
  }
});
test('route and coming-of-age visuals retain the actual choice order',()=>{
  const L=life(),e={regionChoices:['desert','swamp'],opts:['desert','swamp']};
  assert.equal(S.choice(e,1,L).destination,'swamp');assert.equal(S.choice({sceneKind:'adult-fork'},0,L).destination,'adventure');assert.equal(S.choice({sceneKind:'adult-fork'},1,L).destination,'home');
});
test('scene labels are localized and the renderer is shipped exactly as reviewed',()=>{
  for(const lang of ['en','ja'])assert.ok(Object.values(game(lang).STORY.labels).every(v=>!/[가-힣]/.test(v)));
  assert.ok(html.includes(readFileSync(new URL('story-visuals.js',root),'utf8')));
});
