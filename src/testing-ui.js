let testJumpOrigin='title';
function testEntry(){return testToolsEnabled?`<button class="subtle" data-test-jump>${testSession?'測試跳關／退出':'測試跳關'}</button>`:'';}
function resetSessionView(){
  autoAt=0;treasureUntil=0;treasureItem=null;accumulator=0;hitStop=0;lastStamp=0;lastHitSerial=0;lastMode='';lastStatus='';lootKey='';
  $('loot-targets').replaceChildren();
}
function showTestJump(){
  if(!testToolsEnabled)return;testJumpOrigin=modalType;
  if(game.mode==='play')game.pause();autoAt=0;toastUntil=0;$('toast').hidden=true;
  const max=DungeonEngine.levels.length;
  dialog(`<div class="test-jump-dialog"><p class="eyebrow">TEST PLAY</p><h2 id="dialog-title">直接測試關卡</h2><p>使用獨立的臨時進度。<br>返回正式冒險即可繼續原本的旅程。</p><label for="test-level">關卡（1～${max}）</label><input id="test-level" type="number" inputmode="numeric" min="1" max="${max}" step="1" value="${max}"><div class="test-shortcuts">${[1,21,25,max].filter((n,i,a)=>n<=max&&a.indexOf(n)===i).map(n=>`<button data-test-level="${n}">第 ${n} 關</button>`).join('')}</div><label for="test-profile">測試配裝</label><select id="test-profile"><option value="standard">對應等級裝備＋攻擊祝福</option><option value="mine">我的正式裝備與祝福</option></select><p class="hint">標準配置：精良劍、普通甲與飾品，<br>關卡等級 −1 點攻擊祝福；第 4 關起帶風芽。</p><p class="test-error" id="test-error" role="alert" hidden></p><button class="primary" id="test-start">開始測試第 ${max} 關</button>${testSession?'<button class="subtle" id="test-exit">返回正式冒險</button>':''}<button class="subtle" id="test-cancel">返回</button></div>`, 'test-jump');
  const input=$('test-level');
  function label(){const n=Number(input.value);$('test-start').textContent=Number.isInteger(n)&&n>=1&&n<=max?`開始測試第 ${n} 關`:'開始測試';$('test-error').hidden=true;}
  input.oninput=label;
  $('dialog').querySelectorAll('[data-test-level]').forEach(b=>b.onclick=()=>{input.value=b.dataset.testLevel;label();});
  bind('test-start',()=>{
    const level=Number(input.value),next=TestTools.create({engine:DungeonEngine,level,profile:$('test-profile').value,baseSave:campaignGame.save});
    if(!next){$('test-error').textContent=`請輸入 1～${max} 的整數關卡。`;$('test-error').hidden=false;input.focus();return;}
    game=next;testSession=true;resetSessionView();start(level);toast(`測試第 ${level} 關 · 進度保留於本次測試`);
  });
  bind('test-exit',exitTestSession);bind('test-cancel',closeTestJump);
}
function closeTestJump(){
  if(testJumpOrigin==='map')showMap();else if(game.mode==='pause')showPause();else showTitle();
  update();
}
function exitTestSession(){
  if(!testSession)return;game=campaignGame;testSession=false;resetSessionView();
  preview=DungeonEngine.begin(game.save.unlocked,game.save.perks);
  if(game.mode==='pause')showMap();else{game.title();showTitle();}update();toast('已返回正式冒險');
}
