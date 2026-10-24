const {chromium}=require('C:/Users/User/.agents/skills/gstack/node_modules/playwright'),{execFileSync}=require('child_process');
const assert=require('assert/strict'),fs=require('fs');
const oldUi=execFileSync('git',['show','5623797:src/ui.js'],{encoding:'utf8'}),oldGear=execFileSync('git',['show','5623797:src/gear-ui.js'],{encoding:'utf8'});
const reference={update:oldUi.slice(oldUi.indexOf('function update(){'),oldUi.indexOf("\nbind('ultimate'")),targets:oldGear.slice(oldGear.indexOf('function updateLootTargets(){'),oldGear.indexOf("\nbind('bag'")),sync:oldGear.slice(oldGear.indexOf('function syncTargets(){'))};
(async()=>{const browser=await chromium.launch({headless:true}),results=[];try{for(const [name,width,height,dpr] of [['mobile',375,667,2],['desktop',1280,720,1]]){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('little-guardian-mvp-v1',JSON.stringify({version:5,unlocked:20,cleared:Array.from({length:19},(_,i)=>i+1),perks:{power:19},spirit:'wind',inventory:[{id:1,slot:'weapon',rarity:1,level:20,trait:'lifesteal'},{id:2,slot:'armor',rarity:0,level:20,trait:'thorns'},{id:3,slot:'charm',rarity:0,level:20,trait:'renewal'}],equipped:{weapon:1,armor:2,charm:3}})));
 await page.goto('http://127.0.0.1:8765/index.html');await page.locator('#start').click();await page.locator('.assist-target').first().waitFor();
 const mutations=await page.evaluate(reference=>{
   function measure(fn){fn();const observer=new MutationObserver(()=>{});observer.observe(document.querySelector('.game-card'),{subtree:true,attributes:true,childList:true,characterData:true});for(let i=0;i<100;i++)fn();const n=observer.takeRecords().length;observer.disconnect();return n;}
   const currentTargets=updateLootTargets,oldUpdate=new Function('return ('+reference.update+')')(),oldTargets=new Function('return ('+reference.targets+')')(),oldSync=new Function('return ('+reference.sync+')')();
   updateLootTargets=oldTargets;const before=measure(()=>{oldUpdate();oldSync();});updateLootTargets=currentTargets;const after=measure(()=>{update();syncTargets();});
   const root=document.querySelector('#loot-targets'),button=root.querySelector('[data-enemy-id]'),enemy=game.run.enemies.find(e=>e.id===Number(button.dataset.enemyId));
   const x=enemy.x;enemy.x+=.125;syncTargets();const follows=Math.abs(parseFloat(button.style.left)-enemy.x/13*100)<.001;enemy.x=x;syncTargets();
   return {before,after,follows};
 },reference);assert(mutations.before>1000);assert.equal(mutations.after,0,'unchanged active HUD/targets do not mutate DOM');assert(mutations.follows,'touch targets still track movement');
 await page.screenshot({path:`artifacts/qa-optimization-${name}.png`});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight));
 await page.locator('#companion').click();const paused=await page.evaluate(()=>game.run.time);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>game.run.time),paused);await page.locator('[data-spirit="luck"]').click();await page.locator('[data-spirit="wind"]').click();await page.locator('#close-spirits').click();
 await page.locator('#ultimate').click();await page.waitForTimeout(650);assert.equal(await page.evaluate(()=>game.run.stats.ultimates),1);
 if(name==='mobile'){const deadline=Date.now()+120000;while(Date.now()<deadline&&await page.evaluate(()=>game.mode)==='play'){
   if(await page.evaluate(()=>game.run.hero.hp/game.run.hero.maxHp<.55)&&await page.locator('#rescue').isEnabled())await page.locator('#rescue').click();
   if(await page.locator('#ultimate').isEnabled())await page.locator('#ultimate').click();const target=page.locator('.assist-target:visible:not(:disabled)').first();if(await target.count())await target.click({timeout:500}).catch(()=>{});const drop=page.locator('.drop-target:visible').first();if(await drop.count())await drop.click({timeout:500}).catch(()=>{});await page.waitForTimeout(600);
 }assert.equal(await page.evaluate(()=>game.mode),'win','natural-time boss clear after optimization');await page.screenshot({path:'artifacts/qa-optimization-win-mobile.png'});}
 assert.equal(await page.locator('.effect-text').count(),1);assert.deepEqual(errors,[]);results.push({name,mutations,seconds:await page.evaluate(()=>game.run.time),errors});await context.close();
}fs.writeFileSync('artifacts/optimization-browser-results.json',JSON.stringify({passed:true,results},null,2));console.log('PASS: active HUD and touch-target mutations eliminated, movement tracking, spirit switching, actual ultimate, natural-time boss clear and two viewports.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
