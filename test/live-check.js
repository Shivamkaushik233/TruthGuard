'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {png,clip,pdf}=require('./fixtures');
const base=(process.argv[2]||'http://localhost:8080').replace(/\/$/,'');
const output=process.argv[3];
const checks=[];let cookie='',report;
async function check(name,fn){try{const detail=await fn();checks.push({name,passed:true,detail});}catch(e){checks.push({name,passed:false,error:e.message});}console.log(JSON.stringify(checks.at(-1)));}
async function request(route,body,session=true){const r=await fetch(base+route,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(session&&cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(240000)});return r;}
async function investigate(payload){const r=await request('/api/investigate',payload);assert.equal(r.status,200,await r.clone().text());const d=await r.json();assert.equal(d.agent_consensus.total,7);assert.equal(d.trust_index,null);return d;}
const states=d=>({verdict:d.final_verdict,agents:Object.fromEntries(Object.entries(d.agent_results).map(([k,v])=>[k,{status:v.status,verdict:v.verdict,limitations:v.limitations}]))});
(async()=>{
 await check('health',async()=>{const r=await request('/api/health');assert.equal(r.status,200);const d=await r.json();assert.equal(d.version,'3.0.0');return d;});
 await check('frontend',async()=>{const r=await request('/');cookie=r.headers.get('set-cookie')?.split(';')[0]||'';assert(cookie);assert.match(await r.text(),/No verdict yet/);});
 await check('NASA factual verification',async()=>{const d=await investigate({text:'NASA successfully landed humans on the Moon in 1969.'});report=d;assert.equal(d.agent_results.fact.verdict,'VERIFIED_TRUE',JSON.stringify(states(d)));assert(d.supporting_evidence.length);return states(d);});
 await check('false parliamentary count',async()=>{const d=await investigate({text:'India currently has 500 members in the Rajya Sabha.'});assert.equal(d.agent_results.fact.verdict,'FALSE',JSON.stringify(states(d)));assert(d.contradicting_evidence.length);return states(d);});
 await check('image measurements',async()=>{const d=await investigate({image_base64:(await png()).toString('base64')});assert.equal(d.agent_results.image.signals[0].width,200);assert.equal(d.dimensions.media_authenticity,'UNCERTAIN');return states(d);});
 await check('video decoding',async()=>{const d=await investigate({video_base64:(await clip()).toString('base64')});assert.equal(d.agent_results.video.status,'COMPLETED');return states(d);});
 await check('audio decoding',async()=>{const d=await investigate({audio_base64:(await clip('audio','sine=frequency=440:sample_rate=16000')).toString('base64')});assert.equal(d.agent_results.audio.status,'COMPLETED');return states(d);});
 await check('PDF extraction',async()=>{const d=await investigate({document_base64:pdf(['What is this document?']).toString('base64')});assert.equal(d.agent_results.document.status,'COMPLETED');return states(d);});
 await check('scam indicators',async()=>{const d=await investigate({text:'Send your OTP now. Pay a processing fee to claim your lottery prize. Act immediately!'});assert.equal(d.agent_results.scam.verdict,'HIGH_RISK');return states(d);});
 await check('corrupt media',async()=>{const d=await investigate({image_base64:Buffer.from('invalid image').toString('base64')});assert.equal(d.agent_results.image.status,'FAILED');return states(d);});
 await check('report isolation',async()=>{assert(report);assert.equal((await request('/api/investigation/'+report.investigation_id,undefined,false)).status,404);assert.equal((await request('/api/investigation/'+report.investigation_id)).status,200);});
 await check('empty input',async()=>assert.equal((await request('/api/investigate',{})).status,400));
 const result={base,time:new Date().toISOString(),passed:checks.filter(x=>x.passed).length,total:checks.length,checks};
 if(output){await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,JSON.stringify(result,null,2));}
 process.exitCode=checks.every(x=>x.passed)?0:1;
})().catch(e=>{console.error(e);process.exitCode=1;});
