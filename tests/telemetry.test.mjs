import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {handleFunnel,FunnelStore,validEvents,EXTRA_ENDINGS,okFunnelOrigin,scheduleLegacyFlush} from '../stats-extension/funnel.mjs';
const origin='https://dorivoltgames.github.io';
const event=()=>({id:crypto.randomUUID(),day:new Date(Date.now()+9*3600e3).toISOString().slice(0,10),event:'life_completed',path:'home',mode:'daily',at:Date.now()});
const req=(path='/funnel/events',events=[event()],extra={})=>new Request('https://stats.example'+path,{method:'POST',headers:{Origin:origin,'Content-Type':'text/plain'},body:JSON.stringify({version:2,events}),...extra});
function storage() {
  const data=new Map();let alarm=null,tail=Promise.resolve();
  const store={
    async get(key){return Array.isArray(key)?new Map(key.filter(k=>data.has(k)).map(k=>[k,structuredClone(data.get(k))])):structuredClone(data.get(key))},
    async put(key,value){for(const [k,v]of typeof key==='string'?[[key,value]]:Object.entries(key))data.set(k,structuredClone(v))},
    async delete(keys){for(const k of Array.isArray(keys)?keys:[keys])data.delete(k)},
    async list({prefix='',start='',end='\uffff',limit=1000}={}){return new Map([...data].sort(([a],[b])=>a.localeCompare(b)).filter(([k])=>k.startsWith(prefix)&&k>=start&&k<end).slice(0,limit).map(([k,v])=>[k,structuredClone(v)]))},
    async getAlarm(){return alarm},async setAlarm(at){alarm=at},
    transaction(fn){const task=tail.then(()=>fn(store));tail=task.catch(()=>{});return task},data,
  };
  return store;
}
function environment() {
  const db=storage(),funnel=new FunnelStore(db);
  const stats={funnelWrite:(ip,b)=>funnel.write(b),funnelRead:async(ip,days)=>({data:await funnel.read(days)})};
  return {db,funnel,env:{STATS:{idFromName:name=>{assert.equal(name,'main');return name},get:()=>stats}}};
}
test('middleware never handles legacy /e or /s endpoints',async()=>{
  assert.equal(await handleFunnel(req('/e'),{}),null);assert.equal(await handleFunnel(req('/s'),{}),null);
});
test('health only enables uploads when the existing Stats binding exists',async()=>{
  const request=new Request('https://stats.example/funnel/health');
  assert.equal((await (await handleFunnel(request,{})).json()).enabled,false);
  assert.equal((await (await handleFunnel(request,{STATS:{}})).json()).enabled,true);
});
test('events aggregate idempotently without modifying the legacy counters',async()=>{
  const {db,env}=environment(),e=event(),original={players:1041,born:24309,lives:2053,dx:{'end:hero':72},en:{hero:97}};
  await db.put('c',original);await db.setAlarm(123);
  assert.equal((await handleFunnel(req(undefined,[e,e]),env)).status,200);
  assert.equal((await handleFunnel(req(undefined,[e]),env)).status,200);
  const response=await handleFunnel(new Request('https://stats.example/funnel/stats?days=7'),env),report=await response.json();
  assert.equal(report.days[0].total,1);assert.equal(report.days[0].counts['life_completed|home|daily'],1);
  assert.deepEqual(await db.get('c'),original);assert.equal(await db.getAlarm(),123);
});
test('concurrent batches and an object restart retain deduplication',async()=>{
  const db=storage(),a=new FunnelStore(db),b=new FunnelStore(db),e=event();
  await Promise.all([a.write({version:2,events:[e]}),b.write({version:2,events:[e,event()]})]);
  const restart=new FunnelStore(db);await restart.write({version:2,events:[e]});
  assert.equal((await restart.read()).days[0].total,2);
});
test('cleanup only deletes old funnel data and preserves counters and existing alarms',async()=>{
  const db=storage(),funnel=new FunnelStore(db),oldDay='2020-01-01';await db.put('c',{lives:999});await db.put('funnel:day:'+oldDay,{total:5});
  await db.put('funnel:event:'+oldDay+':old',1);await db.put('unrelated',123);await db.setAlarm(321);
  await funnel.prune();assert.equal(await db.get('funnel:day:'+oldDay),undefined);assert.equal(await db.get('funnel:event:'+oldDay+':old'),undefined);
  assert.equal((await db.get('c')).lives,999);assert.equal(await db.get('unrelated'),123);assert.equal(await db.getAlarm(),321);
});
test('a cleanup alarm cannot delay the legacy five-second counter flush',async()=>{
  const db=storage(),now=Date.now();await db.setAlarm(now+60000);
  await scheduleLegacyFlush(db,now);assert.equal(await db.getAlarm(),now+5000);
  await db.setAlarm(now+1000);await scheduleLegacyFlush(db,now);assert.equal(await db.getAlarm(),now+1000);
});
test('unknown origins, unknown events and oversized batches do not write data',async()=>{
  const {db,env}=environment();
  assert.equal((await handleFunnel(req(undefined,[event()],{headers:{Origin:'https://unrelated.example'}}),env)).status,403);
  assert.equal((await handleFunnel(req(undefined,[{...event(),event:'unrecognized'}]),env)).status,400);
  assert.equal((await handleFunnel(req(undefined,Array.from({length:26},event)),env)).status,400);
  assert.equal((await handleFunnel(req(undefined,[{...event(),day:'2000-01-01'}]),env)).status,400);
  assert.equal(db.data.size,0);
});
test('the production itch.io and local-test origins remain supported',()=>{
  for(const o of [origin,'http://localhost:8765','https://v6p9d9t4.itch.zone','https://v6p9d9t4.ssl.hwcdn.net'])assert.ok(okFunnelOrigin(o),o);
  for(const o of ['https://dorivoltgames.github.io.evil.example','https://itch.zone.evil.example',null])assert.ok(!okFunnelOrigin(o));
});
test('all eight archived ending IDs remain accepted for older clients',()=>{
  const sandbox=vm.createContext({});vm.runInContext(readFileSync(new URL('../fate-update.js',import.meta.url),'utf8'),sandbox);
  const fate=sandbox.createFateUpdate({lang:'ko',context:()=>({})});
  assert.deepEqual([...fate.endings.map(e=>e.id)],[...EXTRA_ENDINGS.slice(0,8)]);
  const e=event();assert.equal(validEvents({version:2,events:[{...e,name:'must not be stored'}]})[0].name,undefined);
});
function telemetry(fetcher,baseURL='https://stats.example'){
  const v=vm.createContext({crypto,AbortSignal,Date,console});vm.runInContext(readFileSync(new URL('../fate-telemetry.js',import.meta.url),'utf8'),v);
  const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
  return v.createFateTelemetry({baseURL,storage,fetcher});
}
test('legacy server gets one capability probe and zero new event uploads',async()=>{
  const calls=[],T=telemetry(async(url)=>{calls.push(url);return new Response('Not found',{status:404})});
  for(let n=0;n<200;n++)T.track('life_started');
  await T.probe();await T.flush();
  assert.deepEqual(calls,['https://stats.example/funnel/health']);
  assert.equal(T.snapshot().queue.length,160);
  assert.equal(Object.values(T.snapshot().days)[0].life_started,200);
});
test('queued events survive a failed upload and retry without changing event IDs',async()=>{
  const batches=[];let fail=true;
  const T=telemetry(async(url,options)=>{
    if(url.endsWith('/health'))return Response.json({version:2,enabled:true});
    batches.push(JSON.parse(options.body));return new Response('',{status:fail?503:200});
  });
  await T.probe();T.track('life_started');
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(T.snapshot().queue.length,1);fail=false;await T.flush();
  assert.equal(T.snapshot().queue.length,0);assert.equal(batches[0].events[0].id,batches[1].events[0].id);
});
test('local preview performs no network calls',async()=>{
  let calls=0;const T=telemetry(async()=>{calls++},'');T.track('visit');await T.probe();await T.flush();assert.equal(calls,0);
});
