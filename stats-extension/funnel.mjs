/* Additive middleware for the existing chosen-wizard-stats Cloudflare Worker.
   Return null for every legacy route so its counters and storage stay untouched. */
export const EVENTS=new Set(['visit','challenge_opened','birth','life_started','coming_of_age',
  'exam_started','exam_completed','school_hero','school_forbidden','school_home',
  'adult_hero','adult_forbidden','adult_home','life_completed','share_started','share_completed']);
const PATHS=new Set(['none','hero','forbidden','home']);
const MODES=new Set(['random','daily','challenge']);
const ORIGINS=new Set(['https://dorivoltgames.github.io','https://dorivoltgames.itch.io']);
export async function handleFunnel(request,env) {
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/funnel/'))return null;
  const origin=request.headers.get('Origin');
  const allowed=origin&&ORIGINS.has(origin);
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
  if(allowed)headers['Access-Control-Allow-Origin']=origin;
  const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
  if(origin&&!allowed)return json({error:'Origin not allowed'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
  if(url.pathname==='/funnel/health'&&request.method==='GET')return json({version:2,enabled:!!env.FUNNEL_DB});
  if(url.pathname!=='/funnel/events')return json({error:'Not found'},404);
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  if(!allowed)return json({error:'Origin required'},403);
  if(!env.FUNNEL_DB)return json({error:'Funnel storage is not configured'},503);
  const size=Number(request.headers.get('Content-Length'));
  if(size>16384)return json({error:'Payload too large'},413);
  let body;
  try {const raw=await request.text();if(new TextEncoder().encode(raw).length>16384)return json({error:'Payload too large'},413);body=JSON.parse(raw)}
  catch{return json({error:'Invalid JSON'},400)}
  if(body?.version!==2||!Array.isArray(body.events)||!body.events.length||body.events.length>25)return json({error:'Invalid batch'},400);
  const now=Date.now(),events=[];
  for(const e of body.events) {
    if(!e||typeof e.id!=='string'||!/^[a-z0-9-]{8,80}$/i.test(e.id)||!EVENTS.has(e.event)||!PATHS.has(e.path)||!MODES.has(e.mode)||!Number.isSafeInteger(e.at)||e.at>now+86400000||e.at<now-31*86400000)return json({error:'Invalid event'},400);
    const day=new Date(e.at+9*3600e3).toISOString().slice(0,10);
    if(e.day!==day)return json({error:'Invalid day'},400);
    events.push({...e,day});
  }
  try {
    await env.FUNNEL_DB.batch(events.map(e=>env.FUNNEL_DB.prepare('INSERT OR IGNORE INTO funnel_events (event_id, day, event, path, mode, client_at) VALUES (?, ?, ?, ?, ?, ?)').bind(e.id,e.day,e.event,e.path,e.mode,e.at)));
    return json({accepted:events.length});
  } catch {return json({error:'Storage unavailable'},503)}
}
