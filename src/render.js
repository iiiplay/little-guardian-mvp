function createRenderer(canvas,images){
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function sprite(name,x,y,w=16,h=w,flip=false,alpha=1){const im=images[name];if(!im||!im.complete||!im.naturalWidth)return;ctx.save();ctx.globalAlpha=alpha;if(flip){ctx.translate(Math.round(x+w),Math.round(y));ctx.scale(-1,1);ctx.drawImage(im,0,0,w,h);}else ctx.drawImage(im,Math.round(x),Math.round(y),w,h);ctx.restore();}
  function circle(x,y,r,color,stroke=false){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(stroke){ctx.strokeStyle=color;ctx.lineWidth=1;ctx.stroke();}else{ctx.fillStyle=color;ctx.fill();}}
  function entity(e,t,hero=false){
    const size=e.boss?26:16,x=e.x*16-size/2,y=e.y*16-size/2;ctx.fillStyle='#090b1475';ctx.beginPath();ctx.ellipse(e.x*16,e.y*16+6,e.boss?12:6,2.5,0,0,Math.PI*2);ctx.fill();
    const frame=reduced?0:Math.floor(t*(e.moving?10:6)+(e.id||0))%(e.type==='fly'?4:6);
    let name=hero?`knight_${e.moving?'run':'idle'}_anim_f${frame}`:e.type==='fly'?`fly_anim_f${frame}`:`${e.type}_${e.moving?'run':'idle'}_anim_f${frame}`;
    const bounce=reduced?0:e.moving?-Math.abs(Math.sin(t*11))*1.5:0;
    if(e.flash>0)ctx.filter=hero?'sepia(1) saturate(3) hue-rotate(300deg) brightness(1.7)':'brightness(2.8)';
    sprite(name,x,y+bounce,size,size,e.face<0);ctx.filter='none';
    if(hero){
      if(e.shield>0){circle(e.x*16,e.y*16,12,'#a8f0d4a0',true);circle(e.x*16,e.y*16,14,'#a8f0d436',true);}
      ctx.save();ctx.translate(e.x*16,e.y*16);ctx.rotate((e.face<0?-1:1)*(e.slash>0?(-1.6+(1-e.slash/.25)*3):.35));sprite('weapon_sword_1',e.face<0?-12:3,-5,12,12,e.face<0);ctx.restore();
      if(e.slash>0)sprite('slash_effect_anim_f'+Math.min(2,Math.floor((1-e.slash/.25)*3)),e.x*16+(e.face<0?-22:2),e.y*16-12,24,24,e.face<0);
      circle(e.x*16,e.y*16+10,1,'#b6efd6');
    }else{
      if(e.hp<e.maxHp||e.boss){ctx.fillStyle='#161824';ctx.fillRect(x,y-5,size,2);ctx.fillStyle=e.boss?'#c3a5ed':'#e3a3a0';ctx.fillRect(x,y-5,Math.ceil(size*e.hp/e.maxHp),2);}
      if(e.boss){ctx.fillStyle='#f1d17c';ctx.fillRect(x+8,y-6,10,3);ctx.fillRect(x+8,y-9,2,4);ctx.fillRect(x+12,y-10,2,4);ctx.fillRect(x+16,y-9,2,4);}
    }
  }
  function draw(s,t){
    ctx.clearRect(0,0,208,240);ctx.fillStyle='#17141e';ctx.fillRect(0,0,208,240);
    for(let y=0;y<15;y++)for(let x=0;x<13;x++){
      if(s.map[y][x]==='#'){sprite(y===0?'wall_top_1':'wall_'+(1+(x+y)%3),x*16,y*16);if(y>0&&s.map[y-1]?.[x]==='.') {ctx.fillStyle='#0b101b4d';ctx.fillRect(x*16,y*16,16,3);}}
      else{sprite('floor_'+(1+(x*7+y*11+s.cfg.id)%4),x*16,y*16);if(s.map[y-1]?.[x]==='#'){ctx.fillStyle='#0003';ctx.fillRect(x*16,y*16,16,4);}}
    }
    // Small pools of warm light keep the sprites legible against cool floor tiles.
    for(const [x,y] of [[1,1],[11,1],[1,11],[11,11]]){const grad=ctx.createRadialGradient(x*16+8,y*16+8,0,x*16+8,y*16+8,27);grad.addColorStop(0,'#ffa65222');grad.addColorStop(1,'#ffa65200');ctx.fillStyle=grad;ctx.fillRect(x*16-20,y*16-20,56,56);sprite('torch_anim_f'+(reduced?0:Math.floor(t*9)%6),x*16,y*16);}
    sprite('stair_nextlevel',6*16,1*16);
    if(s.wave>=3&&!s.enemies.length){circle(104,24,12,'#b8f5d576',true);}
    sprite(s.chest?'chest_open':'chest_closed_anim_f'+(reduced?0:Math.floor(t*6)%8),10*16,4*16);
    if(!s.chest&&s.kills>=s.cfg.count){circle(168,72,12,'#edcd91a0',true);ctx.fillStyle='#edcd91';ctx.fillRect(167,55,2,4);ctx.fillRect(166,61,4,1);}
    for(const d of s.loot){const bob=reduced?0:Math.sin(t*5+d.id)*1;circle(d.x*16,d.y*16+2,7,d.kind==='coin'?'#edcd9144':'#a7ebcf44');sprite(d.kind==='coin'?'bag_coins':'potion_red',d.x*16-6,d.y*16-6+bob,12,12);}
    sprite('barrel',1*16,4*16);sprite('barrel',11*16,9*16);
    for(const trap of s.traps){const phase=(s.time+trap.x*.27)%5,frame=phase<2.8?0:phase<3.6?Math.floor((phase-2.8)/.8*4):6; sprite('spikes_anim_f'+frame,trap.x*16-8,trap.y*16-8);if(phase>=2.8&&phase<3.6){ctx.fillStyle='#ffba6d55';ctx.fillRect(trap.x*16-7,trap.y*16-7,14,14);}}
    for(const e of s.enemies)if(e.warning>0){circle(e.x*16,e.y*16,e.boss?32:16,'#ec879c35');circle(e.x*16,e.y*16,e.boss?32:16,'#ef98a5ba',true);}
    const entities=[...s.enemies,s.hero].sort((a,b)=>a.y-b.y);for(const e of entities)entity(e,t,e===s.hero);
    for(const f of s.effects){if(f.kind==='death'){sprite('enemy_afterdead_explosion_anim_f'+Math.min(3,Math.floor(f.age/.5*4)),f.x*16-8,f.y*16-8);}else if(f.kind==='spawn'){circle(f.x*16,f.y*16,12*(1-f.age),`rgba(181,162,240,${1-f.age})`,true);}else{ctx.save();ctx.globalAlpha=Math.min(1,(f.life-f.age)*3);ctx.font='bold 7px "Microsoft JhengHei", sans-serif';ctx.textAlign='center';ctx.fillStyle='#191625';ctx.fillText(f.text,f.x*16+1,f.y*16-11-f.age*13);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x*16,f.y*16-12-f.age*13);ctx.restore();}}
    if(s.status==='win'){for(let i=0;i<26;i++){const x=(i*43+Math.sin(t+i)*12)%208,y=((t*22+i*17)%260)-10;ctx.fillStyle=['#a8edcd','#e8ce8f','#b9a3e5'][i%3];ctx.fillRect(x,y,2,3);}}
  }
  return {draw};
}
