const Q=require('../src/equipment.js'),crypto=require('crypto');
function scenarios(E){const runs=[];for(let level=1;level<=20;level++)for(const seed of [37,7919])for(const mode of ['watch','rescue','active']){
  const s=E.begin(level,{power:level-1},seed,Q.total({spirit:'wind',cleared:[3,6],inventory:[{id:1,slot:'weapon',rarity:1,level,trait:'lifesteal'},{id:2,slot:'armor',rarity:0,level,trait:'thorns'},{id:3,slot:'charm',rarity:0,level,trait:'renewal'}],equipped:{weapon:1,armor:2,charm:3}}));let ticks=0;
  while(s.status==='play'&&ticks++<9000){if(mode!=='watch'&&s.hero.hp/s.hero.maxHp<.5)E.rescue(s);if(mode==='active'){E.ultimate(s);for(const d of [...s.loot])E.collect(s,d.id);const e=s.enemies.find(e=>e.hp>0);if(e)E.assist(s,e.id);}E.step(s,1/30);s.events=[];}
  runs.push({level,seed,mode,status:s.status,ticks,hash:crypto.createHash('sha256').update(JSON.stringify({...s,random:null})).digest('hex')});
}return runs;}
module.exports=scenarios;
if(require.main===module){const fs=require('fs'),{performance}=require('perf_hooks'),start=performance.now(),runs=scenarios(require('../engine/engine.js'));const output=process.argv[2]||'artifacts/simulation-performance-after.json';fs.writeFileSync(output,JSON.stringify({milliseconds:performance.now()-start,runs},null,2));console.log('Simulation milliseconds:',(performance.now()-start).toFixed(1),'runs:',runs.length);}
