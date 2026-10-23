const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
const source=['engine/engine.js','src/driver.js','src/equipment.js','src/core.js'].map(p=>fs.readFileSync(path.join(root,p),'utf8')).join('\n');
const api=vm.runInNewContext(source+'\n({E:DungeonEngine,Q:Equipment,createGame})',{console,structuredClone});
const {E,Q,createGame}=api;
let assertions=0;const check=(condition,message)=>{assert(condition,message);assertions++;};
function storage(value){let text=value;return {getItem:()=>text||null,setItem:(key,val)=>text=val,read:()=>JSON.parse(text)};}
function finish(g,rescue=true){let i=0;while(g.mode==='play'&&i++<10000){if(rescue&&g.run.hero.hp<g.run.hero.maxHp*.55)g.rescue();g.tick(1/30);g.run.events.length=0;}return i;}
const st=storage(),g=createGame({engine:E,store:st,clock:()=>100});
check(g.mode==='title','starts at title');check(!g.start(2),'locked stage rejected');check(g.start(1),'first stage starts');
g.pause();const pausedTime=g.run.time;g.tick(10);check(g.run.time===pausedTime,'paused simulation never advances');check(!g.rescue(),'paused rescue rejected');g.pause();
g.run.hero.hp=40;check(g.rescue(),'rescue accepted');check(g.run.hero.hp===82,'rescue heals 42');check(g.run.hero.shield===6,'six second shield');check(g.run.charges===1,'rescue consumes one charge');check(!g.rescue(),'rescue cooldown rejects repeat');
finish(g);check(g.mode==='win','first stage completable');check(g.save.unlocked===2,'next stage unlocked');const gold=g.save.gold;g.tick(100);check(g.save.gold===gold,'settlement runs once');check(!g.choose('invalid'),'invalid reward rejected');check(g.choose('power'),'valid reward accepted');check(!g.choose('power'),'reward cannot be claimed twice');
g.start(1);finish(g);check(g.save.gold===gold,'replay does not farm first clear rewards');check(!g.pendingUpgrade,'replay has no duplicate upgrade');
const resumed=createGame({engine:E,store:st});check(resumed.save.unlocked===2&&resumed.save.perks.power===1,'progress and upgrades survive reload');
const corrupt=createGame({engine:E,store:storage('{bad json')});check(corrupt.save.unlocked===1,'malformed save falls back');
const minimal=createGame({engine:E,store:storage(JSON.stringify({version:0,unlocked:2}))});check(minimal.save.unlocked===2&&minimal.save.perks.power===0,'minimal previous save normalized');
const denied=createGame({engine:E,store:{getItem(){throw Error('denied');},setItem(){throw Error('full');}}});denied.start();finish(denied);check(denied.mode==='win'&&denied.storageError,'unavailable storage does not interrupt play');
const pendingStore=storage(),pending=createGame({engine:E,store:pendingStore});pending.start();finish(pending);check(pending.pendingUpgrade,'reward pending on clear');const recovered=createGame({engine:E,store:pendingStore});check(recovered.save.perks.power===1,'reload grants documented default');check(createGame({engine:E,store:pendingStore}).save.perks.power===1,'reload cannot duplicate recovery reward');
const lost=createGame({engine:E,store:storage()});lost.start();lost.run.hero.hp=0;lost.tick(.03);check(lost.mode==='lose','death transitions to loss');check(lost.start(1)&&lost.run.hero.hp===120,'retry rebuilds fresh battle');
let samples=[];
for(let seed=1;seed<=12;seed++)for(let level=1;level<=10;level++){
 const s=E.begin(level,{power:level-1},seed*7919+level);let ticks=0;
 while(s.status==='play'&&ticks++<9000){if(s.hero.hp<s.hero.maxHp*.55)E.rescue(s);E.ultimate(s);const warning=s.enemies.find(e=>e.warning>0);if(warning)E.assist(s,warning.id);E.step(s,1/30);s.events.length=0;
   assert(Number.isFinite(s.hero.hp)&&s.hero.hp>=0&&s.hero.hp<=s.hero.maxHp,'HP in bounds');assert(E.walkable(s,s.hero.x,s.hero.y),'hero cannot enter walls');assert(s.charges>=0&&s.charges<=2,'charges in bounds');
   for(const e of s.enemies)assert(E.walkable(s,e.x,e.y),'enemy cannot spawn or walk in wall');
 }
 check(['win','lose'].includes(s.status),`stage ${level} seed ${seed} reaches a terminal state`);if(level<=2)check(s.status==='win','intro stages remain accessible');if(s.status==='win')check(s.chest,'chest collected before exit');check(s.time<300,'within five minutes');samples.push({level,seed,status:s.status,seconds:+s.time.toFixed(1),hp:+s.hero.hp.toFixed(1)});
}
// All-to-defense with a complete ordinary gear set is a viable alternative; failed builds can be freely reassigned.
const armorGear=Q.total({inventory:[{id:1,slot:'weapon',rarity:0,level:10,trait:'lifesteal'},{id:2,slot:'armor',rarity:0,level:10,trait:'thorns'},{id:3,slot:'charm',rarity:0,level:10,trait:'renewal'}],equipped:{weapon:1,armor:2,charm:3}});
const armor=E.begin(10,{armor:9},undefined,armorGear);for(let i=0;i<9000&&armor.status==='play';i++){if(armor.hero.hp<66)E.rescue(armor);E.ultimate(armor);for(const d of [...armor.loot])E.collect(armor,d.id);const target=armor.enemies.find(e=>e.hp>0);if(target)E.assist(armor,target.id);E.step(armor,1/30);armor.events.length=0;}check(armor.status==='win','defense build can complete boss with active support');
check(g.reassign('haste'),'can reassign outside battle');check(g.save.perks.haste===1,'reassignment preserves points');g.start(2);check(!g.reassign('power'),'no mutation of upgrades during active battle');
const a=E.begin(4,{},42),b=E.begin(4,{},42);for(let i=0;i<500;i++){E.step(a,1/30);E.step(b,1/30);}check(JSON.stringify({...a,random:null})===JSON.stringify({...b,random:null}),'seeded simulations are reproducible');
const html=fs.readFileSync(path.join(root,'dist/game.html'),'utf8');check(!/<!--\w+_JS-->/.test(html),'all build slots resolved');check(html.includes('data:image/png;base64,'),'assets embedded for offline use');check(!/<script[^>]+src=/.test(html),'no external script dependencies');
for(const [,js] of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(js);
fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/balance-results.json'),JSON.stringify({runs:samples.length,minSeconds:Math.min(...samples.map(s=>s.seconds)),maxSeconds:Math.max(...samples.map(s=>s.seconds)),samples},null,2));
console.log(`PASS: ${assertions} checks, 120 seeded full-stage runs, replay / save / pause / rescue / reward / failure / build checks.`);
