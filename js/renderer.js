'use strict';
(function(){
const C=JT.Config,W=JT.World,U=JT.Util;
const hash=(n)=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
class Renderer{
 constructor(canvas,settings){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.settings=settings;this.ctx.imageSmoothingEnabled=false;this.time=0;this.particles=[];this.shake=0;this.cache=W.regions.map(r=>this.makeBackdrop(r));this.oldX=114;this.interpolated={};this.oldY=C.floor-20;}
 makeBackdrop(r){
  const c=document.createElement('canvas');c.width=480;c.height=360;const g=c.getContext('2d');
  g.fillStyle=r.sky;g.fillRect(0,0,480,360);
  // Far architecture is decorative: collision always follows the bright platform tops.
  g.fillStyle=r.far;
  if(r.index<2){for(let i=0;i<9;i++){const x=i*62-15,h=100+hash(i+8)*190;g.fillRect(x,360-h,12,h);for(let j=0;j<4;j++)g.fillRect(x-25+j*8,360-h-j*14,54-j*9,28);}}
  else if(r.index===2){for(let i=0;i<12;i++){const x=i*46;g.beginPath();g.moveTo(x-25,0);g.lineTo(x+10,60+hash(i)*150);g.lineTo(x+35,0);g.fill();g.fillRect(x+9,290+hash(i+1)*35,26,70);}}
  else if([3,6,9].includes(r.index)){for(let i=0;i<7;i++){const x=i*85-30,h=100+hash(i+13)*170;g.fillRect(x,360-h,50,h);g.fillRect(x-4,360-h,58,6);g.fillRect(x+8,340-h,34,24);g.fillStyle=r.sky;for(let j=0;j<3;j++)g.fillRect(x+10,375-h+j*30,8,17);g.fillStyle=r.far;}}
  else if(r.index===4||r.index===5){for(let i=0;i<8;i++){const x=i*85-50;g.beginPath();g.moveTo(x-60,360);g.lineTo(x+35,90+hash(i)*120);g.lineTo(x+130,360);g.fill();if(r.index===5){g.fillStyle=r.stone;g.beginPath();g.moveTo(x+5,170+hash(i)*60);g.lineTo(x+35,90+hash(i)*120);g.lineTo(x+62,166+hash(i)*60);g.fill();g.fillStyle=r.far;}}}
  else{for(let i=0;i<15;i++){const x=hash(i+2)*480,y=hash(i+31)*360,w=30+hash(i+5)*90;g.fillRect(x,y,w,5);g.fillRect(x+10,y-6,w-26,8);g.fillRect(x+22,y-10,w-50,6);}}
  // Sparse texture is cached, rather than regenerated in the frame loop.
  g.globalAlpha=0.22;g.fillStyle=r.top;for(let i=0;i<65;i++)g.fillRect(Math.floor(hash(i+80)*480),Math.floor(hash(i+6)*360),1,1);g.globalAlpha=1;
  // Match both edges of the cached vertical repeat, keeping parallax seamless.
  g.fillStyle=r.sky;
  for(let y=0;y<32;y++){g.globalAlpha=(32-y)/32;g.fillRect(0,y,480,1);g.globalAlpha=(y+1)/32;g.fillRect(0,328+y,480,1);}g.globalAlpha=1;
  return c;
 }
 rect(x,y,w,h,color){this.ctx.fillStyle=color;this.ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
 text(s,x,y,color='#e9dec5',size=8,align='left'){const g=this.ctx;g.fillStyle=color;g.font=`${size}px monospace`;g.textAlign=align;g.fillText(s,Math.round(x),Math.round(y));g.textAlign='left';}
 backdrop(cam,r){
  const g=this.ctx,h=JT.View.height;g.fillStyle=r.sky;g.fillRect(0,0,480,h);
  const off=-Math.floor(cam*0.13)%360;for(let y=off;y<h;y+=360)g.drawImage(this.cache[r.index],0,y);
  // Broad columns at the edges frame the playable shaft.
  g.fillStyle=r.far;g.globalAlpha=0.55;g.fillRect(0,0,9,h);g.fillRect(471,0,9,h);g.globalAlpha=1;
  if(this.settings.particles)for(let i=0;i<18;i++){const x=(hash(i+62)*480+Math.sin(this.time*0.22+i)*8),y=((hash(i+70)*430-cam*0.22+this.time*(r.index===5?6:-2))%(h+30)+(h+30))%(h+30);
   g.globalAlpha=0.25+0.2*Math.sin(this.time+i);this.rect(x,y,r.index===5?2:1,1,r.accent);}g.globalAlpha=1;
 }
 platform(p,cam){
  const y=Math.round(p.y-cam),r=W.regions[Math.floor(p.area/5)],g=this.ctx;
  this.rect(p.x+2,y+3,p.w,p.h+3,'#111b29');this.rect(p.x,y,p.w,p.h,p.id===0?'#405956':r.stone);this.rect(p.x,y,p.w,3,p.shortcut?r.accent:r.top);
  this.rect(p.x,y+3,2,p.h-3,r.far);this.rect(p.x+3,y+p.h-3,p.w-3,3,r.far);
  g.fillStyle=r.far;
  for(let x=Math.ceil(p.x/12)*12;x<p.x+p.w-3;x+=12){g.fillRect(x,y+5,1,p.h-8);if(hash(x+p.id)>0.65)g.fillRect(x+2,y+7,3,1);}
  if(p.shortcut){this.rect(p.x+p.w/2-1,y-7,3,3,r.accent);}
  if(r.index<2&&!p.shortcut){this.rect(p.x+2,y-2,p.w-4,2,'#709f78');for(let i=0;i<p.w/9;i++)if(hash(i+p.id)>0.5)this.rect(p.x+i*9,y-4,2,3,'#8bad7c');}
  if(r.index===5){this.rect(p.x-1,y-2,p.w+2,2,'#edf1e6');for(let i=0;i<p.w/16;i++)this.rect(p.x+4+i*16,y+p.h,2,3+hash(i+p.id)*7,'#b5d6dc');}
  if(r.index===8){this.rect(p.x+3,y-1,p.w-6,1,'#e1b7dc');if(!p.rest){this.rect(p.x+p.w/2,y+p.h,2,5,'#8b7ba6');this.rect(p.x+p.w/2-2,y+p.h+5,6,2,'#b3a1ce');}}
  if(p.rest&&p.id>0){const x=p.x+p.w-10;this.rect(x,y-14,2,14,r.far);this.rect(x-2,y-16,6,6,r.accent);g.globalAlpha=0.11;this.rect(x-6,y-20,14,14,r.accent);g.globalAlpha=1;}
 }
 landmark(a,cam){
  const r=W.regions[a.region],y=a.bottom-160-cam,g=this.ctx;
  if(y<-160||y>JT.View.height+110)return;
  const left=a.id%2===0, x=left?18:418;
  g.globalAlpha=0.65;
  // Distinct area landmarks: door, bell, crystal, floating rune, clock, wind vane.
  const kind=a.id%5;
  if(kind===0){this.rect(x,y,42,65,r.far);this.rect(x+5,y+5,32,60,r.stone);this.rect(x+10,y+14,22,51,r.sky);this.rect(x+10,y+9,22,5,r.sky);this.rect(x+20,y+20,2,45,r.far);this.rect(x+2,y+66,38,3,r.stone);}
  if(kind===1){this.rect(x+20,y-4,2,35,r.stone);this.rect(x+14,y+27,14,14,r.stone);this.rect(x+10,y+41,22,3,r.top);this.rect(x+19,y+45,4,4,r.accent);this.rect(x+8,y-6,26,3,r.stone);}
  if(kind===2){g.fillStyle=r.stone;g.beginPath();g.moveTo(x+20,y);g.lineTo(x+35,y+30);g.lineTo(x+20,y+55);g.lineTo(x+8,y+28);g.fill();this.rect(x+19,y+5,2,43,r.top);this.rect(x+15,y+23,5,2,r.top);}
  if(kind===3){g.strokeStyle=r.stone;g.lineWidth=2;g.strokeRect(x+8,y+15,26,26);g.strokeRect(x+15,y+8,12,40);this.rect(x+19,y+26,5,5,r.accent);}
  if(kind===4){this.rect(x+19,y,2,65,r.stone);this.rect(x+5,y+5,30,2,r.top);this.rect(x+30,y,2,11,r.top);this.rect(x+19,y+15,15,8,r.accent);this.rect(x+11,y+65,18,3,r.stone);}
  g.globalAlpha=1;
  if(a.id%5===0){const by=a.bottom-30-cam;g.globalAlpha=0.72;this.text(String(a.id+1).padStart(2,'0')+' / '+r.name.toUpperCase(),20,by,r.top,7);g.globalAlpha=1;}
 }
 sprite(p,cam,victory=false){
  let x=Math.round(p.x),y=Math.round(p.y-cam),g=this.ctx;
  const walk=p.state==='walk'?Math.sin(p.walkTime*0.15):0;
  let squat=p.state==='charge'?Math.round(p.charge/C.maxCharge*5):p.state==='land'?3:0;
  const facing=p.facing;
  g.save();g.translate(x+6,y+20);if(facing<0)g.scale(-1,1);
  const rise=p.state==='rise',fall=p.state==='fall';
  // Original tiny lantern courier: dark coat, warm hood, bright scarf and satchel.
  const bob=p.state==='idle'?Math.floor(Math.sin(this.time*3)*0.6):0;
  this.rect(-4,-8+squat+Math.min(0,walk),3,8-squat,'#182637');this.rect(2,-8+squat+Math.max(0,walk),3,8-squat,'#182637');
  this.rect(-5,-2+Math.min(0,walk),4,2,'#d7b58a');this.rect(2,-2+Math.max(0,walk),5,2,'#d7b58a');
  this.rect(-5,-13+squat+bob,10,9-squat,'#41747e');this.rect(-5,-7+squat,10,2,'#274956');
  this.rect(-6,-19+squat+bob,12,9,'#e7c18c');this.rect(-5,-20+squat+bob,10,2,'#f5dca4');this.rect(-6,-17+squat+bob,3,8,'#c48d62');
  this.rect(-2,-16+squat+bob,7,6,'#f1cf9a');this.rect(3,-15+squat+bob,1,2,'#1c2936');
  this.rect(-6,-11+squat+bob,12,3,'#e28c70');this.rect(-10-(rise?3:0),-10+squat+bob+(fall?-3:0),6,3,'#be6b62');this.rect(-12,-8+squat+bob+(fall?-3:0),3,2,'#e28c70');
  const arm=victory?-17:rise?-12:fall?-16:-7+squat;
  this.rect(5,arm,3,5,'#e9c08a');this.rect(-7,victory?-16:-9+squat,2,5,'#d4ac7d');this.rect(-7,-7+squat,4,5,'#b47d58');
  // A warm lantern is always carried toward the summit.
  this.rect(7,arm+4,4,5,'#614b4c');this.rect(8,arm+5,2,3,'#ffe3a3');
  g.restore();
  if(p.charging){const amount=p.charge/C.maxCharge,by=y+25;
   this.rect(x-10,by,32,5,'#172431');this.rect(x-9,by+1,Math.round(30*amount),3,amount>=1?'#ffe5a9':'#e7b77d');
   for(let i=1;i<4;i++)this.rect(x-10+i*8,by+1,1,3,'#172431');
   if(amount>=1)this.rect(x+3,y-9+Math.sin(this.time*14),5,2,'#ffe5a9');
  }
 }
 burst(x,y,color,count=7){if(!this.settings.particles)return;for(let i=0;i<count;i++)this.particles.push({x,y,vx:(hash(i+this.time)*2-1)*35,vy:-15-hash(i+this.time+3)*30,life:0.4+hash(i)*0.4,color});if(this.particles.length>90)this.particles.splice(0,this.particles.length-90);}
 render(session,camera,alpha,dt){
  this.time+=dt;const g=this.ctx,p=session.player,cam=Math.round(camera.previous+(camera.y-camera.previous)*alpha),r=W.getRegion(p.y);
  this.backdrop(cam,r);
  if(cam>C.floor-500){
   const ground=C.floor-cam;
   // A small, abandoned village: roof tiles, warm windows, and the old well.
   this.rect(333,ground-51,74,51,'#344c4c');this.rect(325,ground-55,90,6,'#687b6b');
   this.rect(331,ground-61,78,6,'#596e64');this.rect(339,ground-67,62,6,'#4c635e');
   this.rect(360,ground-34,15,34,'#1b3037');this.rect(345,ground-39,9,12,'#c6a578');
   this.rect(384,ground-39,9,12,'#c6a578');this.rect(349,ground-39,1,12,'#6c6657');
   this.rect(388,ground-39,1,12,'#6c6657');this.rect(381,ground-78,8,18,'#536962');
   this.rect(28,ground-19,30,19,'#526c61');this.rect(25,ground-22,36,4,'#8fa783');
   this.rect(30,ground-45,2,23,'#6f806a');this.rect(54,ground-45,2,23,'#6f806a');
   this.rect(26,ground-47,34,3,'#91a482');this.rect(42,ground-44,1,20,'#a5aa87');
  }
  g.save();if(this.settings.shake&&this.shake>0){g.translate(Math.round(Math.sin(this.time*83)*this.shake),Math.round(Math.cos(this.time*77)*this.shake));this.shake=Math.max(0,this.shake-dt*16);}
  const first=U.clamp(Math.floor((C.floor-cam-JT.View.height)/400)-1,0,W.areas.length-1),last=U.clamp(Math.floor((C.floor-cam)/400)+1,0,W.areas.length-1);
  for(let a=first;a<=last;a++)this.landmark(W.areas[a],cam);
  W.eachNear(cam-35,cam+JT.View.height+30,q=>{if(q.y+q.h>=cam-35&&q.y<=cam+JT.View.height+30)this.platform(q,cam);});
  // Beacon at the single, reachable destination.
  const sy=W.summit.y-cam;
  if(sy>-60&&sy<380){this.rect(236,sy-48,8,48,'#535369');this.rect(229,sy-20,22,4,'#adb0bf');this.rect(232,sy-52,16,8,'#eee0bf');const f=Math.sin(this.time*9)*2;this.rect(235,sy-62+f,10,12,'#efb578');this.rect(238,sy-67+f,4,13,'#fff0b7');g.globalAlpha=0.08+Math.sin(this.time*2)*0.02;this.rect(208,sy-80,64,75,'#ffe1a4');g.globalAlpha=1;}
  const ip=this.interpolated;Object.assign(ip,p);ip.x=this.oldX+(p.x-this.oldX)*alpha;ip.y=this.oldY+(p.y-this.oldY)*alpha;this.sprite(ip,cam,session.completed);
  for(let i=this.particles.length-1;i>=0;i--){const q=this.particles[i];q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=70*dt;g.globalAlpha=Math.min(1,q.life*3);this.rect(q.x,q.y-cam,2,2,q.color);if(q.life<=0)this.particles.splice(i,1);}g.globalAlpha=1;
  g.restore();
  // A fine vignette frames the scene without hiding platform edges.
  g.fillStyle='#101a29';g.globalAlpha=0.18;g.fillRect(0,0,480,6);g.fillRect(0,JT.View.height-6,480,6);g.globalAlpha=1;
 }
 title(dt){
  this.time+=dt;const g=this.ctx;g.save();g.scale(1,JT.View.height/300);
  this.rect(0,0,480,300,'#152630');
  this.rect(0,200,480,100,'#20343a');
  // Pixel moon and original impossible-looking (decorative) tower silhouette.
  this.rect(344,34,50,50,'#a2b4ae');this.rect(337,42,64,34,'#a2b4ae');this.rect(351,28,36,62,'#a2b4ae');this.rect(352,37,25,5,'#bac6b5');this.rect(382,51,9,16,'#899f9f');
  this.rect(323,65,42,211,'#31464b');this.rect(313,99,62,8,'#526568');this.rect(315,151,58,7,'#526568');this.rect(316,207,56,7,'#526568');
  this.rect(332,40,24,28,'#3d5558');this.rect(327,60,34,6,'#6b7e77');this.rect(338,26,12,17,'#58716c');
  this.rect(341,17,5,11,'#dfb97d');this.rect(339,21,9,4,'#f1dba4');
  for(let i=0;i<5;i++){this.rect(331,80+i*36,7,14,'#192c36');this.rect(350,80+i*36,6,14,'#192c36');if(i===2)this.rect(350,80+i*36,6,14,'#d4af78');}
  this.rect(335,251,19,27,'#14262f');this.rect(338,247,13,6,'#14262f');
  this.rect(287,167,22,110,'#263e44');this.rect(282,164,32,5,'#566b63');this.rect(381,195,22,88,'#293f45');this.rect(378,190,28,7,'#64776b');
  for(let i=0;i<12;i++){const x=250+i*21,y=270+hash(i)*13;this.rect(x,y,24,31,'#243d40');this.rect(x+2,y-3,19,4,'#7a987c');}
  // Floating climb fragments lead the eye upward.
  [[290,233,29],[397,163,28],[294,127,26],[372,87,24]].forEach(([x,y,w],i)=>{this.rect(x,y,w,7,'#586c64');this.rect(x,y,w,2,'#b0b59a');this.rect(x+3,y+7,3,9,'#31484a');});
  if(this.settings.particles)for(let i=0;i<30;i++){const x=240+hash(i+9)*240,y=(hash(i+50)*300-this.time*2+300)%300;g.globalAlpha=0.25+0.25*Math.sin(i+this.time);this.rect(x,y,1,1,'#efd9a8');}g.globalAlpha=1;
  const faux={x:301,y:247,w:12,h:20,state:'idle',walkTime:0,charge:0,facing:1};this.sprite(faux,0);
  const shade=g.createLinearGradient(0,0,360,0);shade.addColorStop(0,'#12222cf5');shade.addColorStop(0.6,'#12222cdd');shade.addColorStop(1,'#12222c00');g.fillStyle=shade;g.fillRect(0,0,480,300);g.restore();
 }
}
JT.Renderer=Renderer;
})();
