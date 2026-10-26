'use strict';
const {randomUUID}=require('node:crypto');
function fuse(results) {
  const list=Array.isArray(results)?results:Object.values(results||{});
  const map=Object.fromEntries(list.filter(Boolean).map(r=>[r.id,r]));
  const primary=['claim','cross','video','image','source','scam','fact'].map(id=>map[id]).filter(Boolean);
  const completed=primary.filter(r=>r.status==='COMPLETED');
  const uncertain=primary.filter(r=>r.status==='INSUFFICIENT_EVIDENCE');
  const failed=primary.filter(r=>['FAILED','TIMEOUT'].includes(r.status));
  const inactive=primary.filter(r=>r.status==='NOT_APPLICABLE');
  const evidence=list.flatMap(r=>r.evidence||[]);
  const supporting=evidence.filter(e=>e.relationship==='SUPPORTS');
  const contradicting=evidence.filter(e=>e.relationship==='CONTRADICTS');
  const fact=map.fact?.status==='COMPLETED'?map.fact.verdict:null;
  const cross=map.cross?.status==='COMPLETED'?map.cross.verdict:null;
  const scam=map.scam?.status==='COMPLETED'?map.scam.verdict:null;
  const media=list.filter(r=>['image','video','audio','document'].includes(r.id)&&r.applicable);
  let verdict='INSUFFICIENT_EVIDENCE';
  if(fact==='CONFLICTING_EVIDENCE'||cross==='CONTRADICTORY') verdict='CONFLICTING_EVIDENCE';
  else if(scam==='HIGH_RISK') verdict='HIGH_SCAM_RISK';
  else if(fact==='FALSE') verdict='FALSE';
  else if(fact==='MIXED') verdict='MIXED';
  else if(fact==='VERIFIED_TRUE') verdict=media.length?'UNCERTAIN':'VERIFIED_TRUE';
  // Auxiliary failures and unexamined applicable domains cannot disappear from a positive overall verdict.
  if(verdict==='VERIFIED_TRUE'&&list.some(r=>r.applicable&&['FAILED','TIMEOUT','INSUFFICIENT_EVIDENCE'].includes(r.status))) verdict='UNCERTAIN';
  const domains=new Set([...supporting,...contradicting].map(e=>{try{return new URL(e.url).hostname.replace(/^www\./,'');}catch{return '';}}).filter(Boolean));
  return {investigation_id:randomUUID(),timestamp:new Date().toISOString(),final_verdict:verdict,trust_index:null,confidence:null,
    evidence_quality:domains.size>=2?'MULTIPLE_SOURCES':domains.size===1?'SINGLE_SOURCE':'NONE',
    discrepancy_detected:verdict==='CONFLICTING_EVIDENCE',
    dimensions:{factual_veracity:fact||map.fact?.verdict||'UNCERTAIN',media_authenticity:media.length?'UNCERTAIN':'NOT_APPLICABLE',cross_modal:cross||map.cross?.verdict||'NOT_APPLICABLE',scam_risk:scam||'NOT_APPLICABLE'},
    agent_consensus:{total:7,completed:completed.length,insufficient:uncertain.length,failed:failed.length,inactive:inactive.length,analyzed:completed.length+uncertain.length},
    supporting_evidence:supporting,contradicting_evidence:contradicting,
    reasoning:verdict==='VERIFIED_TRUE'?'Retrieved evidence supports every checked claim. See sources and limitations.':verdict==='FALSE'?'Retrieved evidence contradicts every checked claim; this does not authenticate any attached media.':verdict==='HIGH_SCAM_RISK'?'Explicit social-engineering indicators were detected. This does not determine factual truth.':'Review the separate findings. The available evidence does not support one definitive overall conclusion.',
    limitations:['No calibrated overall trust probability is available. Unavailable and inapplicable analyses do not contribute positive or negative evidence.','Source credibility, media authenticity and factual truth are separate dimensions.'],
    agent_results:map};
}
module.exports={fuse};
