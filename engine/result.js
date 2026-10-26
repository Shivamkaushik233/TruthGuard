'use strict';
const NAMES = { claim: 'Claim Extractor', cross: 'Cross-Modal Alignment', video: 'Video Deepfake Forensics', image: 'Image Deepfake Detector', source: 'Source Credibility Graph', scam: 'Scam & Persuasion Engine', fact: 'Factual Veracity Engine', audio: 'Audio Support', document: 'Document & OCR Support' };
function result(id, status = 'INSUFFICIENT_EVIDENCE', data = {}) {
  return { id, agent: NAMES[id], status, applicable: status !== 'NOT_APPLICABLE', verdict: status === 'NOT_APPLICABLE' ? 'NOT_APPLICABLE' : 'UNCERTAIN', confidence: null, score: null, evidence: [], signals: [], limitations: [], model: null, model_version: null, execution_time_ms: 0, ...data };
}
function unavailable(id, message) { return result(id, 'INSUFFICIENT_EVIDENCE', { limitations: [message] }); }
async function run(id, fn) {
  const start = Date.now();
  let r;
  try { r = await fn(); } catch (e) {
    console.error(JSON.stringify({ event: 'agent_error', agent: id, code: e.code || e.name }));
    r = result(id, e.name === 'TimeoutError' || e.code === 'TIMEOUT' ? 'TIMEOUT' : 'FAILED', { error: e.code || 'ANALYSIS_FAILED', limitations: [e.publicMessage || 'Analysis failed. Check server diagnostics.'] });
  }
  return { ...r, execution_time_ms: Date.now() - start };
}
function fault(code, message) { const e = new Error(message); e.code = code; e.publicMessage = message; return e; }
module.exports = { NAMES, result, unavailable, run, fault };
