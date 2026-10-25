/**
 * TruthGuard Master Multi-Agent Forensic Orchestrator
 * Coordinates independent execution of all 7 forensic specialist agents.
 * Pure Node.js, zero dependencies.
 */

const agent1 = require('./agent1_claim_factcheck');
const agent2 = require('./agent2_cross_modal');
const agent3 = require('./agent3_video_forensics');
const agent4 = require('./agent4_image_synthesis');
const agent5 = require('./agent5_audio_forensics');
const agent6 = require('./agent6_document_ocr');
const agent7 = require('./agent7_evidence_fusion');

class MasterOrchestrator {
  constructor() {
    this.agent1 = agent1;
    this.agent2 = agent2;
    this.agent3 = agent3;
    this.agent4 = agent4;
    this.agent5 = agent5;
    this.agent6 = agent6;
    this.agent7 = agent7;
  }

  /**
   * Run full multi-agent analysis on input payload
   * @param {Object} payload - { text, image_base64, image_url, image_description, video_base64, audio_base64, document_base64, ocr_text, filename, mime_type, api_key }
   * @returns {Object} Complete TruthGuard forensic intelligence report
   */
  async analyze(payload = {}) {
    const totalStart = Date.now();

    const text = (payload.text || '').trim();
    const apiKey = payload.api_key || payload.gemini_api_key || '';
    const filename = (payload.filename || '').trim();
    const mimeType = (payload.mime_type || '').trim();

    const hasImage = Boolean(payload.image_base64 || payload.image_url || payload.image_description);
    const hasVideo = Boolean(payload.video_base64 || payload.video_url || (filename && filename.match(/\.(mp4|webm|avi|mov|mkv)$/i)));
    const hasAudio = Boolean(payload.audio_base64 || payload.audio_url || (filename && filename.match(/\.(mp3|wav|ogg|m4a|aac|flac)$/i)));
    const hasDoc = Boolean(payload.document_base64 || payload.ocr_text || (filename && filename.match(/\.(pdf|docx?|rtf|odt)$/i)));
    const hasOtherModality = hasImage || hasVideo || hasAudio || hasDoc;

    // Run Agents 1 through 6 concurrently
    const [res1, res2, res3, res4, res5, res6] = await Promise.all([
      this.agent1.analyze({ text, apiKey, url: payload.url, hasOtherModality }).catch(err => ({
        agent: 'Agent 1: Claim Extraction & Fact-Check',
        status: 'FAILED',
        verdict: 'ERROR',
        confidence: 0.0,
        evidence: [`Execution error: ${err.message}`],
        limitations: [err.message],
        processing_time_ms: 0
      })),

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
        verdict: 'ERROR',
        confidence: 0.0,
        evidence: [`Execution error: ${err.message}`],
        limitations: [err.message],
        processing_time_ms: 0
      })),

      this.agent3.analyze({
        video_base64: payload.video_base64,
        filename,
        mime_type: mimeType
      }).catch(err => ({
        agent: 'Agent 3: Video Forensics',
        status: 'FAILED',
        verdict: 'ERROR',
        confidence: 0.0,
        evidence: [`Execution error: ${err.message}`],
        limitations: [err.message],
        processing_time_ms: 0
      })),

      this.agent4.analyze({
        image_base64: payload.image_base64,
        filename,
        mime_type: mimeType
      }).catch(err => ({
        agent: 'Agent 4: Image Deepfake / Synthesis',
        status: 'FAILED',
        verdict: 'ERROR',
        confidence: 0.0,
        evidence: [`Execution error: ${err.message}`],
        limitations: [err.message],
        processing_time_ms: 0
      })),

      this.agent5.analyze({
        audio_base64: payload.audio_base64,
        filename,
        mime_type: mimeType
      }).catch(err => ({
        agent: 'Agent 5: Audio / Voice Forensics',
        status: 'FAILED',
        verdict: 'ERROR',
        confidence: 0.0,
        evidence: [`Execution error: ${err.message}`],
        limitations: [err.message],
        processing_time_ms: 0
      })),

      this.agent6.analyze({
        document_base64: payload.document_base64,
        filename,
        mime_type: mimeType,
        ocr_text: payload.ocr_text,
        page_count: payload.page_count
      }).catch(err => ({
        agent: 'Agent 6: Document & OCR Forensics',
        status: 'FAILED',
        verdict: 'ERROR',
        confidence: 0.0,
        evidence: [`Execution error: ${err.message}`],
        limitations: [err.message],
        processing_time_ms: 0
      }))
    ]);

    // Agent 7: Bayesian Evidence Fusion
    const fusionRes = await this.agent7.fuse([res1, res2, res3, res4, res5, res6]);

    return {
      final_verdict: fusionRes.final_verdict,
      trust_index: fusionRes.trust_index,
      confidence: fusionRes.confidence,
      evidence_strength: fusionRes.evidence_strength,
      agent_consensus: fusionRes.agent_consensus,
      reasoning: fusionRes.reasoning,
      contradictions: fusionRes.contradictions,
      limitations: fusionRes.limitations,
      factors: fusionRes.factors,
      agent_results: {
        agent1_claim_factcheck: res1,
        agent2_cross_modal: res2,
        agent3_video_forensics: res3,
        agent4_image_synthesis: res4,
        agent5_audio_forensics: res5,
        agent6_document_ocr: res6,
        agent7_fusion: fusionRes
      },
      total_processing_time_ms: Date.now() - totalStart
    };
  }
}

module.exports = new MasterOrchestrator();
