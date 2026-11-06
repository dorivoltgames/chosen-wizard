/* Fate Crossroads: story content and progression. No network or browser dependencies. */
function createFateUpdate({lang = 'ko', context}) {
  const tr = (ko, en, ja) => ({ko, en, ja}[lang] || en);
  const pathOrder = ['hero', 'forbidden', 'home'];
  const paths = {
    hero: {icon:'sword', name:tr('영웅의 길','The hero’s road','英雄の道'), desc:tr('시험과 전투 · 누구를 지킬지 선택해','Trials and battles · choose who to protect','試験と戦闘 · 誰を守るか選ぼう')},
    forbidden: {icon:'scroll', name:tr('금지마법의 길','Forbidden magic','禁じられた魔法の道'), desc:tr('연구와 대가 · 힘과 소중한 것 사이에서','Research and sacrifice · power has a price','研究と代償 · 力と大切なものの間で')},
    home: {icon:'house_big', name:tr('고향의 길','A life at home','故郷の道'), desc:tr('생업과 이웃 · 작은 마을의 미래를 바꿔','Work and neighbors · shape your village','仕事と隣人 · 小さな村の未来を変えよう')},
  };
  const endings = [
    {id:'oathkeeper',icon:'sword',name:tr('약속을 지킨 영웅','The promise keeper','約束を守った英雄')},
    {id:'unchosen',icon:'star',name:tr('스스로 운명을 고른 마법사','A wizard by choice','自分で運命を選んだ魔法使い')},
    {id:'sealed',icon:'scroll',name:tr('마지막 봉인의 수호자','Keeper of the final seal','最後の封印の守り手')},
    {id:'truth',icon:'book',name:tr('금지된 진실의 기록자','Chronicler of forbidden truth','禁じられた真実の記録者')},
    {id:'nameless',icon:'ghost',name:tr('이름을 잃고 세상을 구한 자','The savior without a name','名を失い世界を救った者')},
    {id:'village_union',icon:'house_big',name:tr('아무도 떠나지 않는 마을','The village where everyone stays','誰も離れない村')},
    {id:'dream_school',icon:'book',name:tr('누구나 마법사가 되는 학교','A school for every dream','誰もが魔法使いになれる学校')},
    {id:'bread_peace',icon:'heart',name:tr('마왕과 빵을 나눈 제빵사','The baker who fed the Demon Lord','魔王とパンを分け合ったパン職人')},
  ];
  const state = L => L.fate || (L.fate = {path:null, learned:null, choices:[], trust:0, ambition:0, care:0, research:0, bonds:0, craft:null, work:0});
  const ctx = () => context();
  function* choose(L, key, text, options, icon='star') {
    const s=state(L), e={age:L.age,text,icon,d:[],major:true,theme:L.theme,fateKey:key,
      opts:options.map(o=>o.label), paths:options.some(o=>o.desc)?options.map(o=>({name:o.label,desc:o.desc||'',icon:o.icon||icon})):undefined};
    L.log.push(e);
    const value=yield {t:'choice',e};
    const k=Number.isInteger(value)&&value>=0&&value<options.length?value:0, o=options[k];
    e.picked=o.label; s.choices.push({key,pick:k});
    if(o.effect) o.effect(s,L);
    if(o.d) ctx().applyD(L,o.d);
    if(o.result) yield* ctx().say(L,o.result,icon,null,true);
    return k;
  }
  function* choosePath(L, adult=false) {
    const s=state(L);
    const adultDescriptions={hero:tr('약속과 동료 · 마왕성으로 떠나는 모험','Promises and companions · a journey to the castle','約束と仲間 · 魔王城への冒険'),forbidden:tr('신뢰와 연구 · 마지막 봉인을 풀 해답','Trust and research · answers to the final seal','信頼と研究 · 最後の封印への答え'),home:tr('생업과 이웃 · 다음 세대에 남길 것','Work and neighbors · what you leave behind','仕事と隣人 · 次の世代に残すもの')};
    const k=yield* choose(L,adult?'adult_path':'school_path',adult?
      tr('성인식. 배운 것을 어떤 삶에 쓸까? 처음의 꿈과 다른 길을 골라도 괜찮아.','Coming of age. What life will you build? You may choose a different road from your childhood dream.','成人の日。学んだことをどんな人生に使おう？ 子どもの頃と違う道でも大丈夫。'):
      tr('일곱 살, 세 통의 초대장이 왔다. 어디에서 마법을 배울까?','At seven, three invitations arrive. Where will you learn magic?','七歳、三通の招待状が届いた。どこで魔法を学ぼう？'),
      pathOrder.map(id=>({label:paths[id].name,desc:adult?adultDescriptions[id]:paths[id].desc,icon:paths[id].icon})), 'scroll');
    s.path=pathOrder[k]; if(!adult)s.learned=s.path;
    ctx().track((adult?'adult_':'school_')+s.path,L);
    return s.path;
  }
  function* memory(L) {
    const m=L.legacy;
    if(!m)return;
    const ending=ctx().ending(m.end);
    yield* ctx().say(L,tr(`마을 도서관에서 「${ending}」 이야기를 읽었다. 옛 마법사 ${m.name}의 여백에는 "네 삶은 네가 골라"라고 적혀 있었다.`,`In the village library, you read “${ending}.” In the margin, the old wizard ${m.name} wrote: “Choose your own life.”`,`村の図書館で「${ending}」の物語を読んだ。昔の魔法使い${m.name}は余白に「自分の人生は自分で選んで」と書き残していた。`),'book',null,true);
  }
  function* upbringing(L) {
    const s=state(L); L.tier='local';
    if(s.path==='forbidden') {
      yield* ctx().chapter(L,'school','idle',tr('별 없는 서고','The hidden archive','星のない書庫'),tr('금지마법 수련','Forbidden studies','禁術の修行'));
      yield* choose(L,'archive_entry',tr('서고 문은 재능을 묻지 않았다. 첫 주문은 어둠 속에서 길을 찾는 법이었다.','The archive never asks about talent. Your first spell finds a way through darkness.','書庫の扉は才能を問わなかった。最初の呪文は、暗闇で道を見つける方法だった。'),[
        {label:tr('함께 읽을 친구를 부른다','Invite a friend to read','一緒に読む友だちを呼ぶ'),effect:s=>{s.trust++;s.bonds++},d:{int:35,f:'bestfriend'},result:tr('틀린 문장을 서로 고쳐 주었다. 위험한 주문도 둘이 읽으면 조금 덜 무서웠다.','You correct each other’s mistakes. Even a dangerous spell feels less frightening together.','間違いを直し合った。危険な呪文も二人で読めば少し怖くなかった。')},
        {label:tr('혼자 가장 깊은 서가로 간다','Explore the deepest shelves alone','一人で一番奥の書架へ'),effect:s=>{s.research+=2;s.ambition++},d:{int:50},result:tr('아무도 풀지 못한 문장을 해독했다. 책장이 네 이름을 기억했다.','You decipher a sentence nobody could read. The shelves remember your name.','誰も読めなかった一文を解いた。書架が君の名前を覚えた。')},
      ],'book');
      L.age=12;
      yield* choose(L,'archive_echo',tr('거울 속의 미래가 말했다. "더 강해지려면 기억 하나를 내놔."','Your future self speaks from a mirror: “Give up one memory to become stronger.”','鏡の中の未来が言った。「強くなるなら、記憶を一つちょうだい。」'),[
        {label:tr('마법으로 풀던 숙제를 잊는다','Give up a memory of homework','宿題の記憶を渡す'),effect:s=>{s.research++;s.ambition++},d:{int:25},result:tr('숙제는 처음부터 다시 했다. 힘을 얻었지만, 대가를 고르는 책임도 네 몫이었다.','You redo your homework. Power is yours, and so is responsibility for its price.','宿題は最初からやり直した。力も、代償を選ぶ責任も君のものだった。')},
        {label:tr('친구와 다른 해답을 찾는다','Find another answer with a friend','友だちと別の答えを探す'),effect:s=>{s.trust++;s.bonds++},d:{int:15,spd:20},result:tr('거울 뒤의 오래된 마법진을 고쳤다. 기억을 빼앗지 않아도 불은 켜졌다.','You repair the old circle behind the mirror. Its light needs no stolen memory.','鏡の裏の古い魔法陣を直した。記憶を奪わなくても明かりはついた。')},
      ],'ghost');
      L.age=16;
      yield* choose(L,'archive_oath',tr('졸업 연구. 봉인된 주문의 첫 장을 세상에 공개할까?','Your final research: should the first page of a sealed spell be made public?','卒業研究。封印された呪文の最初のページを公開しようか？'),[
        {label:tr('위험과 대처법까지 기록한다','Publish the risks and safeguards','危険と対策も記録する'),effect:s=>{s.trust++;s.research++},d:{int:20,fame:10},result:tr('누군가 다칠 때까지 비밀로 두지 않기로 했다. 친구가 첫 독자가 됐다.','You refuse to wait for an accident. Your friend becomes the first reader.','誰かが傷つくまで秘密にしないと決めた。友だちが最初の読者になった。')},
        {label:tr('혼자 쓸 수 있도록 감춘다','Keep the spell for yourself','自分だけの呪文にする'),effect:s=>{s.ambition+=2;s.research++},d:{int:35},result:tr('책에 네 이름의 자물쇠를 걸었다. 서고가 조용히 어두워졌다.','You lock the book with your name. The archive grows quietly darker.','本に自分の名前の鍵をかけた。書庫が静かに暗くなった。')},
      ],'scroll');
    } else {
      yield* ctx().chapter(L,L.origin.theme,'idle',tr('마을의 작은 배움터','The village workshop','村の小さな学び舎'),tr('고향 수련','Village apprenticeship','故郷での修行'));
      yield* choose(L,'village_craft',tr('마법을 써서 누군가의 하루를 바꿔 보고 싶다. 누구에게 배울까?','You want magic to brighten someone’s day. Who will teach you?','魔法で誰かの一日を変えたい。誰に教わろう？'),[
        {label:tr('빵집에서 반죽을 배운다','Learn at the bakery','パン屋で生地をこねる'),effect:s=>s.craft='bakery',d:{hp:80,int:20},result:tr('첫 빵은 돌처럼 딱딱했다. 그래도 친구는 한 조각을 끝까지 먹어 줬다.','Your first loaf is hard as a rock. Your friend still finishes a slice.','最初のパンは石のようだった。それでも友だちは一切れを食べきってくれた。')},
        {label:tr('아이들에게 마법을 가르친다','Teach magic to the children','子どもたちに魔法を教える'),effect:s=>s.craft='teacher',d:{int:40},result:tr('입학시험에 떨어진 아이도 초대했다. 첫 수업은 실패한 주문으로 꽃 피우기였다.','You invite a child who failed the entrance exam. Lesson one makes flowers from failed spells.','入学試験に落ちた子も招いた。最初の授業は失敗した呪文で花を咲かせることだった。')},
        {label:tr('장터에서 가게 일을 배운다','Learn to trade at the market','市場で商売を学ぶ'),effect:s=>s.craft='merchant',d:{gold:60,int:20},result:tr('물건보다 손님의 사정을 먼저 배웠다. 외상 장부의 첫 줄은 친구 이름이었다.','You learn your customers’ stories before your stock. Your friend is first in the credit book.','品物より先にお客さんの事情を学んだ。掛け帳の最初の行は友だちの名前だった。')},
      ],'house_big');
      L.age=12;
      yield* choose(L,'village_friend',tr('친구가 수업료를 잃어버렸다. 오늘은 네 첫 장사 날이기도 하다.','Your friend lost their tuition money. Today is also your first day of business.','友だちが授業料をなくした。今日は君の初めての商売の日でもある。'),[
        {label:tr('같이 찾고 수업까지 데려다준다','Help search and walk them to class','一緒に探して授業まで送る'),effect:s=>{s.care++;s.bonds++},d:{spd:25,fame:8,f:'bestfriend'},result:tr('첫 손님은 놓쳤다. 다음 날 친구가 반 아이들을 전부 데려왔다.','You miss your first customer. The next day your friend brings the whole class.','最初のお客さんを逃した。翌日、友だちはクラス全員を連れてきた。')},
        {label:tr('가게를 지키고 저녁에 찾아간다','Keep working, then visit that evening','店を守り、夕方に訪ねる'),effect:s=>s.work++,d:{gold:35,spd:20},result:tr('첫 수입으로 저녁거리를 샀다. 친구와 늦은 밥을 나눠 먹었다.','Your first earnings buy dinner. You share a late meal with your friend.','初めての稼ぎで夕食を買った。友だちと遅いご飯を分け合った。')},
      ],'heart');
      L.age=16;
      yield* choose(L,'village_future',tr('왕도에서 더 큰 가게를 함께 열자는 편지가 왔다.','A letter from the capital offers you a bigger business.','王都から、もっと大きな店を開こうという手紙が届いた。'),[
        {label:tr('마을 사람들과 공동 작업장을 만든다','Build a workshop with the villagers','村のみんなと共同工房を作る'),effect:s=>{s.care++;s.bonds++},d:{int:25,hp:60},result:tr('작업장은 작았지만 열쇠는 모두에게 있었다. 친구가 간판을 그려 줬다.','The workshop is small, but everyone has a key. Your friend paints the sign.','工房は小さかったけれど、みんなが鍵を持っていた。友だちが看板を描いた。')},
        {label:tr('왕도와 거래하되 고향에 남는다','Trade with the capital from home','故郷から王都と取引する'),effect:s=>{s.work++;s.ambition++},d:{gold:80,int:20},result:tr('고향 주소가 찍힌 상자가 왕도로 떠났다. 작은 마을에 주문서가 쌓이기 시작했다.','Boxes bearing your village’s address leave for the capital. Orders begin to pile up.','故郷の住所が書かれた箱が王都へ旅立った。小さな村に注文が積もり始めた。')},
      ],'coin');
    }
    L.age=17;
    yield* ctx().say(L,tr('졸업장 대신, 네 손으로 완성한 첫 작품을 받았다. 이제 이 배움을 어디에 쓸지는 네 몫이다.','Instead of a diploma, you receive your first finished work. Where you take it is up to you.','卒業証書の代わりに、自分の手で完成させた最初の作品を受け取った。これをどこで使うかは君次第だ。'),'star',null,true);
  }
  function* forbiddenLife(L) {
    const s=state(L);
    yield* ctx().chapter(L,'school','idle',paths.forbidden.name,tr('첫 번째 금서','The first forbidden book','最初の禁書'));
    L.age=19;
    const k=yield* choose(L,'forbidden_gate',tr('마을 아래의 봉인이 갈라졌다. 금서는 틈을 닫는 데 세 장의 해답이 필요하다고 속삭인다.','The seal beneath the village cracks. The forbidden book whispers that three answers can close it.','村の地下の封印が割れた。禁書は、三つの答えがあれば閉じられるとささやいた。'),[
      {label:tr('친구에게 비밀을 털어놓는다','Tell your friend the truth','友だちに秘密を打ち明ける'),effect:s=>{s.trust++;s.bonds++},d:{fame:10},result:tr(`친구 ${L.friend}가 등불을 들고 왔다. "처음부터 같이 읽자."`,`${L.friend} arrives with a lantern. “Let’s read it together, from the beginning.”`,`友だちの${L.friend}がランプを持ってきた。「最初から一緒に読もう。」`)},
      {label:tr('기억 한 조각으로 금서를 깨운다','Awaken the book with a memory','記憶の欠片で禁書を起こす'),effect:s=>{s.ambition++;s.research+=2},d:{int:20},result:tr('어릴 때 먹던 수프 맛이 기억나지 않는다. 대신 숨겨진 문장이 나타났다.','You forget the taste of childhood soup. A hidden sentence appears in its place.','子どもの頃のスープの味を思い出せない。代わりに隠れた一文が現れた。')},
    ],'scroll');
    L.age=22;
    yield* choose(L,'forbidden_price',k===0?tr('친구가 깨달았다. 봉인은 괴물을 가둔 감옥이 아니라, 오래전 마법사의 실수를 막는 뚜껑이었다.','Your friend realizes the seal is no monster’s prison. It covers an old wizard’s mistake.','友だちが気づいた。封印は怪物の牢ではなく、昔の魔法使いの失敗を覆う蓋だった。'):tr('빼앗긴 기억이 금서의 뒷장에 적혀 있다. 더 읽으면 진실과 함께 또 무언가를 잃게 된다.','Your lost memory is written on the last page. Reading further will cost you something else.','失った記憶が禁書の最後のページにあった。続きを読むと、真実とともに何かを失う。'),[
      {label:tr('모두에게 경고하고 함께 연구한다','Warn everyone and research together','みんなに警告し、一緒に研究する'),effect:s=>{s.trust++;s.research++},result:tr('숨기고 싶던 실패를 광장에 적었다. 마을 사람들은 도망치지 않고 분필을 들었다.','You write the failure in the square. The villagers pick up chalk instead of running away.','隠したかった失敗を広場に書いた。村人は逃げずにチョークを手に取った。')},
      {label:tr('내 이름을 담보로 끝까지 읽는다','Pledge your name and read on','自分の名前を担保に読みきる'),effect:s=>{s.ambition++;s.research+=2;s.namePledged=true},result:tr(`책에서 ${L.name}라는 글자가 사라졌다. 친구는 잊지 않으려고 손바닥에 네 이름을 썼다.`,`The letters of ${L.name} vanish from the book. Your friend writes your name on their palm.`,`本から${L.name}の文字が消えた。友だちは忘れないよう、手のひらに君の名前を書いた。`)},
    ],'ghost');
    L.age=25;
    const options=[
      {label:tr('마력을 내려놓고 봉인을 완성한다','Give up your magic to finish the seal','魔力を手放して封印を完成させる'),result:tr('더는 주문을 쓸 수 없다. 대신 아침마다 마을의 모든 창문이 환하게 열린다.','You can no longer cast spells. Every morning, all the village windows open to the light.','もう呪文は使えない。その代わり、毎朝すべての家の窓が明るく開く。')},
    ];
    if(s.trust>=2) options.push({label:tr('모두의 연구를 공개해 새 마법을 만든다','Publish everyone’s work and create a new spell','みんなの研究を公開し、新しい魔法を作る'),result:tr('한 사람의 금서가 모두의 교과서가 됐다. 틈은 닫혔고, 누구도 기억을 잃지 않았다.','One person’s forbidden book becomes everyone’s textbook. The crack closes. No memories are lost.','一人の禁書がみんなの教科書になった。裂け目は閉じ、誰も記憶を失わなかった。')});
    if(s.research>=3) options.push({label:tr('이름을 마지막 주문으로 바친다','Offer your name as the final spell','名前を最後の呪文として捧げる'),result:tr('세상은 네 이름을 잊었다. 그래도 친구는 빈 의자에 매일 따뜻한 차를 놓았다.','The world forgets your name. Your friend still leaves warm tea beside an empty chair.','世界は君の名を忘れた。それでも友だちは空いた椅子に毎日温かいお茶を置いた。')});
    const final=yield* choose(L,'forbidden_final',tr('마지막 장이 열렸다. 힘을 얻는 일이 아니라, 무엇을 지킬지 고르는 일이 남았다.','The final page opens. The question is no longer what power to gain, but what to protect.','最後のページが開いた。残ったのは、得る力ではなく守るものを選ぶことだった。'),options,'star');
    const label=options[final].label;
    const end=label===tr('모두의 연구를 공개해 새 마법을 만든다','Publish everyone’s work and create a new spell','みんなの研究を公開し、新しい魔法を作る')?'truth':label===tr('이름을 마지막 주문으로 바친다','Offer your name as the final spell','名前を最後の呪文として捧げる')?'nameless':'sealed';
    L.age+=50;
    yield* ctx().finish(L,end,tr(`${L.age}세, 서고에 남긴 세 장의 해답이 다음 세대의 등불이 됐다.`,`At ${L.age}, your three answers in the archive become a lantern for the next generation.`,`${L.age}歳、書庫に残した三つの答えが次の世代の灯りになった。`));
  }
  function* villageLife(L) {
    const s=state(L);
    yield* ctx().chapter(L,L.origin.theme,'idle',paths.home.name,L.origin.name);
    if(!s.craft) {
      yield* choose(L,'home_craft',tr('고향에서 어떤 일을 시작할까?','What will you build at home?','故郷でどんな仕事を始めよう？'),[
        {label:tr('빵집을 연다','Open a bakery','パン屋を開く'),effect:s=>s.craft='bakery'},
        {label:tr('작은 학교를 연다','Open a little school','小さな学校を開く'),effect:s=>s.craft='teacher'},
        {label:tr('장터 가게를 연다','Open a market stall','市場に店を開く'),effect:s=>s.craft='merchant'},
      ],'house_big');
    }
    L.age=23;
    const opening={bakery:tr('노래하는 빵 냄새에 손님들이 줄을 섰다. 첫 수입을 어디에 쓸까?','Your singing bread draws a queue. How will you use your first earnings?','歌うパンの香りに行列ができた。初めての売上を何に使おう？'),teacher:tr('입학시험 없는 학교에 아이들이 모였다. 첫 후원금을 어디에 쓸까?','Children arrive at your school with no entrance exam. How will you use the first donation?','入学試験のない学校に子どもが集まった。最初の寄付を何に使おう？'),merchant:tr('고향 물건을 찾는 주문이 쌓였다. 첫 수입을 어디에 쓸까?','Orders for your village’s goods pile up. How will you use the first earnings?','故郷の品を求める注文が積もった。初めての売上を何に使おう？')}[s.craft];
    yield* choose(L,'home_invest',opening,[
      {label:tr('이웃과 나눌 공동 공간을 만든다','Build a shared space for neighbors','隣人と使う共同スペースを作る'),effect:s=>{s.care++;s.bonds++},d:{fame:15},result:tr('비를 피할 곳과 따뜻한 밥이 생겼다. 친구가 저녁마다 일손을 보탰다.','There is shelter from rain and a warm meal. Your friend helps every evening.','雨宿りする場所と温かいご飯ができた。友だちが毎晩手伝いに来た。')},
      {label:tr('설비와 거래처를 늘린다','Expand your equipment and trade','設備と取引先を増やす'),effect:s=>{s.work+=2;s.ambition++},d:{gold:100},result:tr('큰 주문을 소화할 수 있게 됐다. 바쁜 날에도 고향 이름만은 간판에서 지우지 않았다.','You can fill bigger orders. Even on busy days, your village’s name stays on the sign.','大きな注文にも応えられるようになった。忙しくても看板から故郷の名は消さなかった。')},
    ],'coin');
    L.age=31;
    yield* choose(L,'home_crisis',tr('마왕군의 행군으로 길이 막혔다. 밀가루도 책도 장터에 도착하지 않는다.','The Demon Lord’s army blocks the road. Neither flour nor books can reach the market.','魔王軍の行進で道が閉ざされた。小麦粉も本も市場に届かない。'),[
      {label:tr('이웃과 남은 재료를 함께 쓴다','Pool the remaining supplies','残った材料を隣人と分け合う'),effect:s=>{s.care++;s.bonds++},result:tr(s.care>=1?'어릴 때 도왔던 사람들이 재료를 들고 돌아왔다. 혼자였다면 닫았을 문이 다시 열렸다.':'가진 것은 적었지만 모두가 조금씩 보탰다. 작은 장터가 다시 열렸다.',s.care>=1?'People you helped return with supplies. Doors that would have shut reopen.':'Everyone brings a little. The small market opens again.',s.care>=1?'昔助けた人々が材料を持って戻ってきた。一人なら閉じていた扉がまた開いた。':'少しずつ持ち寄り、小さな市場がまた開いた。')},
      {label:tr('마왕군에 직접 거래를 제안한다','Negotiate directly with the army','魔王軍と直接交渉する'),effect:s=>{s.tradePeace=true;s.work++},d:{fame:10},result:tr('꼬마 악마도 배가 고팠다. 빵과 약을 나누는 동안, 창을 든 손이 조금씩 내려갔다.','The little imps are hungry too. As bread and medicine change hands, spears slowly lower.','小さな悪魔もお腹を空かせていた。パンと薬を渡すうち、槍を持つ手が少しずつ下がった。')},
      {label:tr('마을을 지킬 방벽을 만든다','Build a barrier around the village','村を守る結界を作る'),effect:s=>s.guarded=true,d:{hp:60,fame:20},result:tr('아이들이 그린 마법진을 어른들이 이어 그렸다. 길은 막혀도 마을의 밤은 안전했다.','Adults join the circles drawn by children. The road is blocked, but nights are safe.','子どもが描いた魔法陣を大人がつないだ。道が閉ざされても村の夜は安全だった。')},
    ],'castle');
    L.age=42;
    const options=[
      {label:tr('내가 시작한 일을 끝까지 키운다','Keep growing the work you began','始めた仕事を育て続ける'),end:s.craft==='bakery'?'bakery':s.craft==='teacher'?'teacher':'merchant',result:tr('작은 간판 아래 여러 세대의 추억이 쌓였다. 마을 사람들은 네 가게가 있는 길을 집으로 가는 길이라 불렀다.','Generations of memories gather under your sign. The villagers call your street the way home.','小さな看板の下に何世代もの思い出が積もった。村人はその通りを、家へ帰る道と呼んだ。')},
    ];
    if(s.care>=2)options.push({label:tr('모두가 주인인 마을을 만든다','Make the village belong to everyone','みんなが主役の村を作る'),end:'village_union',result:tr('장부 맨 앞에 이웃들의 이름을 적었다. 가난해서 떠나야 하는 사람은 더 없었다.','You write your neighbors’ names at the front of the ledger. Nobody must leave because they are poor.','帳簿の先頭に隣人の名を書いた。貧しさのせいで村を離れる人はいなくなった。')});
    if(s.craft==='teacher'&&(s.care>=1||s.bonds>=2))options.push({label:tr('재능을 묻지 않는 학교를 연다','Open a school that never asks for talent','才能を問わない学校を開く'),end:'dream_school',result:tr('왕도에서 떨어진 아이도, 꼬마 악마도 같은 교실에 앉았다. 첫 숙제는 서로의 이름 외우기였다.','Rejected students and little imps share a classroom. Their first homework is learning each other’s names.','王都で落ちた子も小さな悪魔も同じ教室に座った。最初の宿題はお互いの名前を覚えることだった。')});
    if(s.craft==='bakery'&&s.tradePeace)options.push({label:tr('마왕을 첫 평화 축제에 초대한다','Invite the Demon Lord to a peace feast','魔王を初めての平和祭に招く'),end:'bread_peace',result:tr('마왕이 왕관 대신 앞치마를 둘렀다. "다음엔 내가 반죽하지." 전쟁터에 빵집이 생겼다.','The Demon Lord wears an apron instead of a crown. “I’ll knead next time.” A bakery replaces the battlefield.','魔王は冠の代わりにエプロンをつけた。「次は私がこねよう。」戦場にパン屋ができた。')});
    if(s.guarded)options.push({label:tr('다음 세대에게 마을의 방패를 맡긴다','Pass the village shield to the next generation','次の世代へ村の盾を託す'),end:'guard',result:tr('마법진을 그리던 아이들이 수비대가 됐다. 네가 잠든 밤에도 마을의 불은 꺼지지 않았다.','The children who drew the circles become the village guard. Its lights stay on while you sleep.','魔法陣を描いた子どもたちが守備隊になった。君が眠る夜も村の灯りは消えなかった。')});
    // The old hometown endings remain reachable through a deliberate choice, rather than a random flag race.
    if(L.origin.id==='potato')options.push({label:tr('황금 감자를 마을의 명물로 키운다','Make golden potatoes the village specialty','黄金のじゃがいもを村の名物にする'),end:'potato'});
    if(L.st.int>=100)options.push({label:tr('왕궁에 고향의 마법을 전한다','Bring your village’s magic to court','王宮に故郷の魔法を伝える'),end:'court'});
    if(L.origin.id==='forest'||ctx().has(L,'beastspeak'))options.push({label:tr('숲을 지키는 사냥꾼이 된다','Become the forest’s guardian hunter','森を守る狩人になる'),end:'hunter'});
    options.push({label:tr('가게를 물려주고 평온하게 살아간다','Pass on your work and live quietly','仕事を譲って穏やかに暮らす'),end:'quiet'});
    const final=yield* choose(L,'home_final',tr('세월이 흘렀다. 무엇을 다음 세대에 남길까?','The years pass. What will you leave to the next generation?','年月が流れた。次の世代に何を残そう？'),options,'heart');
    L.age=82+Math.floor(L.rng()*16);
    yield* ctx().finish(L,options[final].end,tr(`${L.age}세, 네가 바꾼 마을에서 이웃들의 인사를 받으며 잠들었다.`,`At ${L.age}, you rest in the village you changed, surrounded by your neighbors.`,`${L.age}歳、自分が変えた村で、隣人たちに見守られ眠りについた。`));
  }
  function* heroBeat(L,stage) {
    const s=state(L);
    if(stage===0) {
      yield* choose(L,'hero_promise',tr('출발하던 날, 마을 아이들이 약속을 부탁했다. "꼭 돌아와서 이야기를 들려줘."','As you leave, the children ask for a promise: “Come back and tell us your story.”','旅立ちの日、村の子どもたちが約束を願った。「帰ってきて、お話を聞かせてね。」'),[
        {label:tr('돌아올 약속을 새긴다 · 회복 물약','Promise to return · healing potion','帰る約束をする · 回復薬'),effect:s=>{s.promised=true;s.bonds++},d:{mods:{potion:1}},result:tr('아이들이 지팡이에 실을 묶었다. 매듭마다 돌아갈 이유가 하나씩 생겼다.','The children tie threads around your staff. Every knot is another reason to return.','子どもたちが杖に糸を結んだ。一つの結び目ごとに、帰る理由が増えた。')},
        {label:tr('전설이 될 것을 약속한다 · 공격력 +8%','Promise to become a legend · attack +8%','伝説になると約束 · 攻撃力+8%'),effect:s=>s.ambition++,d:{mods:{dmg:1.08}},result:tr('마을에서 가장 높은 언덕에 네 이름을 새겼다. 언젠가 온 세상이 부르게 될 이름이었다.','You carve your name on the highest hill. One day, the whole world might speak it.','村で一番高い丘に名前を刻んだ。いつか世界中が呼ぶかもしれない名前だった。')},
      ],'heart');
    } else if(stage===2) {
      if(s.promised)yield* ctx().say(L,tr('길목에 익숙한 실이 묶인 보급 상자가 있었다. 아이들이 보낸 첫 답장이었다.','A supply box tied with familiar thread waits by the road. The children have sent their first reply.','道端に見覚えのある糸で結んだ補給箱があった。子どもたちからの最初の返事だった。'),'potion',{cur:0.25},true);
      yield* choose(L,'hero_friend',tr(`친구 ${L.friend}가 무너진 다리 너머에서 손을 흔든다. 돌아가면 보물이 있는 지름길을 놓친다.`,`${L.friend} waves from beyond a collapsed bridge. A rescue will cost you the shortcut to treasure.`,`友だちの${L.friend}が崩れた橋の向こうで手を振っている。助ければ宝への近道を逃してしまう。`),[
        {label:tr('돌아가서 친구를 구한다 · 함께 싸움','Go back for your friend · fight together','戻って友だちを救う · 共に戦う'),effect:s=>{s.rescued=true;s.bonds+=2},d:{mods:{dmg:1.1},f:'friendparty'},result:tr('친구가 흙 묻은 손을 잡았다. "이번엔 내가 너를 지킬게."','Your friend takes your muddy hand. “This time, I’ll protect you.”','友だちが泥だらけの手を握った。「今度は僕が君を守る。」')},
        {label:tr('구조 신호를 보내고 보물을 찾는다 · 120골드','Signal rescuers and seek the treasure · 120 gold','救助信号を送り宝を探す · 120ゴールド'),effect:s=>s.ambition++,d:{gold:120},result:tr('구조대의 불빛을 확인한 뒤 길을 떠났다. 주머니는 무거워졌지만 친구의 답장은 늦었다.','You leave once the rescue lanterns arrive. Your purse is heavier, but your friend’s reply is late.','救助隊の灯りを確認してから出発した。財布は重くなったが、友だちの返事は遅かった。')},
      ],'heart');
    } else if(stage===4) {
      yield* choose(L,'hero_final',tr('마왕성 앞. 무엇을 위해 마지막 문을 열까?','Before the Demon Lord’s castle: why will you open the last door?','魔王城の前。何のために最後の扉を開こう？'),[
        {label:tr('이름을 남기기보다 사람들을 지킨다 · 수호','Protect people before chasing glory · shield','名声より人々を守る · 守護'),effect:s=>s.protect=true,d:{mods:{guardian:1}},result:tr(s.rescued?'구해 준 친구가 옆에 섰다. 네가 고른 인연들이 마지막 문을 함께 밀었다.':'고향에서 묶어 준 실이 손목을 간질였다. 돌아갈 곳이 있다는 건 힘이었다.',s.rescued?'Your rescued friend stands beside you. The bonds you chose push the final door together.':'A thread from home brushes your wrist. Having somewhere to return to is a kind of strength.',s.rescued?'救った友だちが隣に立った。自分で選んだ絆が最後の扉を一緒に押した。':'故郷の糸が手首をくすぐった。帰る場所があるのは力だった。')},
        {label:tr('태어날 때 정해진 운명을 넘어선다 · 공격력 +10%','Go beyond the fate of your birth · attack +10%','生まれ持った運命を越える · 攻撃力+10%'),effect:s=>s.defy=true,d:{mods:{dmg:1.1}},result:tr('표식이 있든 없든, 문을 여는 손은 네 것이었다.','With or without a mark, the hand opening the door is yours.','印があってもなくても、扉を開く手は自分のものだった。')},
        {label:tr('예언이 가리킨 결말을 끝까지 본다','Follow the prophecy to its ending','予言の結末を見届ける'),effect:s=>s.original=true},
      ],'star');
    }
  }
  const heroEnding=L=>{const s=state(L);return s.protect&&s.promised&&s.rescued?'oathkeeper':s.defy&&!ctx().has(L,'chosen')?'unchosen':null};
  // Hints describe real predicates in the story. They never depend on a random roll alone.
  function hint(id) {
    const text={
      oathkeeper:tr('영웅의 길에서 돌아올 약속과 친구를 끝까지 지켜 봐.','On the hero’s road, keep your promise and stand by your friend.','英雄の道で、帰る約束と友だちを最後まで守ろう。'),
      unchosen:tr('표식 없이 태어났어도 마지막 문 앞에서 운명을 넘어서 봐.','Without the Chosen mark, defy your birth before the final door.','印がなくても、最後の扉の前で運命を越えよう。'),
      sealed:tr('금지마법의 마지막 장. 힘을 내려놓는 선택도 있어.','At the last forbidden page, power can be given up.','禁術の最後のページ。力を手放す選択もある。'),
      truth:tr('금서를 혼자 읽지 말고, 두 번 이상 믿음을 쌓아 봐.','Share the forbidden book. Build trust at least twice.','禁書を一人で読まず、信頼を二度以上築こう。'),
      nameless:tr('금서의 비밀을 세 번 이상 연구하고 이름의 값을 알아봐.','Research at least three secrets, then learn the price of a name.','禁書の秘密を三つ以上研究し、名前の代価を知ろう。'),
      village_union:tr('고향의 삶에서 이웃을 두 번 이상 먼저 생각해 봐.','At home, put your neighbors first at least twice.','故郷で、二度以上隣人を優先してみよう。'),
      dream_school:tr('고향에서 가르치는 일을 배우고, 아이들과 인연을 쌓아 봐.','Learn to teach at home, and build bonds with the children.','故郷で教える仕事を学び、子どもたちと絆を結ぼう。'),
      bread_peace:tr('고향에서 빵집을 열고, 막힌 길 너머의 손님과 거래해 봐.','Open a bakery, then trade with those beyond the blocked road.','故郷でパン屋を開き、閉ざされた道の向こうと取引しよう。'),
      bakery:tr('고향의 길에서 빵을 배우고 끝까지 가게를 키워 봐.','Learn baking at home and grow your shop to the end.','故郷でパンを学び、最後まで店を育てよう。'),
      teacher:tr('고향에서 작은 학교를 열고 그 일을 이어가 봐.','Open a little school at home and continue teaching.','故郷で小さな学校を開き、教え続けよう。'),
      merchant:tr('고향에서 장터 일을 배우고 가게를 키워 봐.','Learn trade at home and grow your shop.','故郷で商売を学び、店を育てよう。'),
      guard:tr('고향이 위기에 처했을 때 방벽을 세워 봐.','Build a barrier when your village is in danger.','故郷の危機に結界を作ろう。'),
      potato:tr('감자밭 마을 출신이라면 고향의 명물을 떠올려 봐.','Born in Potato Field Village? Remember its specialty.','じゃがいも村の生まれなら、名物を思い出そう。'),
      court:tr('충분한 지능을 쌓고 고향의 마법을 왕궁에 전해 봐.','Reach 100 INT and bring your village’s magic to court.','知力を100まで高め、故郷の魔法を王宮に伝えよう。'),
      hunter:tr('엘프의 숲이나 동물과의 대화가 고향의 다른 길을 열어.','The Elf Forest or speaking with animals opens another life at home.','エルフの森や動物との会話が、故郷の別の道を開く。'),
      quiet:tr('고향에서 시작한 일을 물려주는 선택도 있어.','At home, you can pass your work to the next generation.','故郷の仕事を次の世代に譲る選択もある。'),
      hero:tr('영웅의 길 끝에서 예언의 결말을 보고 마왕을 이겨 봐.','Follow the prophecy to the end of the hero’s road and defeat the Demon Lord.','英雄の道で予言を見届け、魔王を倒そう。'),
      dragonrider:tr('따뜻한 알을 품고, 부화한 친구와 던전을 찾아가 봐.','Keep a warm egg, then visit the dungeon with your hatched friend.','温かな卵を育て、生まれた友だちとダンジョンへ。'),
      peace:tr('동물 말을 이해하거나 고양이와 노래를 좋아한다면, 마왕의 외로움에 귀 기울여 봐.','With animal speech, or song and a cat, listen for the Demon Lord’s loneliness.','動物の言葉、あるいは歌と猫があるなら、魔王の孤独に耳を傾けよう。'),
      family:tr('비밀이 많은 집안에서 태어났다면 마왕의 말을 들어 봐.','If your family has secrets, listen to the Demon Lord.','秘密の多い家に生まれたら、魔王の言葉を聞こう。'),
      gourmet:tr('대식가라면 여행 중 세 지역 이상에서 명물을 먹어 봐.','As a Glutton, eat specialties in at least three regions.','大食いなら旅先の三つ以上の名物を食べよう。'),
      talkshow:tr('수다쟁이는 몬스터 동료 둘과 마왕에게 말을 걸 수 있어.','A Chatterbox with two monster allies can talk to the Demon Lord.','おしゃべりならモンスター仲間二人と魔王に話しかけよう。'),
      shadow:tr('겁쟁이도 보스를 세 번 몰래 지나고 마왕을 이길 수 있어.','A Scaredy-cat can sneak past three bosses and still defeat the Demon Lord.','臆病でもボスを三度こっそり通り抜け、魔王を倒せる。'),
      beastking:tr('말을 걸어 몬스터 동료 셋과 마지막 전투에 도전해 봐.','Talk your way to three monster allies for the final battle.','話しかけてモンスター仲間を三人集め、最後の戦いへ。'),
    };
    if(text[id])return text[id];
    if(id.startsWith('death_'))return tr('모험의 서로 다른 지역에도 마지막 이야기가 남아 있어.','Every region of the adventure holds a final story.','冒険のそれぞれの土地にも、最後の物語がある。');
    return tr('타고난 특성과 만난 사람들의 제안을 따라 다른 선택을 해 봐.','Follow your traits and the offers of people you meet. Try a different choice.','生まれ持った特性や出会った人の誘いから、違う選択を試そう。');
  }
  function target(dx,L) {
    const s=L&&state(L);
    const order=s?.path==='forbidden'?['truth','sealed','nameless']:s?.path==='home'?['bread_peace','dream_school','village_union','bakery','teacher','merchant']:['sealed','bread_peace','dream_school','oathkeeper','unchosen','truth','village_union','nameless'];
    return order.find(id=>!dx.end?.[id])||endings.find(e=>!dx.end?.[e.id])?.id||null;
  }
  function dailyGoal(key) {
    let h=0;for(const c of key)h=(h*31+c.charCodeAt(0))>>>0;
    return [
      {id:'home',text:tr('오늘은 고향에 남아 하나의 삶을 완성하기','Today: finish a life at home','今日のお題：故郷で人生を完成させる'),check:L=>state(L).path==='home'},
      {id:'forbidden',text:tr('오늘은 금지마법의 마지막 장까지 읽기','Today: reach the last forbidden page','今日のお題：禁術の最後のページまで読む'),check:L=>state(L).path==='forbidden'},
      {id:'bonds',text:tr('오늘은 인연을 두 번 이상 선택하고 완주하기','Today: build two bonds and finish your life','今日のお題：絆を二つ以上結んで完走する'),check:L=>state(L).bonds>=2},
    ][h%3];
  }
  return {tr,paths,pathOrder,endings,state,choosePath,memory,upbringing,forbiddenLife,villageLife,heroBeat,heroEnding,hint,target,dailyGoal};
}
