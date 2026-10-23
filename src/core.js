const UPGRADE_CHOICES=[
  {id:'power',name:'磨亮小劍',description:'每次攻擊 +2 傷害',symbol:'sword',color:'#f1cf8d'},
  {id:'vitality',name:'勇敢的心',description:'生命上限 +24',symbol:'heart',color:'#ffa8b7'},
  {id:'haste',name:'輕盈步伐',description:'攻擊間隔縮短 15%',symbol:'wing',color:'#b5a2ef'},
  {id:'armor',name:'口袋護甲',description:'減傷 0.6 · 反傷 +0.5',symbol:'shield',color:'#9ee6cd'}
];
function createGame({engine,store,clock=Date.now,random=Math.random}){
  const key='little-guardian-mvp-v1';let save={version:1,unlocked:1,cleared:[],gold:0,perks:{},best:{},updatedAt:clock()},storageError=false;
  try{const raw=JSON.parse(store?.getItem(key)||'null');if(raw&&typeof raw==='object'){save={...save,...raw,version:1,unlocked:Math.max(1,Math.min(10,Number(raw.unlocked)||1)),perks:{},cleared:Array.isArray(raw.cleared)?raw.cleared.filter(n=>Number.isInteger(n)&&n>=1&&n<=10):[],best:raw.best&&typeof raw.best==='object'?raw.best:{}};for(const k of ['power','vitality','haste','armor'])save.perks[k]=Math.min(30,Math.max(0,Math.floor(Number(raw.perks?.[k])||0)));save.gold=Math.max(0,Number(raw.gold)||0);}}catch{storageError=true;}
  Object.assign(save,Equipment.normalize(save.inventory,save.equipped));save.version=4;save.nextItemId=Math.max(Number.isSafeInteger(save.nextItemId)?save.nextItemId:1,1,...save.inventory.map(i=>i.id+1));save.gearDrops=Number.isSafeInteger(save.gearDrops)&&save.gearDrops>=0?save.gearDrops:save.inventory.length;
  const persist=()=>{try{store?.setItem(key,JSON.stringify({...save,updatedAt:clock()}));}catch{storageError=true;}};
  // A refresh during the reward screen grants its documented default exactly once.
  if(Number.isInteger(save.pendingReward)&&save.cleared.includes(save.pendingReward)){save.perks.power=(save.perks.power||0)+1;save.pendingReward=null;persist();}
  const driver=createDriver(engine);let settled=false,pendingUpgrade=false,mode='title',speed=1;
  const claimGear=()=>{const s=driver.state();if(!s)return;for(const reward of s.gearRewards.splice(0)){const item=Equipment.roll(reward.level,save.nextItemId++,random,save.inventory.length===0,++save.gearDrops);save.inventory.push(item);s.foundGear??=[];s.foundGear.push(item.id);s.events.push({type:'gear',item,manual:reward.manual});persist();}};
  return {
    get save(){return save;},get mode(){return mode;},get speed(){return speed;},get storageError(){return storageError;},get run(){return driver.state();},get pendingUpgrade(){return pendingUpgrade;},
    start(level=save.unlocked){if(!Number.isInteger(level)||level<1||level>save.unlocked)return false;if(pendingUpgrade){save.perks.power=(save.perks.power||0)+1;save.pendingReward=null;persist();}driver.begin(level,save.perks,undefined,Equipment.total(save));settled=false;pendingUpgrade=false;mode='play';return true;},
    tick(dt){if(mode!=='play')return;driver.step(dt);claimGear();const s=driver.state();if(s.status==='lose')mode='lose';if(s.status==='win'&&!settled){settled=true;mode='win';if(!save.cleared.includes(s.cfg.id)){save.cleared.push(s.cfg.id);save.gold+=s.gold;pendingUpgrade=true;save.pendingReward=s.cfg.id;}save.unlocked=Math.min(10,Math.max(save.unlocked,s.cfg.id+1));save.best[s.cfg.id]=Math.min(save.best[s.cfg.id]||Infinity,s.time);persist();}},
    collect(id){return mode==='play'&&engine.collect(driver.state(),id,true);},
    openChest(){if(mode!=='play')return false;const ok=engine.openChest(driver.state(),true);claimGear();return ok;},
    assist(id){return mode==='play'&&engine.assist(driver.state(),id);},
    ultimate(){return mode==='play'&&engine.ultimate(driver.state());},
    detonate(id){return mode==='play'&&engine.detonate(driver.state(),id);},
    fuse(baseId,materialId){if(mode==='play'||save.equipped.weapon===materialId)return null;const base=save.inventory.find(i=>i.id===baseId),material=save.inventory.find(i=>i.id===materialId),item=Equipment.fusionPreview(base,material,save.nextItemId);if(!item)return null;save.nextItemId++;save.inventory=save.inventory.filter(i=>i.id!==baseId&&i.id!==materialId);save.inventory.push(item);save.equipped.weapon=item.id;const s=driver.state();if(s?.status==='play')engine.applyGear(s,save.perks,Equipment.total(save));persist();return item;},
    equip(id){const item=save.inventory.find(i=>i.id===id);if(!item)return false;save.equipped[item.slot]=id;const s=driver.state();if(s?.status==='play')engine.applyGear(s,save.perks,Equipment.total(save));persist();return true;},
    unequip(slot){if(!Equipment.slots[slot])return false;save.equipped[slot]=null;const s=driver.state();if(s?.status==='play')engine.applyGear(s,save.perks,Equipment.total(save));persist();return true;},
    rescue:()=>mode==='play'&&driver.rescue(),pause(){if(mode==='play')mode='pause';else if(mode==='pause')mode='play';},title(){mode='title';},toggleSpeed(){speed=speed===1?2:1;return speed;},
    reassign(id){if(mode==='play'||!UPGRADE_CHOICES.some(x=>x.id===id))return false;const points=Object.values(save.perks).reduce((a,b)=>a+b,0);save.perks={[id]:points};persist();return true;},
    choose(id){if(mode!=='win'||!pendingUpgrade||!UPGRADE_CHOICES.some(x=>x.id===id))return false;save.perks[id]=(save.perks[id]||0)+1;save.pendingReward=null;pendingUpgrade=false;persist();return true;}
  };
}
if(typeof module!=='undefined')module.exports={createGame,UPGRADE_CHOICES};
