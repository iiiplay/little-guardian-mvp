// Development benchmark: run once before editing and again against the same workload.
const {chromium}=require('C:/Users/User/.agents/skills/gstack/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict');
(async()=>{const browser=await chromium.launch({headless:true});try{
  const page=await browser.newPage({viewport:{width:375,height:667},deviceScaleFactor:2});
  await page.goto('http://127.0.0.1:8765/index.html');await page.locator('#start').click();
  const result=await page.evaluate(()=>{
    game.pause();closeDialog();update();
    const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),textCtx=document.querySelector('.effect-text').getContext('2d');
    const counts={drawImage:0,gradient:0,layoutReads:0,measureText:0};
    for(const [object,key,count] of [[ctx,'drawImage','drawImage'],[ctx,'createRadialGradient','gradient'],[canvas,'getBoundingClientRect','layoutReads'],[textCtx,'measureText','measureText']]){const original=object[key].bind(object);object[key]=(...args)=>{counts[count]++;return original(...args);};}
    const scenes=[1,11,20].map(level=>{const s=DungeonEngine.begin(level,{power:level-1},42,{attack:6,hp:40,lifesteal:.06,thorns:4,waveHeal:3,spirit:'wind'});for(let i=0;i<60;i++)DungeonEngine.step(s,1/30);s.effects=Array.from({length:12},(_,i)=>({kind:'text',text:i%2?'回復 +8':'32',x:2+i%5*2,y:5+Math.floor(i/5)*2,age:.2,life:1,color:'#ffe0a0'}));return s;});
    for(const s of scenes)for(let i=0;i<20;i++)renderer.draw(s,3+i/60);
    Object.keys(counts).forEach(k=>counts[k]=0);const timings=[];
    for(const s of scenes){const samples=[];for(let batch=0;batch<5;batch++){const begin=performance.now();for(let i=0;i<200;i++)renderer.draw(s,3+i/60);samples.push((performance.now()-begin)/200);}samples.sort((a,b)=>a-b);timings.push({level:s.cfg.id,medianMs:samples[2],slowestBatchMs:samples[4]});}
    const observer=new MutationObserver(()=>{});observer.observe(document.querySelector('.game-card'),{subtree:true,childList:true,attributes:true,characterData:true});for(let i=0;i<100;i++)update();const unchangedHudMutations=observer.takeRecords().length;observer.disconnect();
    return {frames:3000,counts,timings,unchangedHudMutations};
  });
  const output=process.argv[2]||'artifacts/performance-after.json';fs.writeFileSync(output,JSON.stringify(result,null,2));assert(result.timings.every(t=>Number.isFinite(t.medianMs)));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
