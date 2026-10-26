'use strict';
const sharp = require('sharp');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const crypto = require('node:crypto');
const { result, fault } = require('./result');
const exec = promisify(execFile);
sharp.cache({ memory:32, files:0, items:20 }); sharp.concurrency(1);
const MAX_PIXELS=24_000_000;
function imageFormat(b) {
  if (b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png';
  if (b[0]===255&&b[1]===216&&b[2]===255) return 'jpeg';
  if (/^GIF8[79]a/.test(b.toString('ascii',0,6))) return 'gif';
  if (b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP') return 'webp';
  if (b.toString('ascii',0,2)==='BM') return 'bmp';
  if (['II*\0','MM\0*'].includes(b.toString('ascii',0,4))) return 'tiff';
  return null;
}
const mime={png:'image/png',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',tiff:'image/tiff',bmp:'image/bmp'};
async function raster(bytes, crop) {
  const format=imageFormat(bytes);
  if (!format) throw fault('UNSUPPORTED_IMAGE','Unsupported image signature.');
  try {
    const pipeline=sharp(bytes,{limitInputPixels:MAX_PIXELS,failOn:'warning',animated:false});
    const meta=await pipeline.metadata();
    if (!meta.width||!meta.height||meta.width*meta.height>MAX_PIXELS) throw fault('IMAGE_TOO_LARGE','Image exceeds 24 million pixels.');
    // Decode the complete first frame, even if it is later resized. Truncation must not pass as valid.
    let normalized=await pipeline.rotate().png().toBuffer();
    const dimensions=await sharp(normalized).metadata();
    if (crop) {
      if (crop.left+crop.width>dimensions.width||crop.top+crop.height>dimensions.height) throw fault('INVALID_CROP','Crop lies outside the image.');
      normalized=await sharp(normalized).extract(crop).png().toBuffer();
    }
    return { normalized, meta, format };
  } catch(e) { if(e.code) throw e; throw fault('CORRUPTED_IMAGE','The image could not be decoded completely.'); }
}
async function image(bytes, {mime_type='',crop}={}) {
  if (!bytes) return result('image','NOT_APPLICABLE');
  const { normalized,meta,format }=await raster(bytes,crop);
  if(mime_type&&mime_type!==mime[format]&&!(format==='jpeg'&&mime_type==='image/jpg')) throw fault('MIME_MISMATCH','Image content does not match the supplied MIME type.');
  const scaled=await sharp(normalized).resize({width:512,height:512,fit:'inside',withoutEnlargement:true}).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
  const stats=await sharp(normalized).stats();
  const regions=[];
  for(let y=0;y<2;y++)for(let x=0;x<2;x++){
    const left=Math.floor(x*scaled.info.width/2),top=Math.floor(y*scaled.info.height/2);
    const width=Math.floor((x+1)*scaled.info.width/2)-left,height=Math.floor((y+1)*scaled.info.height/2)-top;
    if(width&&height){const s=await sharp(scaled.data,{raw:scaled.info}).extract({left,top,width,height}).stats();regions.push({left,top,width,height,entropy:s.entropy,channel_stdev:s.channels.map(c=>c.stdev)});}
  }
  const reencoded=await sharp(scaled.data,{raw:scaled.info}).jpeg({quality:90}).toBuffer();
  const decoded=await sharp(reencoded).raw().toBuffer();
  let residualSum=0,residualMax=0;
  for(let i=0;i<scaled.data.length;i++){const d=Math.abs(scaled.data[i]-decoded[i]);residualSum+=d;residualMax=Math.max(residualMax,d);}
  const residual={type:'jpeg_reencoding_residual',quality:90,mean_absolute_error:residualSum/scaled.data.length,max_absolute_error:residualMax,interpretation:'Compression sensitivity only; not proof of editing or synthesis.'};
  const signals=[
    {type:'file',format,width:meta.width,height:meta.height,pages:meta.pages||1,has_alpha:meta.hasAlpha||false,color_space:meta.space,exif_present:Boolean(meta.exif),icc_present:Boolean(meta.icc),sha256:crypto.createHash('sha256').update(bytes).digest('hex')},
    {type:'decoded_pixels',entropy:stats.entropy,sharpness:stats.sharpness,channels:stats.channels.map(c=>({mean:c.mean,stdev:c.stdev,min:c.min,max:c.max}))},
    {type:'regions',coordinate_space:'resized_analysis_image',width:scaled.info.width,height:scaled.info.height,regions}
  ];
  const limitations=['Pixel statistics and metadata do not determine authenticity. No validated synthesis, manipulation, face or provenance model is installed.','AI probability, manipulation probability and calibrated confidence are unavailable.'];
  if(meta.width<128||meta.height<128) limitations.push('Low resolution limits usable forensic detail.');
  if((meta.pages||1)>1) limitations.push('Only the first image frame was analyzed.');
  signals.push(residual);
  if(crop) signals.push({type:'crop_applied',...crop});
  return result('image','INSUFFICIENT_EVIDENCE',{verdict:'UNCERTAIN',image_type:'UNKNOWN',signals,limitations,model:'sharp/libvips pixel decoding',model_version:sharp.versions.vips});
}
function mediaKind(b) {
  if(b.toString('ascii',4,8)==='ftyp') return 'mp4';
  if(b.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]))) return 'webm';
  if(b.toString('ascii',0,4)==='RIFF') return b.toString('ascii',8,12)==='AVI '?'avi':b.toString('ascii',8,12)==='WAVE'?'wav':null;
  if(b.toString('ascii',0,4)==='OggS') return 'ogg';
  if(b.toString('ascii',0,4)==='fLaC') return 'flac';
  if(b.toString('ascii',0,3)==='ID3'||(b[0]===255&&(b[1]&0xe0)===0xe0)) return 'mp3';
  return null;
}
async function withMedia(bytes,fn) {
  const kind=mediaKind(bytes);
  if(!kind) throw fault('UNSUPPORTED_MEDIA','Unsupported media signature.');
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'truthguard-'));
  try { const file=path.join(dir,'input.'+kind); await fs.writeFile(file,bytes,{mode:0o600}); return await fn(file,dir); }
  finally { await fs.rm(dir,{recursive:true,force:true}); }
}
async function command(binary,args,maxBuffer=6*1024*1024) {
  try { return await exec(binary,args,{timeout:20000,maxBuffer,windowsHide:true,encoding:'buffer'}); }
  catch(e){ throw fault(e.killed?'TIMEOUT':'MEDIA_DECODE_FAILED',e.killed?'Media processing timed out.':'Media could not be decoded.'); }
}
async function probe(file) {
  const out=await command(require('ffprobe-static').path,['-v','error','-protocol_whitelist','file,pipe','-show_format','-show_streams','-of','json',file]);
  const info=JSON.parse(out.stdout.toString());
  const duration=Number(info.format?.duration);
  if(!Number.isFinite(duration)||duration<=0||duration>120) throw fault('MEDIA_DURATION','Audio and video must have a readable duration between 0 and 120 seconds.');
  return {info,duration};
}
async function video(bytes) {
  if(!bytes) return result('video','NOT_APPLICABLE');
  return withMedia(bytes,async file=>{
    const {info,duration}=await probe(file);
    const stream=info.streams.find(s=>s.codec_type==='video');
    if(!stream) throw fault('NO_VIDEO_STREAM','The upload has no video stream.');
    if(stream.width*stream.height>MAX_PIXELS) throw fault('VIDEO_TOO_LARGE','Video resolution exceeds the processing limit.');
    const {stderr}=await command(require('ffmpeg-static'),['-v','error','-xerror','-threads','1','-protocol_whitelist','file,pipe','-i',file,'-map','0:v:0','-an','-f','null','-']);
    if(stderr.length) throw fault('MEDIA_DECODE_FAILED','The video contains decoding errors.');
    const frameCount=Math.min(6,Math.max(1,Math.ceil(duration)));
    const frames=[];
    for(let i=0;i<frameCount;i++){
      const seconds=duration*(i+.25)/frameCount;
      const {stdout}=await command(require('ffmpeg-static'),['-v','error','-threads','1','-protocol_whitelist','file,pipe','-ss',String(seconds),'-i',file,'-frames:v','1','-vf','scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2','-f','image2pipe','-vcodec','png','pipe:1']);
      if(!stdout.length) continue;
      const pixels=await sharp(stdout).greyscale().raw().toBuffer();
      frames.push({seconds,pixels});
    }
    if(!frames.length) throw fault('NO_DECODED_FRAMES','No video frames could be extracted.');
    const differences=frames.slice(1).map((f,i)=>{let sum=0; for(let j=0;j<f.pixels.length;j++)sum+=(f.pixels[j]-frames[i].pixels[j])**2;return {from_seconds:frames[i].seconds,to_seconds:f.seconds,rmse:Math.sqrt(sum/f.pixels.length)};});
    return result('video','INSUFFICIENT_EVIDENCE',{signals:[{type:'video_stream',codec:stream.codec_name,width:stream.width,height:stream.height,fps:stream.avg_frame_rate,duration_seconds:duration,decoded_samples:frames.length},{type:'temporal_pixel_change',samples:differences}],face_analysis:'NOT_PERFORMED',limitations:['Frame differences measure scene or motion changes; they are not evidence of a deepfake.','No validated face detector, face tracker, lip-sync model or temporal deepfake model is installed. Face presence is unknown.','Up to six frames sampled; subtle or localized manipulation may be missed.'],model:'FFmpeg decoding and frame RMSE'});
  });
}
async function audio(bytes) {
  if(!bytes) return result('audio','NOT_APPLICABLE');
  return withMedia(bytes,async file=>{
    const {info,duration}=await probe(file);
    const stream=info.streams.find(s=>s.codec_type==='audio');
    if(!stream) throw fault('NO_AUDIO_STREAM','The upload has no audio stream.');
    const {stdout}=await command(require('ffmpeg-static'),['-v','error','-xerror','-threads','1','-protocol_whitelist','file,pipe','-i',file,'-vn','-ac','1','-ar','16000','-f','s16le','pipe:1']);
    let square=0,peak=0,nonzero=0;
    for(let i=0;i+1<stdout.length;i+=2){const v=stdout.readInt16LE(i)/32768;square+=v*v;peak=Math.max(peak,Math.abs(v));if(v!==0)nonzero++;}
    const n=Math.floor(stdout.length/2); if(!n) throw fault('NO_AUDIO_SAMPLES','No audio samples could be decoded.');
    return result('audio','INSUFFICIENT_EVIDENCE',{verdict:nonzero===0?'SILENCE':'UNCERTAIN',signals:[{type:'audio_stream',codec:stream.codec_name,duration_seconds:duration,channels:stream.channels,original_sample_rate:stream.sample_rate,analysis_sample_rate:16000,rms:Math.sqrt(square/n),peak,samples:n}],limitations:['Audio was decoded and measured; speech transcription, speaker identity and voice-clone detection were not performed.','Signal quality is not evidence of synthetic speech.'],model:'FFmpeg PCM analysis'});
  });
}
module.exports={imageFormat,mediaKind,raster,image,video,audio,withMedia,command,probe,MAX_PIXELS};
