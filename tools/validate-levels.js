'use strict';
// Both search and replay execute the production fixed-step integrator and collision code.
const fs=require('node:fs');
for(const f of ['config','world','physics','save','session'])require('../js/'+f+'.js');
const {Config:C,World:W,Physics:P}=JT;
const neutral={dir:0,press:false,release:false};
function walkTo(start,x){
 const p={...start},inputs=[];
 for(let i=0;i<500;i++){
  if(Math.abs(p.x-x)<=1.1)return {p,inputs};
  const input={dir:Math.sign(x-p.x),press:false,release:false};P.step(p,input,C.step);inputs.push(input);
  if(!p.grounded)return null;
 }
 return null;
}
function trial(start,target,ticks,dir){
 const p={...start};
 for(let i=0;i<ticks;i++)P.step(p,{dir,press:i===0,release:false},C.step);
 P.step(p,{dir,press:false,release:true},C.step);
 if(!p.jumped)return null;
 let frames=1;
 while(!p.grounded&&frames<300){P.step(p,neutral,C.step);frames++;if(p.vy>0&&p.y>target.y+50)return null;}
 if(!p.grounded||p.platformId!==target.id)return null;
 const margin=Math.min(p.x+p.w-target.x,target.x+target.w-p.x);
 if(margin<4)return null;
 return {p,frames,margin};
}
function solve(start,from,to){
 const low=from.x+2,high=from.x+from.w-C.playerWidth-2;
 const clamp=x=>Math.max(low,Math.min(high,x));
 const center=to.x+to.w/2-C.playerWidth/2,sourceCenter=from.x+from.w/2-C.playerWidth/2;
 const positions=[clamp(start.x),clamp(sourceCenter),clamp(low),clamp(high),clamp(sourceCenter-10),clamp(sourceCenter+10),clamp(center-110),clamp(center+110),clamp(center-75),clamp(center+75)];
 const ticks=[87,84,81,78,75,72,69,66,63,60,57,54,51,48,45,42,39,36,33];
 let best=null;
 for(const x of positions){
  const walk=walkTo(start,x);if(!walk)continue;
  const dir=Math.sign(center-(walk.p.x+C.playerWidth/2));
  for(const d of [dir,0])for(const t of ticks){
   const result=trial(walk.p,to,t,d);if(!result)continue;
   const score=result.margin-Math.abs(x-start.x)*0.04;
   if(!best||score>best.score)best={...result,score,walk:walk.inputs,ticks:t,dir:d,launchX:walk.p.x};
  }
 }
 return best;
}
function validate({write=false}={}){
 let p=P.player(),totalFrames=0;const route=[],failed=[];
 for(let i=1;i<W.route.length;i++){
  const from=W.route[i-1],to=W.route[i];
  const plan=solve(p,from,to);
  if(!plan){failed.push({from:from.id,to:to.id,area:to.area+1,dx:to.x+to.w/2-(from.x+from.w/2),rise:from.y-to.y});break;}
  p=plan.p;totalFrames+=plan.walk.length+plan.ticks+plan.frames;
  route.push({from:from.id,to:to.id,walk:plan.walk.map(i=>i.dir),ticks:plan.ticks,dir:plan.dir,airFrames:plan.frames,launchX:plan.launchX,landingX:p.x,margin:plan.margin});
 }
 if(failed.length)throw new Error('Unreachable route: '+JSON.stringify(failed));
 // Replay through the real Session, including victory detection, without teleporting.
 const session=new JT.Session();session.restart();
 for(const plan of route){
  for(const dir of plan.walk)session.tick({dir,press:false,release:false});
  for(let i=0;i<plan.ticks;i++)session.tick({dir:plan.dir,press:i===0,release:false});
  session.tick({dir:plan.dir,press:false,release:true});
  for(let i=1;i<plan.airFrames;i++)session.tick(neutral);
  if(session.player.platformId!==plan.to)throw new Error('Replay diverged at '+plan.to);
 }
 if(session.mode!=='victory')throw new Error('Replay did not reach victory');
 let optionalJumps=0;
 for(const shortcut of W.shortcuts){
  let from=W.platforms[shortcut.from],state=P.player(from.x+from.w/2-C.playerWidth/2,from.y-C.playerHeight);state.platformId=from.id;
  for(const id of [...shortcut.via,shortcut.to]){
   const to=W.platforms[id],plan=solve(state,from,to);
   if(!plan)throw new Error('Unreachable shortcut '+from.id+' → '+id);
   state=plan.p;from=to;optionalJumps++;
  }
 }
 const report={optionalJumps,verifiedShortcuts:W.shortcuts.length,areas:W.areas.length,regions:W.regions.length,platforms:W.platforms.length,verifiedJumps:route.length,physicsHz:1/C.step,minimumLandingEdgeClearance:Math.min(...route.map(p=>p.margin-C.playerWidth)),simulatedSeconds:session.stats.time,victory:session.completed,route};
 if(write){fs.writeFileSync('tests/route.json',JSON.stringify(report));fs.writeFileSync('tests/level-report.json',JSON.stringify({...report,route:undefined},null,2)+'\n');}
 return report;
}
if(require.main===module){try{const r=validate({write:!process.argv.includes('--no-write')});console.log(JSON.stringify({...r,route:undefined},null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={validate,solve,trial};
