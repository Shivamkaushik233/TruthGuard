'use strict';
const {Gemini}=require('./provider');
const {validate}=require('./input');
const {run,unavailable}=require('./result');
const text=require('./text');
const media=require('./media');
const {documentTask:document}=require('./document-task');
const {cross}=require('./cross');
const {fuse}=require('./fusion_engine');
class Orchestrator {
  constructor({provider=new Gemini(),fetcher,documentAnalyzer=document}={}){this.provider=provider;this.fetcher=fetcher;this.documentAnalyzer=documentAnalyzer;}
  async analyze(payload) {
    const start=Date.now(),p=validate(payload);
    const [source,doc,image,video,audio]=await Promise.all([
      run('source',()=>text.source(p.url,this.fetcher)),
      run('document',()=>this.documentAnalyzer(p.document_base64,p.ocr_text)),
      run('image',()=>media.image(p.image_base64,{crop:p.crop,mime_type:p.image_base64&&!p.video_base64&&!p.document_base64?p.mime_type:''})),
      run('video',()=>media.video(p.video_base64)),
      run('audio',()=>media.audio(p.audio_base64))
    ]);
    // Prefer explicit claims. Documents and fetched articles become the claim source only when none were supplied.
    const claimText=p.text||doc.extracted_text||source.extracted_text||'';
    const claim=await run('claim',()=>text.extract(claimText,this.provider));
    const [fact,alignment,scam]=await Promise.all([
      run('fact',()=>claimText && claim.status !== 'COMPLETED' ? unavailable('fact','Claim extraction did not complete; factual verification could not run.') : text.factual(claim,this.provider,this.fetcher)),
      run('cross',()=>cross(p,this.provider,doc)),
      run('scam',()=>text.scam(claimText))
    ]);
    const report=fuse([claim,alignment,video,image,source,scam,fact,audio,doc]);
    // Internal extracted article content is not a reported observation.
    delete source.extracted_text;
    report.total_processing_time_ms=Date.now()-start;
    report.input_summary={has_text:Boolean(p.text),has_source:Boolean(p.url),image:Boolean(p.image_base64),video:Boolean(p.video_base64),audio:Boolean(p.audio_base64),document:Boolean(p.document_base64||p.ocr_text)};
    return report;
  }
}
module.exports=new Orchestrator();
module.exports.Orchestrator=Orchestrator;
