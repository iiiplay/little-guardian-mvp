const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {E,Q,createGame}=vm.runInNewContext(['engine/engine.js','src/driver.js','src/equipment.js','src/journey.js','src/core.js'].map(p=>fs.readFileSync(p,'utf8')).join('\n')+'\n({E:DungeonEngine,Q:Equipment,createGame})',{console,structuredClone});
let checks=0;const check=(v,m)=>{assert(v,m);checks++;};
let stored=JSON.stringify({version:4,unlocked:3,cleared:[1,2],perks:{power:2},gold:99,inventory:[{id:1,slot:'weapon',rarity:1,level:3,trait:'chain'}],equipped:{weapon:1}});
const store={getItem:()=>stored,setItem:(k,v)=>stored=v},g=createGame({engine:E,store});
check(g.save.version===6&&g.save.gold===99&&g.save.inventory.length===1,'schema 4 migration preserves gear and economy');
check(g.save.spirit===null&&!g.selectSpirit('wind')&&!g.selectSpirit('luck'),'locked spirits cannot be selected');
g.start(3);check(!g.selectSpirit(null),'cannot switch companions during active combat');g.run.status='win';g.tick(.03);
check(g.save.spirit==='wind'&&g.run.unlockedSpirit==='wind','first stage 3 clear grants and equips wind');
const before=g.save.cleared.length;g.start(3);g.run.status='win';g.tick(.03);check(g.save.cleared.length===before&&!g.run.unlockedSpirit,'replay cannot duplicate the unlock');
g.save.unlocked=6;g.start(6);g.run.status='win';g.tick(.03);check(g.run.unlockedSpirit==='luck'&&g.save.spirit==='wind','stage 6 unlocks luck without replacing current companion');
check(g.selectSpirit('luck'),'unlocked luck can be selected');g.start(6);check(g.run.hero.spirit==='luck','companion reaches the simulation');g.pause();
const naked=E.begin(6,g.save.perks,undefined,Q.stats(g.save.inventory[0]));g.run.hero.hp=g.run.hero.maxHp*.42;const hp=g.run.hero.hp;
g.selectSpirit('wind');check(g.run.hero.attackEvery<naked.hero.attackEvery,'wind actually increases attack speed');const interval=g.run.hero.attackEvery;
for(let i=0;i<40;i++){g.selectSpirit('luck');g.selectSpirit('wind');}check(g.run.hero.hp===hp&&g.run.hero.attackEvery===interval,'switching cannot heal or stack attack speed');
check(!g.selectSpirit('unknown'),'unknown ID rejected');check(createGame({engine:E,store}).save.spirit==='wind','choice survives reload');g.selectSpirit(null);check(createGame({engine:E,store}).save.spirit===null,'resting choice survives reload');
const legacy=createGame({engine:E,store:{getItem:()=>JSON.stringify({version:4,unlocked:8,cleared:[1,2,3,4,5,6,7],gold:200}),setItem(){}}});check(legacy.save.spirit==='wind'&&legacy.selectSpirit('luck')&&legacy.save.gold===200,'legacy progress unlocks both companions without losing gold');
let base=0,lucky=0;for(let i=0;i<10000;i++){const r=()=>i/10000;base+=Q.roll(4,1,r,true,1).rarity>=1;lucky+=Q.roll(4,1,r,true,1,.03).rarity>=1;}
check(lucky-base===300,'luck improves fine-or-better rate by exactly 3 percentage points');
check(Q.roll(4,5,()=>0,false,5,.03).rarity>=2&&Q.roll(10,1,()=>0,false,1,.03).rarity>=2,'luck preserves pity and boss chest floor');
const s=E.begin(1,{},11,{spirit:'wind',attack:3});s.hero.hp=60;s.loot.push({id:1,x:3,y:3,kind:'potion',amount:8,age:0});E.collect(s,1);check(s.hero.hp===68&&s.hero.auraTime===1.5&&s.effects.some(f=>f.kind==='pickup'),'potion creates pickup flow and full-body aura while healing once');E.collect(s,1);check(s.hero.hp===68,'pickup particles cannot duplicate healing');
E.step(s,.1);check(s.hero.auraTime<1.5,'aura lifetime belongs to simulation clock');
const balance=[];
for(const spirit of ['wind','luck'])for(const rescue of [false,true]){let wins=0,used=0;for(let level=7;level<=10;level++)for(let seed=1;seed<=4;seed++){
 const gear=Q.total({spirit,cleared:[3,6],inventory:[{id:1,slot:'weapon',rarity:1,level,trait:'lifesteal'},{id:2,slot:'armor',rarity:0,level,trait:'thorns'},{id:3,slot:'charm',rarity:0,level,trait:'renewal'}],equipped:{weapon:1,armor:2,charm:3}}),r=E.begin(level,{power:level-1},seed*7919+level,gear);
 let ticks=0;while(r.status==='play'&&ticks++<9000){if(rescue&&r.hero.hp/r.hero.maxHp<.45)E.rescue(r);E.step(r,1/30);r.events=[];}
 check(['win','lose'].includes(r.status),'companion battle settles');wins+=r.status==='win';used+=2-r.charges;
 }balance.push({spirit,rescue,wins,runs:16,used});}
for(const spirit of ['wind','luck']){const passive=balance.find(r=>r.spirit===spirit&&!r.rescue),supported=balance.find(r=>r.spirit===spirit&&r.rescue);check(passive.wins<passive.runs*.7,'companions do not restore passive invincibility');check(supported.wins>=supported.runs*.75&&supported.used>0,'healing remains effective with companions');}
fs.writeFileSync('artifacts/spirits-results.json',JSON.stringify({passed:true,checks,qualitySamples:10000,baseFineOrBetter:base,luckyFineOrBetter:lucky,balance},null,2));
console.log(`PASS: ${checks} spirit unlock, migration, persistence, non-stacking, actual speed, luck distribution and aura checks.`);
