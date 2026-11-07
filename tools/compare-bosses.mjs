import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {game} from '../tests/helpers/game.mjs';
const a=game();
const targets=['crystal','clockwork','astral','castle'];
const clone=x=>JSON.parse(JSON.stringify(x));
const median=xs=>{const v=xs.filter(Number.isFinite).sort((a,b)=>a-b);return v.length?v[Math.floor(v.length/2)]:null};
const round=x=>x===null?null:Math.round(x*10)/10;
function drive(B,mode='steady'){
  let damage=0,last=B.wiz.hp;
  for(let tick=0;tick<15000&&!B.result;tick++){
    if(B.clash)B.tap();
    else if(mode==='mash'){if(tick%23===0)B.tap()}
    else if(B.notes.some(n=>!n.done&&n.lane===B.wiz.lane&&n.t<(mode==='late'?.19:.42)))B.tap();
    B.update(.02);damage+=Math.max(0,last-B.wiz.hp);last=B.wiz.hp;
  }
  if(!B.result||!Number.isFinite(B.wiz.hp))throw Error('Unfinished or invalid boss fight');
  return {win:B.result==='win',seconds:B.t,damage:damage/B.wiz.max,notes:B.noteN,hits:Object.values(B.hitsBy||{}).reduce((n,v)=>n+v,0),patterns:B.patternCounts||{},potions:B.potionUsed};
}
function snapshot(L){return clone(Object.fromEntries(['seed','cls','form','st','W','element','traits','allies','mods','sm','route','flags','cards','resonance'].map(k=>[k,L[k]])))}
function choice(L,e){
  if(!e.cards)return 0;
  const score=v=>{const c=a.CARDS.find(c=>c.name===v.name);return ({lifewell:150,phoenix:120,archhat:110,timeheart:100,vampire:85,frostarmor:80,manashield:75,regen:60,flask:50}[c?.id]||30)+(a.RESONANCE.project(L,c)?35:0)+(c?.id==='mend'&&L.W.hp/L.W.max<.5?100:0)};
  return e.cards.map(score).reduce((best,n,i,ar)=>n>ar[best]?i:best,0);
}
function capture(){
  const cases=[];
  for(const score of [110,150])for(let seed=1;seed<=10;seed++){
    const L=a.newLife(seed),g=a.lifeScript(L);let input;
    for(let i=0;i<1100;i++){
      const z=g.next(input);input=undefined;if(z.done||z.value.t==='end')break;const s=z.value;
      if(s.t==='mini')input=s.kind==='quiz'?{c:score===110?18:25,int:score}:s.kind==='speed'?{avg:250,perfect:3,spd:score===110?60:80}:{taps:40,hp:score===110?400:550};
      if(s.t==='choice')input=choice(L,s.e);
      if(s.t==='battle'){
        if(s.boss&&targets.includes(s.region))cases.push({group:'campaign',region:s.region,stage:s.stage,seed:score*100+seed,life:snapshot(L)});
        const B=a.battleFor(L,s,seed*1000+i);drive(B);input=a.afterBattle(L,B);
      }
    }
  }
  // Isolate the penultimate/final encounter difference with exactly the same
  // late-game character, cards and full starting health on both sides.
  for(const c of cases.filter(c=>c.region==='astral'))for(const region of ['astral','castle'])cases.push({...clone(c),group:'shared-late-build',region,stage:a.TIERS.findIndex(t=>t.includes(region))});
  return cases;
}
const [destination,fixture]=process.argv.slice(2);
const cases=fixture?(JSON.parse(await readFile(resolve(fixture),'utf8')).cases):capture();
const rows=[];
for(const c of cases)for(const mode of ['steady','late','mash']){
  const L=clone(c.life);L.W.hp=L.W.max;
  const result=drive(a.battleFor(L,{stage:c.stage,region:c.region,boss:true},c.seed*101+c.stage),mode);
  rows.push({group:c.group,region:c.region,mode,...result});
}
const groups={};
for(const r of rows){const key=[r.group,r.region,r.mode].join('/');(groups[key]||(groups[key]=[])).push(r)}
const summary=Object.entries(groups).map(([key,rows])=>({key,n:rows.length,winPercent:round(100*rows.filter(r=>r.win).length/rows.length),clearSeconds:round(median(rows.filter(r=>r.win).map(r=>r.seconds))),hpDamagePercent:round(median(rows.map(r=>r.damage*100))),notesPerMinute:round(median(rows.map(r=>r.notes/r.seconds*60)))}));
if(destination){await mkdir(dirname(resolve(destination)),{recursive:true});await writeFile(resolve(destination),JSON.stringify({cases,summary},null,2)+'\n')}
console.log(JSON.stringify(summary,null,2));
