'use strict';
(function(){
// Pointer IDs, rather than a single pressed flag, allow direction + jump multitouch.
JT.TouchControls=class{
 constructor(game){
  this.game=game;this.root=document.getElementById('touch-controls');this.pointers=new Map();this.lastCharge=0;
  this.buttons=[...this.root.querySelectorAll('[data-touch]')];
  this.enabled=matchMedia('(pointer: coarse)').matches||navigator.maxTouchPoints>0;
  document.body.classList.toggle('touch-device',this.enabled);
  this.root.addEventListener('pointerdown',e=>this.down(e));
  this.root.addEventListener('pointerup',e=>this.up(e));
  this.root.addEventListener('pointercancel',e=>this.cancel(e));
  this.root.addEventListener('lostpointercapture',e=>this.cancel(e));
  this.root.addEventListener('contextmenu',e=>e.preventDefault());
  document.getElementById('touch-pause').onclick=()=>game.pause();
 }
 held(action){for(const item of this.pointers.values())if(item.action===action)return true;return false;}
 down(e){
  const button=e.target.closest('[data-touch]');
  if(!button||this.game.session.mode!=='playing'||(e.pointerType==='mouse'&&e.button!==0))return;
  e.preventDefault();this.game.audio.unlock();
  const action=button.dataset.touch,alreadyHeld=this.held(action);
  this.pointers.set(e.pointerId,{action,button});
  button.setPointerCapture(e.pointerId);button.classList.add('pressed');button.setAttribute('aria-pressed','true');
  if(action==='jump'&&!alreadyHeld&&!this.game.keys.has('Space'))this.game.input.press=true;
 }
 up(e){
  const item=this.pointers.get(e.pointerId);if(!item)return;e.preventDefault();
  // Sample the launch direction before any other finger can be lifted this frame.
  const direction=this.game.direction();this.pointers.delete(e.pointerId);
  if(!this.held(item.action)){item.button.classList.remove('pressed');item.button.setAttribute('aria-pressed','false');}
  if(item.button.hasPointerCapture(e.pointerId))item.button.releasePointerCapture(e.pointerId);
  if(item.action==='jump'&&!this.held('jump')&&!this.game.keys.has('Space')&&this.game.session.mode==='playing'){
   this.game.input.release=true;this.game.input.releaseDir=direction;
  }
 }
 cancel(e){if(this.pointers.has(e.pointerId))this.game.cancelCharge();}
 clear(){
  const pending=[...this.pointers.entries()];this.pointers.clear();
  for(const [id,item] of pending)if(item.button.hasPointerCapture(id))item.button.releasePointerCapture(id);
  for(const button of this.buttons){button.classList.remove('pressed');button.setAttribute('aria-pressed','false');}
  this.root.style.setProperty('--charge','0%');this.lastCharge=0;
 }
 show(playing){this.root.hidden=!this.enabled||!playing;}
 update(player){if(this.root.hidden)return;const charge=player.charging?Math.round(player.charge/JT.Config.maxCharge*100):0;if(charge!==this.lastCharge){this.root.style.setProperty('--charge',charge+'%');this.lastCharge=charge;}}
};
})();
