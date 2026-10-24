// Called only by the Android Activity. No native bridge or device permissions are exposed.
window.LittleGuardianHost={
  pause(){
    hostSuspended=true;
    if(game.mode==='play')game.pause();
    autoAt=0;if(modalType==='treasure')treasureUntil=0;
    lastStamp=0;accumulator=0;combatAudio.suspend();update();
    return true;
  },
  resume(){
    hostSuspended=false;lastStamp=0;accumulator=0;
    if(game.mode==='win'&&modalType==='win')autoAt=performance.now()+12000;
    if(modalType==='treasure')treasureUntil=performance.now()+8000;
    combatAudio.resume();return true;
  },
  back(){
    if(modalType==='title')return false;
    if(modalType==='journal'){closeJournal();return true;}
    if(modalType==='spirits'){closeSpirits();return true;}
    if(modalType==='forge'){renderGear();return true;}
    if(modalType==='gear'){closeGear();return true;}
    if(modalType==='treasure'){closeTreasure(false);return true;}
    if(modalType==='map'){$('back')?.click();return true;}
    if(modalType==='build'){showMap();return true;}
    if(game.mode==='win'||game.mode==='lose'){
      if(game.pendingUpgrade)game.choose('power');
      game.title();showTitle();return true;
    }
    if(game.mode==='play'||game.mode==='pause'){$('pause').click();return true;}
    return false;
  }
};
