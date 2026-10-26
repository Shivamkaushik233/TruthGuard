'use strict';
const {parentPort,workerData}=require('node:worker_threads');
const {document}=require('./document');
document(Buffer.from(workerData.bytes),workerData.text).then(value=>parentPort.postMessage({value})).catch(e=>parentPort.postMessage({error:{code:e.code||'DOCUMENT_FAILED',message:e.publicMessage||'Document processing failed.'}}));
