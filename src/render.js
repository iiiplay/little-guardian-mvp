function createRenderer(canvas,images){
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  let casting=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function sprite(name,x,y,w=16,h=w,flip=false,alpha=1){const im=images[name];if(!im||!im.complete||!im.naturalWidth)return;ctx.save();ctx.globalAlpha=alpha;if(flip){ctx.translate(Math.round(x+w),Math.round(y));ctx.scale(-1,1);ctx.drawImage(im,0,0,w,h);}else ctx.drawImage(im,Math.round(x),Math.round(y),w,h);ctx.restore();}
  function circle(x,y,r,color,stroke=false){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(stroke){ctx.strokeStyle=color;ctx.lineWidth=1;ctx.stroke();}else{ctx.fillStyle=color;ctx.fill();}}
  function entity(e,t,hero=false){
    const size=e.boss?38:hero?28:25,x=e.x*16-size/2,y=e.y*16-size/2;ctx.fillStyle='#090b1475';ctx.beginPath();ctx.ellipse(e.x*16,e.y*16+6,e.boss?12:6,2.5,0,0,Math.PI*2);ctx.fill();
    const frame=reduced?0:Math.floor(t*(e.moving?10:6)+(e.id||0))%(e.type==='fly'?4:6);
    let name=hero?`knight_${e.moving?'run':'idle'}_anim_f${frame}`:e.type==='fly'?`fly_anim_f${frame}`:`${e.type}_${e.moving?'run':'idle'}_anim_f${frame}`;
    const bounce=reduced?0:e.moving?-Math.abs(Math.sin(t*11))*1.5:0;
    if(e.flash>0)ctx.filter=hero?'sepia(1) saturate(3) hue-rotate(300deg) brightness(1.7)':'brightness(2.8)';
    ctx.save();if(!reduced){let sx=1,sy=1;if(hero&&casting>0){sx=sy=1+.5*Math.sin((1.3-casting)/1.3*Math.PI);}else if(e.recoil>0||e.flash>0){const p=(e.recoil||e.flash)/.28;sx=1+.45*p;sy=1-.35*p;}else if(hero&&e.slash>0){const p=1-e.slash/.25;sx=1+.4*Math.sin(p*Math.PI);sy=1+.18*Math.sin(p*Math.PI);}else if(hero&&!e.moving&&e.atk<.18&&e.atk>0){sx=.8;sy=1.15;}else if(!hero&&e.warning>0){sx=1.2;sy=.8;}ctx.translate(e.x*16,e.y*16);ctx.scale(sx,sy);ctx.translate(-e.x*16,-e.y*16);}sprite(name,x,y+bounce,size,size,e.face<0);ctx.restore();ctx.filter='none';
    if(!hero&&e.elite){circle(e.x*16,e.y*16+3,10,'#ffd283',true);ctx.fillStyle='#ffd283';ctx.fillRect(x+6,y-5,4,3);}
    if(hero){
      if(e.shield>0){circle(e.x*16,e.y*16,12,'#a8f0d4a0',true);circle(e.x*16,e.y*16,14,'#a8f0d436',true);}
      if(e.thorns){for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.fillStyle='#a7ebcf';ctx.fillRect(Math.round(e.x*16+Math.cos(a)*10),Math.round(e.y*16+Math.sin(a)*10),2,2);}}
      if(e.lifesteal||e.chain)ctx.filter=e.chain?'sepia(.7) saturate(2) hue-rotate(170deg)':'sepia(.7) saturate(2) hue-rotate(300deg)';
      ctx.save();ctx.translate(e.x*16,e.y*16);ctx.rotate((e.face<0?-1:1)*(e.slash>0?(-1.6+(1-e.slash/.25)*3):.35));sprite('weapon_sword_1',e.face<0?-19:7,-9,18,18,e.face<0);ctx.restore();
      ctx.filter='none';
      if(e.slash>0)sprite('slash_effect_anim_f'+Math.min(2,Math.floor((1-e.slash/.25)*3)),e.x*16+(e.face<0?-32:1),e.y*16-19,38,38,e.face<0);
      circle(e.x*16,e.y*16+10,1,'#b6efd6');
    }else{
      if(e.hp<e.maxHp||e.boss){ctx.fillStyle='#161824';ctx.fillRect(x,y-5,size,2);ctx.fillStyle=e.boss?'#c3a5ed':'#e3a3a0';ctx.fillRect(x,y-5,Math.max(0,Math.ceil(size*e.hp/e.maxHp)),2);}
      if(e.boss){ctx.fillStyle='#f1d17c';ctx.fillRect(x+8,y-6,10,3);ctx.fillRect(x+8,y-9,2,4);ctx.fillRect(x+12,y-10,2,4);ctx.fillRect(x+16,y-9,2,4);}
    }
  }
  function draw(s,t){casting=s.ultimateCast;
    ctx.clearRect(0,0,208,240);ctx.fillStyle='#17141e';ctx.fillRect(0,0,208,240);ctx.save();if(s.ultimateCast>0&&!reduced){const zoom=1+.12*Math.sin((1.3-s.ultimateCast)/1.3*Math.PI);ctx.translate(104,120);ctx.scale(zoom,zoom);ctx.translate(-104,-120);}if(s.impact>0&&!reduced){const shake=s.impact/.22*s.impactPower;ctx.translate(Math.sin(t*110)*shake,Math.cos(t*93)*shake*.6);}
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
    for(const b of s.barrels||[])if(b.hp>0){circle(b.x*16,b.y*16+4,9,'#f2a15a55');sprite('barrel',b.x*16-8,b.y*16-8);ctx.fillStyle='#ffb267';ctx.fillRect(b.x*16-3,b.y*16-2,6,3);sprite('bomb_anim_f'+Math.floor(t*6)%6,b.x*16-5,b.y*16-15,10,10);}
    for(const trap of s.traps){const phase=(s.time+trap.x*.27)%5,frame=phase<2.8?0:phase<3.6?Math.floor((phase-2.8)/.8*4):6; sprite('spikes_anim_f'+frame,trap.x*16-8,trap.y*16-8);if(phase>=2.8&&phase<3.6){ctx.fillStyle='#ffba6d55';ctx.fillRect(trap.x*16-7,trap.y*16-7,14,14);}}
    for(const e of s.enemies)if(e.warning>0){circle(e.x*16,e.y*16,e.boss?32:16,'#ec879c35');circle(e.x*16,e.y*16,e.boss?32:16,'#ef98a5ba',true);}
    for(const e of s.enemies)if(e.warning>0&&(e.type==='goblin'||e.type==='fly')){ctx.strokeStyle='#ffb487';ctx.setLineDash([2,2]);ctx.beginPath();ctx.moveTo(e.x*16,e.y*16);ctx.lineTo(e.aimX*16,e.aimY*16);ctx.stroke();ctx.setLineDash([]);circle(e.aimX*16,e.aimY*16,10,'#ffb487',true);}
    const entities=[...s.enemies,s.hero].sort((a,b)=>a.y-b.y);for(const e of entities)entity(e,t,e===s.hero);
    for(const f of s.effects)if(f.kind==='assist'){ctx.save();ctx.globalAlpha=1-f.age/f.life;ctx.strokeStyle='#d5e7ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(f.x*16,f.y*16-35);ctx.lineTo(f.x*16,f.y*16);ctx.stroke();circle(f.x*16,f.y*16,5+f.age*20,'#b7c6ff',true);ctx.fillStyle='#ffffff';ctx.fillRect(f.x*16-2,f.y*16-6,4,12);ctx.fillRect(f.x*16-6,f.y*16-2,12,4);ctx.restore();}
    for(const f of s.effects){if(['assist','ultimate','flyout'].includes(f.kind))continue;
      if(['impact','blast','arrow'].includes(f.kind)){ctx.save();const p=f.age/f.life;ctx.globalAlpha=1-p;
        if(f.kind==='impact'){const n=reduced?4:9;for(let i=0;i<n;i++){const a=i*Math.PI*2/n+f.serial*.7,r=(3+p*16)*f.power;ctx.fillStyle=i%2?'#fff5cf':'#ffb766';ctx.fillRect(f.x*16+Math.cos(a)*r,f.y*16+Math.sin(a)*r,2,2);}sprite('hit_effect_anim_f'+Math.min(2,Math.floor(p*3)),f.x*16-12,f.y*16-12,24,24);}
        else if(f.kind==='blast'){circle(f.x*16,f.y*16,f.radius*16*p,'#ffd295',true);circle(f.x*16,f.y*16,f.radius*12*p,'#f4b87544');sprite('explosion_anim_f'+Math.min(6,Math.floor(p*7)),f.x*16-20,f.y*16-20,40,40);}
        else{ctx.strokeStyle='#ffbd7a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(f.x*16,f.y*16);ctx.lineTo((f.x+(f.x2-f.x)*p)*16,(f.y+(f.y2-f.y)*p)*16);ctx.stroke();}ctx.restore();continue;}
      if(f.kind==='lightning'){ctx.save();ctx.globalAlpha=1-f.age/f.life;ctx.strokeStyle='#d6e1ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(f.x*16,f.y*16);ctx.lineTo((f.x+f.x2)*8+3,(f.y+f.y2)*8-3);ctx.lineTo(f.x2*16,f.y2*16);ctx.stroke();ctx.restore();}else if(f.kind==='death'){sprite('enemy_afterdead_explosion_anim_f'+Math.min(3,Math.floor(f.age/.5*4)),f.x*16-8,f.y*16-8);}else if(f.kind==='spawn'){circle(f.x*16,f.y*16,12*(1-f.age),`rgba(181,162,240,${1-f.age})`,true);}else{ctx.save();ctx.globalAlpha=Math.min(1,(f.life-f.age)*3);ctx.font='bold 9px "Microsoft JhengHei", sans-serif';ctx.textAlign='center';ctx.fillStyle='#191625';ctx.fillText(f.text,f.x*16+1,f.y*16-11-f.age*13);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x*16,f.y*16-12-f.age*13);ctx.restore();}}
    ctx.restore();
    const spell=s.effects.find(f=>f.kind==='ultimate');
    if(spell){const p=spell.age/spell.life;ctx.save();ctx.fillStyle='rgba(16,12,42,'+(.7*Math.sin(p*Math.PI))+')';ctx.fillRect(0,0,208,240);
      const cx=104,cy=120,charge=Math.min(1,spell.age/.48);ctx.strokeStyle='#dbccff';ctx.lineWidth=2;
      if(spell.age<.48){for(let i=0;i<3;i++){circle(cx,cy,18+charge*35+i*12,'#c9b7ff',true);}ctx.save();ctx.translate(cx,cy);ctx.rotate(-Math.PI/4);sprite('weapon_sword_1',-22,-30,44,44);ctx.restore();}
      else{const q=(spell.age-.48)/.82;ctx.globalAlpha=1-q;for(let i=0;i<7;i++){const x=18+i*29;ctx.fillStyle=i%2?'#d0b5ff':'#fff0c1';ctx.fillRect(x-5*(1-q),0,10*(1-q),240);ctx.strokeStyle='#fff3d4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-9,0);ctx.lineTo(x+8,85);ctx.lineTo(x-5,140);ctx.lineTo(x+9,240);ctx.stroke();}circle(cx,cy,15+q*220,'#ffe4a3',true);if(!reduced){ctx.fillStyle='rgba(255,233,180,'+Math.max(0,.25-q)+')';ctx.fillRect(0,0,208,240);}}
      ctx.globalAlpha=Math.min(1,(1-p)*4);ctx.fillStyle='#191329dd';ctx.fillRect(40,45,128,28);ctx.font='bold 14px Microsoft JhengHei';ctx.textAlign='center';ctx.fillStyle='#ffedba';ctx.fillText('星 界 裁 決',104,64);ctx.restore();}
    for(const f of s.effects)if(f.kind==='flyout'){ctx.save();const p=f.age/f.life;if(reduced){ctx.globalAlpha=1-p;sprite(f.type==='fly'?'fly_anim_f0':f.type+'_idle_anim_f0',f.x*16-13,f.y*16-13,26,26);}else{const size=(f.boss?38:25)*(1+p*2.8),x=f.x*16+f.dx*p*270,y=f.y*16-190*p+f.dy*p*80;ctx.translate(x,y);ctx.rotate(p*9*(f.dx>0?1:-1));ctx.globalAlpha=Math.min(1,(1-p)*4);sprite(f.type==='fly'?'fly_anim_f0':f.type+'_idle_anim_f0',-size/2,-size/2,size,size);}ctx.restore();}
    if(s.fever>0){ctx.strokeStyle='#ffcd78';ctx.lineWidth=3;ctx.strokeRect(2,2,204,236);}
    if(s.bannerUntil>s.time&&!spell){ctx.fillStyle='#161b2be8';ctx.fillRect(40,42,128,25);ctx.font='bold 9px Microsoft JhengHei';ctx.textAlign='center';ctx.fillStyle='#f6d79b';ctx.fillText('第 '+s.wave+' 波 · '+s.encounter,104,58);}
    if(s.status==='win'){for(let i=0;i<26;i++){const x=(i*43+Math.sin(t+i)*12)%208,y=((t*22+i*17)%260)-10;ctx.fillStyle=['#a8edcd','#e8ce8f','#b9a3e5'][i%3];ctx.fillRect(x,y,2,3);}}
  }
  return {draw};
}
