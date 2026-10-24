function createRenderer(canvas,images){
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const textCanvas=document.createElement('canvas');textCanvas.className='effect-text';textCanvas.setAttribute('aria-hidden','true');canvas.after(textCanvas);
  const textCtx=textCanvas.getContext('2d'),textWidths=new Map();let labels=[];
  let viewWidth=0,viewHeight=0,textDpr=0;
  function resizeTextLayer(width,height){
    viewWidth=width;viewHeight=height;textDpr=window.devicePixelRatio||1;
    const w=Math.round(width*textDpr),h=Math.round(height*textDpr);
    if(textCanvas.width!==w)textCanvas.width=w;if(textCanvas.height!==h)textCanvas.height=h;
  }
  const initialSize=canvas.getBoundingClientRect();resizeTextLayer(initialSize.width,initialSize.height);
  const onResize=()=>{const r=canvas.getBoundingClientRect();resizeTextLayer(r.width,r.height);};
  const resizeObserver=typeof ResizeObserver==='function'?new ResizeObserver(entries=>{const r=entries[0].contentRect;resizeTextLayer(r.width,r.height);}):null;
  if(resizeObserver)resizeObserver.observe(canvas);else window.addEventListener('resize',onResize);
  function label(text,x,y,color,alpha=1,size=14){labels.push({text,x,y,color,alpha,size});}
  function drawLabels(){
    if(textDpr!==(window.devicePixelRatio||1))resizeTextLayer(viewWidth,viewHeight);
    const width=viewWidth,height=viewHeight;
    textCtx.setTransform(textDpr,0,0,textDpr,0,0);textCtx.clearRect(0,0,width,height);const boxes=[];let fontSize=0;
    textCtx.textAlign='center';textCtx.textBaseline='middle';textCtx.lineJoin='round';textCtx.lineWidth=3;textCtx.strokeStyle='#191625';
    for(const l of labels){
      if(fontSize!==l.size){textCtx.font=`700 ${l.size}px "Microsoft JhengHei",sans-serif`;fontSize=l.size;}
      const key=l.size+'|'+l.text;let tw=textWidths.get(key);
      if(tw===undefined){tw=textCtx.measureText(l.text).width+6;if(textWidths.size>=256)textWidths.delete(textWidths.keys().next().value);textWidths.set(key,tw);}
      const th=l.size+4;let x=Math.max(tw/2+3,Math.min(width-tw/2-3,l.x*width/208)),y=Math.max(th/2+3,Math.min(height-th/2-3,l.y*height/240));
      for(let i=0;i<boxes.length;i++)if(Math.abs(x-boxes[i].x)<(tw+boxes[i].w)/2&&Math.abs(y-boxes[i].y)<(th+boxes[i].h)/2){y=boxes[i].y-(th+boxes[i].h)/2; i=-1;if(y<th/2+3)break;}
      y=Math.max(th/2+3,y);boxes.push({x,y,w:tw,h:th});textCtx.globalAlpha=l.alpha;textCtx.strokeText(l.text,Math.round(x),Math.round(y));textCtx.fillStyle=l.color;textCtx.fillText(l.text,Math.round(x),Math.round(y));
    }textCtx.globalAlpha=1;
  }
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function sprite(name,x,y,w=16,h=w,flip=false,alpha=1,context=ctx){const im=images[name];if(!im||!im.complete||!im.naturalWidth)return;context.save();context.globalAlpha*=alpha;if(flip){context.translate(Math.round(x+w),Math.round(y));context.scale(-1,1);context.drawImage(im,0,0,w,h);}else context.drawImage(im,Math.round(x),Math.round(y),w,h);context.restore();}
  function circle(x,y,r,color,stroke=false){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(stroke){ctx.strokeStyle=color;ctx.lineWidth=1;ctx.stroke();}else{ctx.fillStyle=color;ctx.fill();}}
  function enemySprite(type,state='idle',frame=0){return type==='golem'?'crystal_golem':type==='wisp'?'frost_wisp':type==='fly'?`fly_anim_f${frame}`:`${type}_${state}_anim_f${frame}`;}
  function crystal(x,y,context=ctx){context.fillStyle='#152c48';context.fillRect(x+3,y,9,16);context.fillStyle='#70c8e0';context.fillRect(x+5,y+2,5,12);context.fillRect(x+2,y+7,3,7);context.fillRect(x+10,y+6,3,8);context.fillStyle='#d5faff';context.fillRect(x+5,y+2,2,9);context.fillRect(x+2,y+7,1,5);context.fillStyle='#3992b9';context.fillRect(x+9,y+5,1,9);}
  function aura(s,front=false){
    const h=s.hero,t=reduced?0:s.time,x=h.x*16,y=h.y*16;
    const colors=[h.lifesteal?'#ffabc2':null,h.chain?'#c2caff':null,h.thorns?'#a7ebcf':null,h.waveHeal?'#ffe09a':null].filter(Boolean);
    if(!front&&(h.gearGlow||h.shield>0||h.auraTime>0)){
      const color=h.shield>0?'#b0ffe6':h.auraTime>0?'#d0ffe5':colors[0]||'#d4c1ff';
      ctx.save();const r=h.auraTime>0?21:15,glow=ctx.createRadialGradient(x,y,2,x,y,r);glow.addColorStop(0,color+'66');glow.addColorStop(.55,color+'25');glow.addColorStop(1,color+'00');ctx.fillStyle=glow;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.strokeStyle=color+'80';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y+6,12,5,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    for(let i=0;i<colors.length*2;i++){const a=t*(1.2+i*.06)+i*Math.PI*2/(colors.length*2),depth=Math.sin(a);if((depth>=0)!==front)continue;const px=x+Math.cos(a)*13,py=y+depth*6-3;ctx.save();ctx.globalAlpha=.85;circle(px,py,2.5,colors[i%colors.length]+'35');ctx.fillStyle=colors[i%colors.length];ctx.fillRect(Math.round(px)-1,Math.round(py)-1,2,2);ctx.restore();}
    if(h.auraTime>0)for(let i=0;i<6;i++){const a=t*2+i*Math.PI/3,px=x+Math.cos(a)*10,py=y+8-((t*16+i*5)%25);if((i%2===0)!==front)continue;ctx.fillStyle='#d1ffe3';ctx.fillRect(Math.round(px),Math.round(py),1,3);}
    if(h.spirit){const a=t*1.7,depth=Math.sin(a);if((depth>=0)===front){const px=Math.round(x+Math.cos(a)*19),py=Math.round(y-8+depth*9),color=h.spirit==='wind'?'#a7ebcf':'#ffe09a';ctx.save();const glow=ctx.createRadialGradient(px,py,0,px,py,10);glow.addColorStop(0,color+'aa');glow.addColorStop(1,color+'00');ctx.fillStyle=glow;ctx.fillRect(px-10,py-10,20,20);ctx.fillStyle=color+'aa';const flap=reduced?0:Math.round(Math.sin(t*18));ctx.fillRect(px-6,py-2-flap,4,3);ctx.fillRect(px+2,py-2-flap,4,3);ctx.fillStyle=color;ctx.fillRect(px-2,py-4,4,7);ctx.fillStyle='#fff9e8';ctx.fillRect(px-1,py-3,2,2);for(let i=1;i<=4;i++){const tail=a-i*.18;ctx.globalAlpha=1-i/5;ctx.fillStyle=color;ctx.fillRect(Math.round(x+Math.cos(tail)*19),Math.round(y-8+Math.sin(tail)*9),1,1);}ctx.restore();}}
  }
  function entity(e,t,hero=false){
    const size=e.boss?32:16,x=e.x*16-size/2,y=e.y*16-size/2;ctx.fillStyle='#090b1475';ctx.beginPath();ctx.ellipse(e.x*16,e.y*16+6,e.boss?12:6,2.5,0,0,Math.PI*2);ctx.fill();
    const frame=reduced?0:Math.floor(t*(e.moving?10:6)+(e.id||0))%(e.type==='fly'?4:6);
    let name=hero?`knight_${e.moving?'run':'idle'}_anim_f${frame}`:enemySprite(e.type,e.moving?'run':'idle',frame);
    const bounce=reduced?0:e.type==='wisp'?Math.sin(t*4+(e.id||0))*1.5:e.moving?-Math.abs(Math.sin(t*11))*1.5:0;
    if(e.flash>0)ctx.filter=hero?'sepia(1) saturate(3) hue-rotate(300deg) brightness(1.7)':'brightness(2.8)';
    sprite(name,x,y+bounce,size,size,e.face<0);ctx.filter='none';
    if(!hero&&e.elite){circle(e.x*16,e.y*16+3,10,'#ffd283',true);ctx.fillStyle='#ffd283';ctx.fillRect(x+6,y-5,4,3);}
    if(hero){
      if(e.frostTime>0){circle(e.x*16,e.y*16+6,9,'#a7eaff',true);ctx.fillStyle='#b7efff';ctx.fillRect(e.x*16-9,e.y*16+4,3,3);ctx.fillRect(e.x*16+6,e.y*16+4,3,3);}
      if(e.shield>0){circle(e.x*16,e.y*16,12,'#a8f0d4a0',true);circle(e.x*16,e.y*16,14,'#a8f0d436',true);}
      if(e.thorns){for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.fillStyle='#a7ebcf';ctx.fillRect(Math.round(e.x*16+Math.cos(a)*10),Math.round(e.y*16+Math.sin(a)*10),2,2);}}
      if(e.lifesteal||e.chain)ctx.filter=e.chain?'sepia(.7) saturate(2) hue-rotate(170deg)':'sepia(.7) saturate(2) hue-rotate(300deg)';
      // Mirror the complete hand/weapon pose around the hero, including its pivot.
      ctx.save();ctx.translate(e.x*16,e.y*16);ctx.scale(e.face<0?-1:1,1);ctx.rotate(e.slash>0?(-1.6+(1-e.slash/.25)*3):.35);sprite('weapon_sword_1',-3,-7,16,16);ctx.restore();
      ctx.filter='none';
      if(e.slash>0)sprite('slash_effect_anim_f'+Math.min(2,Math.floor((1-e.slash/.25)*3)),e.x*16+(e.face<0?-24:0),e.y*16-12,24,24,e.face<0);
      circle(e.x*16,e.y*16+10,1,'#b6efd6');
    }else{
      if(e.boss&&e.type==='golem'&&e.hp<=e.maxHp*.5){circle(e.x*16,e.y*16,19,'#bcecff',true);ctx.fillStyle='#e1b3ff';ctx.fillRect(x+13,y+9,5,5);}
      if(e.hp<e.maxHp||e.boss){ctx.fillStyle='#161824';ctx.fillRect(x,y-5,size,2);ctx.fillStyle=e.boss?'#c3a5ed':'#e3a3a0';ctx.fillRect(x,y-5,Math.max(0,Math.ceil(size*e.hp/e.maxHp)),2);}
      if(e.boss){ctx.fillStyle='#f1d17c';ctx.fillRect(x+8,y-6,10,3);ctx.fillRect(x+8,y-9,2,4);ctx.fillRect(x+12,y-10,2,4);ctx.fillRect(x+16,y-9,2,4);}
    }
  }
  const terrainCanvas=document.createElement('canvas');terrainCanvas.width=208;terrainCanvas.height=240;
  const terrainCtx=terrainCanvas.getContext('2d');terrainCtx.imageSmoothingEnabled=false;
  const tile=(name,x,y,w=16,h=w,flip=false,alpha=1)=>sprite(name,x,y,w,h,flip,alpha,terrainCtx);
  let terrainKey='',terrainReady=false;
  function drawTerrain(s){
    const key=s.cfg.theme+'|'+s.cfg.id+'|'+s.map.join('');
    if(key!==terrainKey||!terrainReady){
      terrainCtx.clearRect(0,0,208,240);terrainCtx.fillStyle='#17141e';terrainCtx.fillRect(0,0,208,240);
      for(let y=0;y<15;y++)for(let x=0;x<13;x++){
        if(s.cfg.theme==='ice'){
          terrainCtx.fillStyle=s.map[y][x]==='#'?'#6498af':(x+y)%2?'#30495e':'#2d455a';terrainCtx.fillRect(x*16,y*16,16,16);
          if(s.map[y][x]==='#'){terrainCtx.fillStyle='#b4dce5';terrainCtx.fillRect(x*16,y*16,16,3);terrainCtx.fillStyle='#416980';terrainCtx.fillRect(x*16,y*16+12,16,4);crystal(x*16,y*16,terrainCtx);}
          else{terrainCtx.fillStyle='#597d9255';terrainCtx.fillRect(x*16,y*16,16,1);terrainCtx.fillRect(x*16,y*16,1,16);if((x*5+y*3+s.cfg.id)%7===0){terrainCtx.fillStyle='#8bc8dc66';terrainCtx.fillRect(x*16+4,y*16+5,6,1);terrainCtx.fillRect(x*16+9,y*16+6,1,4);}}
          continue;
        }
        if(s.cfg.theme==='forest'){
          terrainCtx.fillStyle='#294436';terrainCtx.fillRect(x*16,y*16,16,16);tile('forest_ground',x*16,y*16,16,16,false,.12);if(s.map[y][x]==='#'){terrainCtx.fillStyle='#173b30';terrainCtx.fillRect(x*16,y*16,16,16);tile('forest_bush',x*16,y*16);terrainCtx.fillStyle='#102a2355';terrainCtx.fillRect(x*16,y*16+12,16,4);}
          else{if(Math.abs(x-6)<=1||y===7)tile('forest_dirt',x*16,y*16,16,16,false,.24);terrainCtx.fillStyle='#9db98033';terrainCtx.fillRect(x*16+(x*7+y*3)%13,y*16+(x*3+y*7)%13,2,1);if((x*5+y)%23===0)tile('forest_flower',x*16,y*16);}
          continue;
        }
        if(s.map[y][x]==='#'){tile(y===0?'wall_top_1':'wall_'+(1+(x+y)%3),x*16,y*16);if(y>0&&s.map[y-1]?.[x]==='.') {terrainCtx.fillStyle='#0b101b4d';terrainCtx.fillRect(x*16,y*16,16,3);}}
        else{tile('floor_'+(1+(x*7+y*11+s.cfg.id)%4),x*16,y*16);if(s.map[y-1]?.[x]==='#'){terrainCtx.fillStyle='#0003';terrainCtx.fillRect(x*16,y*16,16,4);}}
      }
      terrainKey=key;
      const names=s.cfg.theme==='ice'?[]:s.cfg.theme==='forest'?['forest_ground','forest_bush','forest_dirt','forest_flower']:['wall_top_1','wall_1','wall_2','wall_3','floor_1','floor_2','floor_3','floor_4'];
      terrainReady=names.every(name=>images[name]?.complete&&images[name].naturalWidth>0);
    }
    ctx.drawImage(terrainCanvas,0,0);
  }
  function draw(s,t){labels=[];
    ctx.clearRect(0,0,208,240);ctx.fillStyle='#17141e';ctx.fillRect(0,0,208,240);ctx.save();if(s.impact>0&&!reduced){const shake=s.impact/.22*s.impactPower;ctx.translate(Math.round(Math.sin(t*110)*shake),Math.round(Math.cos(t*93)*shake*.6));}
    const world=ctx.getTransform();
    drawTerrain(s);
    // Keep lighting in world space so shake retains identical gradient sampling.
    for(const [x,y] of [[1,1],[11,1],[1,11],[11,11]]){const grad=ctx.createRadialGradient(x*16+8,y*16+8,0,x*16+8,y*16+8,27);grad.addColorStop(0,s.cfg.theme==='ice'?'#b5ecff33':s.cfg.theme==='forest'?'#baffae22':'#ffa65222');grad.addColorStop(1,'#ffa65200');ctx.fillStyle=grad;ctx.fillRect(x*16-20,y*16-20,56,56);if(s.cfg.theme==='ice'){crystal(x*16,y*16);for(let i=0;i<3;i++){const snow=(reduced?0:s.time)*4+i*5;ctx.fillStyle='#d7f6ff';ctx.fillRect(x*16+((i*7+3)%16),y*16+Math.floor(snow%16),1,1);}}else if(s.cfg.theme==='forest'){sprite('forest_rock',x*16,y*16);for(let i=0;i<3;i++){const a=(reduced?0:s.time)+i*2;circle(x*16+8+Math.cos(a)*10,y*16+5+Math.sin(a*1.2)*9,1,'#dcffac');}}else sprite('torch_anim_f'+(reduced?0:Math.floor(t*9)%6),x*16,y*16);}
    sprite('stair_nextlevel',6*16,1*16);
    if(s.wave>=3&&!s.enemies.length){circle(104,24,12,'#b8f5d576',true);}
    sprite(s.chest?'chest_open':'chest_closed_anim_f'+(reduced?0:Math.floor(t*6)%8),10*16,4*16);
    if(!s.chest&&s.kills>=s.cfg.count){circle(168,72,12,'#edcd91a0',true);ctx.fillStyle='#edcd91';ctx.fillRect(167,55,2,4);ctx.fillRect(166,61,4,1);}
    for(const d of s.loot){const bob=reduced?0:Math.sin(t*5+d.id)*1;circle(d.x*16,d.y*16+2,7,d.kind==='coin'?'#edcd9144':'#a7ebcf44');sprite(d.kind==='coin'?'bag_coins':'potion_red',d.x*16-6,d.y*16-6+bob,12,12);}
    for(const b of s.barrels||[])if(b.hp>0){circle(b.x*16,b.y*16+4,9,'#f2a15a55');sprite('barrel',b.x*16-8,b.y*16-8);ctx.fillStyle='#ffb267';ctx.fillRect(b.x*16-3,b.y*16-2,6,3);sprite('bomb_anim_f'+Math.floor(t*6)%6,b.x*16-5,b.y*16-15,10,10);}
    for(const trap of s.traps){const phase=(s.time+trap.x*.27)%5,frame=phase<2.8?0:phase<3.6?Math.floor((phase-2.8)/.8*4):6;if(s.cfg.theme==='ice'){ctx.strokeStyle='#81d2f077';ctx.strokeRect(trap.x*16-6,trap.y*16-6,12,12);if(phase>=2.8){crystal(trap.x*16-8,trap.y*16-8);circle(trap.x*16,trap.y*16,8,'#c0eeff',true);}}else sprite('spikes_anim_f'+frame,trap.x*16-8,trap.y*16-8);if(phase>=2.8&&phase<3.6){ctx.fillStyle=s.cfg.theme==='ice'?'#a9eaff55':'#ffba6d55';ctx.fillRect(trap.x*16-7,trap.y*16-7,14,14);}}
    for(const e of s.enemies)if(e.warning>0){circle(e.x*16,e.y*16,e.boss?32:16,'#ec879c35');circle(e.x*16,e.y*16,e.boss?32:16,'#ef98a5ba',true);}
    for(const mark of s.hazards||[]){const p=mark.age/mark.life,ice=mark.kind==='ice';circle(mark.x*16,mark.y*16,14,ice?'#a9dfff44':'#b6ed7e40');circle(mark.x*16,mark.y*16,14*(1-p),ice?'#d4f9ff':'#edffaf',true);for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.fillStyle=ice?'#c2efff':'#c2db9e';ctx.fillRect(Math.round(mark.x*16+Math.cos(a)*9),Math.round(mark.y*16+Math.sin(a)*9),2,5);}if(ice){ctx.strokeStyle='#e3f9ff';ctx.beginPath();ctx.moveTo(mark.x*16-5,mark.y*16);ctx.lineTo(mark.x*16+5,mark.y*16);ctx.moveTo(mark.x*16,mark.y*16-5);ctx.lineTo(mark.x*16,mark.y*16+5);ctx.stroke();}}
    for(const e of s.enemies)if(e.warning>0&&['goblin','ranger','fly','wisp'].includes(e.type)){ctx.strokeStyle=e.type==='wisp'?'#d0f1ff':'#ffb487';ctx.setLineDash([2,2]);ctx.beginPath();ctx.moveTo(e.x*16,e.y*16);ctx.lineTo(e.aimX*16,e.aimY*16);ctx.stroke();ctx.setLineDash([]);circle(e.aimX*16,e.aimY*16,10,e.type==='wisp'?'#d0f1ff':'#ffb487',true);}
    aura(s);const entities=[...s.enemies,s.hero].sort((a,b)=>a.y-b.y);for(const e of entities)entity(e,t,e===s.hero);aura(s,true);
    for(const f of s.effects)if(f.kind==='assist'){ctx.save();ctx.globalAlpha=1-f.age/f.life;ctx.strokeStyle='#d5e7ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(f.x*16,f.y*16-35);ctx.lineTo(f.x*16,f.y*16);ctx.stroke();circle(f.x*16,f.y*16,5+f.age*20,'#b7c6ff',true);ctx.fillStyle='#ffffff';ctx.fillRect(f.x*16-2,f.y*16-6,4,12);ctx.fillRect(f.x*16-6,f.y*16-2,12,4);ctx.restore();}
    for(const f of s.effects){if(['assist','ultimate','flyout'].includes(f.kind))continue;
      if(f.kind==='icebolt'){const p=f.age/f.life;ctx.save();ctx.globalAlpha=1-p;const x=(f.x+(f.x2-f.x)*p)*16,y=(f.y+(f.y2-f.y)*p)*16;circle(x,y,3,'#cff6ff');ctx.fillStyle='#a8d6ff';ctx.fillRect(Math.round(x)-1,Math.round(y)-5,2,10);ctx.restore();continue;}
      if(f.kind==='pickup'){const p=f.age/f.life,color=f.potion?'#a7ffcf':'#ffe09a';ctx.save();ctx.globalAlpha=1-p;circle(f.x*16,f.y*16,4+p*13,color,true);for(let i=0;i<7;i++){const q=Math.max(0,Math.min(1,p*1.8-i*.055)),x=(f.x+(s.hero.x-f.x)*q)*16,y=(f.y+(s.hero.y-f.y)*q)*16-Math.sin(q*Math.PI)*15;ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),i?1:3,i?1:3);}ctx.restore();continue;}
      if(['impact','blast','arrow'].includes(f.kind)){ctx.save();const p=f.age/f.life;ctx.globalAlpha=1-p;
        if(f.kind==='impact'){const n=reduced?4:9;for(let i=0;i<n;i++){const a=i*Math.PI*2/n+f.serial*.7,r=(3+p*16)*f.power;ctx.fillStyle=i%2?'#fff5cf':'#ffb766';ctx.fillRect(f.x*16+Math.cos(a)*r,f.y*16+Math.sin(a)*r,2,2);}sprite('hit_effect_anim_f'+Math.min(2,Math.floor(p*3)),f.x*16-12,f.y*16-12,24,24);}
        else if(f.kind==='blast'){circle(f.x*16,f.y*16,f.radius*16*p,'#ffd295',true);circle(f.x*16,f.y*16,f.radius*12*p,'#f4b87544');sprite('explosion_anim_f'+Math.min(6,Math.floor(p*7)),f.x*16-20,f.y*16-20,40,40);}
        else{ctx.strokeStyle='#ffbd7a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(f.x*16,f.y*16);ctx.lineTo((f.x+(f.x2-f.x)*p)*16,(f.y+(f.y2-f.y)*p)*16);ctx.stroke();}ctx.restore();continue;}
      if(f.kind==='lightning'){ctx.save();ctx.globalAlpha=1-f.age/f.life;ctx.strokeStyle='#d6e1ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(f.x*16,f.y*16);ctx.lineTo((f.x+f.x2)*8+3,(f.y+f.y2)*8-3);ctx.lineTo(f.x2*16,f.y2*16);ctx.stroke();ctx.restore();}else if(f.kind==='death'){sprite('enemy_afterdead_explosion_anim_f'+Math.min(3,Math.floor(f.age/.5*4)),f.x*16-8,f.y*16-8);}else if(f.kind==='spawn'){circle(f.x*16,f.y*16,12*(1-f.age),`rgba(181,162,240,${1-f.age})`,true);}else{label(f.text,f.x*16+world.e,f.y*16-12-f.age*13+world.f,f.color,Math.min(1,(f.life-f.age)*3));}}
    ctx.restore();
    const spell=s.effects.find(f=>f.kind==='ultimate');
    if(spell){const p=spell.age/spell.life;ctx.save();ctx.fillStyle='rgba(16,12,42,'+(.7*Math.sin(p*Math.PI))+')';ctx.fillRect(0,0,208,240);
      const cx=104,cy=120,charge=Math.min(1,spell.age/.48);ctx.strokeStyle='#dbccff';ctx.lineWidth=2;
      if(spell.age<.48){for(let i=0;i<3;i++){circle(cx,cy,18+charge*35+i*12,'#c9b7ff',true);}ctx.save();ctx.translate(cx,cy);ctx.rotate(-Math.PI/4);sprite('weapon_sword_1',-22,-30,44,44);ctx.restore();}
      else{const q=(spell.age-.48)/.82;ctx.globalAlpha=1-q;for(let i=0;i<7;i++){const x=18+i*29;ctx.fillStyle=i%2?'#d0b5ff':'#fff0c1';ctx.fillRect(x-5*(1-q),0,10*(1-q),240);ctx.strokeStyle='#fff3d4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-9,0);ctx.lineTo(x+8,85);ctx.lineTo(x-5,140);ctx.lineTo(x+9,240);ctx.stroke();}circle(cx,cy,15+q*220,'#ffe4a3',true);if(!reduced){ctx.fillStyle='rgba(255,233,180,'+Math.max(0,.25-q)+')';ctx.fillRect(0,0,208,240);}}
      ctx.globalAlpha=Math.min(1,(1-p)*4);ctx.fillStyle='#191329dd';ctx.fillRect(40,45,128,28);label('星 界 裁 決',104,59,'#ffedba',Math.min(1,(1-p)*4),18);ctx.restore();}
    for(const f of s.effects)if(f.kind==='flyout'){ctx.save();const p=f.age/f.life;if(reduced){ctx.globalAlpha=1-p;sprite(enemySprite(f.type),f.x*16-8,f.y*16-8,16,16);}else{const size=f.boss?32:16,endX=104+f.dx*340,endY=-100+f.dy*40,q=1-Math.pow(1-p,2),x=f.x*16+(endX-f.x*16)*q,y=f.y*16+(endY-f.y*16)*q-Math.sin(p*Math.PI)*35;ctx.strokeStyle='#ffe4b1';ctx.lineWidth=2;ctx.globalAlpha=(1-p)*.8;ctx.beginPath();ctx.moveTo(x-(endX-f.x*16)*.07,y-(endY-f.y*16)*.07);ctx.lineTo(x,y);ctx.stroke();for(let i=1;i<=3;i++){ctx.globalAlpha=(1-p)*(.22-i*.05);sprite(enemySprite(f.type),x-size/2-(endX-f.x*16)*.025*i,y-size/2-(endY-f.y*16)*.025*i,size,size);}ctx.globalAlpha=Math.min(1,(1-p)*4);sprite(enemySprite(f.type),x-size/2,y-size/2,size,size);}ctx.restore();}
    if(s.fever>0){ctx.strokeStyle='#ffcd78';ctx.lineWidth=3;ctx.strokeRect(2,2,204,236);}
    if(s.bannerUntil>s.time&&!spell){ctx.fillStyle='#161b2be8';ctx.fillRect(40,42,128,25);label('第 '+s.wave+' 波 · '+s.encounter,104,54,'#f6d79b');}
    if(s.status==='win'){for(let i=0;i<26;i++){const x=(i*43+Math.sin(t+i)*12)%208,y=((t*22+i*17)%260)-10;ctx.fillStyle=['#a8edcd','#e8ce8f','#b9a3e5'][i%3];ctx.fillRect(x,y,2,3);}}
    drawLabels();
  }
  function destroy(){resizeObserver?.disconnect();if(!resizeObserver)window.removeEventListener('resize',onResize);textCanvas.remove();textWidths.clear();}
  return {draw,destroy};
}
