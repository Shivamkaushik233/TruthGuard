'use strict';
const {Worker}=require('node:worker_threads');
const path=require('node:path');
const {document}=require('./document');
const {fault}=require('./result');
function documentTask(bytes,text){
  if(!bytes)return document(bytes,text);
  return new Promise((resolve,reject)=>{
    const worker=new Worker(path.join(__dirname,'document-worker.js'),{workerData:{bytes,text},resourceLimits:{maxOldGenerationSizeMb:192}});
    let settled=false;
    const finish=(err,value)=>{if(settled)return;settled=true;clearTimeout(timer);worker.terminate();err?reject(err):resolve(value);};
    const timer=setTimeout(()=>finish(fault('TIMEOUT','Document analysis exceeded its 75-second budget.')),75000);
    worker.once('message',m=>m.error?finish(fault(m.error.code,m.error.message)):finish(null,m.value));
    worker.once('error',()=>finish(fault('DOCUMENT_FAILED','Document processing failed or exceeded its memory budget.')));
    worker.once('exit',code=>{if(!settled)finish(fault('DOCUMENT_FAILED','Document worker exited before returning results.'));});
  });
}
module.exports={documentTask};
