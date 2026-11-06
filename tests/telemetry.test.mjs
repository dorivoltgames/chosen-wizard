import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {DatabaseSync} from 'node:sqlite';
import {handleFunnel} from '../stats-extension/funnel.mjs';
const origin='https://dorivoltgames.github.io';
const event=()=>({id:crypto.randomUUID(),day:new Date(Date.now()+9*3600e3).toISOString().slice(0,10),event:'life_completed',path:'home',mode:'daily',at:Date.now()});
const req=(path='/funnel/events',events=[event()],extra={})=>new Request('https://stats.example'+path,{method:'POST',headers:{Origin:origin,'Content-Type':'text/plain'},body:JSON.stringify({version:2,events}),...extra});
function database(){
  const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../stats-extension/schema.sql',import.meta.url),'utf8'));
  return {db,env:{FUNNEL_DB:{prepare:sql=>({bind:(...args)=>({sql,args})}),batch:async rows=>{db.exec('BEGIN');try{for(const {sql,args}of rows)db.prepare(sql).run(...args);db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}}}}};
}
test('middleware never handles legacy /e or /s endpoints',async()=>{
  assert.equal(await handleFunnel(req('/e'),{}),null);assert.equal(await handleFunnel(req('/s'),{}),null);
});
test('health only enables uploads when the dedicated storage binding exists',async()=>{
  const request=new Request('https://stats.example/funnel/health');
  assert.equal((await (await handleFunnel(request,{})).json()).enabled,false);
  assert.equal((await (await handleFunnel(request,{FUNNEL_DB:{}})).json()).enabled,true);
});
test('real SQLite schema accepts events idempotently and exposes daily totals',async()=>{
  const {db,env}=database(),e=event();
  assert.equal((await handleFunnel(req(undefined,[e,e]),env)).status,200);
  assert.equal((await handleFunnel(req(undefined,[e]),env)).status,200);
  assert.equal(db.prepare('SELECT total FROM funnel_daily').get().total,1);
  db.close();
});
test('unknown origins, unknown events and oversized batches do not write data',async()=>{
  const {db,env}=database();
  assert.equal((await handleFunnel(req(undefined,[event()],{headers:{Origin:'https://unrelated.example'}}),env)).status,403);
  assert.equal((await handleFunnel(req(undefined,[{...event(),event:'unrecognized'}]),env)).status,400);
  assert.equal((await handleFunnel(req(undefined,Array.from({length:26},event)),env)).status,400);
  assert.equal((await handleFunnel(req(undefined,[{...event(),day:'2000-01-01'}]),env)).status,400);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM funnel_events').get().n,0);db.close();
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
