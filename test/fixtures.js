'use strict';
const sharp=require('sharp'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {command}=require('../engine/media');
async function pixels(width=200,height=160,channels=3){
  const data=Buffer.alloc(width*height*channels);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)for(let c=0;c<channels;c++)data[(y*width+x)*channels+c]=c===3?Math.round(x/width*255):(x*7+y*11+c*41)%256;
  return sharp(data,{raw:{width,height,channels}});
}
async function png(){return (await pixels()).png().toBuffer();}
async function clip(kind='video',filter='testsrc=size=160x120:rate=8',duration=1){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'tg-fixture-'));
  try{
    const output=path.join(dir,kind==='video'?'sample.mp4':'sample.wav');
    const args=['-v','error','-f','lavfi','-i',filter,'-t',String(duration),'-threads','1'];
    if(kind==='video')args.push('-c:v','libx264','-pix_fmt','yuv420p');else args.push('-c:a','pcm_s16le');
    await command(require('ffmpeg-static'),[...args,'-y',output]);
    return await fs.readFile(output);
  }finally{await fs.rm(dir,{recursive:true,force:true});}
}
function pdf(sentences=['A document claim.']){
  const objs=['<< /Type /Catalog /Pages 2 0 R >>',''];
  const kids=[];objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  sentences.forEach(sentence=>{
    const page=objs.length+1,content=page+1;kids.push(page+' 0 R');
    objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents '+content+' 0 R >>');
    const stream='BT /F1 16 Tf 50 700 Td ('+sentence.replace(/[()\\]/g,'\\$&')+') Tj ET';
    objs.push('<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'\nendstream');
  });
  objs[1]='<< /Type /Pages /Kids ['+kids.join(' ')+'] /Count '+kids.length+' >>';
  let out='%PDF-1.4\n';const offsets=[0];
  objs.forEach((o,i)=>{offsets.push(Buffer.byteLength(out));out+=(i+1)+' 0 obj\n'+o+'\nendobj\n';});
  const xref=Buffer.byteLength(out);out+='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n';
  offsets.slice(1).forEach(n=>out+=String(n).padStart(10,'0')+' 00000 n \n');
  out+='trailer\n<< /Size '+(objs.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';return Buffer.from(out);
}
module.exports={pixels,png,clip,pdf};
