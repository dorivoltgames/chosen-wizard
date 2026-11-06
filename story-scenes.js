/* Visual plans describe real choices/effects. They never roll dice or change a life. */
function createStoryScenes(lang='ko'){
  const tr=(ko,en,ja)=>({ko,en,ja}[lang]||en);
  const careers=[['end_merchant','merchant'],['end_guard','guard'],['end_hunter','hunter'],['end_court','court'],['end_bakery','bakery'],['end_potato','farmer'],['end_teacher','teacher']];
  const relics=['prismcore','clockspring','starlamp'];
  function snapshot(L){return {form:L.form||null,tier:L.tier||null,staff:L.staff||0,pets:[...(L.pets||[])],allies:[...(L.allies||[])],cards:[...(L.cards||[])],job:careers.find(([f])=>L.flags?.[f])?.[1]||null,gold:L.gold||0,hp:L.W?.hp??L.st?.hp??0}}
  function changes(before,L){
    const after=snapshot(L),out=[];
    if(after.form!==before.form&&after.form)out.push({kind:'transform',id:after.form});
    for(const id of after.pets.filter(id=>!before.pets.includes(id)))out.push({kind:'companion',id});
    for(const id of after.allies.filter(id=>!before.allies.includes(id)))out.push({kind:'companion',id});
    for(const id of after.cards.filter(id=>!before.cards.includes(id)))out.push({kind:relics.includes(id)?'relic':'spell',id});
    if(after.job!==before.job&&after.job)out.push({kind:'career',id:after.job});
    if(after.tier!==before.tier&&after.tier)out.push({kind:'school',id:after.tier});
    if(after.staff>before.staff)out.push({kind:'forge',level:after.staff});
    if(!out.length&&after.gold!==before.gold)out.push({kind:'trade',amount:after.gold-before.gold});
    if(!out.length&&after.hp>before.hp)out.push({kind:'heal'});
    if(!out.length&&after.hp<before.hp)out.push({kind:'hurt',amount:before.hp-after.hp});
    return out;
  }
  function plan(e,L){
    if(e.cards)return {kind:'spell',icon:e.cards[0]?.icon||'book',cards:e.cards.map(c=>({icon:c.icon,name:c.name}))};
    if(e.regionChoices)return {kind:'route',regions:[...e.regionChoices]};
    if(e.sceneKind==='adult-fork')return {kind:'fork'};
    const id=e.eventId||'';
    if(id.startsWith('find_'))return {kind:'animal',actor:id.split('_')[1],icon:e.icon};
    if(['cat','farmpet','hawkling','egg','fireegg'].includes(id))return {kind:'animal',actor:id==='farmpet'?'chick':id==='hawkling'?'gull':e.icon||'egg',icon:e.icon};
    if(['forbidden','cheat','oldlibrary','familytest'].includes(id))return {kind:'archive',icon:'book'};
    if(['firstforge','dropweapon','forge'].includes(id)||e.icon==='anvil')return {kind:'forge',icon:'anvil'};
    if(id.startsWith('x'))return {kind:'mystery',actor:e.icon||'ghost',eventId:id};
    if(['merchant','fortune','heirloom','dice'].includes(id))return {kind:'trade',actor:id==='merchant'?'elder':'imp',icon:e.icon};
    if(['manaspring','hotspring'].includes(id))return {kind:'spring',icon:'potion'};
    if(['pyramid','hoard','shipwreck','treasuremap'].includes(id)||e.icon==='chest')return {kind:'treasure',icon:'chest'};
    if(['magicbread','potatofest'].includes(id))return {kind:'workshop',icon:id==='magicbread'?'bread':'leaf'};
    return {kind:'encounter',actor:['wolf','bat','ghost','golem','imp','demon'].includes(e.icon)?e.icon:'kid',icon:e.icon||'heart'};
  }
  function choice(e,pick,L){
    const p=plan(e,L);p.pick=pick;
    if(e.cards){p.icon=e.cards[pick]?.icon||'book';p.label=e.cards[pick]?.name;p.recipe=e.buildCards?.[pick]||null}
    if(e.regionChoices)p.destination=e.regionChoices[pick]||e.regionChoices[0];
    if(p.kind==='fork')p.destination=pick===0?'adventure':'home';
    // An invitation is an action, never a promise of a successful random outcome.
    p.action=p.kind==='animal'?(pick===0?'approach':'wave'):p.kind==='archive'?(pick===0?'open':'leave'):pick===0?'engage':'step';
    return p;
  }
  const labels={adventure:tr('모험을 향해!','Off to adventure!','冒険へ！'),home:tr('돌아갈 곳, 나의 마을','A place to call home','帰る場所、自分の村'),bakery:tr('나의 작은 빵집','My little bakery','自分の小さなパン屋'),teacher:tr('아이들과 첫 수업','A first lesson','子どもたちと最初の授業'),merchant:tr('장터의 새 가게','A new market stall','市場の新しい店'),guard:tr('마을을 지키는 하루','A village watch','村を守る一日'),farmer:tr('내가 가꾼 밭','A field of my own','自分が育てた畑'),hunter:tr('숲과 함께 사는 삶','A life with the forest','森と暮らす人生'),court:tr('왕궁으로 향하는 길','The road to court','王宮へ向かう道')};
  return {tr,snapshot,changes,plan,choice,labels,relics};
}
