const {chromium}=require('C:/Users/User/.agents/skills/gstack/node_modules/playwright');
const assert=require('assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({headless:true}),results=[];
try{for(const [name,width,height,dpr] of [['mobile',375,667,2],['desktop',1280,720,1],['small',320,568,3]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr}),p=await context.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8765/index.html');await p.locator('#start').click();await p.locator('.assist-target').first().waitFor();
  await p.evaluate(()=>{window.spriteSamples=[];const ctx=document.querySelector('#game').getContext('2d'),draw=ctx.drawImage.bind(ctx);ctx.drawImage=(im,...args)=>{if(im===images.knight_idle_anim_f0||Object.keys(images).some(k=>k.startsWith('knight_')&&images[k]===im)){const m=ctx.getTransform();spriteSamples.push({w:args[2],h:args[3],a:m.a,b:m.b,c:m.c,d:m.d});}return draw(im,...args);};});
  await p.locator('#ultimate').click();await p.waitForTimeout(200);await p.screenshot({path:`artifacts/qa-clarity-${name}.png`});
  const info=await p.evaluate(()=>{const c=document.querySelector('.effect-text'),r=c.getBoundingClientRect();return {count:document.querySelectorAll('.effect-text').length,backing:[c.width,c.height],css:[r.width,r.height],smoothing:getComputedStyle(c).imageRendering,pointer:getComputedStyle(c).pointerEvents,samples:spriteSamples,overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight};});
  assert.equal(info.count,1);assert.equal(info.backing[0],Math.round(info.css[0]*dpr));assert.equal(info.backing[1],Math.round(info.css[1]*dpr));assert.equal(info.smoothing,'auto');assert.equal(info.pointer,'none');assert(!info.overflow);assert(info.samples.length>0);
  assert(info.samples.every(s=>s.w===16&&s.h===16&&Math.abs(s.a)===1&&Math.abs(s.d)===1&&s.b===0&&s.c===0),'hero retains native size and proportions during spell');
  await p.waitForTimeout(550);await p.screenshot({path:`artifacts/qa-clarity-impact-${name}.png`});
  await p.locator('#pause').click();const time=await p.evaluate(()=>game.run.time);await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>game.run.time),time);await p.locator('#resume').click();
  await p.setViewportSize({width:width===375?1280:375,height:height===667?720:667});await p.waitForTimeout(150);assert(await p.evaluate(()=>{const c=document.querySelector('.effect-text');return c.width===Math.round(c.getBoundingClientRect().width*devicePixelRatio);}),'text backing follows resize');
  assert.deepEqual(errors,[]);results.push({name,dpr,...info,errors});await context.close();
}fs.writeFileSync('artifacts/clarity-browser-results.json',JSON.stringify({passed:true,results},null,2));console.log('PASS: native sprite size during casting, DPR 1/2/3 text layer, resize, pause, three viewport screenshots and no errors.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
