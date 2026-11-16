'use strict';
(function(){
const C=JT.Config, clamp=JT.Util.clamp;
function player(x=114,y=C.floor-C.playerHeight){return {x,y,w:C.playerWidth,h:C.playerHeight,vx:0,vy:0,grounded:true,charging:false,charge:0,facing:1,state:'idle',landTimer:0,apex:y,launchY:y,countedFall:false,fell:false,fallRegistered:false,jumped:false,landed:false,impact:0,significantFall:false,walkTime:0,platformId:0};}
function launch(p,charge,direction){
 p.vy=-(C.minJump+(C.maxJump-C.minJump)*clamp(charge/C.maxCharge,0,1));
 p.vx=direction*C.speed; if(direction)p.facing=direction;
 p.grounded=false;p.charging=false;p.charge=0;p.apex=p.y;p.launchY=p.y;p.countedFall=false;p.fallRegistered=false;p.jumped=true;p.platformId=-1;
}
function step(p,input,dt,world=JT.World){
 p.jumped=false;p.landed=false;p.fell=false;p.significantFall=false;p.impact=0;
 p.landTimer=Math.max(0,p.landTimer-dt);
 if(input.press&&p.grounded){p.charging=true;p.charge=0;}
 if(p.charging&&p.grounded){p.charge=Math.min(C.maxCharge,p.charge+dt);p.vx=0;if(input.dir)p.facing=input.dir;}
 if(input.release&&p.charging&&p.grounded)launch(p,p.charge,input.dir);
 if(p.grounded&&!p.charging){
  const target=input.dir*C.speed, change=(input.dir?C.acceleration:C.friction)*dt;
  p.vx+=clamp(target-p.vx,-change,change);if(input.dir)p.facing=input.dir;
 }
 const oldX=p.x,oldY=p.y,oldBottom=oldY+p.h;
 p.x+=p.vx*dt;
 // Swept side collision; top contact is excluded so walking across a ledge is stable.
 world.eachNear(oldY,oldBottom,q=>{
  if(oldBottom<=q.y+0.01||oldY>=q.y+q.h-0.01)return;
  if(p.vx>0&&oldX+p.w<=q.x&&p.x+p.w>q.x){p.x=q.x-p.w;p.vx=0;}
  else if(p.vx<0&&oldX>=q.x+q.w&&p.x<q.x+q.w){p.x=q.x+q.w;p.vx=0;}
 });
 if(p.x<0){p.x=0;p.vx=0;}if(p.x>C.width-p.w){p.x=C.width-p.w;p.vx=0;}
 p.vy=Math.min(C.maxFall,p.vy+C.gravity*dt);
 let newY=oldY+p.vy*dt, hit=null;
 if(p.vy>=0){
  world.eachNear(oldBottom,newY+p.h,q=>{
   if(p.x+p.w>q.x+0.01&&p.x<q.x+q.w-0.01&&oldBottom<=q.y+0.01&&newY+p.h>=q.y){if(!hit||q.y<hit.y)hit=q;}
  });
  if(hit){newY=hit.y-p.h;p.impact=p.vy;p.landed=!p.grounded;p.vy=0;p.platformId=hit.id;
   if(p.landed){p.landTimer=0.16;p.charging=false;p.charge=0;}
   p.grounded=true;
  }else{p.grounded=false;p.platformId=-1;}
 }else{
  world.eachNear(newY,oldY,q=>{if(p.x+p.w>q.x+0.01&&p.x<q.x+q.w-0.01&&oldY>=q.y+q.h-0.01&&newY<=q.y+q.h){if(!hit||q.y+q.h>hit.y+hit.h)hit=q;}});
  if(hit){newY=hit.y+hit.h;p.vy=0;}p.grounded=false;
 }
 p.y=newY;
 if(p.y<0){p.y=0;p.vy=Math.max(0,p.vy);}
 if(p.y>C.floor-p.h){p.y=C.floor-p.h;p.vy=0;p.grounded=true;p.platformId=0;}
 p.apex=Math.min(p.apex,p.y);
 if(!p.fallRegistered&&p.y-p.apex>240){p.fallRegistered=true;p.significantFall=true;}
 if(!p.countedFall&&p.y-p.launchY>8){p.countedFall=true;p.fell=true;}
 if(p.landed){p.apex=p.y;p.fallRegistered=false;}
 if(p.grounded){p.launchY=p.y;p.countedFall=false;}
 if(!p.grounded){p.charging=false;p.charge=0;}
 p.walkTime+=Math.abs(p.vx)*dt;
 p.state=p.grounded?(p.charging?'charge':p.landTimer>0?'land':Math.abs(p.vx)>10?'walk':'idle'):(p.vy<0?'rise':'fall');
 return p;
}
JT.Physics={player,launch,step};
})();
