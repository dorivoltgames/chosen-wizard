/* Optional Cloudflare funnel extension. The original /e and /s are left intact.
   Until /funnel/health advertises support, events remain on this browser only. */
function createFateTelemetry({baseURL,storage,fetcher,clock=()=>Date.now(),id=()=>crypto.randomUUID()}) {
  const KEY='chosen-wizard-funnel-v2', LIMIT=160;
  let supported=false,probing=false,sending=false,probed=false;
  const read=()=>{try{const d=JSON.parse(storage.getItem(KEY)||'{}');return d&&typeof d==='object'?d:{}}catch{return {}}};
  const write=d=>{try{storage.setItem(KEY,JSON.stringify(d))}catch{}};
  async function flush() {
    if(!baseURL||!supported||sending)return;
    const batch=(read().queue||[]).slice(0,25);if(!batch.length)return;
    sending=true;
    try {
      const response=await fetcher(baseURL+'/funnel/events',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({version:2,events:batch}),keepalive:true,signal:AbortSignal.timeout(5000)});
      if(response.ok){const data=read(),sent=new Set(batch.map(e=>e.id));data.queue=(data.queue||[]).filter(e=>!sent.has(e.id));write(data)}
    } catch {} finally {sending=false}
    // Drain later batches only after a successful request, never loop on failure.
    if((read().queue||[]).length&&batch.every(e=>!(read().queue||[]).some(q=>q.id===e.id)))await flush();
  }
  async function probe() {
    if(!baseURL||probing||probed)return;
    probing=true;probed=true;
    try {const r=await fetcher(baseURL+'/funnel/health',{signal:AbortSignal.timeout(4000)});if(r.ok){const d=await r.json();supported=d?.version===2&&d?.enabled===true}}catch{}finally{probing=false}
    if(supported)await flush();
  }
  function track(event,L) {
    const data=read(),day=new Date(clock()+9*3600e3).toISOString().slice(0,10);
    data.days=data.days&&typeof data.days==='object'?data.days:{};
    data.days[day]=data.days[day]||{};data.days[day][event]=(Number(data.days[day][event])||0)+1;
    data.days=Object.fromEntries(Object.entries(data.days).sort().slice(-30));
    const payload={id:id(),day,event,path:L?.fate?.path||'none',mode:['daily','challenge'].includes(L?.mode)?L.mode:'random',at:clock()};
    data.queue=[...(Array.isArray(data.queue)?data.queue:[]),payload].slice(-LIMIT);write(data);
    if(supported)void flush();else void probe();
  }
  return {track,probe,flush,snapshot:read};
}
