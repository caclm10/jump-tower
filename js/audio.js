'use strict';
(function(){
class AudioManager{
 constructor(settings){this.settings=settings;this.ctx=null;this.chargeNode=null;this.musicClock=0;this.note=0;this.enabled=false;}
 unlock(){try{
  if(!this.ctx){const AC=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AC)return;this.ctx=new AC();this.fx=this.ctx.createGain();this.bg=this.ctx.createGain();this.fx.connect(this.ctx.destination);this.bg.connect(this.ctx.destination);}
  this.ctx.resume().catch(()=>{});this.enabled=true;this.apply();
 }catch{this.enabled=false;}}
 apply(){if(this.ctx){this.fx.gain.value=this.settings.sound;this.bg.gain.value=this.settings.music*0.28;}}
 tone(freq,duration,type='sine',gain=0.1,slide=0,bus){if(!this.ctx||!this.enabled||this.ctx.state!=='running')return;
  try{const now=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,now);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(20,freq+slide),now+duration);
  g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(gain,now+0.012);g.gain.exponentialRampToValueAtTime(0.0001,now+duration);o.connect(g);g.connect(bus||this.fx);o.start(now);o.stop(now+duration+0.02);o.onended=()=>{o.disconnect();g.disconnect();};}catch{}
 }
 sfx(name,strength=1){if(name==='jump'){this.tone(170,0.16,'triangle',0.2,240);this.tone(520,0.09,'sine',0.08,180);}
 else if(name==='land')this.tone(85+strength*25,0.11,'triangle',Math.min(0.22,0.05+strength*0.12),-50);
 else if(name==='fall')this.tone(240,0.65,'triangle',0.12,-170);
 else if(name==='menu')this.tone(570,0.07,'sine',0.09,120);
 else if(name==='victory'){[392,494,587,784].forEach((n,i)=>setTimeout(()=>this.tone(n,1.4,'sine',0.12),i*160));}}
 charge(amount){if(!this.ctx||!this.enabled)return;try{if(amount<0){this.stopCharge();return;}if(!this.chargeNode){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';g.gain.value=0.025;o.connect(g);g.connect(this.fx);o.start();this.chargeNode={o,g};}this.chargeNode.o.frequency.setTargetAtTime(140+amount*330,this.ctx.currentTime,0.04);}catch{}}
 stopCharge(){if(this.chargeNode){try{this.chargeNode.o.stop();this.chargeNode.o.disconnect();this.chargeNode.g.disconnect();}catch{}this.chargeNode=null;}}
 tick(dt,active){if(!active||!this.enabled)return;this.musicClock-=dt;if(this.musicClock<=0){this.musicClock=2.4;const notes=[196,293.66,246.94,329.63,220,293.66,164.81,246.94];this.tone(notes[this.note++%notes.length],3.6,'sine',0.13,0,this.bg);this.tone(notes[(this.note+2)%notes.length]*2,2.8,'sine',0.035,0,this.bg);}}
 suspend(){this.stopCharge();if(this.ctx)this.ctx.suspend().catch(()=>{});}
}
JT.AudioManager=AudioManager;
})();
