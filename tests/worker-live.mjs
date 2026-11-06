// Integration checks against a LOCAL wrangler dev instance, never production.
import assert from 'node:assert/strict';
const base=new URL(process.argv[2]||'http://127.0.0.1:8787');
if(!['localhost','127.0.0.1','[::1]'].includes(base.hostname))throw new Error('This test only accepts a local Worker URL.');
const origin='https://dorivoltgames.github.io';
const get=async path=>{const r=await fetch(new URL(path,base));assert.equal(r.status,200);return r.json()};
const post=async(path,body,requestOrigin=origin)=>fetch(new URL(path,base),{method:'POST',headers:{Origin:requestOrigin,'Content-Type':'text/plain'},body:JSON.stringify(body)});
const before=await get('/s');
assert.deepEqual(Object.keys(before).sort(),['born','dx','en','lives','players','t','visits']);
assert.equal((await post('/e',{visit:1,player:1,born:1,lives:1,dx:['end:hero','end:truth'],en:['hero','truth']})).status,204);
const legacy=await get('/s');
for(const key of ['players','visits','born','lives'])assert.equal(legacy[key],before[key]+1);
for(const id of ['hero','truth']){assert.equal(legacy.dx['end:'+id],(before.dx['end:'+id]||0)+1);assert.equal(legacy.en[id],(before.en[id]||0)+1)}
console.log('PASS: existing counters and new ending allowlist');
assert.deepEqual(await get('/funnel/health'),{version:2,enabled:true});
const now=Date.now(),day=new Date(now+9*3600e3).toISOString().slice(0,10);
const report0=await get('/funnel/stats?days=7');
const count=report=>report.days.find(d=>d.day===day)?.total||0;
const events=['life_started','school_home','adult_home','life_completed'].map(event=>({id:crypto.randomUUID(),event,path:'home',mode:'challenge',at:now,day}));
let r=await post('/funnel/events',{version:2,events:[...events,events[0]]});
assert.equal(r.status,200,await r.clone().text());assert.equal((await r.json()).accepted,4);
r=await post('/funnel/events',{version:2,events});assert.equal((await r.json()).accepted,0);
assert.equal(count(await get('/funnel/stats?days=7')),count(report0)+4);
const after=await get('/s');delete after.t;delete legacy.t;assert.deepEqual(after,legacy);
console.log('PASS: actual Durable Object transaction, RPC, aggregation and retry deduplication');
assert.equal((await post('/funnel/events',{version:2,events},'https://unrelated.example')).status,403);
r=await fetch(new URL('/funnel/health',base),{headers:{Origin:'https://v6p9d9t4.itch.zone'}});
assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://v6p9d9t4.itch.zone');
assert.equal((await post('/funnel/events',{version:2,events:[{...events[0],event:'unrecognized'}]})).status,400);
console.log('PASS: production-origin compatibility and invalid request rejection');
// Let the original delayed counter flush and the extension cleanup alarm execute.
await new Promise(resolve=>setTimeout(resolve,5500));
const summary=await get('/funnel/stats?days=7');assert.equal(count(summary),count(report0)+4);
console.log('PASS: original flush alarm coexists with the new storage cleanup');
console.log(JSON.stringify({legacy:true,newEndings:true,funnel:true,duplicateRetries:true,alarm:true,productionModified:false}));
