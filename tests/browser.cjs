'use strict';
// Optional development-only dependency. No browser automation library ships with the game.
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.QA_OUTPUT||'/tmp/jump-tower-browser-qa';fs.mkdirSync(out,{recursive:true});
const checks=[];
async function panelFits(page){assert(await page.evaluate(()=>{const p=document.querySelector('.panel');return !p||p.scrollHeight<=p.clientHeight+1;}),'menu content must fit without scrolling');}
function passed(name){checks.push(name);console.log('PASS '+name);}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:1366,height:900},offline:true});
  const page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
  for(const entry of ['index.html','dist/index.html']){
   await page.goto(pathToFileURL(path.join(root,entry)).href);
   await page.evaluate(()=>localStorage.clear());await page.reload();
   await page.waitForFunction(()=>globalThis.JT&&JT.game);
   await page.getByRole('button',{name:'Start game'}).waitFor();
   const clipped=await page.evaluate(()=>{const stage=document.getElementById('stage').getBoundingClientRect();return [...document.querySelectorAll('#screen button')].filter(b=>{const r=b.getBoundingClientRect();return r.top<stage.top||r.bottom>stage.bottom;}).map(b=>b.textContent);});
   assert.deepEqual(clipped,[],'menu actions must fit inside game canvas');
   await page.screenshot({path:path.join(out,entry.startsWith('dist')?'distribution-menu.png':'source-menu.png')});
   await page.getByRole('button',{name:'Settings'}).click();await panelFits(page);
   await page.getByRole('slider',{name:'Sound effects volume'}).fill('0.3');
   await page.getByRole('slider',{name:'Music volume'}).fill('0.1');
   await page.getByRole('checkbox',{name:'Ambient particles'}).uncheck();
   await page.keyboard.press('Escape');
   assert.equal(await page.evaluate(()=>JT.game.ui.page),'menu');
   await page.getByRole('button',{name:'Controls',exact:true}).click();await panelFits(page);
   assert(await page.getByText('Your momentum is fixed in the air.',{exact:false}).isVisible());
   await page.keyboard.press('Escape');
   await page.getByRole('button',{name:'Start game'}).click();
   await page.keyboard.down('Space');await page.keyboard.down('KeyD');await page.waitForTimeout(540);
   const charge=await page.evaluate(()=>JT.game.session.player.charge);assert(charge>0.4&&charge<=0.72);
   await page.keyboard.up('Space');await page.keyboard.up('KeyD');
   await page.waitForFunction(()=>JT.game.session.player.grounded&&JT.game.session.player.platformId===1,{},{timeout:4000});
   const jump=await page.evaluate(()=>JT.game.session.stats.jumps);assert.equal(jump,1);
   await page.keyboard.press('Escape');
   await panelFits(page);const paused=await page.evaluate(()=>JSON.stringify({p:JT.game.session.player,s:JT.game.session.stats}));
   await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>JSON.stringify({p:JT.game.session.player,s:JT.game.session.stats})),paused);
   await page.getByRole('button',{name:'Settings',exact:true}).click();await page.keyboard.press('Escape');
   assert.equal(await page.evaluate(()=>JT.game.ui.page),'paused');
   await page.getByRole('button',{name:'Resume journey'}).click();
   await page.keyboard.press('KeyH');assert(await page.locator('#hud').isHidden());await page.keyboard.press('KeyH');assert(await page.locator('#hud').isVisible());
   await page.keyboard.press('KeyR');await page.getByRole('button',{name:'Keep my journey'}).click();assert.equal(await page.evaluate(()=>JT.game.session.stats.jumps),1);
   await page.getByRole('button',{name:'Return to main menu'}).click();
   await page.reload();await page.getByRole('button',{name:/^Continue/}).click();
   assert.equal(await page.evaluate(()=>JT.game.session.player.platformId),1);assert.equal(await page.evaluate(()=>JT.game.session.stats.jumps),1);
   assert.equal(await page.evaluate(()=>JT.game.settings.sound),0.3);assert.equal(await page.evaluate(()=>JT.game.settings.particles),false);
   await page.keyboard.press('KeyR');await page.getByRole('button',{name:'Restart journey',exact:true}).click();
   assert.equal(await page.evaluate(()=>JT.game.session.stats.jumps),0);assert.equal(await page.evaluate(()=>JT.game.session.player.platformId),0);
   passed(entry+': offline file launch, complete menus, keyboard charge/landing, pause/resume, HUD, restart, save/continue, persistent settings');
  }
  // Complete deterministic browser replay of every route edge: actual tick calls, no teleportation.
  const route=JSON.parse(fs.readFileSync(path.join(root,'tests/route.json'),'utf8')).route;
  const replay=await page.evaluate(route=>{
   const s=new JT.Session();s.restart();let steps=0;
   for(const plan of route){
    for(const dir of plan.walk){s.tick({dir});steps++;}
    for(let i=0;i<plan.ticks;i++){s.tick({dir:plan.dir,press:i===0});steps++;}
    s.tick({dir:plan.dir,release:true});steps++;
    for(let i=1;i<plan.airFrames;i++){s.tick({dir:0});steps++;}
    if(s.player.platformId!==plan.to)throw Error('diverged at '+plan.to);
   }
   const g=JT.game;g.session=s;g.clearInput();g.camera.snap(s.player);g.renderer.oldX=s.player.x;g.renderer.oldY=s.player.y;g.ui.show('victory');g.save();g.ui.updateHud();
   return {mode:s.mode,jumps:s.stats.jumps,highest:s.stats.highest,steps};
  },route);
  assert.equal(replay.mode,'victory');assert.equal(replay.jumps,300);assert(replay.highest>=2000&&replay.highest<=2012);
  await page.getByText('You carried it home.').waitFor();const victoryFits=await page.evaluate(()=>{const panel=document.querySelector('.victory-panel');return panel.scrollHeight<=panel.clientHeight+1;});assert(victoryFits,'Victory stats and actions must fit without scrolling');await page.screenshot({path:path.join(out,'victory.png')});
  await page.getByRole('button',{name:'Return to main menu'}).click();await page.reload();await page.getByRole('button',{name:/^Continue/}).click();assert(await page.getByText('You carried it home.').isVisible());
  passed('all 300 jumps replay to a rendered victory screen and completion persists');
  for(const viewport of [{width:1920,height:1080},{width:1366,height:768},{width:1280,height:720},{width:1024,height:650}]){
   await page.setViewportSize(viewport);await page.getByRole('button',{name:'Return to main menu'}).click();
   const fits=await page.evaluate(()=>{const r=document.getElementById('stage').getBoundingClientRect();const c=document.getElementById('game').getBoundingClientRect();return !document.querySelector('header,footer')&&r.x===0&&r.y===0&&r.width===innerWidth&&r.height===innerHeight&&c.width===innerWidth&&c.height===innerHeight&&[...document.querySelectorAll('#screen button')].every(b=>b.getBoundingClientRect().bottom<=r.bottom);});assert(fits,JSON.stringify(viewport));
   await page.getByRole('button',{name:/^Continue/}).click();
  }
  passed('game fills the viewport without headers, footers or outer margins at four desktop resolutions');
  await page.getByRole('button',{name:'Return to main menu'}).click();await page.getByRole('button',{name:'Reset progress'}).click();await page.getByRole('button',{name:'Keep my journey'}).click();assert(await page.getByRole('button',{name:/^Continue/}).isEnabled());await page.getByRole('button',{name:'Reset progress'}).click();await page.getByRole('button',{name:'Erase saved progress'}).click();assert(await page.getByRole('button',{name:'Continue'}).isDisabled());passed('reset progress requires confirmation and removes the saved run');
  await page.evaluate(()=>{JT.game.menu();localStorage.setItem(JT.Config.saveKey,'{broken');});await page.reload();assert(await page.getByRole('button',{name:'Continue'}).isDisabled());passed('corrupted browser save loads safely');
  // Review region rendering without claiming these visual fixtures are a playthrough.
  await page.setViewportSize({width:1366,height:900});
  for(const [region,id] of [['village',0],['frozen',25],['astral',40]]){
   await page.evaluate(id=>{const g=JT.game;g.start();const q=JT.World.platforms[1+id*6];Object.assign(g.session.player,JT.Physics.player(q.x+4,q.y-20));g.session.player.platformId=q.id;g.session.stats.highest=JT.Util.height(g.session.player.y);g.session.stats.jumps=id*6;g.ui.lastRegion=-1;g.camera.snap(g.session.player);g.renderer.oldX=g.session.player.x;g.renderer.oldY=g.session.player.y;g.ui.updateHud();g.pause();g.ui.screen.innerHTML='';g.ui.screen.classList.remove('shaded');g.ui.hud.hidden=false;},id);
   await page.waitForTimeout(40);await page.screenshot({path:path.join(out,region+'.png')});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);passed('no uncaught JavaScript errors or network requests in offline source/distribution tests');
  const blocked=await browser.newContext({offline:true});await blocked.addInitScript(()=>{Object.defineProperty(globalThis,'localStorage',{get(){throw Error('blocked');}});globalThis.AudioContext=undefined;globalThis.webkitAudioContext=undefined;});
  const fallback=await blocked.newPage();fallback.on('pageerror',e=>errors.push(e.message));await fallback.goto(pathToFileURL(path.join(root,'dist/index.html')).href);await fallback.getByRole('button',{name:'Start game'}).click();assert.equal(await fallback.evaluate(()=>JT.game.session.mode),'playing');await fallback.keyboard.press('Escape');await fallback.getByRole('button',{name:'Resume journey'}).click();assert.deepEqual(errors,[]);passed('game remains playable when storage and Web Audio are unavailable');
  const report={browser:await browser.version(),offline:true,checks,routeReplay:replay,errors,externalRequests:external};fs.writeFileSync(path.join(root,'tests/browser-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Screenshots: '+out);await blocked.close();await context.close();
 }finally{await browser.close();console.log('Browser shutdown complete.');}
})().catch(e=>{console.error(e);process.exitCode=1;});
