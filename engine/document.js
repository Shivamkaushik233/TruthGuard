'use strict';
const { result, fault }=require('./result');
const { raster, imageFormat }=require('./media');
let worker=null, queue=Promise.resolve();
async function ocr(bytes) {
  if(process.env.OCR_ENABLED==='false') throw fault('OCR_UNAVAILABLE','OCR is disabled by server configuration.');
  const task=queue.then(async()=>{
    let timer;
    const work=(async()=>{
      if(!worker) worker=await require('tesseract.js').createWorker('eng',1,{logger:()=>{},errorHandler:()=>{}});
      const {data}=await worker.recognize(bytes);
      return {text:data.text.trim(),ocr_confidence:data.confidence/100};
    })();
    try { return await Promise.race([work,new Promise((_,reject)=>{timer=setTimeout(()=>reject(fault('TIMEOUT','OCR timed out.')),30000);})]); }
    finally { clearTimeout(timer); if(worker){await worker.terminate();worker=null;} }
  });
  queue=task.catch(()=>{});
  return task;
}
async function document(bytes, suppliedText='') {
  if(!bytes&&!suppliedText) return result('document','NOT_APPLICABLE');
  if(!bytes) return result('document','COMPLETED',{verdict:'TEXT_SUPPLIED',extracted_text:suppliedText,ocr_confidence:null,limitations:['Text was supplied by the user; OCR was not performed and document authenticity was not assessed.']});
  let pages=[],count=1,truncated=false;
  if(imageFormat(bytes)){
    const {normalized}=await raster(bytes);
    pages=[{page:1,...await ocr(normalized)}];
  } else if(bytes.toString('ascii',0,5)==='%PDF-'){
    const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
    const task=pdfjs.getDocument({data:new Uint8Array(bytes),isEvalSupported:false,useSystemFonts:true,disableFontFace:true});
    let pdf;
    try {
      pdf=await task.promise; count=pdf.numPages; truncated=count>10;
      for(let n=1;n<=Math.min(count,10);n++){
        const page=await pdf.getPage(n);
        const data=await page.getTextContent();
        let text=data.items.map(i=>i.str||'').join(' ').trim();
        if(text) pages.push({page:n,text,ocr_confidence:null,method:'embedded_text'});
        else {
          const base=page.getViewport({scale:1});
          const scale=Math.min(1.5,1800/Math.max(base.width,base.height));
          const viewport=page.getViewport({scale});
          const {createCanvas}=require('@napi-rs/canvas');
          const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
          await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
          const extracted=await ocr(await canvas.encode('png'));
          pages.push({page:n,...extracted,method:'tesseract_ocr'});
        }
        page.cleanup();
      }
    } catch(e){if(e.code)throw e;throw fault('DOCUMENT_DECODE_FAILED','The PDF could not be read; it may be corrupted, encrypted or unsupported.');}
    finally{await task.destroy();}
  } else throw fault('UNSUPPORTED_DOCUMENT','Upload a PDF or an image scan. DOC/DOCX files are not supported.');
  const text=pages.map(p=>p.text).join('\n\n').slice(0,40000);
  const confidence=pages.filter(p=>p.ocr_confidence!==null).map(p=>p.ocr_confidence);
  return result('document',text?'COMPLETED':'INSUFFICIENT_EVIDENCE',{verdict:text?'TEXT_EXTRACTED':'NO_TEXT_FOUND',extracted_text:text,pages,page_count:count,ocr_confidence:confidence.length?confidence.reduce((a,b)=>a+b,0)/confidence.length:null,model:'PDF.js / Tesseract English OCR',limitations:['Text extraction is not a document authenticity or forgery assessment. OCR confidence does not measure factual truth.',...(truncated?['Only the first 10 pages were processed.']:[]),'OCR currently supports English; poor scans and other languages may be inaccurate.']});
}
module.exports={document,ocr};
