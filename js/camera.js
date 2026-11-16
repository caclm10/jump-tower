'use strict';
JT.Camera=class{
 constructor(){this.y=this.maxY();this.previous=this.y;}
 visibleHeight(){return Math.max(60,JT.View.height-(JT.View.safeBottom||0));}
 maxY(){
  const height=this.visibleHeight();
  const bottom=JT.View.safeBottom?JT.Config.floor+Math.min(60,Math.max(16,height*0.15)):JT.Config.worldHeight;
  return Math.max(0,bottom-height);
 }
 snap(p){this.y=JT.Util.clamp(p.y-this.visibleHeight()*0.56,0,this.maxY());this.previous=this.y;}
 tick(p,dt){
  this.previous=this.y;const height=this.visibleHeight();
  const target=JT.Util.clamp(p.y-height*(p.vy>150?0.32:0.57),0,this.maxY());
  // Short landscape views need a faster camera to keep terminal-speed falls visible.
  const rate=Math.max(7,JT.Config.maxFall/Math.max(24,height*0.36));
  this.y+=(target-this.y)*(1-Math.exp(-dt*rate));
 }
};
