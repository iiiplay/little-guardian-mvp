const E=require('../engine/engine.js'),assert=require('assert/strict'),fs=require('fs');
const enemy=(id,x=6.5,y=10.5)=>({id,x,y,type:'slime',hp:1000,maxHp:1000,warning:0,atk:100,flash:0});
const fixture=()=>{const s=E.begin(1);s.wave=1;s.hero.atk=100;s.enemies=[enemy(1),enemy(2,7.5)];return s;};
let s=fixture();for(let i=0;i<3;i++){if(i===2){s.enemies[1].x=s.enemies[0].x+.5;s.enemies[1].y=s.enemies[0].y;}assert(E.assist(s,1));for(let j=0;j<6;j++)E.step(s,.1);}assert.equal(s.stats.bursts,1);assert(s.enemies[1].hp<1000,'third hit has area damage');assert(!E.assist(s,1),'empty energy blocks');
for(let i=0;i<60;i++)E.step(s,.1);assert(s.assistCharges>=1,'energy regenerates without mandatory tapping');
s=fixture();s.assistCharges=0;s.loot=[{id:1,x:1,y:1,kind:'coin',amount:3,age:0}];assert(E.collect(s,1));assert.equal(s.assistCharges,1);assert(!E.collect(s,1));assert.equal(s.assistCharges,1,'no duplicate energy');
s.loot=[{id:2,x:1,y:1,kind:'coin',amount:3,age:0}];E.collect(s,2,false);assert.equal(s.assistCharges,1,'auto pickup retains gold but not manual energy reward');
for(let i=0;i<4;i++){s.loot.push({id:10+i,x:1,y:1,kind:'coin',amount:3,age:0});E.collect(s,10+i);}assert.equal(s.fever,8);assert.equal(s.assistCharges,3,'energy capped');
s=fixture();s.enemies[0].warning=.5;E.assist(s,1);assert.equal(s.stats.interrupts,1);assert.equal(s.enemies[0].warning,0);assert.equal(s.enemies[0].hp,982);
s=fixture();E.assist(s,1);for(let i=0;i<51;i++)E.step(s,.1);assert.equal(s.combo,0,'combo expires on simulation clock');
s=fixture();s.barrels=[{id:1,x:6.5,y:10.5,hp:1},{id:2,x:7.5,y:10.5,hp:1}];const hp=s.hero.hp;assert(E.detonate(s,1));assert.equal(s.stats.barrels,2);assert.equal(s.hero.hp,hp,'friendly explosive');assert(!E.detonate(s,1));assert.equal(s.enemies[0].hp,940,'chain explosion settles once per barrel');
s.status='lose';assert(!E.detonate(s,2));assert(!E.assist(s,1));
const runs=[];
for(let level=1;level<=10;level++)for(let seed=1;seed<=6;seed++)for(const active of [false,true]){
 const r=E.begin(level,{power:level-1},seed);let ticks=0;
 while(r.status==='play'&&ticks++<9000){
  if(r.hero.hp/r.hero.maxHp<.55)E.rescue(r);
  if(active){for(const d of [...r.loot])E.collect(r,d.id);const target=r.enemies.filter(e=>e.hp>0).sort((a,b)=>(b.warning>0)-(a.warning>0)||a.hp-b.hp)[0];if(target)E.assist(r,target.id);for(const b of r.barrels)if(b.hp>0&&r.enemies.some(e=>e.hp>0&&Math.hypot(e.x-b.x,e.y-b.y)<2))E.detonate(r,b.id);}
  E.step(r,1/30);r.events.length=0;assert(r.assistCharges>=0&&r.assistCharges<=3);assert(r.effects.length<150);assert(Number.isFinite(r.hero.hp));
 }
 if(active||level<=2)assert.equal(r.status,'win',`level ${level} seed ${seed} active ${active}`);else assert(['win','lose'].includes(r.status));runs.push({status:r.status,level,seed,active,seconds:+r.time.toFixed(1),hp:+r.hero.hp.toFixed(1),...r.stats});
}
const mean=active=>{const a=runs.filter(r=>r.active===active&&r.status==='win');return a.reduce((v,r)=>v+r.seconds,0)/a.length;};
assert(runs.some(r=>!r.active&&r.status==='lose'),'watching with rescue alone can still fail without equipment');
assert(mean(true)<mean(false)*.85,'active play must make a measurable difference');
fs.writeFileSync('artifacts/combat-balance.json',JSON.stringify({watchAverage:mean(false),activeAverage:mean(true),runs},null,2));console.log(`PASS: combat safety + 120 campaign runs; watching ${mean(false).toFixed(1)}s / active ${mean(true).toFixed(1)}s mean.`);
