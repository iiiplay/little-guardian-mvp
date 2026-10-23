const Equipment=(()=>{
  const slots={weapon:{name:'武器',icon:'sword'},armor:{name:'護甲',icon:'shield'},charm:{name:'飾品',icon:'heart'}};
  const rarities=[{name:'普通',color:'#c1c8d5',mult:1},{name:'精良',color:'#a7ebcf',mult:1.35},{name:'稀有',color:'#bda5f1',mult:1.8},{name:'史詩',color:'#edcd91',mult:2.4}];
  const names={weapon:['旅人短劍','晨光小劍','星紋細劍','月輝之刃'],armor:['軟皮背心','苔光護甲','星紋胸甲','月輝鎧甲'],charm:['幸運小石','四葉護符','星光墜飾','月輝之心']};
  const stats=item=>{if(!item)return {attack:0,hp:0,armor:0,haste:0};const v=rarities[item.rarity].mult,lv=1+(item.level-1)*.1;return {attack:item.slot==='weapon'?Math.round(3*v*lv):0,hp:item.slot==='armor'?Math.round(18*v*lv):item.slot==='charm'?Math.round(6*v*lv):0,armor:item.slot==='armor'?+(v*.45).toFixed(2):0,haste:item.slot==='charm'?Math.min(.25,.045*v*lv):0};};
  const score=item=>{const s=stats(item);return s.attack*6+s.hp+s.armor*15+s.haste*200;};
  const describe=item=>{const s=stats(item);return [s.attack?`攻擊 +${s.attack}`:'',s.hp?`生命 +${s.hp}`:'',s.armor?`減傷 +${s.armor}`:'',s.haste?`攻速 +${Math.round(s.haste*100)}%`:''].filter(Boolean).join(' · ');};
  function roll(level,id,random=Math.random,first=false){const r=random(),rarity=r<.55?0:r<.83?1:r<.97?2:3,slot=first?'weapon':Object.keys(slots)[Math.min(2,Math.floor(random()*3))];return {id,slot,rarity,level:Math.max(1,Math.min(10,level)),name:names[slot][rarity]};}
  function normalize(inventory,equipped){const ids=new Set(),items=[];for(const raw of Array.isArray(inventory)?inventory:[]){if(!raw||!Number.isInteger(raw.id)||raw.id<1||ids.has(raw.id)||!slots[raw.slot]||!Number.isInteger(raw.rarity)||raw.rarity<0||raw.rarity>3)continue;ids.add(raw.id);items.push({id:raw.id,slot:raw.slot,rarity:raw.rarity,level:Math.max(1,Math.min(10,Math.floor(Number(raw.level)||1))),name:names[raw.slot][raw.rarity]});}const gear={};for(const slot of Object.keys(slots))gear[slot]=items.some(i=>i.id===equipped?.[slot]&&i.slot===slot)?equipped[slot]:null;return {inventory:items,equipped:gear};}
  function total(save){const out={attack:0,hp:0,armor:0,haste:0};for(const id of Object.values(save.equipped)){const s=stats(save.inventory.find(i=>i.id===id));for(const k of Object.keys(out))out[k]+=s[k];}return out;}
  return {slots,rarities,stats,score,describe,roll,normalize,total};
})();
if(typeof module!=='undefined')module.exports=Equipment;
