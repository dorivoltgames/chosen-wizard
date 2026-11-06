import {readFileSync} from 'node:fs';
import vm from 'node:vm';
export const root=new URL('../../',import.meta.url);
export const html=readFileSync(new URL('index.html',root),'utf8');
export function game(lang='ko') {
  const sandbox=vm.createContext({console});
  const core=html.slice(html.indexOf('// Crossroads content is pure story logic;'),html.indexOf('// ---------- rendering (pixel art:'));
  const modules=['resonance.js','fate-update.js','fate-ui.js'].map(f=>readFileSync(new URL(f,root),'utf8')).join('\n');
  vm.runInContext(`const LANG=${JSON.stringify(lang)};const TT_=(id,ko)=>ko;const FUNNEL={track(){}};`+modules+'\n'+core+
    '\nglobalThis.api={newLife,lifeScript,FATE,FATE_UI,ENDINGS,RESONANCE,CARDS,drawCards,createBattle,battleFor,afterBattle,ELEMENTS};',sandbox);
  return sandbox.api;
}
