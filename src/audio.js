// Small, layered synthesis bank. All voices terminate; one limiter owns output.
function createCombatAudio(makeContext=()=>new(window.AudioContext||window.webkitAudioContext)()){
  let context,master,noiseBuffer;const last=new Map();
  function unlock(){context??=makeContext();if(!master){master=context.createGain();master.gain.value=.32;const limiter=context.createDynamicsCompressor();limiter.threshold.value=-14;limiter.ratio.value=8;master.connect(limiter);limiter.connect(context.destination);noiseBuffer=context.createBuffer(1,context.sampleRate*.3,context.sampleRate);const data=noiseBuffer.getChannelData(0);let seed=123;for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;data[i]=seed/2147483648-1;}}if(context.state==='suspended')context.resume().catch(()=>{});}
  function note(f,end,duration,volume,type='triangle',delay=0){const t=context.currentTime+delay,o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(master);o.start(t);o.stop(t+duration+.01);o.onended=()=>{o.disconnect();g.disconnect();};}
  function noise(duration,volume,freq){const t=context.currentTime,n=context.createBufferSource(),filter=context.createBiquadFilter(),g=context.createGain();n.buffer=noiseBuffer;filter.type='bandpass';filter.frequency.setValueAtTime(freq,t);filter.frequency.exponentialRampToValueAtTime(Math.max(100,freq*.3),t+duration);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);n.connect(filter);filter.connect(g);g.connect(master);n.start();n.stop(t+duration);n.onended=()=>{n.disconnect();filter.disconnect();g.disconnect();};}
  function play(type){unlock();const now=context.currentTime;if(now-(last.get(type)??-10)<.045)return;last.set(type,now);
    switch(type){
      case 'attack':noise(.065,.22,3300);note(180,65,.09,.25);note(880,420,.045,.04,'square');break;
      case 'assist':case 'interrupt':noise(.13,.38,2600);note(330,45,.22,.5);note(type==='interrupt'?1320:880,550,.12,.12,'square');break;
      case 'charge':note(160,1200,.45,.22,'triangle');noise(.25,.18,4000);break;
      case 'ultimate':note(65,24,.6,.8,'sine');noise(.29,.8,900);for(let i=0;i<4;i++)note(420+i*180,90,.4,.22,'sawtooth',i*.06);break;
      case 'meteor':case 'explosion':noise(.29,.7,1200);note(130,28,.38,.8,'sine');note(700,140,.2,.16,'sawtooth');break;
      case 'kill':note(480,160,.13,.22);noise(.09,.17,1800);break;
      case 'pickup':note(1047,1047,.08,.17,'sine');note(1568,1568,.12,.13,'sine',.045);break;
      case 'hurt':noise(.12,.23,600);note(105,40,.18,.32,'sawtooth');break;
      case 'fever':case 'win':case 'chest':case 'rescue':case 'cleared':for(const [i,f]of [523,659,784,1047].entries())note(f,f,.24,.16,'triangle',i*.075);break;
      case 'wave':note(160,90,.2,.2);note(240,140,.22,.14,'triangle',.14);break;
    }
  }
  return {play,unlock,mute(value){if(master)master.gain.setTargetAtTime(value?0:.32,context.currentTime,.015);},get state(){return context?.state||'locked';}};
}
