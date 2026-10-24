const {chromium}=require('C:/Users/User/.agents/skills/gstack/node_modules/playwright'),{execFileSync}=require('child_process');
const fs=require('fs'),assert=require('assert/strict');
// Git's released renderer provides an independent pixel reference for this dev check.
// Apply the intentional right-hand anchor correction to the historical pixel reference.
const reference=execFileSync('git',['show','5623797:src/render.js'],{encoding:'utf8'}).replace('e.face<0?-13:3','e.face<0?-13:-3');
(async()=>{const browser=await chromium.launch({headless:true});try{
  const page=await browser.newPage({viewport:{width:375,height:667},deviceScaleFactor:2});await page.goto('http://127.0.0.1:8765/index.html');await page.locator('#start').waitFor();
  const comparisons=await page.evaluate(reference=>{
    const oldFactory=new Function(reference+';return createRenderer;')(),host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;top:0';document.body.append(host);
    function setup(factory,assets=images){const wrapper=document.createElement('div');wrapper.style.cssText='position:relative;width:208px;height:240px';const canvas=document.createElement('canvas');canvas.width=208;canvas.height=240;canvas.style.cssText='display:block;width:208px;height:240px';wrapper.append(canvas);host.append(wrapper);return {canvas,wrapper,renderer:factory(canvas,assets)};}
    const current=setup(createRenderer),old=setup(oldFactory),rows=[];
    function compare(a,b){const x=a.getContext('2d').getImageData(0,0,a.width,a.height).data,y=b.getContext('2d').getImageData(0,0,b.width,b.height).data;if(x.length!==y.length)throw Error('canvas dimensions differ');let changed=0,maxDelta=0;for(let i=0;i<x.length;i++)if(x[i]!==y[i]){changed++;maxDelta=Math.max(maxDelta,Math.abs(x[i]-y[i]));}return {changed,maxDelta};}
    function check(s,kind){current.renderer.draw(s,3.371);old.renderer.draw(s,3.371);rows.push({level:s.cfg.id,kind,world:compare(current.canvas,old.canvas),text:compare(current.canvas.nextSibling,old.canvas.nextSibling)});}
    for(let level=1;level<=20;level++){
      const s=DungeonEngine.begin(level,{power:level-1},42,{attack:6,hp:40,lifesteal:.06,thorns:4,waveHeal:3,spirit:'wind'});for(let i=0;i<60;i++)DungeonEngine.step(s,1/30);
      check(s,'base');s.impact=.1;s.impactPower=3;check(s,'shake');s.impact=0;
      s.effects=[{kind:'text',text:'回復 +8',x:6.5,y:8,age:.2,life:1,color:'#a7ffcf'},{kind:'pickup',x:3,y:5,age:.2,life:.65,potion:true}];check(s,'pickup');
      s.effects.push({kind:'ultimate',age:.2,life:1.3});check(s,'charge');s.effects.at(-1).age=.7;check(s,'impact');
      s.effects=[{kind:'flyout',x:6,y:8,dx:1,dy:-.5,type:level>10?'skeleton':'slime',boss:false,age:.15,life:.85}];check(s,'flyout');
      s.map[5]='#...........#';check(s,'edited-map');
    }
    const assets={...images,forest_ground:{complete:false,naturalWidth:0}},late=setup(createRenderer,assets),lateReference=setup(oldFactory,assets),s=DungeonEngine.begin(11);
    late.renderer.draw(s,3);lateReference.renderer.draw(s,3);assets.forest_ground=images.forest_ground;late.renderer.draw(s,3);lateReference.renderer.draw(s,3);rows.push({level:11,kind:'late-image',world:compare(late.canvas,lateReference.canvas),text:compare(late.canvas.nextSibling,lateReference.canvas.nextSibling)});
    current.renderer.destroy();late.renderer.destroy();if(current.wrapper.querySelector('.effect-text')||late.wrapper.querySelector('.effect-text'))throw Error('destroy did not remove text layer');host.remove();return rows;
  },reference);
  fs.writeFileSync('artifacts/render-optimization-results.json',JSON.stringify({comparisons},null,2));
  assert(comparisons.every(r=>r.world.changed===0&&r.text.changed===0),'cached drawing must match released pixels exactly; inspect render-optimization-results.json');
  console.log(`PASS: ${comparisons.length} pixel-identical render comparisons across 20 maps, effects, shake, map edits and late image loading.`);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
