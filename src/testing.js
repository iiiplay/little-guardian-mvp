// Test runs use an in-memory save; the campaign save and its storage are never replaced.
const TestTools=(()=>{
  function create({engine,level,profile='standard',baseSave,clock=Date.now,random=Math.random}){
    if(!Number.isInteger(level)||level<1||level>engine.levels.length||!['standard','mine'].includes(profile))return null;
    if(profile==='mine'&&(!baseSave||typeof baseSave!=='object'))return null;
    const save=profile==='mine'?JSON.parse(JSON.stringify(baseSave)):{
      version:6,gold:0,perks:{power:level-1},spirit:level>3?'wind':null,
      inventory:[{id:1,slot:'weapon',rarity:1,level,trait:'lifesteal'},{id:2,slot:'armor',rarity:0,level,trait:'thorns'},{id:3,slot:'charm',rarity:0,level,trait:'renewal'}],
      equipped:{weapon:1,armor:2,charm:3},nextItemId:4,gearDrops:0
    };
    // Synthetic unlocks apply to this temporary profile, including spirit requirements.
    save.unlocked=level;save.cleared=[...new Set([...(profile==='mine'&&Array.isArray(save.cleared)?save.cleared:[]),...Array.from({length:level-1},(_,i)=>i+1)])];save.pendingReward=null;save.best={};
    // Keep test battles ordinary, regardless of the campaign's next-run contract selection.
    save.journey={...save.journey,contract:null};
    let memory=JSON.stringify(save);
    return createGame({engine,clock,random,store:{getItem:()=>memory,setItem:(key,value)=>{memory=value;}}});
  }
  return {create};
})();
if(typeof module!=='undefined')module.exports=TestTools;
