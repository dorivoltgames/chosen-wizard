// Pixel events share the original scene, palette, sprites and animation loop.
function makeStoryView(L,theme){return {t:0,basePhase:null,plan:EXPANSION.regions[theme]?{kind:'arrival',region:theme}:null,mode:EXPANSION.regions[theme]?'effect':null,heroX:0,job:STORY.snapshot(L).job,school:L.tier||null,schoolLabel:schoolName(L),schoolIcon:L.tier==='none'?'anvil':L.tier==='royal'?'crown':CLASS_SPRITE[L.cls]||'book',combo:RESONANCE.active(L),relics:STORY.relics.filter(id=>L.mods?.[id])}}
function setStoryPlan(B,p,mode='preview'){
  if(!B||B.C)return;
  B.story=B.story||makeStoryView(LIFE);B.story.t=0;B.story.plan=p;B.story.mode=mode;
  if(['xwerewolf','xvampire'].includes(p?.eventId))B.story.atmosphere='moon';
  else if(p?.kind!=='transform')B.story.atmosphere=null;
  if(B.story.basePhase===null)B.story.basePhase=B.phase;
  B.phase=mode==='action'?'walk':'idle';
}
function updateStoryScene(B,dt){
  if(!B.story||B.C)return;const s=B.story;s.t+=dt;
  const p=s.plan,k=Math.min(1,s.t/.75),moving=s.mode==='action';
  let destination=0;
  if(moving&&p?.kind==='route')destination=(130+p.pick*65)/SC-WX;
  else if(moving&&p?.kind==='fork')destination=(129+p.pick*65)/SC-WX;
  else if(moving&&p?.kind==='animal')destination=p.action==='approach'?75:0;
  else if(moving&&['encounter','trade','mystery','workshop','forge','archive'].includes(p?.kind))destination=p.action==='engage'||p.action==='open'?200:15;
  s.heroX+=(destination*k-s.heroX)*Math.min(1,dt*10);
  if(s.mode==='effect'&&s.t>1.9){s.plan=null;s.mode=null;B.phase=s.basePhase||'idle';s.basePhase=null}
}
function storyLog(L,e,B){
  if(!B||B.C||e.noScene)return;B.story=B.story||makeStoryView(L);
  B.story.job=STORY.snapshot(L).job;B.story.school=L.tier||null;B.story.schoolLabel=schoolName(L);B.story.combo=RESONANCE.active(L);B.story.relics=STORY.relics.filter(id=>L.mods?.[id]);
  const effects=e.visuals||[],p=effects.find(v=>['relic','transform','career','companion','spell','forge'].includes(v.kind))||effects[0];
  if(p)setStoryPlan(B,{...p,icon:e.icon,label:e.visualLabel},'effect');
  else if(e.scene?.kind)setStoryPlan(B,{...e.scene,icon:e.icon},'effect');
}
function storyChoicePreview(L,e,B){if(B&&!B.C)setStoryPlan(B,STORY.plan(e,L),'preview')}
async function storyChoiceAction(L,e,pick,B){
  if(!B||B.C)return;
  setStoryPlan(B,STORY.choice(e,pick,L),'action');
  await sleep(matchMedia('(prefers-reduced-motion: reduce)').matches?180:750);
  if(B.story){B.story.plan=null;B.story.mode=null;B.story.heroX=0;B.phase=B.story.basePhase||'idle';B.story.basePhase=null}
}
function storySprite(id,x,y,o={}){if(SP[id])blit(id,x,y,o)}
function storyEmote(icon,x,y,t){panel(x-7,y-7,14,14,'#ffffff');storySprite(icon,x,y);rect(x-2,y+7,3,2,'#ffffff')}
function storyBread(x,y){oval(x,y,6,3,'#d9a85c');oval(x-1,y-1,5,2,'#f7d896');for(let i=-2;i<3;i+=2)line(x+i,y-2,x+i-1,y+1,'#b57345',1)}
function storyShop(job,time){
  const x=151,f=122,teacher=job==='teacher',farm=job==='farmer',watch=['guard','hunter'].includes(job);
  if(farm){for(let i=0;i<9;i++){const xx=128+i%3*16,yy=105+Math.floor(i/3)*8;oval(xx,yy,6,2,'#9c7750');line(xx,yy,xx,yy-4,'#3fa65a',2);line(xx,yy-2,xx-3,yy-4,'#6ed46a',1)}storySprite('house2',194,88,{scale:2});return}
  if(watch){storySprite('house_big',174,94,{scale:2});for(let i=0;i<3;i++)storySprite(job==='hunter'?'tree':'fence',130+i*30,105);storySprite('knight',120,110);storyEmote('gem',119,84,time);return}
  rect(x-36,f-42,72,42,'#b57345');rect(x-33,f-39,66,37,'#fff4dc');
  for(let i=0;i<5;i++)rect(x-40+i*16,f-48+i%2,16,10,i%2?'#ff9ab8':'#ff6f9f');
  line(x-39,f-49,x,f-62,'#7f4d2f',3);line(x,f-62,x+39,f-49,'#7f4d2f',3);
  rect(x-25,f-28,25,21,'#7f4d2f');rect(x+10,f-25,16,25,'#8a6cff');rect(x+22,f-14,2,2,'#ffd34d');
  panel(x-14,f-56,28,14,'#ffffff');storySprite(teacher?'book':job==='bakery'?'heart':job==='court'?'crown':'coin',x,f-49);
  if(teacher){rect(x-27,f-28,30,15,'#3f7558');for(let i=0;i<3;i++){storySprite('kid',x-25+i*23,f-8);storySprite('book',x-25+i*23,f-1)}storySprite('star',x-12+Math.sin(time*2)*4,f-21)}
  else if(job==='bakery'){for(let i=0;i<3;i++)storyBread(x-21+i*13,f-12);rect(x-29,f-7,40,5,'#d9a85c');const bob=Math.sin(time*2);for(let i=0;i<3;i++)rect(x+19+i*3,f-35-i*4-bob*2,2,2,'rgba(255,255,255,.5)')}
  else {storySprite('chest',x-16,f-10);storySprite('potion',x+2,f-11);storySprite('coin',x-1,f-2);storySprite('elder',x-31,f-8)}
}
function storyPortal(rid,x,selected,time){
  const r=REGIONS[rid];if(!r)return;const c=THEME[r.key]?.sky?.[0]||'#8a6cff';
  oval(x,92,23,31,OUTLINE);oval(x,92,20,28,c);ring(x,92,18,26,selected?'#ffd34d':'#d4c4ff');
  for(let i=0;i<8;i++){const a=time*(selected?2:1)+i*Math.PI/4;rect(x+Math.cos(a)*18,92+Math.sin(a)*26,1,2,'#ffffff')}
  storySprite(r.icon,x,84,{scale:Math.min(1,12/Math.max(SP[r.icon].w,SP[r.icon].h))});
  storySprite(r.boss.s,x,103,{scale:.7});hiText(r.name,x,130,4.6,'#ffffff');
}
function drawStoryBackdrop(B,time){
  if(B.C||!B.story)return;const s=B.story,p=s.plan,t=s.t,acting=s.mode==='action',k=Math.min(1,t/.75);
  if(s.atmosphere==='moon'){
    rect(0,0,LW,LH,'rgba(25,22,69,.53)');disc(190,30,16,'rgba(255,244,220,.12)');disc(190,30,10,'#fff4dc');
    for(let i=0;i<13;i++)rect(12+i*17,15+i%4*11,1,1,i%2?'#ffffff':'#c4ade8');
  }
  if(s.job&&B.age>=18){storyShop(s.job,time);if(!p)hiText(STORY.labels[s.job]||'',151,52,5.1,'#fff4dc')}
  else if(s.school&&B.age>=7&&B.age<18){
    const royal=s.school==='royal';panel(120,37,82,25,royal?'#fff4dc':'#e4e6f5');storySprite(s.schoolIcon,135,49);
    hiText(s.schoolLabel||'',169,49,4.2,'#38325e',false);
    for(let i=0;i<(royal?3:2);i++)storySprite('kid',132+i*23,111);
  }
  if(!p)return;
  if(p.kind==='arrival'){storyPortal(p.region,173,true,time);storySprite(REGIONS[p.region]?.mobs[0]?.s,132,112,{scale:1.1});return}
  if(p.kind==='spell'&&s.mode==='preview'){
    (p.cards||[]).forEach((c,i)=>{const xx=126+i*42,yy=94+Math.sin(time*2+i)*3;ring(xx,yy,13,17,'#c4ade8');storySprite(c.icon,xx,yy,{scale:1.4});hiText(c.name,xx,120,4.2,'#fff4dc')});return;
  }
  if(p.kind==='route'){p.regions.forEach((rid,i)=>storyPortal(rid,130+i*65,acting&&p.pick===i,time));return}
  if(p.kind==='fork'){
    for(let i=0;i<2;i++){const x=129+i*65;line(x,121,x,85,'#b57345',3);panel(x-23,70,46,23,acting&&p.pick===i?'#fff4a8':'#ffffff');storySprite(i?'house_big':'sword',x,81);storySprite('kid',x-8,111);storySprite('elder',x+8,112)}
    hiText(STORY.labels[acting?p.destination:'adventure'],162,55,5.4,'#fff4dc');return;
  }
  if(p.kind==='archive'){storySprite('shelf',170,98,{scale:3});storySprite('book',144,109,{scale:2});storySprite('candle',124,112);if(acting&&p.action==='open'){disc(144,105,10+k*8,'rgba(180,123,255,.22)');for(let i=0;i<8;i++)rect(139+(i%3)*5,104-i*3-k*7,2,2,i%2?'#b47bff':'#ffd34d')}return}
  if(p.kind==='forge'){storySprite('anvil',145,113,{scale:2});storySprite('elder',170,107);const a=acting?Math.sin(t*22)*5:0;line(164,96+a,151,101+a,'#7f4d2f',2);rect(146,97+a,9,4,'#a9accb');if(acting||s.mode==='effect')for(let i=0;i<9;i++){const an=i*.8;rect(145+Math.cos(an)*t*20,107+Math.sin(an)*t*13,2,1,'#ffd34d')}return}
  if(p.kind==='spring'||p.kind==='heal'){oval(148,115,30,8,'#4f9dff');ring(148,115,23+Math.sin(time*2)*3,5,'#8fe3ff');storySprite('potion',148,109);return}
  if(p.kind==='treasure'){storySprite('chest',153,111,{scale:2});if(acting)for(let i=0;i<5;i++)storySprite('coin',143+i*5,98-i%2*5-k*7);return}
  if(p.kind==='workshop'){storyShop('bakery',time);if(acting)storyBread(112+k*20,95-Math.sin(k*Math.PI)*12);return}
  if(['animal','encounter','mystery','trade'].includes(p.kind)){
    const actor=SP[p.actor]?p.actor:'kid',xx=147-(acting&&p.action==='approach'?k*40:0),yy=113-(p.kind==='animal'&&acting?Math.abs(Math.sin(t*10))*3:0);
    storySprite(actor,xx,yy,{scale:actor==='egg'?1.5:1.3});
    if(p.kind==='animal'){storySprite('house2',188,90);if(acting)storyEmote(p.action==='approach'?'heart':'star',xx,87,time)}
    else if(acting)storyEmote(p.kind==='mystery'?'ghost':p.kind==='trade'?'coin':'heart',xx,86,time);
  }
}
function drawStoryForeground(B,time){
  if(B.C||!B.story)return;const s=B.story,p=s.plan,x=lp(WX+s.heroX),y=lp(B.wiz.y??WY),t=s.t;
  if(s.combo){
    const r=s.combo;ring(x,y+10,12+Math.sin(time*2),3,r.color);
    r.parts.forEach((part,i)=>{const a=time*1.4+i*Math.PI;storySprite(RESONANCE.tags[part].icon,x+Math.cos(a)*16,y-13+Math.sin(a)*8,{scale:.55})});
  }
  s.relics.forEach((id,i)=>{const icons={prismcore:'gem',clockspring:'gear_deco',starlamp:'star'},a=time*1.3+i*2.1;storySprite(icons[id],x+Math.cos(a)*17,y-19+Math.sin(a)*7,{scale:id==='clockspring'?.35:.7})});
  if(!p||s.mode==='preview')return;
  if(['spell','transform','relic','career','school','companion','hurt','trade'].includes(p.kind)){
    const good=!(p.kind==='hurt'||p.kind==='trade'&&p.amount<0),color=good?'#ffd34d':'#ff6f9f';
    for(let i=0;i<12;i++){const a=i*Math.PI/6+t*2,r=7+(t%1.8)*16;rect(x+Math.cos(a)*r,y-10+Math.sin(a)*r*.65,1+i%2,1+i%2,i%3?color:'#ffffff')}
    if(p.kind==='spell'&&p.recipe){drawResonanceFx({id:p.recipe.id,x:600,y:WY,t:t%1,life:1,col:p.recipe.color},t%1,{...B,wiz:{...B.wiz,y:B.wiz.y??WY}});storySprite(p.recipe.icon,176,90,{scale:2});hiText(p.recipe.name,175,65,6,'#fff4a8')}
    else if(p.kind==='relic'){const icons={prismcore:'gem',clockspring:'gear_deco',starlamp:'star'},icon=icons[p.id]||p.icon;ring(159,83,22,22,'#ffd34d');storySprite(icon,159,83,{scale:p.id==='clockspring'?1.2:3});const card=CARDS.find(c=>c.id===p.id);if(card)hiText(card.name,159,53,6,'#fff4a8')}
    else if(p.kind==='companion'){const xx=x-24+Math.max(0,1-t/1.2)*45;storySprite(p.id,xx,y+6-Math.abs(Math.sin(t*9))*3);storyEmote('heart',xx,y-17,time)}
    else if(p.kind==='transform'){ring(x,y-9,14+Math.sin(t*8)*3,21,'#b47bff');storyEmote('ghost',x+24,y-29,time)}
    else if(p.icon)storySprite(p.icon,x+21,y-25,{scale:1.4});
  }
  if(s.mode==='action'&&p.kind==='spell'&&!p.recipe){storySprite(p.icon,x+Math.sin(t*4)*18,y-24,{scale:1.5});for(let i=0;i<3;i++)storySprite('i_missile',x+20+t*65+i*9,y-7+i*5)}
}

function installStoryPreview(){
  if(!PLAYTEST)return;const b=document.createElement('button');b.id='btn-story-preview';b.className='btn soft';b.textContent=STORY.tr('선택 이벤트 · 장면 체험','Try the life-event scenes','選択イベント・場面を体験');document.getElementById('btn-combat-preview').after(b);b.onclick=showStoryMenu;
}
function showStoryMenu(){
  document.getElementById('story-preview-dialog')?.remove();const d=document.createElement('dialog');d.id='story-preview-dialog';d.className='story-preview-dialog';
  d.innerHTML='<form method="dialog"><button class="preview-close" aria-label="Close">×</button></form><h2></h2><p></p><div class="story-demo-grid"></div>';
  d.querySelector('h2').textContent=STORY.tr('선택이 장면이 되는 순간','See your choices come to life','選択が場面になる瞬間');d.querySelector('p').textContent=STORY.tr('샘플 인생으로 연출만 바로 체험합니다. 본편의 확률·시험·분기 조건은 그대로입니다.','Preview scenes with a sample life. The main game keeps its odds, trials and conditions.','体験用の人生で演出を確認。本編の確率・試験・分岐条件はそのままです。');
  const demos=[['fork','sword',STORY.tr('모험 / 고향','Adventure / home','冒険 / 故郷')],['pet','dog',STORY.tr('새 친구와의 만남','A new companion','新しい仲間')],['archive','book',STORY.tr('금지된 서고','The forbidden archive','禁じられた書庫')],['route','scroll',STORY.tr('여행의 갈림길','A fork in the road','旅の分かれ道')],['spell','i_fireball',STORY.tr('새 마법 조합','A new spell combo','新しい魔法の組み合わせ')],['relic','gem',STORY.tr('새 보스의 유물','A new boss relic','新ボスの遺物')],['transform','wolf',STORY.tr('보름달의 변신','A full-moon transformation','満月の変身')],['forge','anvil',STORY.tr('떠돌이 대장장이','The wandering smith','旅の鍛冶屋')]];
  for(const [id,icon,name] of demos){const b=document.createElement('button');b.innerHTML=ic(icon,3)+'<b></b>';b.querySelector('b').textContent=name;b.onclick=()=>{d.close();if(id==='relic')showStoryRelics();else startStoryPreview(id)};d.querySelector('.story-demo-grid').appendChild(b)}document.body.appendChild(d);d.showModal();
}
function showStoryRelics(){
  document.getElementById('story-preview-dialog')?.remove();const d=document.createElement('dialog');d.id='story-preview-dialog';d.className='story-preview-dialog';
  d.innerHTML='<form method="dialog"><button class="preview-close" aria-label="Close">×</button></form><h2></h2><p></p><div class="story-demo-grid"></div>';
  d.querySelector('h2').textContent=STORY.tr('세 보스의 유물','Relics of the three bosses','三体のボスの遺物');d.querySelector('p').textContent=STORY.tr('획득 연출 체험입니다. 본편에서는 해당 보스를 직접 격파해야 얻습니다.','Preview the acquisition scene. In the adventure, defeat each boss to earn its relic.','獲得演出の体験です。本編では各ボスを倒すと入手できます。');
  for(const [rid,rg] of Object.entries(EXPANSION.regions)){const c=CARDS.find(c=>c.id===rg.relic),b=document.createElement('button');b.innerHTML=ic(c.icon,3)+'<b></b>';b.querySelector('b').textContent=c.name;b.onclick=()=>{d.close();startStoryPreview('relic',rid)};d.querySelector('.story-demo-grid').appendChild(b)}document.body.appendChild(d);d.showModal();
}
async function startStoryPreview(kind,rid='crystal'){
  const token=++runToken;endFight();const L=newLife(6718);LIFE=L;L.age=kind==='pet'?5:kind==='archive'?10:kind==='fork'?18:19;L.tier='local';L.element=ELEMENTS.find(e=>e.id==='fire');L.cards=[];L.mods={dmg:1};L.flags={};L.pets=[];L.allies=[];
  if(['spell','relic','route','transform','forge'].includes(kind)){L.adventure=true;L.W={hp:900,max:900,lv:7,exp:0,pow:1.5};L.stage=TIERS.findIndex(t=>t.includes(rid));L.region=rid;L.route=TIERS.slice(0,L.stage).map(t=>t[0]).concat(rid)}
  $('#l-log').innerHTML='';$('#hist-n').textContent='';where=STORY.tr('선택 장면 체험','Life-scene preview','選択場面の体験');VIEW=lifeView(kind==='archive'?'school':kind==='relic'?rid:kind==='transform'?'forest':L.origin.theme,'idle');resumeStage();updateHud();
  const exit=document.createElement('button');exit.id='preview-exit';exit.className='btn soft';exit.textContent=STORY.tr('체험 종료','Exit preview','体験を終了');document.getElementById('l-stats').before(exit);
  const finish=()=>{++runToken;endFight();exit.remove();cancelAnimationFrame(raf);VIEW=null;show('s-title');renderTitle()};exit.onclick=finish;
  function* demo(){
    if(kind==='pet')yield* doEvent(L,EVI.find_dog_child);
    if(kind==='archive')yield* doEvent(L,EVI.forbidden);
    if(kind==='transform')yield* doEvent(L,EVI.xwerewolf);
    if(kind==='forge')yield* forge(L);
    if(kind==='route'){const rid=yield* chooseRoute(L,1);yield* chapter(L,REGIONS[rid].key,'walk',REGIONS[rid].name,'')}
    if(kind==='spell')yield* levelPerk(L,{levels:1,min:'r',title:STORY.tr('새 카드를 골라 마법을 바꿔 봐.','Choose a card to shape your magic.','カードを選んで魔法を変えよう。')});
    if(kind==='relic')yield* awardStageRelic(L,rid);
    if(kind==='fork'){
      const e={age:18,icon:'sword',d:[],text:STORY.tr('성인식. 모험을 떠날까, 고향에 남을까?','Coming of age. Adventure, or a life at home?','成人の日。冒険に出る？ 故郷に残る？'),sceneKind:'adult-fork',opts:[STORY.tr('모험을 떠난다','Go adventuring','冒険に出る'),STORY.tr('고향에 남는다','Stay at home','故郷に残る')]};
      const k=yield {t:'choice',e};FATE.state(L).path=k?'home':'hero';L.age=19;
      if(k){yield* chapter(L,'town','idle',STORY.labels.home,'');yield* say(L,STORY.tr('마을에 작은 빵집을 열었다.','You open a little bakery in the village.','村に小さなパン屋を開いた。'),'heart',{f:'end_bakery'},true)}
      else yield* chapter(L,'grass','walk',STORY.labels.adventure,'');
    }
  }
  const gen=demo();let send;
  for(;;){const z=gen.next(send);send=undefined;if(z.done)break;const s=z.value;
    if(s.t==='choice')send=await askChoice(s.e);
    if(s.t==='log'){logItem(s.e);updateHud();await dlgWait(1600)}
    if(s.t==='scene'){VIEW=lifeView(s.theme,s.mode,s.banner);resumeStage();updateHud();await sleep(900)}
    if(token!==runToken)return;
  }
  const e={age:L.age,icon:'star',d:[],noScene:true,text:STORY.tr('선택의 결과는 다음 장면에도 이어집니다.','Your choice stays visible in the scenes ahead.','選択の結果が、この先の場面にも残ります。'),opts:[STORY.tr('다른 장면 체험','Try another scene','別の場面を体験'),STORY.tr('인생 시작 화면으로','Back to the title','タイトルへ')]};
  const k=await askChoice(e);if(token!==runToken)return;finish();if(k===0)showStoryMenu();
}
