const {chromium}=require('C:/Users/User/.agents/skills/gstack/node_modules/playwright');
const {execFileSync}=require('child_process'),assert=require('assert/strict'),fs=require('fs');
const previous=execFileSync('git',['show','06d1bb6:src/render.js'],{encoding:'utf8'});
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:375,height:667},deviceScaleFactor:2});await page.goto('http://127.0.0.1:8765/index.html');await page.locator('#start').waitFor();
 await page.waitForFunction(()=>images.weapon_sword_1?.naturalWidth>0);
 const rows=await page.evaluate(previous=>{
  const oldFactory=new Function(previous+';return createRenderer;')(),rows=[];
  const gallery=document.createElement('div');gallery.id='sword-gallery';gallery.style.cssText='position:fixed;inset:0;z-index:99999;background:#1d2130;color:#fff;overflow:auto;padding:12px;font:16px sans-serif';document.body.append(gallery);
  function draw(factory,face,slash,show=false){
   const wrap=document.createElement('div'),canvas=document.createElement('canvas');canvas.width=208;canvas.height=240;wrap.style.cssText='position:relative;display:inline-block;width:156px';canvas.style.cssText='width:156px;height:180px;image-rendering:pixelated';wrap.append(canvas);gallery.append(wrap);
   const ctx=canvas.getContext('2d'),original=ctx.drawImage.bind(ctx);let matrix;
   ctx.drawImage=(im,...args)=>{if(im===images.weapon_sword_1){const m=ctx.getTransform();matrix={a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f,args};}original(im,...args);};
   const renderer=factory(canvas,images),s=DungeonEngine.begin(1,{},42);Object.assign(s.hero,{x:6.5,y:8,face,slash,moving:false});Object.assign(s,{enemies:[],effects:[],impact:0,bannerUntil:0});renderer.draw(s,0);renderer.destroy();
   if(show){const preview=document.createElement('canvas');preview.width=144;preview.height=144;preview.style.imageRendering='pixelated';const zoom=preview.getContext('2d');zoom.imageSmoothingEnabled=false;zoom.drawImage(canvas,80,104,48,48,0,0,144,144);canvas.replaceWith(preview);const title=document.createElement('p');title.textContent=(face<0?'← LEFT':'RIGHT →')+' / '+slash;wrap.prepend(title);}else wrap.remove();return matrix;
  }
  for(const slash of [0,.25,.18,.08,.001]){
   const left=draw(createRenderer,-1,slash,true),right=draw(createRenderer,1,slash,true),oldLeft=draw(oldFactory,-1,slash);
   const corners=m=>[[0,0],[16,0],[0,16],[16,16]].map(([x,y])=>({x:m.a*(x+m.args[0])+m.c*(y+m.args[1])+m.e,y:m.b*(x+m.args[0])+m.d*(y+m.args[1])+m.f}));
   const l=corners(left),r=corners(right),old=corners(oldLeft);
   const leftError=Math.max(...l.map((p,i)=>Math.hypot(p.x-old[i].x,p.y-old[i].y)));
   const mirrorError=Math.max(...l.map((p,i)=>Math.hypot(p.x+r[i].x-208,p.y-r[i].y)));
   rows.push({slash,leftError,mirrorError});
  }
  return rows;
 },previous);
 assert(rows.every(r=>r.leftError<1e-8&&r.mirrorError<1e-8),JSON.stringify(rows));
 await page.screenshot({path:'artifacts/qa-sword-facing-mobile.png',fullPage:true});
 await page.setViewportSize({width:1280,height:720});await page.screenshot({path:'artifacts/qa-sword-facing-desktop.png',fullPage:true});
 fs.writeFileSync('artifacts/sword-facing-results.json',JSON.stringify({passed:true,rows},null,2));console.log('PASS: left sword pose preserved; right pose mirrors hand pivot through idle and four swing phases.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
