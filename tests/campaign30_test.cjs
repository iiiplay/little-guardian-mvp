const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {E,Q,createGame}=vm.runInNewContext(['engine/engine.js','src/driver.js','src/equipment.js','src/journey.js','src/core.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n')+'\n({E:DungeonEngine,Q:Equipment,createGame})',{console,structuredClone});
assert.equal(E.levels.length,30);assert.equal(E.levels[20].theme,'ice');assert.equal(E.levels[29].boss,true);
assert.equal(new Set(E.levels.slice(20).map(l=>l.layout.join(''))).size,10,'ten distinct third-region maps');
for(const cfg of E.levels.slice(20)){
 const s=E.begin(cfg.id);assert.equal(cfg.layout.length,13);assert(cfg.layout.every(r=>r.length===11));
 const queue=[[6,12]],seen=new Set(['6,12']);for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(E.walkable(s,nx,ny)&&!seen.has(k)){seen.add(k);queue.push([nx,ny]);}}}
 assert.equal(seen.size,s.map.join('').split('').filter(c=>c==='.').length,'connected '+cfg.id);assert(seen.has('10,4')&&seen.has('6,1'));
 for(const t of s.traps)assert(E.walkable(s,t.x,t.y));
 E.step(s,.1);s.waveWait=0;E.step(s,.1);assert(s.enemies.some(e=>e.type==='wisp')&&s.enemies.some(e=>e.type==='golem'));
}
let stored=JSON.stringify({version:6,unlocked:20,cleared:Array.from({length:20},(_,i)=>i+1),gold:700,perks:{power:20},spirit:'luck',inventory:[{id:4,slot:'weapon',rarity:2,level:20,trait:'chain'}],equipped:{weapon:4},journey:{marks:12}});
const store={getItem:()=>stored,setItem:(k,v)=>stored=v};let g=createGame({engine:E,store});assert.equal(g.save.unlocked,21);assert.equal(g.save.gold,700);assert.equal(g.save.spirit,'luck');assert.equal(g.save.journey.marks,12);assert.equal(g.save.inventory[0].id,4);assert(g.start(21));assert(!g.start(22));
for(let level=21;level<=30;level++){if(g.mode!=='play')assert(g.start(level));g.run.status='win';g.tick(.03);const gold=g.save.gold;g.tick(.03);assert.equal(g.save.gold,gold,'one settlement');assert(g.choose('power'));}
assert.equal(g.save.unlocked,30);assert.equal(g.save.cleared.length,30);g=createGame({engine:E,store});assert.equal(g.save.cleared.length,30);assert.equal(g.save.unlocked,30);assert(!g.start(31));
assert.equal(Q.roll(30,1,()=>0).level,30);assert(Q.roll(30,1,()=>0).rarity>=2);assert.equal(Q.craft(30,7,'chain',3).level,30);assert.equal(Q.normalize([{id:3,slot:'armor',rarity:2,level:30}],{}).inventory[0].level,30);
// Delayed ice damage is applied once, slow expires, and shield prevents the slow.
function field(shield=0){const s=E.begin(21);s.wave=3;s.hero.atk=100;s.hero.shield=shield;s.hazards=[{kind:'ice',x:s.hero.x,y:s.hero.y,age:1.19,life:1.2}];return s;}
let s=field(),hp=s.hero.hp;E.step(s,.02);assert(s.hero.hp<hp);assert.equal(s.hero.frostTime,2);const after=s.hero.hp;E.step(s,.02);assert.equal(s.hero.hp,after);assert.equal(s.hazards.length,0);for(let i=0;i<25;i++)E.step(s,.1);assert.equal(s.hero.frostTime,0);
s=field(6);E.step(s,.02);assert.equal(s.hero.hp,120);assert.equal(s.hero.frostTime,0);
// Interrupting a telegraphed ice caster prevents the field from being created.
s=E.begin(21);s.waveWait=0;E.step(s,.03);const wisp=s.enemies.find(e=>e.type==='wisp');s.enemies=[wisp];s.hero.atk=100;wisp.warning=.7;wisp.aimX=s.hero.x;wisp.aimY=s.hero.y;assert(E.assist(s,wisp.id));for(let i=0;i<25;i++)E.step(s,.03);assert.equal(s.hazards.length,0);assert.equal(s.stats.interrupts,1);
// The final boss switches to a five-cell cross below half HP.
function bossPhase(ratio){const s=E.begin(30);s.wave=2;s.waveWait=0;E.step(s,.03);const b=s.enemies.find(e=>e.boss);s.enemies=[b];Object.assign(b,{x:6.5,y:8.5,hp:b.maxHp*ratio,warning:.01,aimX:6.5,aimY:10.5});Object.assign(s.hero,{x:6.5,y:10.5,atk:100,shield:6});E.step(s,.03);return s;}
assert.equal(bossPhase(.9).hazards.length,3);assert.equal(bossPhase(.4).hazards.length,5);
const runs=[];
for(let level=21;level<=30;level++)for(let seed=1;seed<=8;seed++)for(const mode of ['watch','rescue','active']){
 const gear=Q.total({spirit:'wind',cleared:[3,6],inventory:[{id:1,slot:'weapon',rarity:1,level,trait:'lifesteal'},{id:2,slot:'armor',rarity:0,level,trait:'thorns'},{id:3,slot:'charm',rarity:0,level,trait:'renewal'}],equipped:{weapon:1,armor:2,charm:3}}),s=E.begin(level,{power:level-1},seed*7919+level,gear);let ticks=0,minimum=s.hero.hp,fields=0;
 while(s.status==='play'&&ticks++<9000){if(mode!=='watch'&&s.hero.hp/s.hero.maxHp<.55)E.rescue(s);if(mode==='active'){E.ultimate(s);for(const d of [...s.loot])E.collect(s,d.id);const e=s.enemies.filter(e=>e.hp>0).sort((a,b)=>(b.warning>0)-(a.warning>0)||a.hp-b.hp)[0];if(e)E.assist(s,e.id);for(const b of s.barrels)if(b.hp>0&&s.enemies.some(e=>Math.hypot(e.x-b.x,e.y-b.y)<2))E.detonate(s,b.id);}
 E.step(s,1/30);minimum=Math.min(minimum,s.hero.hp);fields=Math.max(fields,s.hazards.length);s.events=[];assert(Number.isFinite(s.hero.hp)&&s.hero.hp>=0&&s.hero.hp<=s.hero.maxHp);for(const e of [s.hero,...s.enemies])assert(E.walkable(s,e.x,e.y));assert(s.effects.length<200&&s.hazards.length<=E.ICE.maxFields);}
 assert(['win','lose'].includes(s.status),'settles '+level);if(mode==='active')assert.equal(s.status,'win',`active ${level}/${seed}`);runs.push({level,seed,mode,status:s.status,seconds:+s.time.toFixed(1),minRatio:+(minimum/s.hero.maxHp).toFixed(3),rescues:2-s.charges,fields});
}
const summary=['watch','rescue','active'].map(mode=>{const a=runs.filter(r=>r.mode===mode);return {mode,runs:a.length,wins:a.filter(r=>r.status==='win').length,rescues:a.reduce((n,r)=>n+r.rescues,0)};});
assert(summary[0].wins<64,'third region requires intervention');assert(summary[1].wins>summary[0].wins,'healing helps');
fs.writeFileSync('artifacts/campaign30-results.json',JSON.stringify({passed:true,summary,runs},null,2));console.table(summary);console.log('PASS: ten unique connected maps, Lv30 save/gear progression, ice/interrupt/boss phases and 240 third-region battles.');
