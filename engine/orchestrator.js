/**
 * TruthGuard Master Multi-Agent Forensic Orchestrator
 * Coordinates independent execution of all 7 forensic specialist agents and Bayesian Evidence Fusion.
 * Pure Node.js, zero external dependencies.
 */

const agent1 = require('./agent1_claim_extractor');
const agent2 = require('./agent2_cross_modal');
const agent3 = require('./agent3_video_deepfake');
const agent4 = require('./agent4_image_deepfake');
const agent5 = require('./agent5_source_credibility');
const agent6 = require('./agent6_scam_persuasion');
const agent7 = require('./agent7_factual_veracity');
const agentAudio = require('./agent5_audio_forensics');
const agentDoc = require('./agent6_document_ocr');
const fusion = require('./fusion_engine');

class MasterOrchestrator {
  constructor() {
    this.agent1 = agent1;
    this.agent2 = agent2;
    this.agent3 = agent3;
    this.agent4 = agent4;
    this.agent5 = agent5;
    this.agent6 = agent6;
    this.agent7 = agent7;
    this.agentAudio = agentAudio;
    this.agentDoc = agentDoc;
    this.fusion = fusion;

    // Backward-compatible aliases
    this.agent3_video_forensics = agent3;
    this.agent4_image_synthesis = agent4;

    // Investigation Telemetry Ring Buffer (max 200 items)
    this.investigations = new Map();
  }

  /**
   * Run full multi-agent analysis on input payload
   * @param {Object} payload - { text, image_base64, image_url, image_description, video_base64, filename, mime_type, url, crop, api_key }
   * @returns {Object} Complete TruthGuard forensic intelligence report
   */
  async analyze(payload = {}) {
    const totalStart = Date.now();

    const text = (payload.text || '').trim();
    const apiKey = payload.api_key || payload.gemini_api_key || '';
    const filename = (payload.filename || '').trim();
    const mimeType = (payload.mime_type || '').trim();
    const sourceUrl = (payload.url || '').trim();
    const crop = (payload.crop || '').trim();

    const hasImage = Boolean(payload.image_base64 || payload.image_url || payload.image_description || (filename && filename.match(/\.(jpg|jpeg|png|webp|gif)$/i)));
    const hasVideo = Boolean(payload.video_base64 || payload.video_url || (filename && filename.match(/\.(mp4|webm|avi|mov|mkv)$/i)));
    const hasAudio = Boolean(payload.audio_base64 || payload.audio_url || (filename && filename.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)));
    const hasDoc = Boolean(payload.document_base64 || payload.ocr_text || (filename && filename.match(/\.(pdf|docx?|rtf|odt)$/i)));
    const hasOtherModality = hasImage || hasVideo || hasAudio || hasDoc;

    // Concurrently execute all neural specialist agents
    const [res1, res2, res3, res4, res5, res6, res7, resAudio, resDoc] = await Promise.all([
      // Agent 1: Claim Extractor
      this.agent1.analyze({ text, apiKey, url: sourceUrl, hasOtherModality }).catch(err => ({
        agent: 'Agent 1: Claim Extractor',
        status: 'FAILED',
        applicable: true,
        verdict: 'ERROR',
        confidence: 0.0,
        claims: [],
        evidence: [`Execution error: ${err.message}`],
        limitations: [err.message],
        processing_time_ms: 0
      })),

      // Agent 2: Cross-Modal Alignment
      this.agent2.analyze({
        text,
        image_base64: payload.image_base64,
        image_url: payload.image_url,
        image_description: payload.image_description,
        video_base64: payload.video_base64,
        audio_base64: payload.audio_base64,
        document_base64: payload.document_base64,
        ocr_text: payload.ocr_text,
        filename
      }).catch(err => ({
        agent: 'Agent 2: Cross-Modal Alignment',
        status: 'FAILED',
        applicable: true,
        verdict: 'ERROR',
        confidence: 0.0,
        evidence: [`Execution error: ${err.message}`],
        limitations: [err.message],
        processing_time_ms: 0
      })),

      // Agent 3: Video Deepfake Forensics
      this.agent3.analyze({
        video_base64: payload.video_base64,
        filename,
        mime_type: mimeType
      }).catch(err => ({
        agent: 'Agent 3: Video Deepfake Forensics',
        status: 'FAILED',
        applicable: true,
        verdict: 'ERROR',
        confidence: 0.0,
        evidence: [`Execution error: ${err.message}`],
        limitations: [err.message],
        processing_time_ms: 0
      })),

      // Agent 4: Image Deepfake Detector
      this.agent4.analyze({
        image_base64: payload.image_base64,
        filename,
        mime_type: mimeType,
        width: payload.width,
        height: payload.height,
        crop
      }).catch(err => ({
        agent: 'Agent 4: Image Deepfake Detector',
        status: 'FAILED',
        applicable: true,
        verdict: 'ERROR',
        confidence: 0.0,
        evidence: [`Execution error: ${err.message}`],
        limitations: [err.message],
        processing_time_ms: 0
      })),

      // Agent 5: Source Credibility Graph
      this.agent5.analyze({
        url: sourceUrl,
        source_name: payload.source_name,
        text
      }).catch(err => ({
        agent: 'Agent 5: Source Credibility Graph',
        status: 'FAILED',
        applicable: true,
        verdict: 'ERROR',
        confidence: 0.0,
        evidence: [`Execution error: ${err.message}`],
        limitations: [err.message],
        processing_time_ms: 0
      })),

      // Agent 6: Scam & Persuasion Engine
      this.agent6.analyze({
        text
      }).catch(err => ({
        agent: 'Agent 6: Scam & Persuasion Engine',
        status: 'FAILED',
        applicable: true,
        verdict: 'ERROR',
        confidence: 0.0,
        evidence: [`Execution error: ${err.message}`],
        limitations: [err.message],
        processing_time_ms: 0
      })),

      // Agent 7: Factual Veracity Engine
      this.agent7.analyze({
        text,
        apiKey,
        hasOtherModality
      }).catch(err => ({
        agent: 'Agent 7: Factual Veracity Engine',
        status: 'FAILED',
        applicable: true,
        verdict: 'ERROR',
        confidence: 0.0,
        evidence: [`Execution error: ${err.message}`],
        limitations: [err.message],
        processing_time_ms: 0
      })),

      // Auxiliary: Audio Forensics
      this.agentAudio.analyze({
        audio_base64: payload.audio_base64,
        filename,
        mime_type: mimeType
      }).catch(err => ({
        agent: 'Agent 5: Audio / Voice Forensics',
        status: 'FAILED',
        applicable: true,
        verdict: 'ERROR',
        confidence: 0.0,
        evidence: [`Execution error: ${err.message}`],
        limitations: [err.message],
        processing_time_ms: 0
      })),

      // Auxiliary: Document & OCR Forensics
      this.agentDoc.analyze({
        document_base64: payload.document_base64,
        filename,
        mime_type: mimeType,
        ocr_text: payload.ocr_text,
        page_count: payload.page_count
      }).catch(err => ({
        agent: 'Agent 6: Document & OCR Forensics',
        status: 'FAILED',
        applicable: true,
        verdict: 'ERROR',
        confidence: 0.0,
        evidence: [`Execution error: ${err.message}`],
        limitations: [err.message],
        processing_time_ms: 0
      }))
    ]);

    // Bayesian Evidence Fusion of all agent responses
    const agentResultsList = [res1, res2, res3, res4, res5, res6, res7, resAudio, resDoc];
    const fusionRes = await this.fusion.fuse(agentResultsList);

    const fullReport = {
      investigation_id: fusionRes.investigation_id,
      timestamp: new Date().toISOString(),
      final_verdict: fusionRes.final_verdict,
      trust_index: fusionRes.trust_index,
      confidence: fusionRes.confidence,
      evidence_strength: fusionRes.evidence_strength,
      discrepancy_detected: fusionRes.discrepancy_detected,
      applicable_agents: fusionRes.applicable_agents,
      inactive_agents: fusionRes.inactive_agents,
      failed_agents: fusionRes.failed_agents,
      agent_consensus: fusionRes.agent_consensus,
      supporting_evidence: fusionRes.supporting_evidence,
      contradicting_evidence: fusionRes.contradicting_evidence,
      factors: fusionRes.factors,
      reasoning: fusionRes.reasoning,
      recommendation: fusionRes.recommendation,
      methodology: fusionRes.methodology,
      agent_results: {
        agent1_claim_extractor: res1,
        agent2_cross_modal: res2,
        agent3_video_deepfake: res3,
        agent4_image_deepfake: res4,
        agent5_source_credibility: res5,
        agent6_scam_persuasion: res6,
        agent7_factual_veracity: res7,
        // Backward-compatible keys
        agent1_claim_factcheck: res7,
        agent3_video_forensics: res3,
        agent4_image_synthesis: res4,
        agent5_audio_forensics: resAudio,
        agent6_document_ocr: resDoc,
        agent7_fusion: fusionRes
      },
      // Backward compatibility top-level keys
      agent1_claim_factcheck: res7,
      agent3_video_forensics: res3,
      agent4_image_synthesis: res4,
      agent5_audio_forensics: resAudio,
      agent6_document_ocr: resDoc,
      agent7_fusion: fusionRes,
      total_processing_time_ms: Date.now() - totalStart
    };

    // Store in investigation ring buffer
    this.recordInvestigation(fullReport.investigation_id, fullReport);

    return fullReport;
  }

  recordInvestigation(id, report) {
    if (this.investigations.size >= 200) {
      const oldestKey = this.investigations.keys().next().value;
      this.investigations.delete(oldestKey);
    }
    this.investigations.set(id, report);
  }

  getInvestigation(id) {
    return this.investigations.get(id) || null;
  }

  listInvestigations(limit = 50) {
    const list = Array.from(this.investigations.values()).map(inv => ({
      investigation_id: inv.investigation_id,
      timestamp: inv.timestamp,
      final_verdict: inv.final_verdict,
      trust_index: inv.trust_index,
      confidence: inv.confidence,
      active_agents: inv.applicable_agents?.length || 0,
      processing_time_ms: inv.total_processing_time_ms
    }));
    return list.slice(-limit).reverse();
  }
}

module.exports = new MasterOrchestrator();
