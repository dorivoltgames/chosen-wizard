/* A small extension of the existing card deck and three-lane dodge combat. */
function createResonance(lang='ko') {
  const tr=(ko,en,ja)=>({ko,en,ja}[lang]||en);
  const tags={
    fire:{name:tr('불꽃','Flame','炎'),icon:'fire',color:'#ff8a3d'},
    ice:{name:tr('서리','Frost','霜'),icon:'snowflake',color:'#8fe3ff'},
    bolt:{name:tr('번개','Lightning','雷'),icon:'bolt',color:'#ffd34d'},
    echo:{name:tr('분신','Echo','分身'),icon:'i_missile',color:'#c5a3ff'},
    wind:{name:tr('바람','Wind','風'),icon:'leaf',color:'#b4ecd4'},
    earth:{name:tr('수호','Guard','守護'),icon:'gem',color:'#c9935a'},
    life:{name:tr('생명','Life','生命'),icon:'heart',color:'#3fcf9f'},
    dark:{name:tr('어둠','Shadow','闇'),icon:'ghost',color:'#b47bff'},
  };
  const innate={fire:'fire',ice:'ice',bolt:'bolt',wind:'wind',earth:'earth',light:'life',dark:'dark',none:'echo'};
  const cardTags={burn:'fire',chill:'ice',frostarmor:'ice',chainplus:'bolt',twin:'echo',echo:'echo',mirror:'echo',swift:'wind',haste:'wind',guardian:'earth',manashield:'earth',armor:'earth',regen:'life',lifewell:'life',vampire:'dark',prismcore:'echo',clockspring:'wind',starlamp:'earth'};
  const recipes=[
    {id:'thermal',parts:['fire','ice'],name:tr('열충격','Thermal shock','熱衝撃'),icon:'i_fireball',color:'#ff9c9c',effect:'burst',desc:tr('폭발 피해 + 짧은 기절','Blast damage + a short stun','爆発ダメージ＋短い気絶')},
    {id:'firestorm',parts:['fire','wind'],name:tr('화염 회오리','Firestorm','炎の竜巻'),icon:'i_whirl',color:'#ffb369',effect:'storm',desc:tr('적 아래에 3초 동안 불꽃 소용돌이','A fiery vortex under the enemy for 3 seconds','敵の足元に3秒間の炎の渦')},
    {id:'thunder',parts:['bolt','echo'],name:tr('뇌전 분신','Thunder echoes','雷の分身'),icon:'i_chain',color:'#ffd34d',effect:'chain',desc:tr('분신의 번개가 세 번 연속 적중','Three lightning strikes from your echoes','分身の雷が3回連続で命中')},
    {id:'bloom',parts:['earth','life'],name:tr('생명의 결계','Living barrier','生命の結界'),icon:'flower',color:'#79dfaa',effect:'ward',desc:tr('HP 5% 회복 + HP 8% 보호막','Heal 5% HP + an 8% HP shield','HP5%回復＋HP8%のバリア')},
    {id:'eclipse',parts:['dark','life'],name:tr('월식','Eclipse','月食'),icon:'i_bloodmoon',color:'#c39dff',effect:'drain',desc:tr('어둠으로 적을 타격하고 HP 4% 회복','Strike with shadow and heal 4% HP','闇で攻撃しHP4%回復')},
    {id:'glacier',parts:['ice','earth'],name:tr('빙하 파쇄','Glacier break','氷河砕き'),icon:'ice',color:'#a6e8ff',effect:'glacier',desc:tr('얼음 파편으로 타격 + 공격을 잠시 늦춤','Ice shards strike and briefly slow attacks','氷の破片で攻撃＋一時的に攻撃を遅くする')},
  ];
  function parts(L,extra) {
    const counts={};
    const add=(tag,n=1)=>{if(tag)counts[tag]=Math.min(4,(counts[tag]||0)+n)};
    add(innate[L.element?.id||'none']);
    // Use earned cards, rather than generic combat buffs with similar names.
    // Normal cards may stack; rare cards may only occur once in the deck.
    for(const id of L.cards||[])add(cardTags[id]);
    if(extra)add(cardTags[extra.id]);
    return counts;
  }
  function inspect(L,extra) {
    const counts=parts(L,extra);
    return recipes.map(r=>{
      const rank=1+Math.min(2,Math.floor(Math.max(0,r.parts.reduce((n,p)=>n+(counts[p]||0),0)-2)/2)),k=1+(rank-1)*0.25;
      let desc=r.desc;
      if(r.effect==='ward')desc=tr(`HP ${5*k}% 회복 + HP ${8*k}% 보호막`,`Heal ${5*k}% HP + a ${8*k}% HP shield`,`HP${5*k}%回復＋HP${8*k}%のバリア`);
      if(r.effect==='drain')desc=tr(`어둠으로 적을 타격하고 HP ${4*k}% 회복`,`Strike with shadow and heal ${4*k}% HP`,`闇で攻撃しHP${4*k}%回復`);
      return {...r,desc,rank,have:r.parts.filter(p=>counts[p]>0).length};
    });
  }
  const available=L=>inspect(L).filter(r=>r.have===2);
  const active=L=>{const list=available(L);return list.find(r=>r.id===L.resonance)||list[0]||null};
  function project(L,c) {
    const before=inspect(L),after=inspect(L,c);
    return after.find((r,i)=>r.have===2&&before[i].have<2)||after.find((r,i)=>r.have===2&&r.rank>before[i].rank)||null;
  }
  function bridge(L,deck) {
    return deck.filter(c=>!c.bossOnly&&!(L.mods||{})[c.id]&&!(L.cards||[]).includes(c.id)&&project(L,c));
  }
  function meter(recipe,fire) {
    return {recipe,charge:0,need:3,cooldown:0,procs:0,damage:0,healed:0,shield:0,
      tick(dt){this.cooldown=Math.max(0,this.cooldown-dt)},
      dodge(){if(this.cooldown>0)return;this.charge=Math.min(this.need,this.charge+1);if(this.charge>=this.need){if(fire(this.recipe)===false)return;this.charge=0;this.cooldown=1.2;this.procs++}},
      hit(){this.charge=Math.max(0,this.charge-1)},
    };
  }
  return {tr,tags,innate,cardTags,recipes,parts,inspect,available,active,project,bridge,meter};
}
