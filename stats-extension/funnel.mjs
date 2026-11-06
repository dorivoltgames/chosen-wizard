/* Additive extension for the existing Stats Durable Object.
   All new storage keys start with "funnel:". The legacy "c" record is never touched. */
export const EXTRA_ENDINGS=['oathkeeper','unchosen','sealed','truth','nameless','village_union','dream_school','bread_peace'];
export const EVENTS=new Set(['visit','challenge_opened','birth','life_started','coming_of_age',
  'exam_started','exam_completed','school_hero','school_forbidden','school_home',
  'adult_hero','adult_forbidden','adult_home','life_completed','share_started','share_completed']);
const PATHS=new Set(['none','hero','forbidden','home']);
const MODES=new Set(['random','daily','challenge']);
const DAY=86400000, RETAIN_DAYS=31;
const dayOf=at=>new Date(at+9*3600e3).toISOString().slice(0,10);
// Cleanup may have scheduled a later alarm. Legacy counters must still flush within 5s.
export async function scheduleLegacyFlush(storage,now=Date.now()) {
  const alarm=await storage.getAlarm();
  if(!alarm||alarm>now+5000)await storage.setAlarm(now+5000);
}
// Matches the production Worker's GitHub Pages, localhost and itch.io policy.
export const okFunnelOrigin=o=>o==='https://dorivoltgames.github.io'||/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o||'')||/^https:\/\/([a-z0-9-]+\.)*itch\.zone$/.test(o||'')||/^https:\/\/[a-z0-9-]+\.ssl\.hwcdn\.net$/.test(o||'');
export function validEvents(body,now=Date.now()) {
  if(body?.version!==2||!Array.isArray(body.events)||!body.events.length||body.events.length>25)return null;
  for(const e of body.events) {
    if(!e||typeof e.id!=='string'||!/^[a-z0-9-]{8,80}$/i.test(e.id)||!EVENTS.has(e.event)||!PATHS.has(e.path)||!MODES.has(e.mode)||!Number.isSafeInteger(e.at)||e.at>now+DAY||e.at<now-RETAIN_DAYS*DAY||e.day!==dayOf(e.at))return null;
  }
  // Copy only the allowed fields; arbitrary client properties never reach storage.
  return body.events.map(e=>({id:e.id,day:e.day,event:e.event,path:e.path,mode:e.mode,at:e.at}));
}
export class FunnelStore {
  constructor(storage,clock=()=>Date.now()){this.storage=storage;this.clock=clock}
  async write(body) {
    const events=validEvents(body,this.clock());if(!events)return {err:400};
    return this.storage.transaction(async tx=>{
      const keys=[...new Set(events.flatMap(e=>['funnel:event:'+e.day+':'+e.id,'funnel:day:'+e.day]))];
      const existing=await tx.get(keys), updates={},seen=new Set();let accepted=0;
      for(const e of events) {
        const eventKey='funnel:event:'+e.day+':'+e.id, dayKey='funnel:day:'+e.day;
        if(existing.has(eventKey)||seen.has(eventKey))continue;
        seen.add(eventKey);accepted++;
        const day=updates[dayKey]||(updates[dayKey]=structuredClone(existing.get(dayKey)||{day:e.day,total:0,counts:{}}));
        const key=[e.event,e.path,e.mode].join('|');day.total++;day.counts[key]=(day.counts[key]||0)+1;
        updates[eventKey]=e.at;
      }
      if(accepted)await tx.put(updates);
      // Schedule cleanup without replacing an existing earlier legacy flush alarm.
      if(!await tx.getAlarm())await tx.setAlarm(this.clock()+5000);
      return {accepted};
    });
  }
  async read(days=7) {
    days=Number.isFinite(Number(days))?Math.max(1,Math.min(RETAIN_DAYS,Math.floor(Number(days)))):7;
    const start='funnel:day:'+dayOf(this.clock()-(days-1)*DAY);
    const rows=await this.storage.list({prefix:'funnel:day:',start,limit:RETAIN_DAYS+1});
    return {version:2,days:[...rows.values()],retentionDays:RETAIN_DAYS};
  }
  async prune() {
    const cutoff=dayOf(this.clock()-RETAIN_DAYS*DAY);let more=false;
    for(const prefix of ['funnel:event:','funnel:day:']) {
      const old=await this.storage.list({prefix,end:prefix+cutoff,limit:256});
      if(old.size)await this.storage.delete([...old.keys()]);
      if(old.size===256)more=true;
    }
    if(more&&!await this.storage.getAlarm())await this.storage.setAlarm(this.clock()+60000);
    return more;
  }
}
export async function handleFunnel(request,env) {
  const url=new URL(request.url);if(!url.pathname.startsWith('/funnel/'))return null;
  const origin=request.headers.get('Origin'),allowed=origin&&okFunnelOrigin(origin);
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
  if(allowed)headers['Access-Control-Allow-Origin']=origin;
  const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
  if(origin&&!allowed)return json({error:'Origin not allowed'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
  if(url.pathname==='/funnel/health'&&request.method==='GET')return json({version:2,enabled:!!env.STATS});
  if(!env.STATS)return json({error:'Stats binding unavailable'},503);
  if(url.pathname==='/funnel/stats'&&request.method==='GET') {
    const stub=env.STATS.get(env.STATS.idFromName('main'));
    const r=await stub.funnelRead(request.headers.get('CF-Connecting-IP')||'?',url.searchParams.get('days')||7);
    return r.err?json({error:'Read unavailable'},r.err):json(r.data);
  }
  if(url.pathname!=='/funnel/events')return json({error:'Not found'},404);
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  if(!allowed)return json({error:'Origin required'},403);
  if(Number(request.headers.get('Content-Length'))>16384)return json({error:'Payload too large'},413);
  let body;
  try {const raw=await request.text();if(new TextEncoder().encode(raw).length>16384)return json({error:'Payload too large'},413);body=JSON.parse(raw)}
  catch{return json({error:'Invalid JSON'},400)}
  if(!validEvents(body))return json({error:'Invalid batch'},400);
  try {
    const stub=env.STATS.get(env.STATS.idFromName('main'));
    const r=await stub.funnelWrite(request.headers.get('CF-Connecting-IP')||'?',body);
    return r.err?json({error:'Write unavailable'},r.err):json(r);
  }catch{return json({error:'Storage unavailable'},503)}
}
