// Apply the reviewed additive changes to the separately downloaded production source.
// The private original Worker and account credentials are never committed to this repository.
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
const [originalDir,outputDir]=process.argv.slice(2);
if(!originalDir||!outputDir)throw new Error('Usage: node stats-extension/prepare-worker.mjs <original-src-directory> <new-output-directory>');
const original=await readFile(join(resolve(originalDir),'index.js'),'utf8');
const expected='473561ed2d50e65a6d83f596d641fc32ddd6dbb92c93102ae69a8450e06e3d7c';
if(createHash('sha256').update(original).digest('hex')!==expected)throw new Error('The original Worker differs from the reviewed production source. Review it before preparing an update.');
const out=resolve(outputDir);
await mkdir(out,{recursive:true});
if((await readdir(out)).length)throw new Error('Output directory must be empty.');
let updated=original;
function replace(old,value){if(updated.split(old).length!==2)throw new Error('Cannot safely locate a unique source section: '+old.slice(0,60));updated=updated.replace(old,value)}
replace('import IDS from "./ids.json";', 'import IDS from "./ids.json";\nimport {FunnelStore,handleFunnel,EXTRA_ENDINGS,scheduleLegacyFlush} from "./funnel.mjs";');
replace('const DX = new Set(IDS.dx), EN = new Set(IDS.en);','const DX = new Set([...IDS.dx,...EXTRA_ENDINGS.map(id=>"end:"+id)]), EN = new Set([...IDS.en,...EXTRA_ENDINGS]);');
replace('  async fetch(req, env) {','  async fetch(req, env) {\n    const extended = await handleFunnel(req, env);\n    if (extended) return extended;');
replace('    super(ctx, env);','    super(ctx, env);\n    this.funnel = new FunnelStore(ctx.storage);');
replace('    if (!(await this.ctx.storage.getAlarm())) await this.ctx.storage.setAlarm(Date.now() + 5000);','    await scheduleLegacyFlush(this.ctx.storage);');
replace('  async alarm() {',`  async funnelWrite(ip, body) {
    if (this.limited(ip, "fp", 120)) return { err: 429 };
    return this.funnel.write(body);
  }
  async funnelRead(ip, days) {
    if (this.limited(ip, "fg", 60)) return { err: 429 };
    return { data: await this.funnel.read(days) };
  }
  async alarm() {`);
replace('    if (this.dirty) { this.dirty = false; await this.ctx.storage.put("c", this.c); }','    if (this.dirty) { this.dirty = false; await this.ctx.storage.put("c", this.c); }\n    await this.funnel.prune();');
await mkdir(join(out,'src'));
await writeFile(join(out,'src/index.js'),updated);
await writeFile(join(out,'src/ids.json'),await readFile(join(resolve(originalDir),'ids.json')));
await writeFile(join(out,'src/funnel.mjs'),await readFile(new URL('./funnel.mjs',import.meta.url)));
const config={name:'chosen-wizard-stats',main:'src/index.js',compatibility_date:'2026-10-01',exports:{Stats:{type:'durable-object',storage:'sqlite'}},durable_objects:{bindings:[{name:'STATS',class_name:'Stats'}]}};
await writeFile(join(out,'wrangler.json'),JSON.stringify(config,null,2)+'\n');
const {exports:productionExports,...localConfig}=config;
await writeFile(join(out,'wrangler.local.json'),JSON.stringify({...localConfig,name:'chosen-wizard-stats-local-test',migrations:[{tag:'local-v1',new_sqlite_classes:['Stats']}]},null,2)+'\n');
await writeFile(join(out,'SOURCE.json'),JSON.stringify({worker:'chosen-wizard-stats',reviewedOriginalSHA256:expected,preparedSHA256:createHash('sha256').update(updated).digest('hex'),binding:'STATS',className:'Stats',objectName:'main',productionDeployed:false},null,2)+'\n');
console.log('Prepared Worker update in '+out+'. No Cloudflare writes or deployment were performed.');
