function createDriver(engine){let run=null;return {begin:(level,perks,seed,gear,contract)=>(run=engine.begin(level,perks,seed,gear,contract)),step:dt=>run&&engine.step(run,dt),rescue:()=>run&&engine.rescue(run),state:()=>run};}
if(typeof module!=='undefined')module.exports=createDriver;
