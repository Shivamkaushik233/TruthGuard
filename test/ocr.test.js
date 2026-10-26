'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createCanvas}=require('@napi-rs/canvas');
const {PDFDocument}=require('pdf-lib');
const {document:analyze}=require('../engine/document');
const {documentTask}=require('../engine/document-task');
function scan(){const canvas=createCanvas(1000,240);const c=canvas.getContext('2d');c.fillStyle='white';c.fillRect(0,0,1000,240);c.fillStyle='black';c.font='48px sans-serif';c.fillText('Invoice total 123 dollars',40,110);return canvas.toBuffer('image/png');}
test('actual scan OCR extracts visible words and reports OCR-only confidence',async()=>{const r=await analyze(scan());assert.match(r.extracted_text,/123 dollars/i);assert(r.ocr_confidence>0&&r.ocr_confidence<=1);assert.equal(r.confidence,null);});
test('image-only PDF renders pages and performs OCR',async()=>{const p=await PDFDocument.create();const img=await p.embedPng(scan());const page=p.addPage([1000,240]);page.drawImage(img,{x:0,y:0,width:1000,height:240});const r=await analyze(Buffer.from(await p.save()));assert.match(r.extracted_text,/123 dollars/i);assert.equal(r.pages[0].method,'tesseract_ocr');});
test('blank PDF returns no text instead of authentic document',async()=>{const p=await PDFDocument.create();p.addPage([300,300]);const r=await analyze(Buffer.from(await p.save()));assert.equal(r.verdict,'NO_TEXT_FOUND');assert.equal(r.status,'INSUFFICIENT_EVIDENCE');});
test('document worker isolates decoding and preserves extracted results',async()=>{const r=await documentTask(scan());assert.match(r.extracted_text,/123 dollars/i);});
test('disabled OCR is explicit',async()=>{const previous=process.env.OCR_ENABLED;process.env.OCR_ENABLED='false';try{await assert.rejects(()=>analyze(scan()),{code:'OCR_UNAVAILABLE'});}finally{if(previous===undefined)delete process.env.OCR_ENABLED;else process.env.OCR_ENABLED=previous;}});
