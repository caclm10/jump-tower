'use strict';
(function(){
const C=JT.Config;
class Game{
 constructor(){
  this.canvas=document.getElementById('game');this.settings=JT.Save.loadSettings();if(globalThis.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)this.settings.shake=false;
  this.session=new JT.Session();this.camera=new JT.Camera();this.renderer=new JT.Renderer(this.canvas,this.settings);this.audio=new JT.AudioManager(this.settings);this.saved=JT.Save.load();
  this.keys=new Set();this.input={dir:0,press:false,release:false,releaseDir:0};this.last=0;this.accumulator=0;this.saveClock=0;this.hudClock=0;this.storageWarned=false;this.ui=new JT.UI(this);
  this.ui.show('menu');this.resize();this.bind();this.frame=this.frame.bind(this);requestAnimationFrame(this.frame);
 }
 bind(){
  addEventListener('resize',()=>this.resize());
  addEventListener('keydown',e=>{
   if(e.target.matches('input')&&e.code!=='Escape')return;
   if(['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
   if(e.repeat)return;
   if(e.code==='Escape'){this.ui.escape();return;}
   if(e.code==='KeyH'){this.settings.hud=!this.settings.hud;this.persistSettings();this.ui.updateHud();return;}
   if(e.code==='KeyR'&&(this.session.mode==='playing'||this.session.mode==='paused')){
    if(this.session.mode==='playing')this.pause();this.ui.confirmKind='restart';this.ui.confirmReturn='paused';this.ui.show('confirm');return;
   }
   if(this.session.mode!=='playing')return;
   this.audio.unlock();this.keys.add(e.code);
   if(e.code==='Space')this.input.press=true;
  });
  addEventListener('keyup',e=>{this.keys.delete(e.code);if(e.code==='Space'&&this.session.mode==='playing'){this.input.release=true;this.input.releaseDir=this.direction();}});
  addEventListener('blur',()=>{if(this.session.mode==='playing')this.pause();this.clearInput();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(this.session.mode==='playing')this.pause();this.audio.suspend();}this.last=0;this.accumulator=0;});
  addEventListener('pagehide',()=>{if(this.session.mode!=='menu')this.save();});
 }
 resize(){
  // Keep pixels square and show the whole shaft; taller windows reveal more world.
  const height=Math.max(1,Math.round(C.width*innerHeight/innerWidth));
  JT.View.height=height;this.canvas.height=height;this.renderer.ctx.imageSmoothingEnabled=false;
  document.getElementById('stage').style.setProperty('--unit',Math.min(innerWidth/C.width,innerHeight/C.height)+'px');
  this.camera.y=JT.Util.clamp(this.camera.y,0,Math.max(0,C.worldHeight-height));this.camera.previous=this.camera.y;
 }

 direction(){return (this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0);}
 clearInput(){this.keys.clear();this.input.dir=0;this.input.press=false;this.input.release=false;this.audio.stopCharge();}
 start(){this.clearInput();this.session.restart();this.camera.snap(this.session.player);this.renderer.oldX=this.session.player.x;this.renderer.oldY=this.session.player.y;this.renderer.particles.length=0;this.ui.lastRegion=-1;this.ui.lastArea=-1;this.accumulator=0;this.saveClock=0;this.audio.unlock();this.ui.show('');this.ui.updateHud();this.save();}
 continue(){if(!this.saved)return;this.clearInput();this.session.load(JT.Save.valid({version:C.version,player:this.saved.player,stats:this.saved.stats,completed:this.saved.completed}));this.camera.snap(this.session.player);this.renderer.oldX=this.session.player.x;this.renderer.oldY=this.session.player.y;this.ui.lastArea=-1;this.ui.lastRegion=-1;this.accumulator=0;this.audio.unlock();this.ui.show(this.session.completed?'victory':'');this.ui.updateHud();}
 pause(){if(this.session.pause()){this.clearInput();this.save();this.ui.show('paused');}}
 resume(){if(this.session.resume()){this.clearInput();this.accumulator=0;this.last=0;this.audio.unlock();this.ui.show('');}}
 menu(){if(this.session.mode!=='menu')this.save();this.clearInput();this.session.mode='menu';this.saved=JT.Save.load()||this.saved;this.ui.show('menu');}
 save(){const ok=JT.Save.store(this.session);this.saved=JT.Save.valid({version:C.version,player:this.session.player,stats:this.session.stats,completed:this.session.completed});if(!ok&&!this.storageWarned){this.storageWarned=true;this.ui.notice('Browser storage is unavailable. This journey will last only for this session.');}}
 persistSettings(){if(!JT.Save.saveSettings(this.settings)&&!this.storageWarned){this.storageWarned=true;this.ui.notice('Browser storage is unavailable. Settings will last only for this session.');}}
 frame(now){
  requestAnimationFrame(this.frame);if(document.hidden){this.last=0;return;}
  let dt=this.last?Math.min((now-this.last)/1000,0.1):0;this.last=now;
  const s=this.session,p=s.player;
  if(s.mode==='playing'){
   this.accumulator+=dt;
   while(this.accumulator>=C.step){
    this.input.dir=this.input.release?this.input.releaseDir:this.direction();
    this.renderer.oldX=p.x;this.renderer.oldY=p.y;s.tick(this.input);this.input.press=false;this.input.release=false;this.camera.tick(p,C.step);this.accumulator-=C.step;
    if(p.jumped){this.audio.sfx('jump');this.renderer.burst(p.x+6,p.y+20,'#c1c3a0',4);}
    if(p.landed){this.audio.sfx('land',p.impact/500);this.renderer.burst(p.x+6,p.y+20,JT.World.getRegion(p.y).top);if(p.impact>460&&this.settings.shake)this.renderer.shake=2.4;this.saveClock=C.saveInterval;}
    if(p.significantFall)this.audio.sfx('fall');
    if(s.completed){this.audio.stopCharge();this.audio.sfx('victory');this.save();this.ui.show('victory');break;}
   }
   this.audio.charge(p.charging?p.charge/C.maxCharge:-1);this.audio.tick(dt,true);this.saveClock+=dt;this.hudClock+=dt;
   if(this.saveClock>=C.saveInterval){this.saveClock=0;this.save();}
   if(this.hudClock>0.1){this.hudClock=0;this.ui.updateHud();}
  }
  if(s.mode==='menu')this.renderer.title(dt);
  else this.renderer.render(s,this.camera,s.mode==='playing'?this.accumulator/C.step:1,s.mode==='playing'||s.completed?dt:0);
 }
}
JT.Game=Game;JT.game=new Game();
})();
