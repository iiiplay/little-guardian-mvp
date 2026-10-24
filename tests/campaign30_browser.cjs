const {chromium}=require('C:/Users/User/.agents/skills/gstack/node_modules/playwright');
const assert=require('assert/strict'),fs=require('fs');
const fixture=(level,cleared=level-1)=>({version:6,unlocked:Math.min(20,level),cleared:Array.from({length:cleared},(_,i)=>i+1),spirit:'wind',perks:{power:level-1},inventory:[{id:1,slot:'weapon',rarity:1,level:Math.min(20,level),trait:'lifesteal'},{id:2,slot:'armor',rarity:0,level:Math.min(20,level),trait:'thorns'},{id:3,slot:'charm',rarity:0,level:Math.min(20,level),trait:'renewal'}],equipped:{weapon:1,armor:2,charm:3},gold:700});
(async()=>{const b=await chromium.launch({headless:true}),errors=[],results=[];try{
 let p=await b.newPage({viewport:{width:375,height:667},deviceScaleFactor:2});p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(save=>{if(!localStorage.getItem('little-guardian-mvp-v1'))localStorage.setItem('little-guardian-mvp-v1',JSON.stringify(save));},fixture(21,20));
 await p.goto('http://127.0.0.1:8765/index.html');await p.locator('#select').click();assert.equal(await p.evaluate(()=>game.save.unlocked),21);
 assert.equal(await p.locator('[data-chapter]').count(),3);assert.equal(await p.locator('[data-level]').count(),10);assert(await p.locator('[data-level="21"]').isEnabled());assert(await p.locator('[data-level="22"]').isDisabled());
 for(const [name,width,height] of [['mobile',375,667],['small',320,568],['desktop',1280,720]]){
  await p.setViewportSize({width,height});await p.screenshot({path:`artifacts/qa-chapter3-${name}.png`});const box=await p.locator('#dialog').boundingBox();assert(box.y>=0&&box.y+box.height<=height,'chapter map fits '+name);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
  const tabs=await p.locator('[data-chapter]').evaluateAll(nodes=>nodes.map(n=>({w:n.offsetWidth,h:n.offsetHeight,scroll:n.scrollWidth})));assert(tabs.every(t=>t.h>=44&&t.scroll<=t.w),'chapter buttons fit '+name);
 }
 await p.locator('[data-chapter="0"]').click();assert(await p.locator('[data-level="10"]').isEnabled());await p.locator('[data-chapter="1"]').click();assert(await p.locator('[data-level="20"]').isEnabled());await p.locator('[data-chapter="2"]').click();
 await p.setViewportSize({width:375,height:667});await p.locator('[data-level="21"]').click();await p.locator('.assist-target').first().waitFor();
 assert(await p.evaluate(()=>['frost_wisp','crystal_golem'].every(k=>images[k].complete&&images[k].naturalWidth>0)));
 assert((await p.locator('#progress').innerText()).includes('霜晶遺跡'));assert(await p.locator('[aria-label*="寒霜冰靈"]').count());assert(await p.locator('[aria-label*="霜晶守衛"]').count());
 await p.screenshot({path:'artifacts/qa-ice-mobile.png'});await p.setViewportSize({width:1280,height:720});await p.screenshot({path:'artifacts/qa-ice-desktop.png'});await p.setViewportSize({width:375,height:667});
 async function play(level){
  assert.equal(await p.evaluate(()=>game.run.cfg.id),level,'playing the requested stage');
  const deadline=Date.now()+180000;let bossSeen=false;
  while(Date.now()<deadline&&['play','pause'].includes(await p.evaluate(()=>game.mode))){
   if(await p.locator('#treasure-close').isVisible()){await p.locator('#treasure-close').click();continue;}
   const state=await p.evaluate(()=>({hp:game.run.hero.hp/game.run.hero.maxHp,boss:game.run.enemies.some(e=>e.boss),id:game.run.enemies.filter(e=>e.hp>0).sort((a,b)=>(b.warning>0)-(a.warning>0)||a.hp-b.hp)[0]?.id}));
   if(state.boss&&!bossSeen){bossSeen=true;await p.screenshot({path:'artifacts/qa-boss30-mobile.png'});}
   if(state.hp<.6&&await p.locator('#rescue').isEnabled())await p.locator('#rescue').click();
   if(await p.locator('#ultimate').isEnabled())await p.locator('#ultimate').click();
   if(state.id){const target=p.locator(`[data-enemy-id="${state.id}"]:not(:disabled)`);if(await target.count())await target.click({timeout:450}).catch(()=>{});}
   for(let n=0;n<2;n++){const drop=p.locator('.drop-target:visible').first();if(await drop.count())await drop.click({timeout:350}).catch(()=>{});}
   const barrel=p.locator('.barrel-target:visible').first();if(await barrel.count()&&await p.evaluate(()=>game.run.enemies.some(e=>Math.hypot(e.x-2.5,e.y-7.5)<2)))await barrel.click({timeout:350}).catch(()=>{});
   await p.waitForTimeout(350);
  }
  assert.equal(await p.evaluate(()=>game.mode),'win','natural-time stage '+level);assert(await p.evaluate(l=>game.save.cleared.includes(l),level));
  const row=await p.evaluate(()=>({level:game.run.cfg.id,seconds:game.run.time,charges:game.run.charges,minFinalHp:game.run.hero.hp,stats:game.run.stats}));results.push({...row,bossSeen});return bossSeen;
 }
 await play(21);assert.equal(await p.evaluate(()=>game.save.unlocked),22);await p.locator('[data-upgrade="power"]').click();assert.equal(await p.evaluate(()=>game.run.cfg.id),22,'21 naturally continues to 22');
 // Enter the final encounter using a real migrated save; combat runs at 1x through UI buttons.
 await p.close();p=await b.newPage({viewport:{width:375,height:667},deviceScaleFactor:2});p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(save=>{if(!localStorage.getItem('little-guardian-mvp-v1'))localStorage.setItem('little-guardian-mvp-v1',JSON.stringify(save));},{...fixture(30,29),unlocked:30});await p.goto('http://127.0.0.1:8765/index.html');await p.locator('#start').click();assert(await play(30));
 assert((await p.locator('#dialog').innerText()).includes('30 關試玩完成'));assert.equal(await p.evaluate(()=>game.save.unlocked),30);await p.screenshot({path:'artifacts/qa-campaign30-win-mobile.png'});
 await p.setViewportSize({width:320,height:568});let box=await p.locator('#dialog').boundingBox();assert(box.y>=0&&box.y+box.height<=568,'final rewards fit small phone');await p.screenshot({path:'artifacts/qa-campaign30-win-small.png'});
 await p.locator('[data-upgrade="power"]').click();assert.equal(await p.evaluate(()=>game.mode),'title');await p.reload();await p.locator('#select').click();assert(await p.locator('[data-level="30"]').isEnabled());assert.equal(await p.locator('[data-level="31"]').count(),0);assert.equal(await p.evaluate(()=>game.save.cleared.length),30);
 assert.deepEqual(errors,[]);fs.writeFileSync('artifacts/campaign30-browser-results.json',JSON.stringify({passed:true,results,errors},null,2));console.log('PASS: third chapter at three sizes, save migration, generated sprites, real-button natural-time levels 21 and 30, final reward and reload persistence.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
