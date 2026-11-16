'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.QA_OUTPUT||'/tmp/jump-tower-mobile-qa';fs.mkdirSync(out,{recursive:true});
const checks=[];function pass(s){checks.push(s);console.log('PASS '+s);}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true,offline:true});
  const page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
  const client=await context.newCDPSession(page);let contacts=[];
  const center=async action=>{const b=await page.locator('[data-touch="'+action+'"]').boundingBox();assert(b);return {x:b.x+b.width/2,y:b.y+b.height/2};};
  async function down(id,action){contacts.push({id,...await center(action),radiusX:5,radiusY:5,force:1});await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:contacts});}
  async function up(id){const point=contacts.find(p=>p.id===id);assert(point);contacts=contacts.filter(p=>p.id!==id);await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[point]});}
  async function cancel(){contacts=[];await client.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});}
  for(const entry of ['index.html','dist/index.html']){
   await page.goto(pathToFileURL(path.join(root,entry)).href);await page.evaluate(()=>localStorage.clear());await page.reload();
   assert(await page.locator('body').evaluate(e=>e.classList.contains('touch-device')));
   await page.getByRole('button',{name:'Start game'}).tap();
   assert(await page.locator('#touch-controls').isVisible());
   const sizes=await page.locator('.touch-button').evaluateAll(buttons=>buttons.map(b=>{const r=b.getBoundingClientRect();return [r.width,r.height];}));assert(sizes.every(([w,h])=>w>=44&&h>=44));
   await down(1,'jump');await down(2,'right');await page.waitForFunction(()=>JT.game.session.player.charge>=0.45);
   assert(await page.evaluate(()=>JT.game.session.player.charging));
   assert.equal(await page.evaluate(()=>JT.game.direction()),1);
   await up(1);await up(2);
   await page.waitForFunction(()=>JT.game.session.player.grounded&&JT.game.session.player.platformId===1,null,{timeout:4000});
   assert.equal(await page.evaluate(()=>JT.game.session.stats.jumps),1);
   await page.getByRole('button',{name:'Pause game',exact:true}).last().tap();
   const frozen=await page.evaluate(()=>JSON.stringify([JT.game.session.player,JT.game.session.stats]));await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>JSON.stringify([JT.game.session.player,JT.game.session.stats])),frozen);
   await page.getByRole('button',{name:'Settings',exact:true}).tap();
   await page.getByRole('checkbox',{name:'Show HUD'}).uncheck();await page.getByRole('button',{name:'Back',exact:true}).tap();await page.getByRole('button',{name:'Resume journey'}).tap();
   assert(await page.locator('#hud').isHidden());assert(await page.locator('#touch-controls').isVisible());
   await page.getByRole('button',{name:'Pause game',exact:true}).last().tap();await page.getByRole('button',{name:'Settings',exact:true}).tap();await page.getByRole('checkbox',{name:'Show HUD'}).check();await page.getByRole('button',{name:'Back',exact:true}).tap();await page.getByRole('button',{name:'Resume journey'}).tap();
   await page.evaluate(()=>JT.game.start());assert.equal(await page.locator('#region-toast').textContent(),'');
   await down(3,'jump');await down(4,'left');await page.waitForTimeout(120);await cancel();
   assert.deepEqual(await page.evaluate(()=>({charging:JT.game.session.player.charging,dir:JT.game.direction(),contacts:JT.game.touch.pointers.size,jumps:JT.game.session.stats.jumps})),{charging:false,dir:0,contacts:0,jumps:0});
   await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>JT.game.session.stats.jumps),0);
   await down(5,'jump');await down(6,'jump');await page.waitForTimeout(100);await up(5);assert(await page.evaluate(()=>JT.game.session.player.charging));await up(6);await page.waitForFunction(()=>JT.game.session.stats.jumps===1);
   pass(entry+': real multitouch jump and landing, 44px targets, pause/settings, HUD-independent controls, pointer cancellation, duplicate fingers');
  }
  await page.evaluate(()=>JT.game.start());await down(7,'jump');await down(8,'right');await page.waitForTimeout(200);
  const before=await page.evaluate(()=>({x:JT.game.session.player.x,y:JT.game.session.player.y,jumps:JT.game.session.stats.jumps}));
  contacts=[];await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>JT.game.session.mode==='paused');
  assert.deepEqual(await page.evaluate(()=>({x:JT.game.session.player.x,y:JT.game.session.player.y,jumps:JT.game.session.stats.jumps})),before);
  assert.equal(await page.evaluate(()=>JT.game.touch.pointers.size),0);assert(!await page.evaluate(()=>JT.game.session.player.charging));
  await page.getByRole('button',{name:'Resume journey'}).tap();await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>JT.game.session.stats.jumps),0);
  pass('rotation pauses safely, clears held touches and charge, and preserves world position and jump count');
  for(const viewport of [{width:390,height:844},{width:375,height:667},{width:844,height:390},{width:667,height:375},{width:932,height:320},{width:320,height:568}]){
   await page.setViewportSize(viewport);await page.waitForFunction(()=>{const r=document.getElementById('stage').getBoundingClientRect();return Math.abs(r.width-visualViewport.width)<1&&Math.abs(r.height-visualViewport.height)<1;});await page.evaluate(()=>JT.game.start());
   const fit=await page.locator('#touch-controls button').evaluateAll(buttons=>buttons.every(b=>{const r=b.getBoundingClientRect();return r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;}));assert(fit,JSON.stringify(viewport));
   const camera=await page.evaluate(()=>{
    const p=JT.game.session.player,c=JT.game.camera;p.x=1;p.y=6000;p.grounded=false;p.apex=p.y;p.launchY=p.y;JT.Physics.launch(p,JT.Config.maxCharge,0);c.snap(p);
    let frames=0,min=Infinity,max=-Infinity;
    while(!p.grounded&&frames<4000){JT.Physics.step(p,{dir:0},JT.Config.step);c.tick(p,JT.Config.step);min=Math.min(min,p.y-c.y);max=Math.max(max,p.y+p.h-c.y);frames++;if(p.y-c.y<0||p.y+p.h-c.y>c.visibleHeight())return {ok:false,frames,min,max,visible:c.visibleHeight()};}
    return {ok:p.grounded,frames,min,max,visible:c.visibleHeight()};
   });assert(camera.ok,JSON.stringify({viewport,camera}));
   await page.evaluate(()=>{const g=JT.game;g.start();g.ui.updateHud();});await page.screenshot({path:path.join(out,'play-'+viewport.width+'x'+viewport.height+'.png')});await page.evaluate(()=>JT.game.menu());const menuFits=await page.locator('#screen button').evaluateAll(buttons=>buttons.every(b=>{const r=b.getBoundingClientRect();return r.top>=0&&r.bottom<=visualViewport.height+1;}));assert(menuFits,'menu clipped at '+JSON.stringify(viewport));
  }
  pass('six phone viewports keep the full shaft and touch targets visible; maximum jump and long terminal fall stay above controls');
  await page.setViewportSize({width:844,height:390});await page.evaluate(()=>{JT.game.start();JT.game.session.player.x=1;JT.game.session.player.y=6000;JT.game.session.player.grounded=false;JT.game.camera.snap(JT.game.session.player);JT.game.pause();});
  const anchor=await page.evaluate(()=>(JT.game.session.player.y-JT.game.camera.y)/JT.game.camera.visibleHeight());
  await page.setViewportSize({width:844,height:340});await page.waitForFunction(()=>Math.abs(document.getElementById('stage').getBoundingClientRect().height-visualViewport.height)<1);
  const anchorAfter=await page.evaluate(()=>(JT.game.session.player.y-JT.game.camera.y)/JT.game.camera.visibleHeight());assert(Math.abs(anchor-anchorAfter)<0.01);
  pass('browser-height changes preserve the player camera anchor without moving the player');
  await page.evaluate(()=>JT.game.menu());await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'portrait-menu.png')});
  await page.getByRole('button',{name:'Settings',exact:true}).tap();await page.getByRole('button',{name:'Back',exact:true}).tap();
  await page.getByRole('button',{name:'Controls',exact:true}).tap();assert(await page.locator('.mobile-controls').isVisible());await page.getByRole('button',{name:'Back',exact:true}).tap();
  pass('portrait menus work by touch and explain landscape and multitouch controls');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  fs.writeFileSync(path.join(root,'tests/mobile-report.json'),JSON.stringify({browser:await browser.version(),mode:'Chromium mobile emulation with CDP multitouch; not physical iOS/Android hardware',offline:true,checks,errors,externalRequests:external},null,2)+'\n');
  await context.close();console.log('Screenshots: '+out);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
