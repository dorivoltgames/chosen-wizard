import {readFileSync} from 'node:fs';
import vm from 'node:vm';
export const root=new URL('../../',import.meta.url);
export const html=readFileSync(new URL('index.html',root),'utf8');
export function game(lang='ko') {
  const sandbox=vm.createContext({console});
  const core=html.slice(html.indexOf('// Crossroads content is pure story logic;'),html.indexOf('// ---------- rendering (pixel art:'));
  const modules=['story-scenes.js','stage-expansion.js','resonance.js','fate-update.js','fate-ui.js'].map(f=>readFileSync(new URL(f,root),'utf8')).join('\n');
  vm.runInContext(`const LANG=${JSON.stringify(lang)};const TT_=(id,ko)=>ko;const FUNNEL={track(){}};`+modules+'\n'+core+
    '\nglobalThis.api={newLife,lifeScript,STORY,say,doEvent,EVI,FATE,FATE_UI,ENDINGS,RESONANCE,EXPANSION,REGIONS,TIERS,LAST_STAGE,HPMUL,ATKMUL,MOB_HP,BOSS_HP,DPS_REF,HIT_CAP,BOSS_ATK,CLASH_PULL,SPECIAL_HIT,BPM_N,TRAVEL_N,TAP_MIN,HOP_K,UNFAIR_N,REST_N,HAZ_DMG,MONOX,BOSSX,CARDS,drawCards,levelPerk,createBattle,battleFor,afterBattle,ELEMENTS,awardStageRelic,EV,FOODS,WANTED};',sandbox);
  return sandbox.api;
}
