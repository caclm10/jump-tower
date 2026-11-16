'use strict';
(function(){
const C=JT.Config;
const regions=[
 ['Mosslight Village','Where every journey begins.','#16262b','#294147','#79a781','#b8d59a','#e8c58c'],
 ['The Root Archives','Old stones remember the sky.','#192b2d','#294943','#71947a','#b0bc83','#e4ce97'],
 ['Lantern Hollows','Follow the quiet lights.','#1d2533','#33364b','#797490','#b6a6ae','#e9bb78'],
 ['The Hollow Keep','A kingdom held together by ivy.','#292838','#454052','#8e849a','#bfb4b3','#e6b394'],
 ['Copperwind Bluffs','Trust the arc. The wind is only a song.','#343044','#66505a','#b78c85','#e2b39a','#f0cd96'],
 ['The Glass Orchard','Even winter leaves a way through.','#202f46','#3c5369','#8cbbc4','#d4e6db','#efcba0'],
 ['Moonbell Spires','Listen between the bells.','#242b4c','#3a4267','#929cc3','#c7c8e0','#e8d09f'],
 ['The Cloudsea','Nothing below. Everything ahead.','#35465d','#687d90','#b5c9cb','#e3e8d7','#f6dca3'],
 ['Astral Gardens','The stars have roots here.','#26253f','#494267','#a298c4','#d6bfdd','#f4cb9f'],
 ['The Last Light','A small flame, carried a long way.','#252b40','#50526b','#a6abc2','#e0d7cd','#ffe1a4']
].map((r,i)=>({name:r[0],subtitle:r[1],sky:r[2],far:r[3],stone:r[4],top:r[5],accent:r[6],index:i}));
// Each row is a hand-authored area: six successive platform centers, bottom to top.
// Rise profiles total exactly 400 px, so transitions stay explicit and inspectable.
const layouts=[
 [225,125,215,325,405,300],
 [200,95,200,310,410,300],
 [400,290,180,75,180,285],
 [390,280,390,280,170,70],
 [175,285,395,285,175,285],
 [390,280,170,65,170,275],
 [380,270,160,270,380,275],
 [170,65,175,285,395,285],
 [175,285,395,285,175,70],
 [175,285,395,285,175,285],
 [390,275,165,55,165,275],
 [385,275,165,275,385,275],
 [165,55,170,280,390,280],
 [170,280,390,280,170,60],
 [170,280,390,280,170,280],
 [390,280,170,60,175,285],
 [395,285,175,285,395,285],
 [175,65,180,295,410,295],
 [180,295,410,295,180,65],
 [180,290,400,290,180,290],
 [410,290,170,50,170,290],
 [410,290,170,290,410,290],
 [170,50,165,285,405,285],
 [165,285,405,285,165,45],
 [165,285,405,285,165,285],
 [390,285,180,75,180,285],
 [390,285,180,285,390,285],
 [180,75,185,295,405,295],
 [185,295,405,295,185,75],
 [185,290,395,290,185,290],
 [400,290,180,70,180,290],
 [400,290,180,290,400,290],
 [180,70,190,300,410,300],
 [190,300,410,300,190,80],
 [190,300,410,300,190,300],
 [420,300,180,60,180,300],
 [420,300,180,300,420,300],
 [180,60,175,295,415,295],
 [175,295,415,295,175,55],
 [175,295,415,295,175,295],
 [405,295,185,75,185,295],
 [405,295,185,295,405,295],
 [185,75,190,305,420,305],
 [190,305,420,305,190,75],
 [190,300,410,300,190,300],
 [410,300,190,80,190,300],
 [410,300,190,300,410,300],
 [190,80,185,295,405,295],
 [185,295,405,295,185,75],
 [180,290,400,290,400,240]
];
const names=[
 'The Well','Rooftop Letters','The Old Mill','Bramble Gate','Village Lantern',
 'Rootbound Steps','The Reading Tree','Broken Aqueduct','The Green Window','Archive Crown',
 'Firefly Mouth','Echo Gallery','The Hanging Lake','Amber Teeth','Last Lantern',
 'Outer Bailey','The Silent Kitchen','Herald’s Walk','The Bell Room','Kingless Crown',
 'Copper Crossing','Weatherworn Teeth','The Leaning Post','Kestrel’s Perch','The Wind Harp',
 'First Frost','Crystal Boughs','Winter Windows','The Mirror Well','Orchard Moon',
 'Blue Chimes','The Watchmaker','Silver Pendulum','Night Balcony','Moonbell Crown',
 'Cloud Harbor','The Drifting Dock','Sailor’s Dream','Whitecap Steps','The High Tide',
 'Starfall Gate','Violet Trellis','The Comet’s Tail','Constellation Walk','Garden of Orbits',
 'Ember Stair','The Quiet Hour','Dawn’s Threshold','One More Breath','The Beacon'
];
// Small silhouettes, resting ledges, and alternating rise rhythms create deliberate routes.
const rises=[
 [62,70,66,72,62,68],[68,62,74,64,70,62],[72,64,60,70,68,66],
 [60,74,66,62,72,66],[70,60,72,64,66,68],[52,80,56,78,62,72],
 [78,52,82,54,74,60],[58,76,60,80,54,72],[82,54,72,58,80,54],[64,68,56,82,60,70]
];
const rhythm=[0,1,2,3,4, 2,5,1,7,0, 5,6,7,3,8, 3,9,6,8,2, 6,8,5,9,7, 7,5,9,6,8, 8,6,3,9,5, 9,7,6,5,8, 5,8,7,9,6, 6,9,8,7,0];
const platforms=[{id:0,x:0,y:C.floor,w:C.width,h:60,area:0,rest:true,route:true}];
const areas=[]; let altitude=0;
for(let a=0;a<C.areaCount;a++){
 const region=Math.floor(a/5), row=layouts[a], steps=rises[rhythm[a]];
 areas.push({id:a,name:names[a],region,bottom:C.floor-a*400,top:C.floor-(a+1)*400});
 for(let k=0;k<6;k++){
  altitude+=steps[k];
  const rest=k===5, w=rest?Math.max(60,96-region*3):Math.max(27,74-region*5-(k%3)*5);
  platforms.push({id:platforms.length,x:row[k]-w/2,y:C.floor-altitude,w,h:12+(k%2)*4,area:a,rest,route:true});
 }
}
// Summit is a broad landing, with a beacon accessible from the final route platform.
const summit=platforms[platforms.length-1]; summit.w=116; summit.x=182; summit.h=20; summit.rest=true;
// Optional gold-rimmed routes trade narrow landings for two fewer jumps.
// They are authored separately and never replace the main route.
const route=platforms.slice(), shortcuts=[];
for(const [area,x1,x2] of [[6,140,30],[21,155,45],[36,180,60]]){
 const ids=[];
 for(const [i,x] of [x1,x2,x1].entries()){
  const p={id:platforms.length,x:x-9,y:C.floor-area*400-(i+1)*100,w:18,h:8,area,rest:false,route:false,shortcut:true};
  platforms.push(p);ids.push(p.id);
 }
 shortcuts.push({from:area*6,via:ids,to:(area+1)*6});
}
const buckets=new Map(), bucketSize=160;
for(const p of platforms){const b=Math.floor(p.y/bucketSize); if(!buckets.has(b))buckets.set(b,[]);buckets.get(b).push(p);}
const world={width:C.width,height:C.worldHeight,platforms,route,shortcuts,areas,regions,summit,bucketSize,
 eachNear(y0,y1,fn){for(let b=Math.floor(y0/bucketSize)-1;b<=Math.floor(y1/bucketSize)+1;b++){const list=buckets.get(b);if(list)for(let i=0;i<list.length;i++)fn(list[i]);}},
 getArea(y){return areas[JT.Util.clamp(Math.floor((C.floor-y-1)/400),0,areas.length-1)];},
 getRegion(y){return regions[this.getArea(y).region];}
};
JT.World=world;
})();
