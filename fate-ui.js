/* Crossroads UI, bounded local progression, and versioned friend challenges. */
function createFateUI({fate:F,context}) {
  const c=()=>context(), t=F.tr;
  const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const name=id=>c().endings.find(e=>e.id===id)?.name||id;
  function remember(L,dx) {
    const s=F.state(L);
    dx.crossroads=dx.crossroads&&typeof dx.crossroads==='object'?dx.crossroads:{};
    const p=dx.crossroads;
    p.version=2;
    p.legacy={name:L.name,end:L.ending,path:s.path||'hero'};
    p.paths=p.paths&&typeof p.paths==='object'?p.paths:{};
    p.paths[s.path]=(Number(p.paths[s.path])||0)+1;
    const history=Array.isArray(p.history)?p.history:[];
    p.history=[...history,{seed:L.seed,end:L.ending,path:s.path,day:c().dailyKey()}].slice(-12);
    if(L.mode==='daily'&&F.dailyGoal(L.dkey).check(L)) {
      p.daily=p.daily&&typeof p.daily==='object'?p.daily:{};
      p.daily[L.dkey]=true;
      p.daily=Object.fromEntries(Object.entries(p.daily).sort().slice(-45));
    }
    c().saveDex(dx);
  }
  function legacy(dx) {
    const m=dx.crossroads?.legacy;
    if(!m||!c().endings.some(e=>e.id===m.end)||typeof m.name!=='string')return null;
    return {name:m.name.slice(0,14),end:m.end};
  }
  function parseHash(hash) {
    const h=String(hash||'').replace(/^#/,'');
    if(h==='today')return {daily:true};
    const m=/^(f[0-9a-z]{1,7}|d\d{4}-\d{2}-\d{2})(?:~([a-z_]{1,32})~(hero|forbidden|home))?$/.exec(h);
    if(!m)return null;
    let result;
    if(m[1][0]==='f') {
      const seed=parseInt(m[1].slice(1),36);
      if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)return null;
      result={seed:seed>>>0};
    }else {
      const day=m[1].slice(1),date=new Date(day+'T00:00:00Z');
      if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==day)return null;
      result={seed:c().dailySeed(day),daily:true,dkey:day};
    }
    if(m[2]&&c().endings.some(e=>e.id===m[2]))result.result={end:m[2],path:m[3]};
    return result;
  }
  function link(L) {
    const fate=L.mode==='daily'?'d'+L.dkey:'f'+(L.seed>>>0).toString(36);
    const result=L.ending?'~'+L.ending+'~'+(F.state(L).path||'hero'):'';
    return c().shareURL+'#'+fate+result;
  }
  function challengePanel(ch) {
    if(ch?.seed===undefined)return false;
    const L=c().newLife(ch.seed),host=document.getElementById('chal');
    host.hidden=false;
    host.innerHTML=`<p class="eyebrow">${esc(t('같은 탄생, 다른 인생','Same birth. A different life.','同じ誕生、違う人生。'))}</p>
      <p class="chalfate">${esc([L.origin.name,L.family.name,L.element.name,...L.traits.map(v=>v.name)].join(' · '))}</p>
      ${ch.result?`<div class="fate-friend-result"><small>${esc(t('친구가 이룬 결말','Your friend’s ending','友だちがたどり着いた結末'))}</small><strong>${esc(name(ch.result.end))}</strong><span>${esc(F.paths[ch.result.path].name)}</span></div>`:''}
      <p class="fate-caption">${esc(t('타고난 운명은 같아. 어떤 삶을 살지는 네가 골라.','Your birth is the same. Choose the life you will live.','生まれ持った運命は同じ。どんな人生にするかは君次第。'))}</p>
      <button id="btn-chal" class="btn sun">${esc(t('내 선택으로 살아 보기','Live it my way','自分の選択で生きてみる'))}</button>`;
    document.getElementById('btn-chal').onclick=()=>c().startBirth({seed:ch.seed,mode:ch.daily?'daily':'challenge',dkey:ch.dkey||'',challenge:ch.result||null});
    return true;
  }
  function targetPanel(dx,L,host) {
    const selected=dx.crossroads?.target, target=selected&&!dx.end?.[selected]&&!F.endings.some(e=>e.id===selected)&&c().endings.some(e=>e.id===selected)?selected:F.target(dx,L);
    if(!target)return;
    const box=document.createElement('div');box.className='fate-target';
    box.innerHTML=`<p class="eyebrow">${esc(t('다음 인생의 작은 목표','A little goal for your next life','次の人生の小さな目標'))}</p><p>${esc(F.hint(target))}</p><button class="btn soft fate-small">${esc(t('이 단서로 다시 태어나기','Start another life with this clue','この手がかりでもう一度'))}</button>`;
    box.querySelector('button').onclick=()=>{const d=c().loadDex();d.crossroads=d.crossroads||{};d.crossroads.target=target;c().saveDex(d);c().startBirth()};
    host.appendChild(box);
  }
  function title(dx) {
    const hero=document.querySelector('.hero');
    let badge=document.getElementById('fate-version');
    if(!badge){badge=document.createElement('p');badge.id='fate-version';badge.className='fate-version';hero.querySelector('h1').after(badge)}
    badge.textContent=t('마법 공명 · 여섯 구간','Spell resonance · six stages','魔法の共鳴 · 全6区間');
    hero.querySelector('.lede').textContent=t('태어난 운명은 랜덤. 시험으로 성장하고, 뜻밖의 인연을 만나고, 나만의 마법으로 모험해.','A random birth. School trials, unexpected encounters, and an adventure with your own magic.','生まれ持った運命はランダム。試験で成長し、思いがけない縁に出会い、自分だけの魔法で冒険へ。');
    const how=document.querySelectorAll('.how li');
    how[1].querySelector('b').textContent=t('시험으로 자라는 마법사','A wizard shaped by trials','試験で育つ魔法使い');
    how[1].querySelector('span').textContent=t('입학시험, 빗자루 비행, 체력장. 직접 해낸 결과가 모험의 힘이 돼.','Entrance exams, broom flight, fitness. Your results shape your adventure.','入学試験、ほうき飛行、体力測定。自分の結果が冒険の力になる。');
    document.getElementById('fate-paths')?.remove();
    document.getElementById('fate-daily-goal')?.remove();
    let memory=document.getElementById('fate-legacy');
    if(!memory){memory=document.createElement('div');memory.id='fate-legacy';memory.className='fate-legacy';document.getElementById('best').before(memory)}
    const m=legacy(dx);memory.hidden=!m;
    if(m)memory.innerHTML=`${c().icon('book',2)}<span>${esc(t('마을 도서관에 남은 전생','A past life in the village library','村の図書館に残った前世'))}<b>${esc(m.name)} · ${esc(name(m.end))}</b></span>`;
  }
  function hud(L) {document.getElementById('fate-hud')?.remove()}
  function ending(L,dx) {
    const host=document.getElementById('endcard'), s=F.state(L);
    const path=document.createElement('p');path.className='fate-ending-path';path.textContent=F.paths[s.path||'hero'].name;
    host.querySelector('.endhero h2').before(path);
    if(L.challenge) {
      const box=document.createElement('div');box.className='fate-comparison';
      box.innerHTML=`<h3>${esc(t('같은 탄생, 우리의 다른 선택','Same birth, our different choices','同じ誕生、それぞれの選択'))}</h3><div class="fate-compare-grid"><div><small>${esc(t('친구','Your friend','友だち'))}</small><strong>${esc(name(L.challenge.end))}</strong><span>${esc(F.paths[L.challenge.path].name)}</span></div><div><small>${esc(t('나','You','自分'))}</small><strong>${esc(name(L.ending))}</strong><span>${esc(F.paths[s.path].name)}</span></div></div><p>${esc(t('같은 출생 조건으로 완성한 두 인생. 다음에는 또 어떤 길이 나올까?','Two lives from the same birth. Which road comes next?','同じ生まれから完成した二つの人生。次はどんな道になるだろう？'))}</p>`;
      host.querySelector('.sharetop').before(box);
    }
    if(L.mode==='daily') {
      const p=document.createElement('p');p.className='fate-daily-result';
      p.textContent=(F.dailyGoal(L.dkey).check(L)?'✓ ':'')+F.dailyGoal(L.dkey).text;host.querySelector('.sharetop').before(p);
    }
    const next=document.createElement('div');next.className='fate-next';targetPanel(dx,L,next);
    host.querySelector('.sharetop').after(next);
    const again=document.createElement('button');again.className='btn soft';again.id='btn-same-fate';
    again.textContent=t('같은 탄생으로 다른 길 살기','Same birth, another road','同じ誕生で別の道を生きる');
    again.onclick=()=>c().startBirth({seed:L.seed,mode:L.mode==='daily'?'daily':'challenge',dkey:L.dkey,challenge:{end:L.ending,path:s.path||'hero'}});
    document.getElementById('btn-again').before(again);
  }
  function dex(dx) {
    const host=document.getElementById('dex');
    const existing=host.querySelector('.dexsec');
    const section=document.createElement('section');section.className='fate-clues';
    section.innerHTML=`<h3>${esc(t('엔딩으로 가는 단서','Clues to another ending','別の結末への手がかり'))}</h3><p>${esc(t('결말은 비밀로, 다음 선택은 선명하게. 하나를 골라 다음 인생의 목표로 삼아 봐.','Keep the ending a mystery. Pick a clue as your next life’s goal.','結末は秘密のまま。手がかりを一つ選び、次の人生の目標にしよう。'))}</p>`;
    const ids=['hero','chosen','dragonrider','peace','family','gourmet','shadow','beastking','bakery','teacher','merchant','guard'];
    for(const id of ids) {
      const found=!!dx.end?.[id],row=document.createElement('details');row.className='fate-clue';
      row.innerHTML=`<summary>${esc(found?'✓ '+name(id):t('미발견 이야기','An undiscovered story','まだ見ぬ物語')+' · '+String(c().endings.findIndex(e=>e.id===id)+1).padStart(2,'0'))}</summary><p>${esc(F.hint(id))}</p>`;
      if(!found){const b=document.createElement('button');b.className='btn soft fate-small';b.textContent=dx.crossroads?.target===id?t('현재 목표 ✓','Current goal ✓','現在の目標 ✓'):t('다음 인생의 목표로','Make this my next goal','次の人生の目標にする');b.setAttribute('aria-pressed',String(dx.crossroads?.target===id));b.onclick=()=>{const d=c().loadDex();d.crossroads=d.crossroads||{};d.crossroads.target=id;c().saveDex(d);for(const other of section.querySelectorAll('button')){other.setAttribute('aria-pressed','false');other.textContent=t('다음 인생의 목표로','Make this my next goal','次の人生の目標にする')}b.setAttribute('aria-pressed','true');b.textContent=t('현재 목표 ✓','Current goal ✓','現在の目標 ✓');};row.appendChild(b)}
      section.appendChild(row);
    }
    const archived=F.endings.filter(e=>dx.end?.[e.id]);
    if(archived.length){const p=document.createElement('p');p.className='fate-caption';p.textContent=t('이전 버전에서 발견한 이야기: ','Stories discovered in the previous version: ','以前のバージョンで発見した物語：')+archived.map(e=>e.name).join(' · ');section.appendChild(p)}
    host.insertBefore(section,existing);
  }
  function birth(L,dx) {
    let p=document.getElementById('fate-birth-goal');
    if(!p){p=document.createElement('p');p.id='fate-birth-goal';p.className='fate-birth-goal';document.getElementById('btn-live').before(p)}
    const target=dx.crossroads?.target;
    p.hidden=!target||!!dx.end?.[target]||F.endings.some(e=>e.id===target);p.textContent=target?F.hint(target):'';
    L.legacy=legacy(dx);
    document.getElementById('btn-same-fate')?.remove();
  }
  return {esc,name,remember,legacy,parseHash,link,challengePanel,title,hud,ending,dex,birth};
}
