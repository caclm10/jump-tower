'use strict';
(function(){
const $=id=>document.getElementById(id),U=JT.Util;
class UI{
 constructor(game){this.game=game;this.screen=$('screen');this.hud=$('hud');this.returnTo='menu';this.confirmReturn='menu';this.toastTimer=0;this.lastArea=-1;this.lastRegion=-1;this.noticeTimer=0;
 $('pause-button').onclick=()=>game.pause();
 this.screen.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b&&!b.disabled){game.audio.unlock();game.audio.sfx('menu');this.action(b.dataset.action);}});
 this.screen.addEventListener('input',e=>{const k=e.target.dataset.setting;if(!k)return;game.settings[k]=e.target.type==='checkbox'?e.target.checked:Number(e.target.value);game.audio.apply();game.persistSettings();this.updateHud();});
 }
 button(label,action,primary=false,disabled=false){return `<button class="button${primary?' primary':''}" data-action="${action}" ${disabled?'disabled':''}><span>${label}</span><span class="arrow" aria-hidden="true">${primary?'↗':'›'}</span></button>`;}
 show(page){
  this.page=page;const g=this.game,s=g.session;
  g.touch.show(!page&&s.mode==='playing');
  this.screen.classList.toggle('shaded',page!=='menu'&&page!=='');
  if(!page){this.screen.innerHTML='';this.hud.hidden=!g.settings.hud;if(!g.touch.enabled)g.canvas.focus({preventScroll:true});return;}
  this.hud.hidden=true;
  const btn=(...args)=>this.button(...args),back=btn('Back','back');let html='';
  if(page==='menu'){
   const saved=g.saved;
   html=`<div class="title-menu"><div class="eyebrow">50 AREAS · ONE UNBROKEN CLIMB</div><h1>JUMP<span>TOWER</span></h1><p class="tagline">Carry a little light a long way.</p><p class="description">An unforgiving journey above the clouds.</p><p class="mobile-guide">Touch controls available.<span> Turn your phone sideways for the best view.</span></p><div class="title-actions">${btn('Start game','start',!saved)}${saved?btn('Continue <small>· '+U.height(saved.player.y)+' m</small>','continue',true):btn('Continue','continue',false,true)}<div class="button-row">${btn('Settings','settings')}${btn('Controls','controls')}</div><button class="text-button" data-action="reset" ${saved?'':'disabled'}>Reset progress</button></div></div><div class="title-bottom"><span>NO CHECKPOINTS. EVERY STEP IS YOURS.</span><span>VOL. 01 / THE LANTERN COURIER</span></div>`;
  }else if(page==='paused'){
   html=`<div class="panel"><div class="eyebrow">TAKE A BREATH</div><h2>The tower can wait.</h2><p>${JT.World.getRegion(s.player.y).name} · ${U.height(s.player.y)} m<br>Your journey is saved on this device.</p>${btn('Resume journey','resume',true)}${btn('Settings','settings')}${btn('Controls','controls')}${btn('Restart from the village','restart')}${btn('Return to main menu','menu')}</div>`;
  }else if(page==='settings'){
   const settings=g.settings;
   html=`<div class="panel"><div class="eyebrow">MAKE YOURSELF AT HOME</div><h2>Settings</h2><label class="setting">Sound effects <input aria-label="Sound effects volume" data-setting="sound" type="range" min="0" max="1" step="0.05" value="${settings.sound}"></label><label class="setting">Ambient music <input aria-label="Music volume" data-setting="music" type="range" min="0" max="1" step="0.05" value="${settings.music}"></label><div class="rule"></div>${[['hud','Show HUD · H'],['particles','Ambient particles'],['shake','Landing shake']].map(([k,label])=>`<label class="setting">${label}<input data-setting="${k}" type="checkbox" ${settings[k]?'checked':''}></label>`).join('')}<p>Settings and progress stay in your browser. Audio begins after your first interaction.</p>${back}</div>`;
  }else if(page==='controls'){
   html=`<div class="panel"><div class="eyebrow">THE ART OF THE ASCENT</div><h2>A leap of faith.</h2><div class="control"><span>Move / choose direction</span><span><kbd>A</kbd> <kbd>D</kbd> / <kbd>←</kbd> <kbd>→</kbd></span></div><div class="control"><span>Charge / release to jump</span><kbd>SPACE</kbd></div><div class="control"><span>Pause / resume</span><kbd>ESC</kbd></div><div class="control"><span>Restart · with confirmation</span><kbd>R</kbd></div><div class="control"><span>Hide / show HUD</span><kbd>H</kbd></div><p class="mobile-controls">On touch screens, hold ◀ or ▶ with one finger. Hold JUMP with another finger, then release JUMP to launch. Use Ⅱ to pause.</p><p class="tip">Hold Space while standing still. Release with a direction for a long jump; release with neither for a vertical jump. Your momentum is fixed in the air.</p><p>A full charge takes 0.72 seconds. You can hold it as long as you need. No checkpoints, no lost lives. If you fall, keep climbing.</p>${back}</div>`;
  }else if(page==='confirm'){
   const reset=this.confirmKind==='reset';
   html=`<div class="panel"><div class="eyebrow">A FRESH BEGINNING</div><h2>${reset?'Let this journey go?':'Back to the village?'}</h2><p>${reset?'This removes your saved journey. Your settings stay.':'This replaces your saved journey and resets your time, jumps and height.'} There is no undo.</p>${btn(reset?'Erase saved progress':'Restart journey','confirm',true)}${btn('Keep my journey','cancel')}</div>`;
  }else if(page==='victory'){
   html=`<div class="panel victory-panel"><div class="victory-symbol">✦</div><div class="eyebrow">THE LAST LIGHT IS LIT</div><h2>You carried it home.</h2><p>Every fall. Every leap. All yours.</p><div class="rule"></div>${[['COMPLETION TIME',U.time(s.stats.time)],['JUMPS',s.stats.jumps],['TOTAL FALLS',s.stats.falls],['HIGHEST POINT',Math.round(s.stats.highest)+' m']].map(([k,v])=>`<div class="run-stat"><span>${k}</span><strong>${v}</strong></div>`).join('')}<div class="rule"></div>${btn('Carry the light again','restart',true)}${btn('Return to main menu','menu')}</div>`;
  }
  this.screen.innerHTML=html;
  requestAnimationFrame(()=>{const el=this.screen.querySelector('button:not(:disabled),input');if(el&&!g.touch.enabled)el.focus({preventScroll:true});});
 }
 action(action){const g=this.game;
  if(action==='start'){if(g.saved){this.confirmKind='restart';this.confirmReturn='menu';this.show('confirm');}else g.start();}
  else if(action==='continue')g.continue();
  else if(action==='resume')g.resume();
  else if(action==='settings'||action==='controls'){this.returnTo=this.page;this.show(action);}
  else if(action==='back')this.show(this.returnTo);
  else if(action==='menu')g.menu();
  else if(action==='reset'||action==='restart'){this.confirmKind=action;this.confirmReturn=this.page;this.show('confirm');}
  else if(action==='cancel')this.show(this.confirmReturn);
  else if(action==='confirm'){
   if(this.confirmKind==='reset'){const ok=JT.Save.clear();g.saved=null;this.show('menu');if(!ok)this.notice('Storage is unavailable. Progress could not be removed.');}
   else g.start();
  }
 }
 escape(){if(this.page==='settings'||this.page==='controls')this.show(this.returnTo);else if(this.page==='confirm')this.show(this.confirmReturn);else if(this.game.session.mode==='playing')this.game.pause();else if(this.page==='paused')this.game.resume();}
 resetRegion(){clearTimeout(this.toastTimer);this.lastArea=-1;this.lastRegion=-1;$('region-toast').classList.remove('visible');$('region-toast').textContent='';}
 updateHud(){const g=this.game,s=g.session,p=s.player,a=JT.World.getArea(p.y),r=JT.World.regions[a.region];
  this.hud.hidden=s.mode!=='playing'||!g.settings.hud;
  if(a.id!==this.lastArea){$('hud-area').textContent=String(a.id+1).padStart(2,'0')+' / '+a.name.toUpperCase();this.lastArea=a.id;}
  if(r.index!==this.lastRegion){$('hud-region').textContent=r.name;if(s.mode==='playing'&&this.lastRegion>=0){$('region-toast').innerHTML=r.name+'<small>'+r.subtitle+'</small>';$('region-toast').classList.add('visible');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>$('region-toast').classList.remove('visible'),4000);}this.lastRegion=r.index;}
  $('hud-height').textContent=U.height(p.y);$('hud-best').textContent=Math.round(s.stats.highest)+' m';$('hud-time').textContent=U.time(s.stats.time);$('hud-jumps').textContent=s.stats.jumps;
  const summitHeight=U.height(JT.World.summit.y-JT.Config.playerHeight),h=U.height(p.y)/summitHeight*100;$('altitude-fill').style.height=Math.min(100,s.stats.highest/summitHeight*100)+'%';$('altitude-marker').style.bottom=Math.min(100,h)+'%';$('tutorial').hidden=s.stats.highest>24||s.stats.jumps>5;
 }
 notice(message){$('notice').textContent=message;$('notice').hidden=false;clearTimeout(this.noticeTimer);this.noticeTimer=setTimeout(()=>$('notice').hidden=true,5500);}
}
JT.UI=UI;
})();
