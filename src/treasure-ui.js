let treasureUntil=0,treasureItem=null;
function showTreasure(item){
  if(game.mode!=='play')return;game.pause();lastMode=game.mode;treasureItem=item;toastUntil=0;$('toast').hidden=true;
  const rarity=Equipment.rarities[item.rarity],trait=Equipment.traits[Equipment.traitFor(item)];
  dialog(`<div class="treasure-dialog" style="--treasure-color:${rarity.color}"><p class="eyebrow">${item.rarity>=2?'A LITTLE EXTRAORDINARY':'A LITTLE DISCOVERY'}</p><div class="treasure-emblem ${item.rarity>=2?'rare':''}">${icon(Equipment.slots[item.slot].icon)}<span>${icon('spark')}</span></div><p class="treasure-rarity">${rarity.name} · Lv.${item.level} · ${Equipment.slots[item.slot].name}</p><h2 id="dialog-title">${escapeHtml(item.name)}</h2><p class="treasure-stats">${Equipment.describe(item)}</p><div class="treasure-trait"><strong style="color:${trait.color}">${trait.name}</strong><p>${Equipment.traitDescription(item)}</p></div><p class="hint">已存入背包 · 每第 5 次開箱至少為稀有</p><button class="primary" id="treasure-equip">立即穿戴，繼續冒險</button><button class="subtle" id="treasure-close">先收好，繼續冒險</button><p class="hint" id="treasure-auto">8 秒後收好並自動繼續</p></div>`, 'treasure');
  treasureUntil=performance.now()+8000;bind('treasure-equip',()=>closeTreasure(true));bind('treasure-close',()=>closeTreasure(false));tone(item.rarity>=2?'win':'chest');update();
}
function closeTreasure(equip=false){if(modalType!=='treasure'||!treasureItem)return;if(equip)game.equip(treasureItem.id);treasureItem=null;treasureUntil=0;if(game.mode==='pause')game.pause();closeDialog();lastMode=game.mode;update();}
function tickTreasure(stamp){if(modalType!=='treasure'||!treasureUntil)return;const seconds=Math.max(0,Math.ceil((treasureUntil-stamp)/1000));if($('treasure-auto'))$('treasure-auto').textContent=seconds+' 秒後收好並自動繼續';if(stamp>=treasureUntil)closeTreasure(false);}
document.addEventListener('visibilitychange',()=>{if(modalType==='treasure')treasureUntil=document.hidden?0:performance.now()+8000;});
