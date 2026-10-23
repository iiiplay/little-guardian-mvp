/* Seeded simulation; the DOM and wall clock never own game state. */
const DungeonEngine = (() => {
  const B = Object.freeze({ maxHp:120, attack:6, attackEvery:.9, moveSpeed:1.4, heal:42, shield:6, rescueCooldown:18, rescues:2 });
  const titles=['初見微光','綠色訪客','小心頭頂','尖刺走廊','哥布林晚餐','交錯的足跡','振翅迴廊','寶庫守衛','最後的前廳','史萊姆的王冠'];
  const layouts=[
    ['...........','...........','..##...##..','...........','...........','.....#.....','...........','..#.....#..','..#.....#..','...........','...........','...........','...........'],
    ['...........','...#...#...','...#...#...','...........','...........','.##.....##.','...........','...........','...#...#...','...#...#...','...........','...........','...........'],
    ['...........','...........','..###.###..','...........','...........','.#.......#.','.#.......#.','...........','...........','..##...##..','...........','...........','...........'],
    ['...........','..#.....#..','..#.....#..','...........','.....#.....','...........','..##...##..','...........','.....#.....','...........','..#.....#..','...........','...........'],
    ['...........','...........','...#...#...','...#...#...','...........','.##.....##.','...........','.##.....##.','...........','...#...#...','...........','...........','...........']
  ];
  const levels=titles.map((title,i)=>Object.freeze({id:i+1,title,waves:3,count:i===0?3:4+(i>5?1:0),hp:23+i*6,damage:2.6+i*.2,trap:i>=3,boss:i===9,layout:layouts[i%5]}));
  function rng(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function begin(levelId,perks={},seed=levelId*1579,gear={}){
    const cfg=levels[levelId-1];if(!cfg)throw new Error('Unknown level');
    const map=['#############',...cfg.layout.map(r=>'#'+r+'#'),'#############'];
    const s={cfg,map,seed,random:rng(seed),status:'play',time:0,wave:0,waveWait:1.4,enemies:[],effects:[],events:[],loot:[],gearRewards:[],lootUid:0,kills:0,gold:0,charges:B.rescues,cooldown:0,chest:false,uid:0,
      hero:{x:6.5,y:12.5,hp:120,maxHp:120,atk:0,shield:0,flash:0,slash:0,face:1,moving:false},
      traps:cfg.trap?[{x:4.5,y:6.5},{x:8.5,y:6.5},{x:6.5,y:9.5}]:[]};applyGear(s,perks,gear);s.hero.hp=s.hero.maxHp;return s;
  }
  function applyGear(s,perks,gear){const h=s.hero,ratio=h.hp/h.maxHp;h.maxHp=B.maxHp+(perks.vitality||0)*24+(gear.hp||0);h.hp=Math.min(h.maxHp,h.maxHp*ratio);h.attack=B.attack+(perks.power||0)*2+(gear.attack||0);h.armor=(perks.armor||0)*.6+(gear.armor||0);h.attackEvery=B.attackEvery*Math.pow(.85,perks.haste||0)/(1+Math.min(.4,gear.haste||0));}
  function collect(s,id,manual=true){if(s.status!=='play')return false;const drop=s.loot.find(d=>d.id===id);if(!drop)return false;s.loot=s.loot.filter(d=>d.id!==id);if(drop.kind==='coin'){s.gold+=drop.amount;effect(s,drop.x,drop.y,'+'+drop.amount,'#f5d18a');}else{s.hero.hp=Math.min(s.hero.maxHp,s.hero.hp+drop.amount);effect(s,drop.x,drop.y,'回復 +'+drop.amount,'#a7ebcf');}emit(s,'pickup',{kind:drop.kind,manual});return true;}
  function openChest(s,manual=true){if(s.status!=='play'||s.chest||s.kills<s.cfg.count)return false;s.chest=true;s.gold+=20;s.gearRewards.push({level:s.cfg.id});effect(s,10.5,4.5,'寶箱 +20','#f5d18a');emit(s,'chest',{manual});return true;}
  function emit(s,type,data={}){s.events.push({type,...data});}
  function effect(s,x,y,text,color='#f4dda4',kind='text'){s.effects.push({x,y,text,color,kind,age:0,life:kind==='death'?.5:1});}
  const walkable=(s,x,y)=>s.map[Math.floor(y)]?.[Math.floor(x)]==='.';
  function next(s,a,b){
    const sx=Math.floor(a.x),sy=Math.floor(a.y),tx=Math.floor(b.x),ty=Math.floor(b.y);
    if(sx===tx&&sy===ty)return b;
    const queue=[[sx,sy]],visited=new Set([sx+','+sy]),parents=new Map();
    for(let k=0;k<queue.length;k++){const [x,y]=queue[k];if(x===tx&&y===ty){let p=[x,y];while(parents.get(p.join(','))?.join(',')!==[sx,sy].join(',')){p=parents.get(p.join(','));if(!p)return a;}return {x:p[0]+.5,y:p[1]+.5};}
      for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(!visited.has(key)&&walkable(s,nx,ny)){visited.add(key);parents.set(key,[x,y]);queue.push([nx,ny]);}}
    }return a;
  }
  function move(s,a,target,speed,dt){const p=next(s,a,target),dx=p.x-a.x,dy=p.y-a.y,d=Math.hypot(dx,dy);a.moving=d>.04;if(!a.moving)return;if(Math.abs(dx)>.02)a.face=dx>0?1:-1;const t=Math.min(1,speed*dt/d);a.x+=dx*t;a.y+=dy*t;}
  function spawn(s){
    s.wave++;const n=s.cfg.count+(s.wave===3?1:0),spots=[[2.5,2.5],[10.5,2.5],[6.5,3.5],[2.5,7.5],[10.5,7.5],[6.5,5.5]];
    for(let i=0;i<n;i++){let type=s.cfg.id<3?'slime':(i%3===1?'fly':i%3===2?'goblin':'slime');if(s.cfg.id===2&&i===n-1)type='goblin';
      const boss=s.cfg.boss&&s.wave===3&&i===0;if(boss)type='slime';let [x,y]=spots[(i+s.wave-1)%spots.length];
      if(!walkable(s,x,y)){const candidates=[];for(let cy=1;cy<14;cy++)for(let cx=1;cx<12;cx++)if(walkable(s,cx,cy))candidates.push({x:cx+.5,y:cy+.5});const p=candidates.sort((a,b)=>dist(a,{x,y})-dist(b,{x,y}))[0];x=p.x;y=p.y;}
      const hp=s.cfg.hp*(type==='fly'?.65:1)*(boss?3:1);
      s.enemies.push({id:++s.uid,x,y,type,boss,hp,maxHp:hp,atk:1.5+s.random()*1.5,warning:0,flash:0,face:1,moving:false});effect(s,x,y,'','#b5a2f0','spawn');
    }emit(s,'wave',{wave:s.wave});
  }
  function damageHero(s,n){const h=s.hero;if(h.shield>0){effect(s,h.x,h.y,'守護','#98f5d4');return;}const amount=Math.max(.75,n-h.armor);h.hp=Math.max(0,h.hp-amount);h.flash=.25;effect(s,h.x,h.y,'−'+Math.ceil(amount),'#ff9caa');emit(s,'hurt');}
  function rescue(s){if(s.status!=='play'||s.charges<=0||s.cooldown>0)return false;s.charges--;s.cooldown=B.rescueCooldown;const h=s.hero;h.hp=Math.min(h.maxHp,h.hp+B.heal);h.shield=B.shield;effect(s,h.x,h.y,'守護降臨 +'+B.heal,'#b7ffe5');emit(s,'rescue');return true;}
  function step(s,dt){
    if(s.status!=='play')return s;dt=Math.max(0,Math.min(.1,dt));s.time+=dt;const h=s.hero;
    h.atk-=dt;h.flash=Math.max(0,h.flash-dt);h.slash=Math.max(0,h.slash-dt);h.shield=Math.max(0,h.shield-dt);s.cooldown=Math.max(0,s.cooldown-dt);s.effects=s.effects.filter(f=>(f.age+=dt)<f.life);
    if(!s.enemies.length&&s.wave<3){s.waveWait-=dt;if(s.waveWait<=0)spawn(s);}
    if(s.enemies.length){
      const target=s.enemies.reduce((a,b)=>dist(h,a)<dist(h,b)?a:b);
      if(dist(h,target)>1.02)move(s,h,target,B.moveSpeed,dt);else{h.moving=false;if(h.atk<=0){h.atk=h.attackEvery;h.slash=.25;h.face=target.x>=h.x?1:-1;target.hp-=h.attack;target.flash=.18;effect(s,target.x,target.y,''+h.attack,'#f7e6b8');emit(s,'attack');}}
      for(const e of s.enemies){e.flash=Math.max(0,e.flash-dt);if(e.hp<=0)continue;const range=e.boss?2.05:1.15;
        if(e.warning>0){e.warning-=dt;e.moving=false;if(e.warning<=0){if(dist(e,h)<range+.4)damageHero(s,s.cfg.damage*(e.boss?3:1));e.atk=e.boss?3.5:2.4;}}
        else{e.atk-=dt;if(dist(e,h)>range)move(s,e,h,e.type==='fly'?1.18:e.type==='goblin'?1:.65,dt);else{e.moving=false;if(e.atk<=0)e.warning=e.boss?1.3:.85;}}
      }
      const dead=s.enemies.filter(e=>e.hp<=0);for(const e of dead){s.kills++;s.loot.push({id:++s.lootUid,x:e.x,y:e.y,kind:'coin',amount:e.boss?30:3,age:0});if(e.id%4===0)s.loot.push({id:++s.lootUid,x:e.x+.3,y:e.y+.3,kind:'potion',amount:12,age:0});effect(s,e.x,e.y,'','#cfb4ff','death');emit(s,'kill');}s.enemies=s.enemies.filter(e=>e.hp>0);
      if(!s.enemies.length){s.waveWait=3;h.hp=Math.min(h.maxHp,h.hp+12);emit(s,'cleared');}
    }else if(s.wave>=3){const goal=s.chest?{x:6.5,y:1.5}:{x:10.5,y:4.5};move(s,h,goal,B.moveSpeed,dt);if(dist(h,goal)<.2){if(!s.chest)openChest(s,false);else{for(const d of [...s.loot])collect(s,d.id,false);s.status='win';emit(s,'win');}}}else h.moving=false;
    for(const d of [...s.loot])if((d.age+=dt)>=8)collect(s,d.id,false);
    for(const t of s.traps){const phase=(s.time+t.x*.27)%5;if(phase>3.6&&phase<3.6+dt&&dist(h,t)<.7){damageHero(s,6);emit(s,'trap');}}
    if(h.hp<=0){s.status='lose';emit(s,'lose');}return s;
  }
  return {B,levels,begin,step,rescue,next,walkable,collect,openChest,applyGear};
})();
if(typeof module!=='undefined')module.exports=DungeonEngine;
