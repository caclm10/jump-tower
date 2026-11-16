'use strict';
var JT = globalThis.JT = globalThis.JT || {};
JT.Config = (()=>{const areaCount=50;return Object.freeze({
  width:480, height:300, worldHeight:areaCount*400+540, floor:areaCount*400+480, step:1/120,
  playerWidth:12, playerHeight:20, gravity:440, maxFall:680,
  speed:130, acceleration:1000, friction:1300, minJump:105, maxJump:316,
  maxCharge:0.72, saveInterval:4, areaHeight:400, areaCount,
  version:1, saveKey:'jump-tower.save.v1', settingsKey:'jump-tower.settings.v1'
});})();
// View dimensions can change without changing the world or simulation.
JT.View = {width:JT.Config.width,height:JT.Config.height,safeBottom:0};
JT.Util = {
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  time(seconds){ const s=Math.floor(seconds); return (Math.floor(s/3600)?Math.floor(s/3600)+':':'')+String(Math.floor(s/60)%60).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); },
  height(y){return Math.max(0,Math.round((JT.Config.floor-y-JT.Config.playerHeight)/10));}
};
