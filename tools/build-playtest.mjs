import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const target=resolve(process.argv[2]||'playtest.html');
let html=await readFile(resolve(root,'index.html'),'utf8');
for(const name of ['story-scenes.js','stage-expansion.js','resonance.js','fate-update.js','fate-ui.js','fate-telemetry.js']){
  const tag=`<script src="${name}"></script>`;if(!html.includes(tag))throw Error('Missing script: '+name);
  const code=await readFile(resolve(root,name),'utf8');
  html=html.replace(tag,()=>'<script>\n'+code+'\n</script>');
}
for(const name of ['fate-update.css','resonance.css','story-scenes.css']){
  const css=await readFile(resolve(root,name),'utf8');html=html.replace(`<link rel="stylesheet" href="${name}">`,()=>'<style>\n'+css+'\n</style>');
}
html=html.replace("const PLAYTEST=new URLSearchParams(location.search).has('playtest');",'const PLAYTEST=true;');
for(const name of ['favicon.png','apple-touch-icon.png'])html=html.replace('href="'+name+'"','href="data:image/png;base64,'+(await readFile(resolve(root,name))).toString('base64')+'"');
await mkdir(dirname(target),{recursive:true});await writeFile(target,html);console.log('Built offline playtest: '+target);
