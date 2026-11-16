'use strict';
(function(){
const C=JT.Config,U=JT.Util;
const defaults={sound:0.55,music:0.25,hud:true,particles:true,shake:true};
function access(){try{return globalThis.localStorage;}catch{return null;}}
function read(key,storage=access()){try{return JSON.parse(storage.getItem(key));}catch{return null;}}
function write(key,data,storage=access()){try{storage.setItem(key,JSON.stringify(data));return true;}catch{return false;}}
function settings(raw){const s={...defaults};if(raw&&typeof raw==='object')for(const k of Object.keys(defaults)){
 if(typeof s[k]==='boolean'){if(typeof raw[k]==='boolean')s[k]=raw[k];}
 else if(Number.isFinite(raw[k]))s[k]=U.clamp(raw[k],0,1);
}return s;}
function valid(raw){
 if(!raw||raw.version!==C.version||!raw.player||!raw.stats)return null;
 const p=raw.player,s=raw.stats;
 for(const [k,min,max] of [['x',0,C.width-C.playerWidth],['y',0,C.floor-C.playerHeight],['vx',-C.speed,C.speed],['vy',-C.maxJump,C.maxFall]])if(!Number.isFinite(p[k])||p[k]<min||p[k]>max)return null;
 for(const [k,max] of [['time',1e10],['jumps',1e9],['falls',1e9],['highest',C.floor]])if(!Number.isFinite(s[k])||s[k]<0||s[k]>max)return null;
 if(s.highest+0.1<JT.Util.height(p.y))return null;
 if(!Number.isInteger(s.jumps)||!Number.isInteger(s.falls)||typeof raw.completed!=='boolean')return null;
 // Saved positions must be outside solid geometry. Ignore untrusted grounded/region values.
 if(JT.World.platforms.some(q=>p.x+C.playerWidth>q.x&&p.x<q.x+q.w&&p.y+C.playerHeight>q.y+0.05&&p.y<q.y+q.h-0.05))return null;
 const out=JT.Physics.player(p.x,p.y);out.vx=p.vx;out.vy=p.vy;out.grounded=false;
 for(const q of JT.World.platforms)if(Math.abs(p.y+C.playerHeight-q.y)<0.05&&p.x+C.playerWidth>q.x&&p.x<q.x+q.w){out.grounded=true;out.platformId=q.id;break;}
 out.facing=p.facing===-1?-1:1;out.apex=Number.isFinite(p.apex)?U.clamp(p.apex,0,p.y):p.y;out.fallRegistered=p.fallRegistered===true;out.launchY=Number.isFinite(p.launchY)?U.clamp(p.launchY,0,C.floor-C.playerHeight):p.y;out.countedFall=p.countedFall===true;
 if(raw.completed&&out.platformId!==JT.World.summit.id)return null;
 return {player:out,stats:{time:s.time,jumps:s.jumps,falls:s.falls,highest:s.highest},completed:raw.completed};
}
JT.Save={defaults,settings,read,write,valid,
 load(storage){return valid(read(C.saveKey,storage));},
 store(session,storage){return write(C.saveKey,{version:C.version,player:session.player,stats:session.stats,region:JT.World.getArea(session.player.y).region,completed:session.completed},storage);},
 clear(storage=access()){try{storage.removeItem(C.saveKey);return true;}catch{return false;}},
 loadSettings(){return settings(read(C.settingsKey));},saveSettings(s){return write(C.settingsKey,settings(s));}
};
})();
