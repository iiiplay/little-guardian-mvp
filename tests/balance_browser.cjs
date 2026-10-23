const {chromium}=require('C:/Users/User/.agents/skills/gstack/node_modules/playwright');
const assert=require('assert/strict'),fs=require('fs'),crypto=require('crypto');
const inventory=[{id:1,slot:'weapon',rarity:1,level:10,trait:'lifesteal'},{id:2,slot:'armor',rarity:0,level:10,trait:'thorns'},{id:3,slot:'charm',rarity:0,level:10,trait:'renewal'}];
const save={version:4,unlocked:10,cleared:[1,2,3,4,5,6,7,8,9],perks:{power:9},inventory,equipped:{weapon:1,armor:2,charm:3},gold:0};
(async()=>{const b=await chromium.launch({headless:true});try{
const results=await Promise.all(['watch','spell','spellRescue'].map(async mode=>{
  const context=await b.newContext({viewport:{width:375,height:667},deviceScaleFactor:2}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(save=>localStorage.setItem('little-guardian-mvp-v1',JSON.stringify(save)),save);await p.goto('http://127.0.0.1:8765/index.html');await p.locator('#start').click();
  const start=Date.now(),trace=[];let lowest=Infinity,savedDanger=false;
  while(Date.now()-start<150000){const s=await p.evaluate(()=>({mode:game.mode,time:game.run.time,hp:game.run.hero.hp,maxHp:game.run.hero.maxHp,charges:game.run.charges,wave:game.run.wave}));trace.push(s);lowest=Math.min(lowest,s.hp);
    if(s.mode!=='play')break;
    if(s.hp/s.maxHp<.45&&!savedDanger){savedDanger=true;await p.screenshot({path:`artifacts/qa-balance-danger-${mode}.png`});}
    if(mode==='spellRescue'&&s.hp/s.maxHp<.55&&await p.locator('#rescue').isEnabled())await p.locator('#rescue').click();
    if(mode.startsWith('spell')&&await p.locator('#ultimate').isEnabled())await p.locator('#ultimate').click();
    await p.waitForTimeout(200);
  }
  const result=await p.evaluate(()=>({status:game.mode,seconds:game.run.time,hp:game.run.hero.hp,maxHp:game.run.hero.maxHp,rescues:2-game.run.charges,stats:game.run.stats,speed:game.speed}));
  assert.equal(result.speed,1);assert.equal(result.status,mode==='spellRescue'?'win':'lose',mode);if(mode==='spellRescue'){assert(result.rescues>0);assert((await p.locator('.intervention-result').innerText()).includes('次大招'));}
  assert.deepEqual(errors,[]);await p.screenshot({path:`artifacts/qa-balance-result-${mode}.png`});await context.close();return {mode,realSeconds:(Date.now()-start)/1000,lowest,result,errors,trace};
}));
fs.writeFileSync('artifacts/balance-browser-results.json',JSON.stringify({passed:true,buildHash:crypto.createHash('sha256').update(fs.readFileSync('index.html')).digest('hex'),save,results},null,2));console.log(JSON.stringify(results.map(({mode,result,realSeconds,lowest})=>({mode,result,realSeconds,lowest})),null,2));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
