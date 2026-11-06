/* New regions use the existing three-lane battle, card deck and pixel palette. */
function createStageExpansion(lang='ko') {
  const tr=(ko,en,ja)=>({ko,en,ja}[lang]||en);
  function sprite(draw,w=24,h=24){
    const rows=Array.from({length:h},()=>Array(w).fill('.'));
    const dot=(x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&x<w&&y>=0&&y<h)rows[y][x]=c};
    const box=(x,y,ww,hh,c)=>{for(let yy=y;yy<y+hh;yy++)for(let xx=x;xx<x+ww;xx++)dot(xx,yy,c)};
    const oval=(x,y,rx,ry,c)=>{for(let yy=-ry;yy<=ry;yy++)for(let xx=-rx;xx<=rx;xx++)if(xx*xx/(rx*rx)+yy*yy/(ry*ry)<=1)dot(x+xx,y+yy,c)};
    const line=(x,y,xx,yy,c)=>{const n=Math.max(Math.abs(xx-x),Math.abs(yy-y));for(let i=0;i<=n;i++)dot(x+(xx-x)*i/(n||1),y+(yy-y)*i/(n||1),c)};
    const gem=(x,y,r,c)=>{for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++)if(Math.abs(xx)+Math.abs(yy)<=r)dot(x+xx,y+yy,c);line(x,y-r,x,y+r,'w')};
    draw({dot,box,oval,line,gem});return rows.map(r=>r.join(''));
  }
  const sprites={
    gemite:sprite(({box,oval,line,gem})=>{for(const y of [13,17,20]){line(8,y,3,y+2,'U');line(16,y,21,y+2,'U')}oval(12,15,7,6,'C');gem(12,10,6,'c');box(6,17,4,3,'w');box(14,17,4,3,'w');box(7,18,2,2,'k');box(15,18,2,2,'k')}),
    prismbat:sprite(({box,line,gem})=>{for(let i=0;i<6;i++){line(10,11,2+i,5+i*2,'u');line(14,11,22-i,5+i*2,'c')}gem(12,13,5,'U');box(9,11,2,2,'w');box(14,11,2,2,'w');line(10,7,8,3,'u');line(14,7,16,3,'c');box(11,17,2,2,'w')}),
    quartzsnail:sprite(({box,oval,line,gem})=>{oval(12,19,9,3,'m');oval(14,12,7,7,'u');gem(14,11,6,'c');line(13,8,16,8,'C');line(16,8,16,13,'C');line(16,13,13,13,'C');line(13,13,13,11,'C');oval(6,17,4,3,'m');line(4,16,3,11,'M');line(7,16,8,11,'M');box(2,10,2,2,'k');box(8,10,2,2,'k')}),
    prismstag:sprite(({box,oval,line,gem})=>{oval(13,15,7,4,'c');box(8,18,2,5,'C');box(17,18,2,5,'C');oval(6,12,4,4,'c');line(5,8,4,2,'u');line(4,5,1,3,'u');line(8,8,10,2,'u');line(10,5,13,3,'u');box(4,11,1,2,'k');gem(14,11,3,'u');box(3,15,3,1,'p')}),
    cogling:sprite(({box,oval,line})=>{for(let a=0;a<8;a++){const t=a*Math.PI/4;box(Math.round(12+Math.cos(t)*7)-1,Math.round(9+Math.sin(t)*7)-1,3,3,'Y')}oval(12,9,7,7,'T');oval(12,9,5,5,'x');box(8,8,2,2,'k');box(14,8,2,2,'k');box(9,16,6,4,'b');box(8,20,3,3,'T');box(14,20,3,3,'T');line(6,16,2,12,'T');line(18,16,21,13,'T');box(2,8,1,6,'e')}),
    pendulum:sprite(({box,oval,line,gem})=>{oval(12,9,7,7,'l');oval(12,9,5,5,'x');line(12,9,12,5,'U');line(12,9,16,11,'U');box(9,11,1,1,'k');box(14,11,1,1,'k');line(12,16,9,21,'T');gem(9,21,2,'y');line(5,9,2,12,'u');line(19,9,22,12,'u')}),
    brassbeetle:sprite(({box,oval,line})=>{for(const y of [12,16,20]){line(7,y,2,y+1,'b');line(17,y,22,y+1,'b')}oval(12,15,7,7,'T');oval(12,15,5,5,'Y');box(11,10,2,11,'b');oval(12,7,4,3,'T');box(9,6,2,2,'k');box(14,6,2,2,'k');line(10,5,7,2,'y');line(14,5,17,2,'y');box(7,12,2,3,'x')}),
    hourkeeper:sprite(({box,oval,line})=>{box(7,16,4,7,'b');box(15,16,4,7,'b');box(3,9,3,9,'T');box(20,9,3,9,'T');box(7,5,12,14,'T');oval(13,10,6,6,'y');oval(13,10,4,4,'x');line(13,10,13,6,'b');line(13,10,16,11,'b');line(13,16,11,20,'b');box(10,19,3,3,'y');box(9,1,8,3,'b');box(11,0,4,2,'y')}),
    starjelly:sprite(({box,oval,line,gem})=>{for(let i=0;i<5;i++)line(5+i*3,14,4+i*3+(i%2?2:-1),21-i%2,'u');oval(12,10,9,7,'u');oval(12,8,6,4,'l');gem(12,6,3,'y');box(7,11,2,2,'k');box(15,11,2,2,'k');box(5,13,3,1,'p');box(16,13,3,1,'p')}),
    cometfox:sprite(({box,oval,line,gem})=>{line(17,15,22,8,'u');line(20,11,21,4,'l');line(19,14,23,11,'y');oval(12,16,7,4,'l');box(8,19,2,4,'u');box(16,19,2,4,'u');oval(6,12,4,4,'x');line(4,9,3,4,'u');line(8,9,10,4,'u');box(3,12,2,2,'k');gem(14,14,2,'y')}),
    moonray:sprite(({box,oval,line})=>{for(let i=0;i<8;i++){line(12,13,2+i,7+i,'l');line(12,13,22-i,7+i,'c')}oval(12,13,4,5,'e');line(12,17,16,23,'u');box(10,11,1,2,'k');box(14,11,1,2,'k');box(11,8,3,2,'y')}),
    astrowhale:sprite(({box,oval,line,gem})=>{oval(10,13,9,7,'n');oval(9,16,8,3,'l');line(18,13,22,7,'u');line(18,13,23,18,'u');box(4,12,2,2,'w');box(4,13,1,1,'k');line(8,18,10,22,'u');gem(12,9,2,'y');line(6,5,7,2,'c');line(9,5,11,2,'c')}),
    crystal_deco:sprite(({gem,line})=>{gem(10,14,8,'c');gem(17,17,5,'u');line(8,11,8,17,'w')},24,24),
    gear_deco:sprite(({box,oval})=>{for(let a=0;a<8;a++){const t=a*Math.PI/4;box(Math.round(12+Math.cos(t)*8)-1,Math.round(13+Math.sin(t)*8)-1,3,3,'b')}oval(12,13,8,8,'T');oval(12,13,5,5,'.');box(11,11,3,4,'Y')},24,24),
    star_deco:sprite(({gem,line})=>{line(5,18,12,6,'u');line(12,6,20,16,'u');gem(5,18,2,'y');gem(12,6,3,'y');gem(20,16,2,'y')},24,24),
  };
  const regions={
    crystal:{key:'crystal',name:tr('수정 동굴','Crystal Caverns','水晶洞窟'),icon:'gem',hint:tr('빛이 굴절되는 동굴','A cavern of refracted light','光が屈折する洞窟'),mobs:[
      {s:'gemite',n:tr('수정 진드기','Gem mite','水晶ダニ'),hp:38,atk:7,size:52,k:'ice',patterns:['single','pair']},
      {s:'prismbat',n:tr('프리즘 박쥐','Prism bat','プリズムコウモリ'),hp:22,atk:6,size:48,fly:1,k:'star',patterns:['single','stairD']},
      {s:'quartzsnail',n:tr('석영 달팽이','Quartz snail','石英カタツムリ'),hp:65,atk:7,size:56,k:'boulder',patterns:['single','double']}],
      boss:{s:'prismstag',n:tr('프리즘 사슴왕 루미','Lumi, the Prism Stag','プリズム鹿王ルミ'),hp:440,atk:20,size:195,k:'ice',patterns:['prism','pair','stairD'],phase2:['prism','refraction'],fair:true},relic:'prismcore'},
    clockwork:{key:'clockwork',name:tr('태엽 시계탑','Clockwork Tower','ぜんまい時計塔'),icon:'gear_deco',hint:tr('진자가 숨을 고르는 탑','A tower with a swinging pulse','振り子が息づく塔'),mobs:[
      {s:'cogling',n:tr('태엽 병정','Clockwork soldier','ぜんまい兵士'),hp:44,atk:8,size:52,k:'slash',patterns:['double','stairD']},
      {s:'pendulum',n:tr('진자 유령','Pendulum spirit','振り子の幽霊'),hp:28,atk:7,size:48,fly:1,k:'sonic',patterns:['pendulum','single'],fair:true},
      {s:'brassbeetle',n:tr('황동 풍뎅이','Brass beetle','真鍮コガネムシ'),hp:64,atk:9,size:56,k:'rock',patterns:['pair','double']}],
      boss:{s:'hourkeeper',n:tr('시간지기 똑딱','Ticktock, the Hourkeeper','時の番人チクタク'),hp:480,atk:22,size:205,k:'shock',patterns:['pendulum','double','stairU'],phase2:['pendulum','clockrush'],fair:true},relic:'clockspring'},
    astral:{key:'astral',name:tr('별빛 항로','Starlit Passage','星明かりの航路'),icon:'star',hint:tr('별들이 건너는 마지막 하늘길','The last skyway before the castle','星が渡る最後の空路'),mobs:[
      {s:'starjelly',n:tr('별 해파리','Star jelly','星クラゲ'),hp:32,atk:8,size:50,fly:1,k:'star',patterns:['pair','stairD']},
      {s:'cometfox',n:tr('혜성 여우','Comet fox','彗星キツネ'),hp:30,atk:9,size:52,k:'flame',patterns:['comettail','double'],fair:true},
      {s:'moonray',n:tr('초승달 가오리','Crescent ray','三日月エイ'),hp:42,atk:8,size:56,fly:1,k:'wind',patterns:['stairU','pair']}],
      boss:{s:'astrowhale',n:tr('별을 삼킨 고래 노바','Nova, the Star Whale','星を飲んだクジラ・ノヴァ'),hp:510,atk:23,size:220,fly:1,k:'star',patterns:['starfall','pair','comettail'],phase2:['starfall','orbitfall'],fair:true},relic:'starlamp'},
  };
  const relics=[
    {id:'prismcore',r:'l',bossOnly:true,name:tr('프리즘 심장','Prism Heart','プリズムの心臓'),icon:'gem',desc:tr('공명 발동 시 추적 파편탄 2발 추가','Resonance launches two extra homing shards','共鳴時に追尾する破片弾を2発追加')},
    {id:'clockspring',r:'l',bossOnly:true,name:tr('멈추지 않는 태엽','Endless Mainspring','止まらないぜんまい'),icon:'gear_deco',desc:tr('실제 회피 4번마다 모든 마법 대기시간 1.5초 감소','Every 4 real dodges reduce all spell cooldowns by 1.5s','実際の回避4回ごとに全魔法の待ち時間を1.5秒短縮')},
    {id:'starlamp',r:'l',bossOnly:true,name:tr('별고래의 등불','Star Whale Lantern','星クジラのランタン'),icon:'star',desc:tr('전투마다 별 3개. 피격 시 하나를 써 피해 30% 감소와 반격','3 stars per fight. Spend one on a hit to reduce damage 30% and counterattack','戦闘ごとに星3個。被弾時に1個使いダメージ30%減少と反撃')},
  ];
  const endings=[
    {id:'death_crystal',name:tr('수정 속에 남은 반짝임','A glimmer in the crystal','水晶に残ったきらめき'),icon:'gem'},
    {id:'death_clockwork',name:tr('시계탑에 멈춘 발걸음','Footsteps stopped in time','時計塔で止まった足音'),icon:'gear_deco'},
    {id:'death_astral',name:tr('하늘에 남은 작은 별','A little star in the sky','空に残った小さな星'),icon:'star'},
  ];
  const themes={
    crystal:{sky:['#383c7c','#9c9bd6'],far:'#5d5ca0',mid:'#777ac2',ground:['#a9bce0','#7b88bf'],speck:'rgba(50,50,120,.25)',deco:['crystal_deco','gem','crystal_deco','rock'],path:['#c3d2ee','#a7b7d9'],fore:['gem','rock'],sharp:1,vig:'rgba(28,25,80,.25)'},
    clockwork:{sky:['#795572','#edc19d'],far:'#8c6c80',mid:'#b28b91',ground:['#c9a685','#9c785f'],speck:'rgba(70,45,65,.25)',deco:['gear_deco','candle','gear_deco','rock'],path:['#d6bc86','#b29a70'],fore:['candle','gem'],tiles:1},
    astral:{sky:['#302957','#8976b8'],far:'#60508d',mid:'#8877b2',ground:['#c1b5dc','#8f7caf'],speck:'rgba(70,45,110,.25)',deco:['star_deco','gem','star_deco'],path:['#e2d5f0','#b8a3d7'],fore:['gem','flower2'],tiles:1,clouds:1},
  };
  const foods={crystal:[tr('수정 설탕 사탕','Crystal sugar candy','水晶砂糖の飴'),'gem'],clockwork:[tr('태엽 와플','Clockwork waffles','ぜんまいワッフル'),'gear_deco'],astral:[tr('별가루 푸딩','Stardust pudding','星屑プリン'),'star']};
  const patternNames={prism:tr('굴절 광선','Prism rays','屈折光線'),refraction:tr('쌍무지개','Twin rainbows','二重の虹'),pendulum:tr('진자 스윙','Pendulum swing','振り子スイング'),clockrush:tr('태엽 폭주','Clockwork rush','ぜんまい暴走'),starfall:tr('별비','Starfall','星の雨'),orbitfall:tr('궤도 낙하','Orbital rain','軌道落下'),comettail:tr('혜성 꼬리','Comet tail','彗星の尾')};
  return {tr,sprites,regions,relics,endings,themes,foods,patternNames};
}
