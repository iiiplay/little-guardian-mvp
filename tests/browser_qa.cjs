// Uses an existing local Playwright installation or PLAYWRIGHT_PATH. No runtime dependency.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
let pw;try{pw=require('playwright');}catch{pw=require(process.env.PLAYWRIGHT_PATH||'C:/Users/User/.agents/skills/gstack/node_modules/playwright');}
const root=path.resolve(__dirname,'..'),url=process.env.GAME_URL||'http://127.0.0.1:8765/index.html';
(async()=>{
 const browser=await pw.chromium.launch({headless:true});const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:375,height:667},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(url);await page.getByRole('button',{name:'開始守護',exact:true}).waitFor();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
  await page.screenshot({path:path.join(root,'artifacts/qa-title-mobile.png')});
  await page.getByRole('button',{name:'開始守護',exact:true}).click();
  await page.getByRole('button',{name:'切換速度，目前一倍'}).click();
  await page.waitForTimeout(4500);await page.screenshot({path:path.join(root,'artifacts/qa-play-mobile.png')});
  // UI rescue then verify its actual gameplay effect and cooldown.
  await page.getByRole('button',{name:/守護降臨/}).click();assert.equal(await page.evaluate(()=>game.run.charges),1);assert(await page.evaluate(()=>game.run.hero.shield>0));
  assert(await page.locator('#rescue').isDisabled());await page.screenshot({path:path.join(root,'artifacts/qa-rescue-mobile.png')});
  await page.getByRole('button',{name:'暫停',exact:true}).click();await page.getByRole('heading',{name:'休息一下。'}).waitFor();const before=await page.evaluate(()=>game.run.time);await page.waitForTimeout(800);assert.equal(await page.evaluate(()=>game.run.time),before);await page.screenshot({path:path.join(root,'artifacts/qa-pause-mobile.png')});
  await page.getByRole('button',{name:'繼續守護',exact:true}).click();
  // Real-time soak: first stage runs naturally, not by mutating the game clock.
  await page.getByRole('heading',{name:'又前進了一小步！'}).waitFor({timeout:45000});
  await page.screenshot({path:path.join(root,'artifacts/qa-win-mobile.png')});
  assert.equal(await page.evaluate(()=>game.save.unlocked),2);
  await page.getByRole('button',{name:/勇敢的心/}).click();await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>game.run.cfg.id),2);assert.equal(await page.evaluate(()=>game.run.hero.maxHp),144);
  // Backgrounding freezes the owner and never accrues catch-up damage.
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await page.evaluate(()=>game.mode),'pause');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await page.getByRole('button',{name:'繼續守護',exact:true}).click();
  await page.getByRole('button',{name:'開啟關卡地圖'}).click();await page.getByRole('heading',{name:'冒險的小足跡'}).waitFor();assert(await page.getByRole('button',{name:/第 3 關/}).isDisabled());await page.screenshot({path:path.join(root,'artifacts/qa-map-mobile.png')});
  await page.getByRole('button',{name:'重新分配祝福'}).click();await page.getByRole('button',{name:/磨亮小劍/}).click();assert.equal(await page.evaluate(()=>game.save.perks.power),1);
  await page.reload();await page.getByRole('button',{name:/繼續冒險 · 第 2 關/}).click();assert.equal(await page.evaluate(()=>game.run.hero.attack),8);
  // Loss flow is driven by the simulation's HP condition, then retried through UI.
  await page.evaluate(()=>{game.run.hero.hp=0;});await page.getByRole('heading',{name:'差一點點。'}).waitFor();await page.screenshot({path:path.join(root,'artifacts/qa-lose-mobile.png')});await page.getByRole('button',{name:'再守護他一次'}).click();assert.equal(await page.evaluate(()=>game.mode),'play');
  await page.setViewportSize({width:1280,height:720});await page.waitForTimeout(250);await page.screenshot({path:path.join(root,'artifacts/qa-play-desktop.png')});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'desktop no overflow');
  const box=await page.locator('#rescue').boundingBox();assert(box.height>=44&&box.y+box.height<=720,'desktop rescue visible');
  await page.setViewportSize({width:375,height:667});const mobile=await page.locator('#rescue').boundingBox();assert(mobile.y+mobile.height<=667,'mobile rescue visible');
  // Build has no missing local assets and works without HTTP as a portable file.
  const offline=await browser.newPage({viewport:{width:375,height:667}});offline.on('pageerror',e=>errors.push(e.message));await offline.goto('file:///'+path.join(root,'dist/game.html').replaceAll('\\','/'));await offline.getByRole('button',{name:'開始守護',exact:true}).click();await offline.waitForTimeout(200);assert.equal(await offline.evaluate(()=>game.mode),'play');
  assert.deepEqual(errors,[],'no browser errors');
  const result={passed:true,viewports:['375x667','1280x720'],flows:['start','real-time stage clear at 2x','rescue and cooldown','pause and resume','upgrade','background pause','level locks','respec','reload save','loss and retry','portable file'],errors};fs.writeFileSync(path.join(root,'artifacts/browser-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
