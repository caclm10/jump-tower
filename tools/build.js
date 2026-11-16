'use strict';
// Zero-dependency builder. Output is a single, self-contained file:// compatible HTML.
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace('<link rel="stylesheet" href="style.css">',()=>'<style>\n'+fs.readFileSync(path.join(root,'style.css'),'utf8')+'\n</style>');
html=html.replace(/<script src="([^"]+)"><\/script>/g,(_,file)=>'<script>\n'+fs.readFileSync(path.join(root,file),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>');
fs.mkdirSync(path.join(root,'dist'),{recursive:true});fs.writeFileSync(path.join(root,'dist/index.html'),html);
console.log('Built dist/index.html: '+Buffer.byteLength(html).toLocaleString()+' bytes; no runtime dependencies.');
