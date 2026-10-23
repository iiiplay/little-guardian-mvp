const ICONS={spark:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/><path d="m19 2 .8 2.2L22 5l-2.2.8L19 8l-.8-2.2L16 5l2.2-.8Z"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',pause:'<path d="M8 5v14M16 5v14"/>',play:'<path d="m8 4 12 8-12 8Z"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',mute:'<path d="m11 4-6 5H2v6h3l6 5ZM16 9l6 6m0-6-6 6"/>',sound:'<path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',sword:'<path d="m16 3 5 0 0 5-11 11-5-5ZM3 13l8 8M3 21l4-4"/>',wing:'<path d="M21 3C12 3 4 8 3 15l6-2-1 6c7-1 12-7 13-16Z"/><path d="m8 16 8-8"/>',shield:'<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Z"/><path d="m8 12 3 3 5-6"/>'};
const icon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]||ICONS.spark}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
const $=id=>document.getElementById(id);
let store;try{store=window.localStorage;}catch{store=null;}
const game=createGame({engine:DungeonEngine,store});
const images=Object.fromEntries(Object.entries(ASSETS).map(([key,src])=>{const im=new Image();im.src=src;return [key,im];}));
const renderer=createRenderer($('game'),images);
let preview=DungeonEngine.begin(game.save.unlocked,game.save.perks),lastMode='',modalType='',autoAt=0,toastUntil=0,lastStamp=0,visualTime=0,accumulator=0,soundOn=false,audio=null,returnFocus=null,lastStatus='',lastUiUpdate=0;
const time=t=>`${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;
function toast(text){$('toast').textContent=text;$('toast').hidden=false;toastUntil=performance.now()+2400;}
function tone(type){if(!soundOn)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const osc=audio.createOscillator(),g=audio.createGain();osc.type='sine';const f={attack:330,hurt:130,kill:610,chest:740,win:880,rescue:990,cleared:520,wave:240}[type];if(!f)return;osc.frequency.setValueAtTime(f,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(f*.7,audio.currentTime+.12);g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.15);osc.connect(g);g.connect(audio.destination);osc.start();osc.stop(audio.currentTime+.16);}catch{soundOn=false;}}
function dialog(html,type){returnFocus=document.activeElement;$('veil').hidden=false;$('dialog').innerHTML=html;modalType=type;$('dialog').querySelectorAll('[data-open-gear]').forEach(b=>b.onclick=showGear);requestAnimationFrame(()=>$('dialog').querySelector('button:not(:disabled)')?.focus({preventScroll:true}));}
function closeDialog(){autoAt=0;$('veil').hidden=true;modalType='';returnFocus?.focus?.({preventScroll:true});}
function bind(id,fn){$(id)?.addEventListener('click',fn);}
function showTitle(){
  dialog(`<p class="eyebrow">一段剛剛好的小冒險</p><img class="hero-portrait" src="${ASSETS.knight_idle_anim_f0}" alt="戴著頭盔的小勇者"><h2 id="dialog-title">小小勇者，<br>需要一點點守護。</h2><p>他會自己探索、戰鬥、找寶物。<br>你能幫忙撿寶、開箱，危險時點一下守護。</p><div class="feature-line"><span>自動冒險</span><span>偶爾介入</span><span>10 關試玩</span></div><button class="primary" id="start">${game.save.cleared.length?'繼續冒險 · 第 '+game.save.unlocked+' 關':'開始守護'}</button><div class="camp-links"><button class="subtle" id="select">關卡地圖</button><button class="subtle" data-open-gear>裝備背包</button></div><p class="hint">每關約 1～3 分鐘 · 切到背景會自動暫停<br>Art: o_lobster · MVP 0.2</p>`, 'title');
  bind('start',()=>start(game.save.unlocked));bind('select',showMap);
}
function start(level){if(!game.start(level))return;closeDialog();accumulator=0;lastMode='';lastStatus='';tone('rescue');if(game.storageError||!store)toast('瀏覽器無法儲存，目前進度僅保留在本次遊玩');update();}
function showMap(){
  if(game.mode==='play')game.pause();
  dialog(`<p class="eyebrow">CHAPTER 01 / 微光地城</p><h2 id="dialog-title">冒險的小足跡</h2><p>完成一關，解鎖下一段旅程。<br>首通獲得祝福與金幣，重玩仍能開箱拿裝備。</p><div class="level-grid">${DungeonEngine.levels.map(l=>`<button data-level="${l.id}" class="${game.save.cleared.includes(l.id)?'done':l.id===game.save.unlocked?'current':''}" ${l.id>game.save.unlocked?'disabled':''} aria-label="第 ${l.id} 關 ${l.title}${l.id>game.save.unlocked?'，尚未解鎖':''}">${l.id>game.save.unlocked?'·':l.id}</button>`).join('')}</div><p class="summary">已完成 ${game.save.cleared.length} / 10 關 · 累計 ${game.save.gold} 金幣</p><p class="hint">${UPGRADE_CHOICES.map(c=>`${c.name} ${game.save.perks[c.id]||0}`).join(' · ')}</p><button class="primary" id="back">${game.run&&game.mode==='pause'?'回到冒險':'返回'}</button>${game.save.cleared.length?'<button class="subtle" id="build">重新分配祝福</button>':''}`, 'map');
  $('dialog').querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>start(Number(b.dataset.level)));
  bind('back',()=>{if(game.mode==='pause'){game.pause();closeDialog();}else{game.title();showTitle();}});
  bind('build',showBuild);
}
function showBuild(){
  dialog(`<p class="eyebrow">A FRESH LITTLE START</p><h2 id="dialog-title">換一種勇敢。</h2><p>把已獲得的祝福全部重新分配。<br>免費更換，從下次出發開始生效。</p><div class="choices">${UPGRADE_CHOICES.map(c=>`<button class="choice" data-build="${c.id}"><span class="icon" style="color:${c.color}">${icon(c.symbol)}</span><span><strong>${c.name}</strong><small>全部投入：${c.description}</small></span></button>`).join('')}</div><button class="subtle" id="cancel-build">返回關卡地圖</button>`, 'build');
  $('dialog').querySelectorAll('[data-build]').forEach(b=>b.onclick=()=>{game.reassign(b.dataset.build);toast('祝福已重新分配，下次出發生效');showMap();});bind('cancel-build',showMap);
}
function showPause(){
  dialog(`<p class="eyebrow">TAKE A LITTLE BREAK</p><img class="hero-portrait" src="${ASSETS.knight_idle_anim_f0}" alt="休息中的勇者"><h2 id="dialog-title">休息一下。</h2><p>小勇者會在這裡等你。<br>目前的冒險已暫停。</p><button class="primary" id="resume">繼續守護</button><button class="subtle" id="restart">重新挑戰本關</button><button class="subtle" id="select">關卡地圖</button>`, 'pause');
  bind('resume',()=>{game.pause();closeDialog();});bind('restart',()=>start(game.run.cfg.id));bind('select',showMap);
}
function continueAfterWin(){const n=game.run.cfg.id;if(n===10){game.title();showTitle();}else start(n+1);}
function showWin(){
  const s=game.run;
  const choices=s.cfg.id%2===1?[UPGRADE_CHOICES[0],UPGRADE_CHOICES[1],UPGRADE_CHOICES[2]]:[UPGRADE_CHOICES[0],UPGRADE_CHOICES[1],UPGRADE_CHOICES[3]];
  const isLast=s.cfg.id===10;
  dialog(`<p class="eyebrow">${isLast?'CHAPTER COMPLETE':'A LITTLE VICTORY'}</p><h2 id="dialog-title">${isLast?'微光，因你而亮。':'又前進了一小步！'}</h2><p>${isLast?'10 關試玩完成，謝謝你一路守護。':s.cfg.title+'，探索完成。'}</p><div class="result-stats"><div><b>${time(s.time)}</b><small>探險時間</small></div><div><b>+${game.pendingUpgrade?s.gold:0}</b><small>${game.pendingUpgrade?'首通金幣':'重玩不重複領獎'}</small></div><div><b>${s.kills}</b><small>擊退怪物</small></div></div>${game.pendingUpgrade?`<p>送給勇者一份永久祝福</p><div class="choices">${choices.map((c,i)=>`<button class="choice" data-upgrade="${c.id}"><span class="icon" style="color:${c.color}">${icon(c.symbol)}</span><span><strong>${c.name}</strong><small>${c.description}${i===0?' · 預設選擇':''}</small></span></button>`).join('')}</div><p class="hint" id="auto">12 秒後自動選擇「磨亮小劍」</p>`:`<button class="primary" id="next">${isLast?'返回營地':'前往第 '+(s.cfg.id+1)+' 關'}</button><p class="hint" id="auto">12 秒後自動繼續</p>`}<div class="camp-links"><button class="subtle" id="select">關卡地圖</button><button class="subtle" data-open-gear>查看裝備</button></div>`, 'win');
  autoAt=performance.now()+12000;
  $('dialog').querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>{game.choose(b.dataset.upgrade);autoAt=0;continueAfterWin();});
  bind('next',continueAfterWin);bind('select',()=>{if(game.pendingUpgrade)game.choose('power');autoAt=0;showMap();});
}
function showLose(){
  const s=game.run;
  dialog(`<p class="eyebrow">EVERY HERO NEEDS A SECOND TRY</p><h2 id="dialog-title">差一點點。</h2><p>小勇者回到營地休息了。<br>已獲得的祝福與解鎖關卡都還在。</p><div class="result-stats"><div><b>${time(s.time)}</b><small>本次探險</small></div><div><b>${s.wave} / 3</b><small>抵達波次</small></div></div><p>${s.charges>0?'下次生命偏低時，試著使用「守護降臨」。':'下次試著把一次守護留給最後一波。'}</p><button class="primary" id="retry">再守護他一次</button><button class="subtle" id="select">關卡地圖</button>`, 'lose');bind('retry',()=>start(s.cfg.id));bind('select',showMap);
}
function update(){
  const s=game.run||preview,h=s.hero;
  $('pause').disabled=!['play','pause'].includes(game.mode);$('pause').innerHTML=icon(game.mode==='pause'?'play':'pause');$('pause').setAttribute('aria-label',game.mode==='pause'?'繼續冒險':'暫停');
  $('chapter').textContent=String(s.cfg.id).padStart(2,'0')+' / '+s.cfg.title;$('progress').textContent='微光地城 · '+s.cfg.id+' / 10';$('timer').textContent=time(s.time);$('hp').textContent=Math.ceil(h.hp)+' / '+h.maxHp;$('health').style.width=(h.hp/h.maxHp*100)+'%';$('health').style.background=h.hp/h.maxHp<.3?'#ef788f':'#f4a4b2';
  const bar=document.querySelector('[role="progressbar"]');bar.setAttribute('aria-valuenow',Math.ceil(h.hp));bar.setAttribute('aria-valuemax',h.maxHp);
  $('gold').textContent='金幣 '+s.gold;$('bag').dataset.count=Math.min(99,game.save.inventory.length);updateLootTargets();document.querySelectorAll('.wave-dots i').forEach((el,i)=>el.classList.toggle('on',i<s.wave));
  $('live').innerHTML='<i></i>'+(game.mode==='pause'?'暫停中':game.mode==='play'?(s.wave>=3&&!s.enemies.length?'前往出口':'第 '+Math.max(1,s.wave)+' / 3 波'):'自動探險');
  const can=game.mode==='play'&&s.charges>0&&s.cooldown<=0;$('rescue').disabled=!can;
  $('rescue-title').textContent=s.charges<=0?'本關守護已用完':s.cooldown>0?'守護凝聚中 · '+Math.ceil(s.cooldown)+'s':'守護降臨';$('rescue-info').textContent=s.charges<=0?'下一關補滿守護':`回復42 · 無敵6秒 · 剩${s.charges}次`;
  const status=game.mode==='play'?(h.shield>0?'守護生效中，放心往前走吧':h.hp/h.maxHp<.4?'勇者需要你！點一下「守護降臨」':s.loot.length?'點地上寶物幫忙撿取 · 8秒後自動收取':!s.chest&&s.kills>=s.cfg.count?'寶箱解鎖了！點右上寶箱拿裝備':s.wave>=3&&!s.enemies.length?'打掃完畢！拿上寶物，往出口出發':!s.enemies.length?'喘口氣，準備下一波冒險':'勇者正在自動戰鬥 · 紅圈是出招預警'):game.mode==='pause'?'冒險暫停中':'小勇者已經準備好了';
  if(status!==lastStatus){$('status').textContent=status;lastStatus=status;}
  if(game.mode!==lastMode){lastMode=game.mode;if(!['map','gear'].includes(modalType)){if(game.mode==='win')showWin();else if(game.mode==='lose')showLose();else if(game.mode==='pause')showPause();}}
}
bind('rescue',()=>{if(game.rescue())toast('守護降臨！回復生命，無敵 6 秒');update();});
bind('speed',()=>{const speed=game.toggleSpeed();$('speed').textContent=speed+'×';$('speed').setAttribute('aria-label','切換速度，目前'+speed+'倍');toast(speed===2?'兩倍速度 · 再點一次恢復':'恢復一般速度');});
bind('sound',()=>{soundOn=!soundOn;$('sound').innerHTML=icon(soundOn?'sound':'mute');$('sound').setAttribute('aria-label',soundOn?'關閉音效':'開啟音效');tone('chest');});
bind('pause',()=>{if(game.mode==='play'||game.mode==='pause'){game.pause();if(game.mode==='play')closeDialog();update();}});
bind('map',()=>{if(game.mode==='win'&&game.pendingUpgrade)game.choose('power');autoAt=0;showMap();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(game.mode==='play'){game.pause();update();}autoAt=0;}else if(game.mode==='win'&&modalType==='win')autoAt=performance.now()+12000;lastStamp=0;accumulator=0;});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(modalType==='gear'){closeGear();return;}if(modalType==='map')$('back')?.click();else if(game.mode==='play'||game.mode==='pause')$('pause').click();}
  if(e.key==='Tab'&&!$('veil').hidden){const btns=[...$('dialog').querySelectorAll('button:not(:disabled)')],first=btns[0],last=btns.at(-1);if(e.shiftKey&&document.activeElement===first){last.focus();e.preventDefault();}else if(!e.shiftKey&&document.activeElement===last){first.focus();e.preventDefault();}}
});
function frame(stamp){
  const dt=lastStamp?Math.min(.1,(stamp-lastStamp)/1000):0;lastStamp=stamp;visualTime+=dt;
  if(game.mode==='play'){accumulator+=dt*game.speed;let safety=0;while(accumulator>=1/30&&safety++<8){game.tick(1/30);accumulator-=1/30;if(game.mode!=='play'){accumulator=0;break;}}}
  const s=game.run||preview;renderer.draw(s,game.mode==='pause'?s.time:visualTime);
  if(s.events.length){const events=s.events.splice(0);for(const e of events)if(e.type==='gear'&&modalType!=='gear')toast('獲得'+Equipment.rarities[e.item.rarity].name+'裝備：'+e.item.name+'！點盾牌穿戴');const audible=events.filter(e=>e.type!=='attack');tone((audible.at(-1)||events.at(-1)).type);}
  if(stamp-lastUiUpdate>100){update();lastUiUpdate=stamp;}
  if(autoAt&&game.mode==='win'&&modalType==='win'){
    const seconds=Math.max(0,Math.ceil((autoAt-stamp)/1000));if($('auto'))$('auto').textContent=game.pendingUpgrade?`${seconds} 秒後自動選擇「磨亮小劍」`:`${seconds} 秒後自動繼續`;
    if(stamp>=autoAt){autoAt=0;if(game.pendingUpgrade)game.choose('power');continueAfterWin();}
  }
  if(toastUntil&&stamp>toastUntil){$('toast').hidden=true;toastUntil=0;}requestAnimationFrame(frame);
}
Promise.all(Object.values(images).map(im=>im.decode().catch(()=>{}))).then(()=>{showTitle();update();requestAnimationFrame(frame);});
