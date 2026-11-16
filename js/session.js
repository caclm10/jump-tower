'use strict';
(function(){
const C=JT.Config;
class Session{
 constructor(){this.restart();this.mode='menu';}
 restart(){this.player=JT.Physics.player();this.stats={time:0,jumps:0,falls:0,highest:0};this.completed=false;this.mode='playing';}
 load(data){if(!data)return false;this.player=data.player;this.stats=data.stats;this.completed=data.completed;this.mode=data.completed?'victory':'playing';return true;}
 pause(){if(this.mode==='playing'){this.mode='paused';this.player.charging=false;this.player.charge=0;return true;}return false;}
 resume(){if(this.mode==='paused'){this.mode='playing';return true;}return false;}
 tick(input,dt=C.step){
  if(this.mode!=='playing')return;
  const p=this.player;JT.Physics.step(p,input,dt);this.stats.time+=dt;
  if(p.jumped)this.stats.jumps++;
  if(p.fell)this.stats.falls++;
  this.stats.highest=Math.max(this.stats.highest,JT.Util.height(p.y));
  if(p.grounded&&p.platformId===JT.World.summit.id){this.completed=true;this.mode='victory';p.state='victory';}
 }
}
JT.Session=Session;
})();
