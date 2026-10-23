const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/User/.agents/skills/gstack/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({headless:true}),errors=[];try{
 const p=await browser.newPage({viewport:{width:375,height:667}});p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{const key='little-guardian-mvp-v1';if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:2,unlocked:1,cleared:[],inventory:[1,2,3,4].map(id=>({id,slot:'weapon',rarity:0,level:1})),equipped:{}}));});
 await p.goto('http://127.0.0.1:8765/index.html');await p.locator('#start').click();
 await p.evaluate(()=>{let n=0;while(game.run.kills<game.run.cfg.count&&n++<2000)game.tick(1/30);update();});
 await p.getByRole('button',{name:'開啟寶箱，獲得裝備'}).click();await p.locator('#treasure-equip').waitFor();
 assert.equal(await p.evaluate(()=>game.mode),'pause');assert(await p.evaluate(()=>game.save.inventory.at(-1).rarity>=2),'fifth drop has rare guarantee');const t=await p.evaluate(()=>game.run.time);await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>game.run.time),t,'reveal pauses battle');
 await p.screenshot({path:'artifacts/qa-treasure-mobile.png'});let box=await p.locator('#treasure-close').boundingBox();assert(box.y>=0&&box.y+box.height<667,'reveal fits mobile');
 await p.setViewportSize({width:1280,height:720});await p.screenshot({path:'artifacts/qa-treasure-desktop.png'});await p.setViewportSize({width:320,height:568});box=await p.locator('#treasure-close').boundingBox();assert(box.y>=0&&box.y+box.height<=568,'reveal fits small mobile');
 await p.locator('#treasure-equip').click();assert.equal(await p.evaluate(()=>game.mode),'play');assert(await p.evaluate(()=>Object.values(game.save.equipped).includes(5)),'quick equip applies newly found gear');
 await p.reload();await p.locator('#start').click();assert(await p.evaluate(()=>Object.values(game.save.equipped).includes(5)),'trait equipment persists on reload');
 await p.evaluate(()=>{let n=0;while(game.run.kills<game.run.cfg.count&&n++<2000)game.tick(1/30);update();});await p.getByRole('button',{name:'開啟寶箱，獲得裝備'}).click();await p.locator('#treasure-close').waitFor();
 await p.waitForTimeout(8500);assert.equal(await p.evaluate(()=>game.mode),'play','unattended reveal resumes automatically');assert.equal(await p.evaluate(()=>game.save.inventory.length),6,'auto close does not duplicate drops');
 assert.deepEqual(errors,[]);fs.writeFileSync('artifacts/treasure-browser-results.json',JSON.stringify({passed:true,errors,flows:['rare guarantee','manual reveal','pause','quick equip','reload with trait','automatic reveal dismissal'],viewports:['375x667','320x568','1280x720']},null,2));console.log('PASS: treasure reveal, quick equip, rare guarantee, persistence and auto-resume at three viewports.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
