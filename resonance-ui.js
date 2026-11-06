// Inlined into index.html by the preview build; uses the game's own sprites and UI.
function appendResonancePreview(button,r){
  if(!r)return;
  const p=document.createElement('span');p.className='resonance-card-hint';
  p.innerHTML=`${ic(RESONANCE.tags[r.parts[0]].icon,2)} + ${ic(RESONANCE.tags[r.parts[1]].icon,2)}<b></b><small></small>`;
  p.querySelector('b').textContent=RESONANCE.tr('조합 완성 · ','Combo · ','組み合わせ · ')+r.name;
  p.querySelector('small').textContent=r.desc;button.appendChild(p);
}
function updateSpellbook(L){
  let box=document.getElementById('resonance-book');
  if(!box){box=document.createElement('details');box.id='resonance-book';document.getElementById('l-stats').after(box)}
  box.hidden=!L.adventure;
  if(box.hidden)return;
  const active=RESONANCE.active(L),counts=RESONANCE.parts(L),open=box.open;
  if(VIEW?.story&&!VIEW.C)VIEW.story.combo=active;
  box.innerHTML='<summary></summary><div class="resonance-book-body"></div>';
  box.querySelector('summary').innerHTML=`${ic(active?.icon||'book',2)}<span></span><small></small>`;
  box.querySelector('summary span').textContent=active?active.name+' · '+RESONANCE.tr('공명','Resonance','共鳴')+' '+active.rank:RESONANCE.tr('나의 마법 조합','My spell combinations','自分の魔法の組み合わせ');
  box.querySelector('summary small').textContent=RESONANCE.tr('마법서 ▾','Spellbook ▾','魔法書 ▾');
  const body=box.querySelector('.resonance-book-body'),p=document.createElement('p');
  p.textContent=RESONANCE.tr('위험한 공격을 3번 피하면 준비한 조합 발동. 피해를 받으면 충전 1칸 감소.','Dodge 3 threatening attacks to trigger your prepared combo. Taking damage costs 1 charge.','危険な攻撃を3回避けると準備した組み合わせが発動。ダメージで1チャージ減少。');body.appendChild(p);
  for(const r of RESONANCE.inspect(L)){
    const b=document.createElement('button');b.type='button';b.className='resonance-recipe';b.disabled=r.have<2||FIGHT;
    b.setAttribute('aria-pressed',String(active?.id===r.id));
    b.innerHTML=`<span class="resonance-parts">${r.parts.map(id=>`<i class="${counts[id]?'owned':''}">${ic(RESONANCE.tags[id].icon,2)}</i>`).join('<em>+</em>')}</span><span><b></b><small></small></span><span class="resonance-state"></span>`;
    b.querySelector('b').textContent=r.name;
    b.querySelector('small').textContent=r.desc;
    b.querySelector('.resonance-state').textContent=r.have<2?r.have+'/2':(active?.id===r.id?'✓ ':RESONANCE.tr('준비','Equip','準備'))+' '+r.rank;
    b.onclick=()=>{if(FIGHT)return;L.resonance=r.id;SFX_HOOK('pop');updateSpellbook(L);box.open=true};
    body.appendChild(b);
  }
  const cards=document.createElement('p');cards.className='resonance-owned';
  cards.textContent=RESONANCE.tr('획득 카드: ','Earned cards: ','獲得カード：')+(L.cards.length?L.cards.map(id=>CARDS.find(c=>c.id===id)?.name||id).join(' · '):RESONANCE.tr('아직 없음','None yet','まだなし'));body.appendChild(cards);box.open=open;
}
function drawResonanceHud(B,time){
  const R=B.resonance;if(!R||B.tut)return;
  const r=R.recipe,x=91,y=2;
  panel(x,y,77,22,'#ffffff');blit(r.icon,x+8,y+8);
  hiText(r.name,x+44,y+7,LANG==='ko'?5:4.2,'#38325e',false);
  for(let i=0;i<R.need;i++){
    const lit=i<R.charge,xx=x+22+i*14;
    rect(xx,y+14,9,5,lit?r.color:'#e3def1');rect(xx+1,y+13,7,1,lit?r.color:'#e3def1');
    if(lit)rect(xx+2,y+14,3,1,'#ffffff');
  }
  if(B.resonanceFlash)hiText(B.resonanceFlash.name+'!',LW/2,57,7.2,r.color);
}
function drawResonanceFx(f,k,B){
  const ward=f.id==='bloom',x=lp(ward?WX:f.x),y=lp(ward?B.wiz.y:f.y),a=1-k,r=8+k*30;
  G.globalAlpha=a;
  if(f.id==='thermal'){
    ring(x,y,r,r*0.5,'#ff8a3d');ring(x,y,r*0.7,r*0.35,'#8fe3ff');
    for(let i=0;i<10;i++){const t=i*Math.PI/5,xx=x+Math.cos(t)*r,yy=y+Math.sin(t)*r*0.6;line(xx,yy,xx-Math.cos(t)*6,yy-Math.sin(t)*5,i%2?'#8fe3ff':'#ff8a3d',2)}
  }else if(f.id==='thunder'){
    for(let i=0;i<2;i++){const xx=lp(WX)-12-i*10,yy=lp(B.wiz.y)-12-i*6;blit(heroSprite(B.cls,B.age||19),xx,yy,{alpha:a*0.45});line(xx,yy,x-4,y-8-i*8,'#ffd34d',2);line(xx,yy,x-4,y-8-i*8,'#ffffff',1)}
  }else if(f.id==='bloom'){
    ring(x,y-5,12+k*9,18+k*5,'#79dfaa');ring(x,y-5,10+k*9,16+k*5,'#ffffff');
    for(let i=0;i<6;i++){const t=i*1.047+k*4;blit('leaf',x+Math.cos(t)*20,y+Math.sin(t)*14-9,{alpha:a})}
  }else if(f.id==='glacier'){
    for(let i=0;i<7;i++){const xx=x-24+i*8,hh=(i%3+1)*6*(1-k*0.7);line(xx,y+4,xx+3,y-hh,'#8fe3ff',3);line(xx+1,y+2,xx+3,y-hh,'#ffffff',1)}
    ring(x,y+4,r,r*0.3,'#a6e8ff');
  }else if(f.id==='eclipse'){
    disc(x,y-18,12+k*8,'#b47bff');disc(x+5,y-21,11+k*8,'#38325e');
    for(let i=0;i<8;i++){const t=i*Math.PI/4+k*2;disc(x+Math.cos(t)*r,y-12+Math.sin(t)*r*0.6,2,'#e6d6ff')}
  }else{
    for(let i=0;i<16;i++){const t=i*0.8+k*12,rr=6+(i%4)*6;disc(x+Math.cos(t)*rr,y-10+Math.sin(t)*rr*0.5,1+i%2,i%2?'#ff8a3d':'#fff4a8')}
  }
  G.globalAlpha=1;
}
function installResonanceUI(){
  if(!PLAYTEST)return;
  document.body.classList.add('playtest');
  const b=document.createElement('button');b.className='btn sun';b.id='btn-combat-preview';b.textContent=RESONANCE.tr('새 마법 조합 · 전투 체험','Try the spell combos','新しい魔法の組み合わせを体験');
  document.getElementById('btn-daily').before(b);b.onclick=showCombatMenu;
  const stages=document.createElement('button');stages.className='btn sun';stages.id='btn-stage-preview';stages.textContent=RESONANCE.tr('새 지역 3곳 · 몬스터와 보스 체험','3 new regions · meet their bosses','新地域3か所・ボスに挑戦');b.before(stages);stages.onclick=showStageMenu;
  const note=document.createElement('p');note.className='playtest-note';note.textContent=RESONANCE.tr('개선안 체험판 · 실제 서비스에는 아직 반영되지 않았습니다.','Playtest · not published to the live game.','改善案の体験版 · 本番には未反映です。');b.before(note);
}
function showStageMenu(){
  document.getElementById('combat-preview-dialog')?.remove();
  const d=document.createElement('dialog');d.id='combat-preview-dialog';
  d.innerHTML='<form method="dialog"><button class="preview-close" aria-label="Close">×</button></form><h2></h2><p class="preview-lede"></p><div class="preview-loadouts stage-loadouts"></div>';
  d.querySelector('h2').textContent=EXPANSION.tr('마왕성까지, 새로운 세 구간','Three new stops before the castle','魔王城へ、新たな三つの道');
  d.querySelector('p').textContent=EXPANSION.tr('모험은 총 6구간. 여기서는 지역별 샘플 캐릭터로 몬스터전 → 카드 보상 → 보스전을 바로 해볼 수 있습니다.','The adventure has 6 stages. Try each region with a sample character: monsters, a card reward, then the boss.','冒険は全6区間。地域ごとの体験用キャラクターで、モンスター戦→カード報酬→ボス戦を体験できます。');
  for(const [rid,rg] of Object.entries(EXPANSION.regions)){
    const row=document.createElement('section');row.className='stage-preview-card';row.innerHTML=`<span class="stage-boss-icon">${ic(rg.boss.s,3)}</span><span><b></b><small></small><span class="stage-mini-mobs">${rg.mobs.map(m=>ic(m.s,1)).join('')}</span></span><div class="stage-actions"><button></button><button></button></div>`;
    row.querySelector('b').textContent=rg.name;row.querySelector('small').textContent=rg.boss.n;
    const [journey,boss]=row.querySelectorAll('button');journey.textContent=EXPANSION.tr('몬스터부터 체험','Play the region','地域を体験');boss.textContent=EXPANSION.tr('보스 바로 도전','Fight the boss','ボスに挑戦');
    journey.onclick=()=>{d.close();startCombatPreview('thermal',false,rid)};boss.onclick=()=>{d.close();startCombatPreview('thermal',false,rid,true)};d.querySelector('.preview-loadouts').appendChild(row);
  }
  document.body.appendChild(d);d.showModal();
}
function showCombatMenu(){
  document.getElementById('combat-preview-dialog')?.remove();
  const d=document.createElement('dialog');d.id='combat-preview-dialog';
  d.innerHTML='<form method="dialog"><button class="preview-close" aria-label="Close">×</button></form><h2></h2><p class="preview-lede"></p><div class="preview-loadouts"></div><label class="preview-compare"><input type="checkbox"> <span></span></label>';
  d.querySelector('h2').textContent=RESONANCE.tr('조작은 그대로, 마법은 다르게','Same controls, different spells','操作はそのまま、魔法は違う');
  d.querySelector('.preview-lede').textContent=RESONANCE.tr('기존 전투 2판을 바로 체험합니다. 승리하면 카드를 고르고 보스에게 도전합니다. 아래 조합은 체험용 샘플입니다.','Try two existing encounters. Win, choose a card, then challenge the boss. These are sample loadouts.','既存の戦闘を2回体験。勝ったらカードを選んでボスへ。以下は体験用の組み合わせです。');
  d.querySelector('.preview-compare span').textContent=RESONANCE.tr('같은 조건에서 공명만 끄고 비교하기','Compare with resonance disabled','同じ条件で共鳴だけを無効にして比較');
  for(const r of RESONANCE.recipes){
    const b=document.createElement('button');b.type='button';b.innerHTML=`${r.parts.map(id=>ic(RESONANCE.tags[id].icon,3)).join('<em>+</em>')}<b></b><small></small>`;
    b.querySelector('b').textContent=r.name;b.querySelector('small').textContent=r.desc;
    b.onclick=()=>{const baseline=d.querySelector('input').checked;d.close();startCombatPreview(r.id,baseline)};
    d.querySelector('.preview-loadouts').appendChild(b);
  }
  document.body.appendChild(d);d.showModal();
}
async function startCombatPreview(id,baseline=false,rid='grass',bossOnly=false){
  const token=++runToken,r=RESONANCE.recipes.find(r=>r.id===id)||RESONANCE.recipes[0];
  const rg=REGIONS[rid]||REGIONS.grass,stage=TIERS.findIndex(t=>t.includes(rg.id));rid=rg.id;
  endFight();
  const L=newLife(481516);LIFE=L;L.name=RESONANCE.tr('체험 마법사','Playtest wizard','体験魔法使い');L.age=19;L.adventure=true;
  const birth={fire:'fire',ice:'ice',bolt:'bolt',echo:'none',wind:'wind',earth:'earth',life:'light',dark:'dark'};
  const support={fire:'burn',ice:'chill',bolt:'chainplus',echo:'twin',wind:'swift',earth:'guardian',life:'regen',dark:'vampire'};
  L.element=ELEMENTS.find(e=>e.id===birth[r.parts[0]]);L.traits=[];L.pets=[];L.allies=[];L.flags={};L.stage=stage;L.region=rid;L.route=TIERS.slice(0,stage).map(t=>t[0]).concat(rid);L.cards=[];L.mods={dmg:1+stage*0.1};L.st={int:110+stage*6,spd:55+stage*2,hp:850+stage*70};L.gold=0;
  const lv=4+stage*2;L.W={hp:L.st.hp,max:L.st.hp,lv,exp:0,pow:stage?Math.pow(1.07,lv-1):1.1};L.resonance=id;FATE.state(L).path='hero';
  const card=CARDS.find(c=>c.id===support[r.parts[1]]);L.cards.push(card.id);if(card.r!=='n')L.mods[card.id]=1;if(card.apply)card.apply(L);
  if(stage)for(const id of (stage>=4?['twin','armor','flask','guardian']:['armor','flask'])){const c=CARDS.find(c=>c.id===id);L.cards.push(c.id);if(c.r!=='n')L.mods[c.id]=1;if(c.apply)c.apply(L)}
  $('#l-log').innerHTML='';$('#hist-n').textContent='';where=rg.name+' · '+RESONANCE.tr('전투 체험','Combat playtest','戦闘体験');VIEW=lifeView(rg.key,'walk');resumeStage();updateHud();
  const exit=document.createElement('button');exit.id='preview-exit';exit.className='btn soft';exit.textContent=RESONANCE.tr('체험 종료','Exit playtest','体験を終了');
  document.getElementById('l-stats').before(exit);
  const finish=()=>{++runToken;endFight();exit.remove();cancelAnimationFrame(raf);VIEW=null;show('s-title');renderTitle()};exit.onclick=finish;
  logItem({age:L.age,text:RESONANCE.tr('화면을 탭하면 한 칸 회피. 내 줄로 날아오는 공격을 피하세요. '+(baseline?'공명을 끈 비교 전투입니다.':'세 번 피하면 '+r.name+' 발동!'),'Tap to hop one lane. Dodge attacks aimed at your lane. '+(baseline?'Resonance is disabled for comparison.':'Three dodges trigger '+r.name+'!'),'タップで1列移動。自分の列に飛んでくる攻撃を避けよう。'+(baseline?'共鳴を無効にした比較戦闘です。':'3回避けると'+r.name+'発動！')),icon:r.icon,d:[]});
  let won=true;
  for(let n=bossOnly?1:0;n<2;n++){
    const result=await fight({stage,region:rid,boss:n===1,noResonance:baseline,seed:7381+stage*100+n});
    if(token!==runToken)return;
    if(!result.win){won=false;break}
    {
      const gen=n===0?levelPerk(L,{levels:Math.max(1,result.levels),min:'r',title:RESONANCE.tr('승리! 보스전 전에 카드를 한 장 고르자.','Victory! Choose a card before the boss.','勝利！ボス戦の前にカードを選ぼう。')}):awardStageRelic(L,rid);let answer;
      for(;;){const step=gen.next(answer);answer=undefined;if(step.done)break;if(step.value.t==='choice')answer=await askChoice(step.value.e);else if(step.value.t==='log'){logItem(step.value.e);dlgFinish()}if(token!==runToken)return}
      updateHud();
    }
  }
  if(token!==runToken)return;
  const totals=L.resonanceTotals||{procs:0,damage:0};
  const e={age:L.age,icon:won?'star':'skull',d:[],major:true,noScene:true,text:RESONANCE.tr((won?'체험 완료! ':'쓰러졌습니다. ')+`공명 ${totals.procs}회 · 회피 ${L.dodges||0}회. 실제 인생에서는 태어난 속성과 획득한 카드로 조합이 만들어집니다.`,(won?'Playtest complete! ':'Defeated. ')+`${totals.procs} resonances · ${L.dodges||0} dodges. In a real life, your birth element and earned cards create the combinations.`,(won?'体験完了！':'倒れてしまった。')+`共鳴${totals.procs}回・回避${L.dodges||0}回。本編では生まれた属性と獲得カードから組み合わせが生まれます。`),opts:[RESONANCE.tr('같은 조합 다시','Retry this combo','同じ組み合わせでもう一度'),RESONANCE.tr('다른 조합 체험','Try another combo','別の組み合わせ'),RESONANCE.tr('인생 시작 화면으로','Back to the title','タイトルへ')]};
  const trophy=won?CARDS.find(c=>c.id===EXPANSION.regions[rid]?.relic):null;
  if(trophy){e.icon=trophy.icon;e.text=EXPANSION.tr(`${rg.boss.n} 격파! 유물 「${trophy.name}」 획득. ${trophy.desc}`,`${rg.boss.n} defeated! Relic acquired: ${trophy.name}. ${trophy.desc}`,`${rg.boss.n}撃破！ 遺物「${trophy.name}」を獲得。${trophy.desc}`)}
  if(EXPANSION.regions[rid]){e.opts[0]=EXPANSION.tr('이 지역 다시 도전','Retry this region','この地域に再挑戦');e.opts[1]=EXPANSION.tr('다른 지역 가 보기','Try another region','別の地域へ')}
  const choice=await askChoice(e);if(token!==runToken)return;exit.remove();
  if(choice===0)startCombatPreview(id,baseline,rid,bossOnly);else{finish();if(choice===1)(EXPANSION.regions[rid]?showStageMenu:showCombatMenu)()}
}
