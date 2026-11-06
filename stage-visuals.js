// Installed after the original boss renderer. Shapes share its outline/flash passes.
Object.assign(BOSS_ART,{
  prismstag(x,f,t,ov){
    const b=Math.round(Math.sin(t*2)*1.2),c='#8fe3ff',d='#7e82cb',h='#e9faff',p='#b47bff';
    const parts=[['o',x+7,f-19+b,20,10,c],['l',x-3,f-14,x-7,f-1,4,d],['l',x+20,f-14,x+25,f-1,4,d],['l',x+8,f-14,x+10,f-1,3,c],['o',x-15,f-29+b,8,11,c],['o',x-21,f-24+b,8,5,h],
      ['l',x-19,f-38+b,x-24,f-57+b,3,p],['l',x-24,f-49+b,x-34,f-55+b,3,p],['l',x-24,f-48+b,x-17,f-56+b,2,h],['l',x-10,f-38+b,x-6,f-59+b,3,c],['l',x-6,f-50+b,x+3,f-56+b,3,c],['l',x-6,f-48+b,x-12,f-56+b,2,h],['l',x+26,f-22+b,x+31,f-29+b,3,p]];
    if(bparts(parts,ov))return;
    line(x-20,f-36+b,x-17,f-21+b,h,2);line(x-2,f-26+b,x+10,f-16+b,h,1);line(x+10,f-27+b,x+23,f-18+b,d,1);
    rect(x-22,f-31+b,3,2,'#38325e');rect(x-22,f-31+b,1,1,'#ffffff');rect(x-30,f-25+b,2,2,p);
    for(let i=0;i<3;i++){const xx=x+2+i*8,yy=f-27+b-(i%2)*2;disc(xx,yy,3,p);rect(xx,yy-2,1,3,h)}
    for(const xx of [-7,10,25])rect(x+xx-2,f-2,5,2,h);
    const q=0.4+0.2*Math.sin(t*4);G.globalAlpha=q;ring(x-17,f-49+b,22,8,c);G.globalAlpha=1;
  },
  hourkeeper(x,f,t,ov){
    const b=Math.round(Math.sin(t*2)),s=Math.round(Math.sin(t*2.6)*7),gold='#d9a85c',dark='#8a5a40',light='#ffe7a0',steel='#74769a';
    const parts=[['r',x-13,f-13,9,13,dark],['r',x+5,f-13,9,13,dark],['l',x-22,f-37+b,x-29,f-20+b,6,gold],['c',x-29,f-17+b,5,steel],['l',x+22,f-37+b,x+29,f-20+b,6,gold],['c',x+29,f-17+b,5,steel],
      ['r',x-18,f-40+b,36,28,dark],['c',x,f-40+b,21,gold],['c',x,f-40+b,17,light],['r',x-12,f-65+b,24,5,dark],['r',x-7,f-70+b,14,5,gold]];
    if(bparts(parts,ov))return;
    for(let i=0;i<12;i++){const a=i*Math.PI/6;rect(x+Math.round(Math.sin(a)*13)-1,f-40+b-Math.round(Math.cos(a)*13)-1,2,2,dark)}
    line(x,f-40+b,x+Math.round(Math.sin(t*.6)*10),f-40+b-Math.round(Math.cos(t*.6)*10),dark,2);
    line(x,f-40+b,x-7,f-36+b,'#c93a5a',2);disc(x,f-40+b,2,dark);
    line(x,f-24+b,x+s,f-12+b,steel,1);disc(x+s,f-11+b,4,gold);rect(x+s-1,f-13+b,2,2,light);
    rect(x-12,f-1,9,1,light);rect(x+5,f-1,9,1,light);rect(x-29,f-19+b,2,2,light);rect(x+29,f-19+b,2,2,light);
  },
  astrowhale(x,f,t,ov){
    const b=Math.round(Math.sin(t*1.8)*3),tail=Math.round(Math.sin(t*2.3)*5),blue='#6874bc',navy='#41477d',lilac='#c9baff',star='#ffd34d';
    const parts=[['l',x+25,f-29+b,x+41,f-42+b+tail,7,navy],['l',x+26,f-28+b,x+42,f-19+b-tail,7,navy],['o',x-1,f-30+b,30,18,blue],['o',x-7,f-22+b,23,8,lilac],['l',x-3,f-19+b,x+6,f-7+b,6,navy],['l',x-25,f-30+b,x-31,f-23+b,3,lilac]];
    if(bparts(parts,ov))return;
    line(x-24,f-22+b,x-10,f-22+b,navy,1);disc(x-17,f-35+b,3,'#ffffff');disc(x-18,f-35+b,1,navy);rect(x-23,f-29+b,4,2,'#ff9ab8');
    for(const [xx,yy] of [[-4,-41],[10,-36],[18,-29],[4,-30]]){rect(x+xx-2,f+yy+b,5,1,star);rect(x+xx,f+yy+b-2,1,5,star)}
    for(let i=0;i<3;i++){const a=t*2+i*2.1,xx=x-4+Math.round(Math.cos(a)*14),yy=f-57+b+Math.round(Math.sin(a)*4);disc(xx,yy,2,i%2?star:'#8fe3ff')}
    ring(x-4,f-57+b,15,5,'#a9c7ff');line(x-5,f-49+b,x-7,f-54+b,'#8fe3ff',1);
  },
});
Object.assign(BOSS_HALF,{prismstag:35,hourkeeper:35,astrowhale:44});

function drawExpansionBackdrop(key,time,scroll){
  if(key==='crystal'){
    for(let i=0;i<9;i++){
      const x=((i*43-scroll*.035)%300+300)%300-30,y=26+(i%3)*12,h=15+(i%4)*8;
      line(x,y-h,x-7,y+h,'#727bb7',5);line(x,y-h,x+8,y+h,'#a1c9e9',4);line(x,y-h,x,y+h,'#cdeaff',1);
      rect(x+12,y-12,1,1,Math.sin(time*2+i)>.2?'#ffffff':'#a1c9e9');
    }
  }else if(key==='clockwork'){
    const x=143,y=39;
    disc(x,y,27,'#8c6c80');ring(x,y,26,26,'#f4d6a0');ring(x,y,22,22,'#c49b80');
    for(let i=0;i<12;i++){const a=i*Math.PI/6;rect(x+Math.sin(a)*20,y-Math.cos(a)*20,2,2,'#f4d6a0')}
    line(x,y,x+Math.sin(time*.12)*17,y-Math.cos(time*.12)*17,'#f4d6a0',2);line(x,y,x-10,y-5,'#d1af88',2);disc(x,y,2,'#f4d6a0');
    for(let j=0;j<3;j++){const gx=25+j*92,gy=24+(j%2)*28,r=10+j*2;for(let i=0;i<8;i++){const a=i*Math.PI/4+time*.2*(j%2?-1:1);rect(gx+Math.cos(a)*r-2,gy+Math.sin(a)*r-2,4,4,'#a17d87')}ring(gx,gy,r-2,r-2,'#b59a99');ring(gx,gy,4,4,'#b59a99')}
  }else if(key==='astral'){
    for(let i=0;i<42;i++){const x=(i*67+13)%LW,y=(i*29+9)%74;rect(x,y,1+(i%11===0?1:0),1,Math.sin(time*1.4+i)>.3?'#fff4dc':'#b6a6d8')}
    oval(177,31,29,9,'#a08ac4');disc(177,27,17,'#d7b3d8');oval(177,30,29,3,'#ead4e8');disc(172,23,3,'#e6c8e1');disc(182,30,2,'#b08fc2');
    const xx=((time*12+scroll*.015)%300)-30;line(xx,18,xx+13,12,'#bdc4ef',1);rect(xx+13,12,2,2,'#fff4dc');
  }
}

function drawExpansionIntent(B){
  if(!B.intent||B.result)return;
  const m=B.mobs.find(m=>!m.dead&&m.boss);if(!m)return;
  hiText(B.intent.name,152,46,5.2,'#fff4dc');
}
