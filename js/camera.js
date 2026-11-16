'use strict';
JT.Camera=class{
 constructor(){this.y=JT.Config.worldHeight-JT.View.height;this.previous=this.y;}
 snap(p){this.y=JT.Util.clamp(p.y-JT.View.height*0.56,0,JT.Config.worldHeight-JT.View.height);this.previous=this.y;}
 tick(p,dt){this.previous=this.y;const target=JT.Util.clamp(p.y-JT.View.height*(p.vy>150?0.32:0.57),0,JT.Config.worldHeight-JT.View.height);this.y+=(target-this.y)*(1-Math.exp(-dt*7));}
};
