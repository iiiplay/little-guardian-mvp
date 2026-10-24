/* Seeded simulation; the DOM and wall clock never own game state. */
const DungeonEngine = (() => {
  const B = Object.freeze({ maxHp:120, attack:6, attackEvery:.9, moveSpeed:1.4, heal:42, shield:6, rescueCooldown:18, rescues:2,assistCharges:3,assistCooldown:.55,assistStun:1.2, energyRegen:6, comboWindow:5, burstRadius:2.6, barrelRadius:3, feverDuration:8, ultimateMax:100, ultimateRegen:.7, ultimateKill:3, ultimateLoot:4, ultimateAssist:2, waveHeal:4, potionHeal:8, knockbackDrag:12, ultimateWindup:.48 });
  const titles=['初見微光','綠色訪客','小心頭頂','尖刺走廊','哥布林晚餐','交錯的足跡','振翅迴廊','寶庫守衛','最後的前廳','史萊姆的王冠','踏入螢光林','白骨小徑','林間伏弓','盤根錯節','苔石巡守','幽光追逐','雙弓交鋒','骸骨庭院','王座前的風','骸骨守林者','霜境初踏','冰靈低語','碎晶回廊','雙柱寒庭','晶衛甦醒','霜痕交錯','寒光圍陣','破冰前線','封印之門','玄霜晶王'];
  const ICE = Object.freeze({slow:.75,slowDuration:2,fieldLife:1.2,fieldDamage:.75,fieldRadius:.85,maxFields:24});
  const layouts=[
    ['...........','...........','..##...##..','...........','...........','.....#.....','...........','..#.....#..','..#.....#..','...........','...........','...........','...........'],
    ['...........','...#...#...','...#...#...','...........','...........','.##.....##.','...........','...........','...#...#...','...#...#...','...........','...........','...........'],
    ['...........','...........','..###.###..','...........','...........','.#.......#.','.#.......#.','...........','...........','..##...##..','...........','...........','...........'],
    ['...........','..#.....#..','..#.....#..','...........','.....#.....','...........','..##...##..','...........','.....#.....','...........','..#.....#..','...........','...........'],
    ['...........','...........','...#...#...','...#...#...','...........','.##.....##.','...........','.##.....##.','...........','...#...#...','...........','...........','...........']
  ];
  const forestLayouts=[
    ['...........','...#.......','...#...#...','.......#...','...........','.##.....##.','...........','.....#.....','..#.....#..','..#.....#..','...........','...........','...........'],
    ['...........','..#.....#..','..#.....#..','...........','....#......','....#......','...........','......#....','......#....','...........','...#...#...','...........','...........'],
    ['...........','.....#.....','..#..#..#..','..#.....#..','...........','....###....','...........','..#.....#..','..#.....#..','...........','.....#.....','...........','...........'],
    ['...........','...........','.##.....##.','...........','.....#.....','..#..#..#..','..#.....#..','...........','....###....','...........','..#.....#..','...........','...........'],
    ['...........','...#...#...','...#...#...','...........','..#.....#..','..#.....#..','...........','....###....','...........','..#.....#..','..#.....#..','...........','...........']
  ];
  // Ten distinct broken-pillar layouts keep the central routes, exit and chest open.
  const iceLayouts=Array.from({length:10},(_,i)=>{
    const grid=Array.from({length:13},()=>Array(11).fill('.'));
    for(let row=2;row<=10;row+=4){const shift=(i+row)%3;for(const col of [1+shift,7+shift]){grid[row][col]='#';if(i%2===0)grid[row+1][col]='#';}}
    for(let col=3;col<=7;col+=4){const row=4+(i%3);grid[row][col]='#';if(i>=5)grid[9][col]='#';}
    for(const [x,y] of [[5,0],[9,3],[5,11],[1,6],[9,6]])grid[y][x]='.';
    return grid.map(row=>row.join(''));
  });
  const levels=titles.map((title,i)=>Object.freeze({id:i+1,title,region:i<10?'微光地城':i<20?'螢光森林':'霜晶遺跡',theme:i<10?'dungeon':i<20?'forest':'ice',waves:3,count:i===0?3:i>=20?6:4+(i>5?1:0),hp:i<20?38+i*10:238+(i-20)*12,damage:i<2?2+i:i<10?4+(i-2)*1.2:i<20?13.2+(i-10)*.7:20.2+(i-20)*.7,trap:i>=3,boss:(i+1)%10===0,layout:i<10?layouts[i%5]:i<20?forestLayouts[(i-10)%5]:iceLayouts[i-20]}));
  function rng(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
  const ranged=e=>e.type==='goblin'||e.type==='ranger'||e.type==='wisp';
  const contracts=Object.freeze({
    wind:Object.freeze({name:'疾風追擊',brief:'出手間隔 −15% · 敵人移速 +25%',hint:'快速出劍，善用星擊攔住突襲。',interval:.85,speed:1.25}),
    thorns:Object.freeze({name:'荊棘試煉',brief:'減傷 +1.5、反傷 +3 · 敵人生命 +30%',hint:'讓反傷護甲發揮，別把守護用得太早。',armor:1.5,thorns:3,hp:1.3}),
    surge:Object.freeze({name:'星能激流',brief:'星能每 4 秒回復 · 承受傷害 +20%',hint:'抓準紅圈打斷，用連擊換取安全。',regen:4,damage:1.2})
  });
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function begin(levelId,perks={},seed=levelId*1579,gear={},contract=null){
    const cfg=levels[levelId-1];if(!cfg)throw new Error('Unknown level');
    const map=['#############',...cfg.layout.map(r=>'#'+r+'#'),'#############'];
    const s={cfg,map,seed,random:rng(seed),status:'play',time:0,wave:0,waveWait:1.4,enemies:[],effects:[],events:[],loot:[],hazards:[],gearRewards:[],lootUid:0,kills:0,gold:0,charges:B.rescues,cooldown:0,assistCharges:B.assistCharges,assistCooldown:0,chest:false,uid:0,energyClock:0,combo:0,comboUntil:0,manualLoot:0,fever:0,hitSerial:0,impact:0,impactPower:0,barrels:[],ultimateCharge:100,ultimateCast:0,ultimatePending:false,stats:{assists:0,interrupts:0,bursts:0,barrels:0,ultimates:0},
      ...(Object.hasOwn(contracts,contract)?{contract}:{}),hero:{x:6.5,y:12.5,hp:120,maxHp:120,atk:0,shield:0,flash:0,slash:0,face:1,moving:false,attackCount:0},
      traps:cfg.trap?[{x:4.5,y:6.5},{x:8.5,y:6.5},{x:6.5,y:9.5}]:[]};if(cfg.theme==='ice'){s.hero.frostTime=0;s.traps=s.traps.filter(t=>walkable(s,t.x,t.y));}applyGear(s,perks,gear);s.hero.hp=s.hero.maxHp;s.barrels=[{id:1,x:2.5,y:7.5,hp:1},{id:2,x:10.5,y:7.5,hp:1}];return s;
  }
  function applyGear(s,perks,gear){const h=s.hero,ratio=h.hp/h.maxHp;h.maxHp=B.maxHp+(perks.vitality||0)*24+(gear.hp||0);h.hp=Math.min(h.maxHp,h.maxHp*ratio);h.attack=B.attack+(perks.power||0)*2+(gear.attack||0);h.armor=(perks.armor||0)*.6+(gear.armor||0);h.attackEvery=B.attackEvery*Math.pow(.85,perks.haste||0)/(1+Math.min(.4,gear.haste||0));h.spirit=gear.spirit||null;h.gearGlow=Object.values(gear).some(v=>typeof v==='number'&&v>0);h.auraTime=1.2;for(const key of ['lifesteal','chain','thorns','waveHeal'])h[key]=gear[key]||0;h.thorns+=(perks.armor||0)*.5;if(s.contract){const c=contracts[s.contract];h.attackEvery*=c.interval||1;h.armor+=c.armor||0;h.thorns+=c.thorns||0;}}
  function heal(s,amount,label){const h=s.hero;if(h.hp<=0)return;const n=Math.min(amount,h.maxHp-h.hp);if(n<=0)return;h.hp+=n;h.auraTime=Math.max(h.auraTime||0,.65);effect(s,h.x,h.y,label+' +'+n.toFixed(1),'#a7ebcf');emit(s,'trait',{trait:label});}
  function impact(s,e,power=1){s.hitSerial++;s.impact=.22;s.impactPower=power;s.effects.push({kind:'impact',x:e.x,y:e.y,age:0,life:.32,power,serial:s.hitSerial});}
  function knockback(s,e,from,strength){
    const dx=e.x-from.x,dy=e.y-from.y,len=Math.hypot(dx,dy)||1,force=strength*(e.boss?.3:1);
    e.kx=(dx||(!dy?1:0))/len*force*B.knockbackDrag;e.ky=dy/len*force*B.knockbackDrag;
    e.launchPower=Math.max(e.launchPower||0,strength);e.launchX=dx/len||1;e.launchY=dy/len;e.recoil=.28;
  }
  function drift(s,e,dt){if(!e.kx&&!e.ky)return;const parts=Math.max(1,Math.ceil(Math.hypot(e.kx,e.ky)*dt/.1));
    for(let i=0;i<parts;i++){const x=e.x+e.kx*dt/parts,y=e.y+e.ky*dt/parts;if(walkable(s,x,e.y))e.x=x;else e.kx=0;if(walkable(s,e.x,y))e.y=y;else e.ky=0;}
    const decay=Math.exp(-B.knockbackDrag*dt);e.kx*=decay;e.ky*=decay;if(Math.abs(e.kx)<.02)e.kx=0;if(Math.abs(e.ky)<.02)e.ky=0;
  }
  function ultimate(s){if(s.status!=='play'||s.hero.hp<=0||s.ultimateCharge<B.ultimateMax||s.ultimateCast>0||!s.enemies.some(e=>e.hp>0))return false;
    s.ultimateCharge=0;s.ultimateCast=1.3;s.ultimatePending=true;s.stats.ultimates++;s.hero.shield=Math.max(s.hero.shield,1.3);s.effects.push({kind:'ultimate',x:s.hero.x,y:s.hero.y,age:0,life:1.3});emit(s,'charge');return true;}
  function burst(s,point,damage,radius){for(const e of s.enemies)if(e.hp>0&&dist(e,point)<=radius){e.hp-=damage;knockback(s,e,point,1.5);e.flash=.25;e.warning=0;e.stun=B.assistStun;effect(s,e.x,e.y,''+damage,'#ffe2a6');}s.effects.push({kind:'blast',x:point.x,y:point.y,age:0,life:.5,radius});impact(s,point,3);}
  function detonate(s,id){if(s.status!=='play'||s.hero.hp<=0)return false;const barrel=s.barrels.find(b=>b.id===id&&b.hp>0);if(!barrel)return false;barrel.hp=0;s.stats.barrels++;burst(s,barrel,Math.max(30,s.hero.attack*3),B.barrelRadius);emit(s,'explosion');for(const b of s.barrels)if(b.hp>0&&dist(b,barrel)<=B.barrelRadius)detonate(s,b.id);return true;}
  function strike(s,target){const h=s.hero;h.attackCount++;const actual=Math.min(target.hp,h.attack);target.hp-=h.attack;knockback(s,target,h,.2);target.flash=.18;effect(s,target.x,target.y,''+h.attack,'#f7e6b8');impact(s,target);emit(s,'attack');if(h.lifesteal)heal(s,actual*h.lifesteal,'回甘');
    if(h.chain&&h.attackCount%3===0){const others=s.enemies.filter(e=>e!==target&&e.hp>0&&dist(e,target)<=3).sort((a,b)=>dist(a,target)-dist(b,target)).slice(0,2);for(const e of others){const amount=Math.round(h.attack*h.chain);e.hp-=amount;e.flash=.2;s.effects.push({kind:'lightning',x:target.x,y:target.y,x2:e.x,y2:e.y,age:0,life:.35});effect(s,e.x,e.y,'雷擊 '+amount,'#b7c6ff');}if(others.length)emit(s,'trait',{trait:'跳跳雷'});}
  }
  function collect(s,id,manual=true){if(s.status!=='play')return false;const drop=s.loot.find(d=>d.id===id);if(!drop)return false;s.loot=s.loot.filter(d=>d.id!==id);s.effects.push({kind:'pickup',x:drop.x,y:drop.y,targetX:s.hero.x,targetY:s.hero.y,potion:drop.kind==='potion',age:0,life:.65});s.hero.auraTime=Math.max(s.hero.auraTime||0,drop.kind==='potion'?1.5:.5);if(drop.kind==='coin'){s.gold+=drop.amount;effect(s,drop.x,drop.y,'+'+drop.amount,'#f5d18a');}else if(s.hero.hp>0){s.hero.hp=Math.min(s.hero.maxHp,s.hero.hp+drop.amount);effect(s,drop.x,drop.y,'回復 +'+drop.amount,'#a7ebcf');}if(manual){s.assistCharges=Math.min(B.assistCharges,s.assistCharges+1);s.manualLoot++;s.ultimateCharge=Math.min(B.ultimateMax,s.ultimateCharge+B.ultimateLoot);s.energyClock=0;effect(s,drop.x,drop.y,'星能 +1','#b7c6ff');if(s.manualLoot%5===0){s.fever=B.feverDuration;emit(s,'fever');effect(s,s.hero.x,s.hero.y,'狂熱！攻速翻倍','#ffe29b');}}emit(s,'pickup',{kind:drop.kind,manual});return true;}
  function openChest(s,manual=true){if(s.status!=='play'||s.chest||s.kills<s.cfg.count)return false;s.chest=true;s.gold+=20;s.gearRewards.push({level:s.cfg.id,manual});effect(s,10.5,4.5,'寶箱 +20','#f5d18a');emit(s,'chest',{manual});return true;}
  function emit(s,type,data={}){s.events.push({type,...data});}
  function effect(s,x,y,text,color='#f4dda4',kind='text'){s.effects.push({x,y,text,color,kind,age:0,life:kind==='death'?.5:1});}
  const walkable=(s,x,y)=>s.map[Math.floor(y)]?.[Math.floor(x)]==='.';
  // Scratch storage lives outside saves and is released when its map is collected.
  // Map contents are still read on every search, so edits never leave stale routes.
  const searches=new WeakMap();
  function next(s,a,b){
    const sx=Math.floor(a.x),sy=Math.floor(a.y),tx=Math.floor(b.x),ty=Math.floor(b.y);
    if(sx===tx&&sy===ty)return b;
    const width=s.map[0].length,height=s.map.length,size=width*height;
    if(sx<0||sx>=width||sy<0||sy>=height||tx<0||tx>=width||ty<0||ty>=height)return a;
    let work=searches.get(s.map);
    if(!work||work.width!==width||work.height!==height){work={width,height,queue:new Int32Array(size),parents:new Int32Array(size),seen:new Uint32Array(size),epoch:0};searches.set(s.map,work);}
    if(work.epoch===0xffffffff){work.seen.fill(0);work.epoch=0;}
    const epoch=++work.epoch,{queue,parents,seen}=work,start=sy*width+sx,goal=ty*width+tx;
    let tail=1;queue[0]=start;seen[start]=epoch;
    for(let head=0;head<tail;head++){
      const cell=queue[head],x=cell%width,y=Math.floor(cell/width);
      if(cell===goal){let p=cell;while(parents[p]!==start)p=parents[p];return {x:p%width+.5,y:Math.floor(p/width)+.5};}
      // Preserve the original up/right/down/left order, including shortest-path ties.
      for(let direction=0;direction<4;direction++){
        const nx=x+(direction===1?1:direction===3?-1:0),ny=y+(direction===2?1:direction===0?-1:0),key=ny*width+nx;
        if(nx>=0&&nx<width&&ny>=0&&ny<height&&seen[key]!==epoch&&walkable(s,nx,ny)){seen[key]=epoch;parents[key]=cell;queue[tail++]=key;}
      }
    }
    return a;
  }
  function move(s,a,target,speed,dt){const p=next(s,a,target),dx=p.x-a.x,dy=p.y-a.y,d=Math.hypot(dx,dy);a.moving=d>.04;if(!a.moving)return;if(Math.abs(dx)>.02)a.face=dx>0?1:-1;const t=Math.min(1,speed*dt/d);a.x+=dx*t;a.y+=dy*t;}
  function spawn(s){
    s.wave++;s.encounter=['迎擊','疾風突襲','精英守衛'][s.wave-1];s.bannerUntil=s.time+2.2;const n=s.cfg.count+(s.wave===3?1:0),spots=[[2.5,7.5],[10.5,7.5],[6.5,10.5],[2.5,2.5],[10.5,2.5],[6.5,5.5]];
    for(let i=0;i<n;i++){let type=s.cfg.id<3?'slime':(i%3===1?'fly':i%3===2?'goblin':'slime');if(s.cfg.id===2&&i===n-1)type='goblin';if(s.wave===2&&i===0&&s.cfg.id>=2)type='fly';
      if(s.cfg.theme==='forest')type=i%3===0?'skeleton':i%3===1?'ranger':s.cfg.id>=15?'fly':'slime';
      if(s.cfg.theme==='ice')type=(i+s.wave)%3===0?'wisp':(i+s.wave)%3===1?'golem':'fly';
      const boss=s.cfg.boss&&s.wave===3&&i===0;if(boss)type=s.cfg.theme==='ice'?'golem':s.cfg.theme==='forest'?'skeleton':'slime';let [x,y]=spots[(i+s.wave-1)%spots.length];
      if(!walkable(s,x,y)){const candidates=[];for(let cy=1;cy<14;cy++)for(let cx=1;cx<12;cx++)if(walkable(s,cx,cy))candidates.push({x:cx+.5,y:cy+.5});const p=candidates.sort((a,b)=>dist(a,{x,y})-dist(b,{x,y}))[0];x=p.x;y=p.y;}
      const elite=s.wave===3&&i===0&&!boss;const hp=s.cfg.hp*(elite?1.5:1)*(type==='fly'?.65:type==='wisp'?.8:type==='golem'&&!boss?1.1:1)*(boss?3:1)*(contracts[s.contract]?.hp||1);
      s.enemies.push({id:++s.uid,x,y,type,boss,elite,speedBoost:s.wave===2?1.5:1,hp,maxHp:hp,atk:1.5+s.random()*1.5,warning:0,flash:0,face:1,moving:false});effect(s,x,y,'','#b5a2f0','spawn');
    }emit(s,'wave',{wave:s.wave});
  }
  function damageHero(s,n,attacker){if(s.contract)n*=contracts[s.contract].damage||1;const h=s.hero;if(h.hp<=0)return;if(h.shield>0){effect(s,h.x,h.y,'守護','#98f5d4');return;}const amount=Math.max(.75,n-h.armor);h.hp=Math.max(0,h.hp-amount);h.flash=.25;if(attacker)knockback(s,h,attacker,attacker.boss?.85:.25);impact(s,h,attacker?.boss?2:1);effect(s,h.x,h.y,'−'+Math.ceil(amount),'#ff9caa');emit(s,'hurt');if(attacker&&h.thorns){attacker.hp-=h.thorns;attacker.flash=.2;effect(s,attacker.x,attacker.y,'反傷 '+h.thorns,'#a7ebcf');emit(s,'trait',{trait:'刺刺'});}}
  function rescue(s){if(s.status!=='play'||s.charges<=0||s.cooldown>0)return false;s.charges--;s.cooldown=B.rescueCooldown;const h=s.hero;h.hp=Math.min(h.maxHp,h.hp+B.heal);h.shield=B.shield;h.auraTime=2;effect(s,h.x,h.y,'守護降臨 +'+B.heal,'#b7ffe5');emit(s,'rescue');return true;}
  function assist(s,id){
    if(s.status!=='play'||s.hero.hp<=0||s.assistCharges<=0||s.assistCooldown>0||s.ultimateCast>0)return false;
    const e=s.enemies.find(e=>e.id===id&&e.hp>0);if(!e)return false;
    const interrupt=e.warning>0;s.combo=s.time<=s.comboUntil?s.combo+1:1;s.comboUntil=s.time+B.comboWindow;
    const meteor=s.combo===3,damage=Math.max(18,Math.round(s.hero.attack*(interrupt?3:2)));
    s.stats.assists++;s.ultimateCharge=Math.min(B.ultimateMax,s.ultimateCharge+B.ultimateAssist);if(interrupt)s.stats.interrupts++;s.assistCharges--;s.assistCooldown=B.assistCooldown;
    e.hp-=damage;knockback(s,e,s.hero,1);e.warning=0;e.atk=Math.max(1.5,e.atk);e.stun=B.assistStun;e.flash=.3;
    s.effects.push({kind:'assist',x:e.x,y:e.y,age:0,life:.45});impact(s,e,2);
    effect(s,e.x,e.y,(interrupt?'打斷！ ':'')+damage,'#d5e7ff');
    if(meteor){s.combo=0;s.stats.bursts++;burst(s,e,Math.max(12,s.hero.attack*2),B.burstRadius);for(const b of s.barrels)if(b.hp>0&&dist(b,e)<B.burstRadius)detonate(s,b.id);emit(s,'meteor');}else emit(s,interrupt?'interrupt':'assist');return true;
  }
  function iceField(s,x,y){if(walkable(s,x,y)&&s.hazards.length<ICE.maxFields)s.hazards.push({kind:'ice',x,y,age:0,life:ICE.fieldLife});}
  function crystalCast(s,e){
    e.casts=(e.casts||0)+1;
    const enraged=e.hp<=e.maxHp*.5;
    const offsets=enraged?[[0,0],[-1,0],[1,0],[0,-1],[0,1]]:e.casts%2?[[0,0],[-1,0],[1,0]]:[[0,0],[0,-1],[0,1]];
    for(const [dx,dy] of offsets)iceField(s,e.aimX+dx,e.aimY+dy);
    effect(s,e.x,e.y,enraged?'晶王震怒 · 十字冰裂':'晶王蓄力 · 冰裂','#c4f5ff');
  }
  function step(s,dt){
    if(s.status!=='play')return s;dt=Math.max(0,Math.min(.1,dt));s.time+=dt;const h=s.hero;s.impact=Math.max(0,s.impact-dt);s.fever=Math.max(0,s.fever-dt);if(s.time>s.comboUntil)s.combo=0;
    if(s.assistCharges<B.assistCharges){s.energyClock+=dt;const regen=contracts[s.contract]?.regen||B.energyRegen;if(s.energyClock>=regen){s.energyClock-=regen;s.assistCharges++;}}else s.energyClock=0;
    h.auraTime=Math.max(0,(h.auraTime||0)-dt);h.atk-=dt;h.flash=Math.max(0,h.flash-dt);h.slash=Math.max(0,h.slash-dt);h.shield=Math.max(0,h.shield-dt);s.cooldown=Math.max(0,s.cooldown-dt);s.effects=s.effects.filter(f=>(f.age+=dt)<f.life);
    s.assistCooldown=Math.max(0,s.assistCooldown-dt);
    if(s.ultimateCast>0){s.ultimateCast=Math.max(0,s.ultimateCast-dt);if(s.ultimatePending&&s.ultimateCast<=1.3-B.ultimateWindup){s.ultimatePending=false;for(const e of s.enemies)if(e.hp>0){const damage=Math.max(55,h.attack*5);e.hp-=damage;e.warning=0;e.stun=1.4;e.flash=.4;knockback(s,e,h,2.5);effect(s,e.x,e.y,''+damage,'#fff0ba');s.effects.push({kind:'blast',x:e.x,y:e.y,age:0,life:.5,radius:1.5});}impact(s,h,4);emit(s,'ultimate');}if(s.ultimateCast>.8)return s;}
    else s.ultimateCharge=Math.min(B.ultimateMax,s.ultimateCharge+B.ultimateRegen*dt);
    if(s.cfg.theme==='ice')h.frostTime=Math.max(0,h.frostTime-dt);
    drift(s,h,dt);h.recoil=Math.max(0,(h.recoil||0)-dt);
    for(const e of s.enemies){if(e.hp>0)drift(s,e,dt);e.recoil=Math.max(0,(e.recoil||0)-dt);}
    if(!s.enemies.length&&s.wave<3){s.waveWait-=dt;if(s.waveWait<=0)spawn(s);}
    if(s.enemies.length){
      const target=s.enemies.filter(e=>e.hp>0).reduce((a,b)=>!a||dist(h,b)<dist(h,a)?b:a,null);
      if(!target)h.moving=false;else if(dist(h,target)>1.02)move(s,h,target,B.moveSpeed*(h.frostTime>0?ICE.slow:1),dt);else{h.moving=false;if(h.atk<=0){h.atk=h.attackEvery/(s.fever>0?2:1);h.slash=.25;h.face=target.x>=h.x?1:-1;strike(s,target);}}
      for(const e of s.enemies){e.flash=Math.max(0,e.flash-dt);if(e.hp<=0)continue;if(e.stun>0){e.stun=Math.max(0,e.stun-dt);e.moving=false;continue;}const range=e.boss?2.8:ranged(e)?(e.type==='ranger'?3.8:3.2):e.type==='fly'?2:1.15;
        if(e.warning>0){e.warning-=dt;e.moving=false;if(e.type==='fly'&&e.warning<.25&&Number.isFinite(e.aimX))move(s,e,{x:e.aimX,y:e.aimY},6,dt);if(e.warning<=0){if(e.type==='wisp'){iceField(s,e.aimX,e.aimY);s.effects.push({kind:'icebolt',x:e.x,y:e.y,x2:e.aimX,y2:e.aimY,age:0,life:.3});}else if(ranged(e)){s.effects.push({kind:'arrow',x:e.x,y:e.y,x2:e.aimX,y2:e.aimY,age:0,life:.22});if(dist(h,{x:e.aimX,y:e.aimY})<.85)damageHero(s,s.cfg.damage*1.3,e);}else if(dist(e,h)<range+.4)damageHero(s,s.cfg.damage*(e.boss?(s.cfg.theme==='ice'?1.8:s.cfg.theme==='forest'?2:3):e.elite?1.5:e.type==='golem'?1.25:e.type==='skeleton'?1.15:1),e);if(e.boss){if(s.cfg.theme==='ice')crystalCast(s,e);if(s.cfg.theme==='forest')for(const offset of [-1,0,1]){const x=e.aimX+offset,y=e.aimY;if(walkable(s,x,y))s.hazards.push({x,y,age:0,life:1.4});}s.effects.push({kind:'blast',x:e.x,y:e.y,age:0,life:.5,radius:range});emit(s,'explosion');}else if(e.type==='golem'&&s.cfg.id>=25)iceField(s,e.aimX,e.aimY);e.atk=e.boss?(s.cfg.theme==='ice'&&e.hp<=e.maxHp*.5?2.8:3.5):e.type==='skeleton'?2.7:e.type==='ranger'?2.8:e.type==='wisp'?3.2:e.type==='golem'?3:2.4;}}
        else{e.atk-=dt;if(dist(e,h)>range)move(s,e,h,(e.type==='fly'?1.18:ranged(e)?(e.type==='ranger'?.8:1):e.type==='skeleton'?.85:.65)*(e.speedBoost||1)*(contracts[s.contract]?.speed||1),dt);else{e.moving=false;if(e.atk<=0){e.warning=e.boss?1.3:e.type==='golem'?1.15:e.type==='wisp'?1.5:ranged(e)?(e.type==='ranger'?1.4:1.15):e.type==='skeleton'?.75:.85;e.aimX=h.x;e.aimY=h.y;}}}
      }
      const dead=s.enemies.filter(e=>e.hp<=0);for(const e of dead){s.kills++;s.ultimateCharge=Math.min(B.ultimateMax,s.ultimateCharge+B.ultimateKill);if(e.launchPower>=1)s.effects.push({kind:'flyout',x:e.x,y:e.y,type:e.type,boss:e.boss,dx:e.launchX||1,dy:e.launchY||-.5,age:0,life:.85});s.loot.push({id:++s.lootUid,x:e.x,y:e.y,kind:'coin',amount:e.boss?30:3,age:0});if(e.id%4===0)s.loot.push({id:++s.lootUid,x:e.x+.3,y:e.y+.3,kind:'potion',amount:B.potionHeal,age:0});effect(s,e.x,e.y,'','#cfb4ff','death');impact(s,e,1.5);emit(s,'kill');}s.enemies=s.enemies.filter(e=>e.hp>0);
      if(!s.enemies.length){s.waveWait=3;if(h.hp>0){h.hp=Math.min(h.maxHp,h.hp+B.waveHeal);if(h.waveHeal)heal(s,h.waveHeal,'暖光');}emit(s,'cleared');}
    }else if(s.wave>=3){const goal=s.chest?{x:6.5,y:1.5}:{x:10.5,y:4.5};move(s,h,goal,B.moveSpeed,dt);if(dist(h,goal)<.2){if(!s.chest)openChest(s,false);else{for(const d of [...s.loot])collect(s,d.id,false);s.status='win';emit(s,'win');}}}else h.moving=false;
    for(const d of [...s.loot])if((d.age+=dt)>=8)collect(s,d.id,false);
    for(const mark of s.hazards){mark.age+=dt;if(mark.age>=mark.life&&dist(h,mark)<(mark.kind==='ice'?ICE.fieldRadius:.9)){const exposed=h.shield<=0;damageHero(s,s.cfg.damage*(mark.kind==='ice'?ICE.fieldDamage:.7));if(mark.kind==='ice'&&exposed&&h.hp>0){h.frostTime=ICE.slowDuration;effect(s,h.x,h.y,'寒霜 · 移速降低','#b9eaff');}impact(s,h,2);}}s.hazards=s.hazards.filter(mark=>mark.age<mark.life);
    for(const t of s.traps){const phase=(s.time+t.x*.27)%5;if(phase>3.6&&phase<3.6+dt&&dist(h,t)<.7){damageHero(s,6);emit(s,'trap');}}
    if(h.hp<=0){s.status='lose';emit(s,'lose');}return s;
  }
  return {B,ICE,levels,contracts,begin,step,rescue,next,walkable,collect,openChest,applyGear,assist,detonate,ultimate};
})();
if(typeof module!=='undefined')module.exports=DungeonEngine;
