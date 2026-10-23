const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/User/.agents/skills/gstack/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
(async()=>{const b=await chromium.launch({headless:true}),errors=[];try{
 const p=await b.newPage({viewport:{width:375,height:667},hasTouch:true});p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8765/index.html');await p.locator('#start').click();
 await p.locator('.assist-target').first().waitFor();assert.equal(await p.evaluate(()=>combatAudio.state),'running','sound unlocked by start gesture');
 for(let i=0;i<3;i++){await p.locator('.assist-target:not(:disabled)').first().click();if(i<2)await p.waitForTimeout(650);}
 assert.equal(await p.evaluate(()=>game.run.stats.bursts),1,'three actual screen taps cast meteor');
 await p.screenshot({path:'artifacts/qa-combat-mobile.png'});
 await p.locator('.drop-target').first().waitFor();const before=await p.evaluate(()=>game.run.assistCharges);await p.locator('.drop-target').first().click();assert(await p.evaluate(()=>game.run.manualLoot)>0);assert(await p.evaluate(()=>game.run.assistCharges)>before,'manual loot replenishes energy');
 await p.locator('.barrel-target').first().click();assert(await p.evaluate(()=>game.run.stats.barrels)>0,'barrel UI routes to engine');
 await p.locator('#pause').click();const frozen=await p.evaluate(()=>({time:game.run.time,energy:game.run.energyClock,combo:game.run.combo}));await p.waitForTimeout(700);assert.deepEqual(await p.evaluate(()=>({time:game.run.time,energy:game.run.energyClock,combo:game.run.combo})),frozen);await p.locator('#resume').click();
 const until=Date.now()+120000;let screenshots=false;
 while(await p.evaluate(()=>game.mode)==='play'&&Date.now()<until){
   const drops=p.locator('.drop-target');if(await drops.count())await drops.first().click({timeout:1500}).catch(()=>{});
   const enemies=p.locator('.assist-target:not(:disabled)');if(await enemies.count())await enemies.first().click({timeout:1500}).catch(()=>{});
   if(await p.evaluate(()=>game.run.hero.hp/game.run.hero.maxHp<.5)&&await p.locator('#rescue').isEnabled())await p.locator('#rescue').click();
   if(!screenshots&&await p.evaluate(()=>game.run.wave>=2)){await p.setViewportSize({width:1280,height:720});await p.screenshot({path:'artifacts/qa-combat-desktop.png'});const box=await p.locator('#rescue').boundingBox();assert(box.y+box.height<=720);await p.setViewportSize({width:375,height:667});screenshots=true;}
   await p.waitForTimeout(900);
 }
 assert.equal(await p.evaluate(()=>game.mode),'win','natural real-time active run wins');const stats=await p.evaluate(()=>({time:game.run.time,...game.run.stats,manualLoot:game.run.manualLoot}));await p.screenshot({path:'artifacts/qa-combat-result-mobile.png'});
 assert(await p.locator('.intervention-result').isVisible());
 // Inspect small-screen and reduced-motion rendering, without changing save data.
 await p.locator('[data-upgrade]').first().click();await p.setViewportSize({width:320,height:568});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));let box=await p.locator('#rescue').boundingBox();assert(box.y+box.height<=568);await p.screenshot({path:'artifacts/qa-combat-small.png'});
 await p.emulateMedia({reducedMotion:'reduce'});await p.reload();await p.locator('#start').click();await p.waitForTimeout(1800);await p.locator('.assist-target').first().click();await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>hitStop),0);
 await p.locator('#sound').click();assert.equal(await p.evaluate(()=>soundOn),false);assert.deepEqual(errors,[]);
 fs.writeFileSync('artifacts/combat-browser-results.json',JSON.stringify({passed:true,stats,viewports:['375x667','1280x720','320x568'],errors},null,2));console.log(JSON.stringify({passed:true,stats,errors}));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
