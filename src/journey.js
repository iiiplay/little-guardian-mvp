// Offline progression only. The injected clock owns calendar changes; no timers or DOM.
const Journey=(()=>{
  const B=Object.freeze({taskGold:30,taskMarks:1,allMarks:1,contractGold:20,contractLimit:3,rareGold:120,rareMarks:4,epicGold:400,epicMarks:12});
  const cap=(n,max=1000000)=>Math.min(max,Math.max(0,Math.floor(Number(n)||0)));
  function day(time){const d=new Date(time);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
  const validDay=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T12:00:00Z'));
  const ordinal=s=>Math.floor(Date.parse(s+'T12:00:00Z')/86400000);
  function tasks(key){return [{id:'wins',title:'完成 2 場探險',goal:2},{id:'pickups',title:'親手撿取 10 件寶物',goal:10},[
    {id:'assists',title:'使出 8 次星擊',goal:8},{id:'interrupts',title:'打斷敵人 3 次',goal:3},{id:'spells',title:'施放 2 次星界裁決',goal:2}
  ][((ordinal(key)%3)+3)%3]];}
  function emptyDaily(key){return {day:key,progress:{wins:0,pickups:0,assists:0,interrupts:0,spells:0},claimed:[],bonus:false,contractWins:0};}
  function normalize(raw,time){
    const today=day(time),d=raw?.daily,key=validDay(d?.day)?d.day:today,daily=emptyDaily(key);
    for(const id of Object.keys(daily.progress))daily.progress[id]=cap(d?.progress?.[id],1000);
    daily.claimed=tasks(key).filter(t=>Array.isArray(d?.claimed)&&d.claimed.includes(t.id)&&daily.progress[t.id]>=t.goal).map(t=>t.id);
    daily.bonus=daily.claimed.length===3&&d?.bonus===true;daily.contractWins=cap(d?.contractWins,B.contractLimit);
    const victories={wind:cap(raw?.victories?.wind),thorns:cap(raw?.victories?.thorns),surge:cap(raw?.victories?.surge)};
    const firstDay=validDay(raw?.firstDay)?raw.firstDay:key,visits=[...new Set((Array.isArray(raw?.visits)?raw.visits:[]).filter(d=>validDay(d)&&d>=firstDay))].sort().slice(-14);
    return {version:1,marks:cap(raw?.marks),contract:['wind','thorns','surge'].includes(raw?.contract)?raw.contract:null,daily,victories,days:Math.max(1,cap(raw?.days)),firstDay,visits,opens:cap(raw?.opens),returnedNextDay:raw?.returnedNextDay===true,lastNotice:typeof raw?.lastNotice==='string'?raw.lastNotice.slice(0,100):'',runs:cap(raw?.runs),wins:cap(raw?.wins),crafts:cap(raw?.crafts)};
  }
  function visit(save,time){const j=save.journey,key=day(time);j.opens++;if(key<j.daily.day)return;if(!j.visits.includes(key))j.visits=[...j.visits,key].sort().slice(-14);if(ordinal(key)-ordinal(j.firstDay)===1)j.returnedNextDay=true;}
  function payTask(save,id){const j=save.journey,d=j.daily,t=tasks(d.day).find(t=>t.id===id);if(!t||d.claimed.includes(id)||d.progress[id]<t.goal)return false;d.claimed.push(id);save.gold+=B.taskGold;j.marks+=B.taskMarks;if(d.claimed.length===3&&!d.bonus){d.bonus=true;j.marks+=B.allMarks;}return true;}
  function rollover(save,time){
    const today=day(time),j=save.journey;if(today<=j.daily.day)return false;
    let banked=0;for(const t of tasks(j.daily.day))if(payTask(save,t.id))banked++;
    j.daily=emptyDaily(today);j.days++;j.lastNotice=banked?`上次完成的 ${banked} 項委託已自動收好。`:'';return true;
  }
  function record(save,id,amount=1){const d=save.journey.daily;if(Object.hasOwn(d.progress,id))d.progress[id]=Math.min(1000,d.progress[id]+amount);}
  function win(save,contract){
    const j=save.journey;record(save,'wins');j.wins++;
    const reward={gold:0,marks:0};if(Object.hasOwn(j.victories,contract)){
      if(!j.victories[contract]){j.marks++;reward.marks++;}j.victories[contract]++;
      if(j.daily.contractWins<B.contractLimit){j.daily.contractWins++;save.gold+=B.contractGold;reward.gold=B.contractGold;}
    }return reward;
  }
  function view(save){const j=save.journey,d=j.daily;return {day:d.day,marks:j.marks,gold:save.gold,days:j.days,notice:j.lastNotice,contract:j.contract,contractWins:d.contractWins,victories:{...j.victories},tasks:tasks(d.day).map(t=>({...t,value:Math.min(t.goal,d.progress[t.id]),claimed:d.claimed.includes(t.id)})),complete:d.bonus,runs:j.runs,wins:j.wins,crafts:j.crafts,firstDay:j.firstDay,visits:[...j.visits],opens:j.opens,returnedNextDay:j.returnedNextDay};}
  return {B,day,tasks,normalize,rollover,visit,record,payTask,win,view};
})();
if(typeof module!=='undefined')module.exports=Journey;
