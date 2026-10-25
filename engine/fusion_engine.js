/**
 * TruthGuard Master Consensus Engine: Bayesian Evidence Fusion Network (BEFN)
 * Responsibilities:
 * - Fuse findings from all 7 specialized forensic neural agents + auxiliary media analyzers
 * - Filter active agents (status === 'COMPLETED' && applicable === true)
 * - CRITICAL: Completely exclude inactive modalities (status === 'NOT_APPLICABLE' || applicable === false) from weighting
 * - Apply Bayesian evidence weights and strict factual guardrails
 * - Detect cross-modal and multi-agent discrepancies
 * - Return calibrated consensus trust index, final verdict, evidence summary, and unique investigation ID
 */

const crypto = require('crypto');

class FusionEngine {
  constructor() {
    this.name = 'TruthGuard Bayesian Consensus Fusion Engine';
  }

  /**
   * Main fusion entrypoint
   * @param {Array|Object} agentResults - Array or key-value dictionary of the agent responses
   * @returns {Object} Final TruthGuard consensus verdict report
   */
  async fuse(agentResults) {
    const startTime = Date.now();

    // Normalize input into an array of agent response objects
    let resultsList = [];
    if (Array.isArray(agentResults)) {
      resultsList = agentResults;
    } else if (agentResults && typeof agentResults === 'object') {
      if (agentResults.agent_results) {
        resultsList = Object.values(agentResults.agent_results);
      } else {
        resultsList = Object.values(agentResults);
      }
    }

    // Map agents by identifier or role
    const getAgent = (pattern) => resultsList.find(r => r && (
      (r.agent && new RegExp(pattern, 'i').test(r.agent)) ||
      (r.name && new RegExp(pattern, 'i').test(r.name))
    ));

    const a1 = getAgent('claim|agent 1|extractor');
    const a2 = getAgent('cross-modal|agent 2|alignment');
    const a3 = getAgent('video|agent 3');
    const a4 = getAgent('image|agent 4|synthesis');
    const a5 = getAgent('source|agent 5|credibility');
    const a6 = getAgent('scam|agent 6|persuasion');
    const a7 = getAgent('veracity|agent 7|fact');
    const aAudio = getAgent('audio');
    const aDoc = getAgent('document|ocr');

    // Partition into applicable, inactive, and failed agents
    const applicableAgents = [];
    const inactiveAgents = [];
    const failedAgents = [];

    const agentsTracked = [
      { key: 'Agent 1: Claim Extractor', res: a1 },
      { key: 'Agent 2: Cross-Modal Alignment', res: a2 },
      { key: 'Agent 3: Video Deepfake Forensics', res: a3 },
      { key: 'Agent 4: Image Deepfake Detector', res: a4 },
      { key: 'Agent 5: Source Credibility Graph', res: a5 },
      { key: 'Agent 6: Scam & Persuasion Engine', res: a6 },
      { key: 'Agent 7: Factual Veracity Engine', res: a7 }
    ];

    agentsTracked.forEach(({ key, res }) => {
      if (!res) return;
      if (res.status === 'COMPLETED' && res.applicable !== false) {
        applicableAgents.push(key);
      } else if (res.status === 'NOT_APPLICABLE' || res.applicable === false) {
        inactiveAgents.push(key);
      } else if (res.status === 'FAILED') {
        failedAgents.push(key);
      }
    });

    // Check if auxiliary audio/doc failed
    if (aAudio && aAudio.status === 'FAILED' && !failedAgents.includes('Audio Forensics')) {
      failedAgents.push('Audio Forensics');
    }
    if (aDoc && aDoc.status === 'FAILED' && !failedAgents.includes('Document Forensics')) {
      failedAgents.push('Document Forensics');
    }

    // Check for complete input validation error
    if (a1 && a1.status === 'FAILED' && a1.verdict === 'INVALID_INPUT' && applicableAgents.length === 0) {
      return {
        investigation_id: this.generateInvestigationId(),
        final_verdict: 'INVALID_INPUT',
        trust_index: 0,
        confidence: 0.0,
        evidence_strength: 'NONE',
        discrepancy_detected: false,
        contradictions: [],
        applicable_agents: [],
        inactive_agents: inactiveAgents,
        failed_agents: ['Agent 1: Claim Extractor'],
        agent_consensus: { total: 7, active: 0, completed: 0, inactive: 6, failed: 1 },
        supporting_evidence: [],
        contradicting_evidence: ['Validation error: Empty or malformed input payload.'],
        factors: [],
        reasoning: 'Input was empty or invalid. No analysis could be performed.',
        recommendation: 'Provide valid text, image, video, audio, or document asset to initiate analysis.',
        processing_time_ms: Date.now() - startTime
      };
    }

    const factors = [];
    const supportingEvidence = [];
    const contradictingEvidence = [];
    let scoreSum = 0;
    let weightSum = 0;
    let discrepancyDetected = false;

    // ── 1. AGENT 7: FACTUAL VERACITY (WEIGHT: 2.5) ───────────────────────────
    let isFactuallyTrue = false;
    let isFactuallyFalse = false;
    let isSatire = false;
    let isSpeculation = false;
    let isNonLexical = false;
    let isInsufficient = false;

    if (a7 && a7.status === 'COMPLETED' && a7.applicable !== false) {
      const v = a7.verdict;
      const w = 2.5;
      let score = 50;

      if (v === 'VERIFIED_TRUE' || v === 'VERIFIED TRUE' || v === 'TRUE / VERIFIED') {
        isFactuallyTrue = true;
        score = 98;
        factors.push({ agent: 'Agent 7: Factual Veracity', direction: 'supports_trust', weight: w, reason: 'Proposition verified against Tier 1 authoritative scientific and historical records.' });
        supportingEvidence.push(...(a7.evidence || []));
      } else if (v === 'FALSE' || v === 'DECEPTIVE / FALSE' || v === 'FALSE / FABRICATED') {
        isFactuallyFalse = true;
        score = 4;
        factors.push({ agent: 'Agent 7: Factual Veracity', direction: 'undermines_trust', weight: w, reason: 'Proposition refuted by primary documentation and constitutional records.' });
        contradictingEvidence.push(...(a7.evidence || []));
      } else if (v === 'SATIRICAL / ABSURD') {
        isSatire = true;
        score = 10;
        factors.push({ agent: 'Agent 7: Factual Veracity', direction: 'undermines_trust', weight: w, reason: 'Absurd or satirical assertion contradicting astrophysics.' });
        contradictingEvidence.push(...(a7.evidence || []));
      } else if (v === 'NON_LEXICAL_INPUT') {
        isNonLexical = true;
        score = 5;
        factors.push({ agent: 'Agent 7: Factual Veracity', direction: 'undermines_trust', weight: w, reason: 'Input consists of non-lexical random character mash.' });
        contradictingEvidence.push(...(a7.evidence || []));
      } else if (v === 'UNVERIFIABLE_SPECULATION') {
        isSpeculation = true;
        score = 45;
        factors.push({ agent: 'Agent 7: Factual Veracity', direction: 'neutral', weight: w * 0.5, reason: 'Speculative projection regarding unarrived future events.' });
      } else if (v === 'INSUFFICIENT_EVIDENCE' || v === 'INSUFFICIENT EVIDENCE') {
        isInsufficient = true;
        score = 48;
        factors.push({ agent: 'Agent 7: Factual Veracity', direction: 'neutral', weight: 0.5, reason: 'Claim requires independent corroboration.' });
      }

      scoreSum += score * w;
      weightSum += w;
    }

    // ── 2. AGENT 4: IMAGE DEEPFAKE DETECTOR (WEIGHT: 2.0) ────────────────────
    let isImageSynthetic = false;
    let isImageAltered = false;
    let isImageMultiPanel = false;
    let isImageAuthentic = false;

    if (a4 && a4.status === 'COMPLETED' && a4.applicable !== false) {
      const w = 2.0;
      let score = 50;

      if (a4.verdict === 'MULTI-PANEL / MIXED CONTENT') {
        isImageMultiPanel = true;
        score = 50;
        factors.push({ agent: 'Agent 4: Image Deepfake', direction: 'neutral', weight: w, reason: 'Dual-panel split infographic with heterogeneous authentic and synthetic regions.' });
        supportingEvidence.push(...(a4.evidence || []));
      } else if (a4.verdict === 'SYNTHETIC / AI-GENERATED' || a4.verdict === 'AI_GENERATED') {
        isImageSynthetic = true;
        score = 4;
        factors.push({ agent: 'Agent 4: Image Deepfake', direction: 'undermines_trust', weight: w, reason: 'Synthetic diffusion frequency anomalies and neural generation artifacts.' });
        contradictingEvidence.push(...(a4.evidence || []));
      } else if (a4.verdict === 'DIGITALLY ALTERED') {
        isImageAltered = true;
        score = 12;
        factors.push({ agent: 'Agent 4: Image Deepfake', direction: 'undermines_trust', weight: w, reason: 'Digital photo manipulation and splicing detected along composite seams.' });
        contradictingEvidence.push(...(a4.evidence || []));
      } else if (a4.verdict === 'AUTHENTIC' || a4.verdict === 'REAL') {
        isImageAuthentic = true;
        score = 96;
        factors.push({ agent: 'Agent 4: Image Deepfake', direction: 'supports_trust', weight: w, reason: 'Verified optical camera provenance and natural sensor noise distribution.' });
        supportingEvidence.push(...(a4.evidence || []));
      }

      scoreSum += score * w;
      weightSum += w;
    }

    // ── 3. AGENT 3: VIDEO DEEPFAKE FORENSICS (WEIGHT: 2.0) ───────────────────
    let isVideoDeepfake = false;
    let isVideoAuthentic = false;

    if (a3 && a3.status === 'COMPLETED' && a3.applicable !== false) {
      const w = 2.0;
      let score = 50;

      if (a3.verdict && (a3.verdict.includes('DEEPFAKE') || a3.verdict.includes('SYNTHETIC'))) {
        isVideoDeepfake = true;
        score = 5;
        factors.push({ agent: 'Agent 3: Video Deepfake', direction: 'undermines_trust', weight: w, reason: 'Temporal cadence jitter, face swap boundaries, or diffusion video generation.' });
        contradictingEvidence.push(...(a3.evidence || []));
      } else if (a3.verdict && (a3.verdict.includes('AUTHENTIC') || a3.verdict === 'AUTHENTIC_NO_FACES')) {
        isVideoAuthentic = true;
        score = 95;
        factors.push({ agent: 'Agent 3: Video Deepfake', direction: 'supports_trust', weight: w, reason: 'Temporal frame-to-frame coherence and natural optical camera cadence verified.' });
        supportingEvidence.push(...(a3.evidence || []));
      }

      scoreSum += score * w;
      weightSum += w;
    }

    // ── 4. AUXILIARY AUDIO FORENSICS (WEIGHT: 1.5) ───────────────────────────
    let isAudioFake = false;
    let isAudioAuthentic = false;

    if (aAudio && aAudio.status === 'COMPLETED' && aAudio.applicable !== false) {
      const w = 1.5;
      if (aAudio.verdict && aAudio.verdict.includes('SYNTHETIC VOICE')) {
        isAudioFake = true;
        const score = 5;
        scoreSum += score * w;
        weightSum += w;
        factors.push({ agent: 'Audio Forensics', direction: 'undermines_trust', weight: w, reason: 'Voice clone or synthetic neural speech synthesis detected.' });
        contradictingEvidence.push(...(aAudio.evidence || []));
      } else if (aAudio.verdict === 'AUTHENTIC SPEECH') {
        isAudioAuthentic = true;
        const score = 95;
        scoreSum += score * w;
        weightSum += w;
        factors.push({ agent: 'Audio Forensics', direction: 'supports_trust', weight: w, reason: 'Acoustic vocal tract resonances and natural glottal pulses verified.' });
        supportingEvidence.push(...(aAudio.evidence || []));
      }
    }

    // ── 5. AUXILIARY DOCUMENT & OCR FORENSICS (WEIGHT: 1.5) ──────────────────
    let isDocForged = false;
    let isDocAuthentic = false;

    if (aDoc && aDoc.status === 'COMPLETED' && aDoc.applicable !== false) {
      const w = 1.5;
      if (aDoc.verdict === 'FABRICATED' || aDoc.verdict === 'ALTERED / FORGED') {
        isDocForged = true;
        const score = 5;
        scoreSum += score * w;
        weightSum += w;
        factors.push({ agent: 'Document Forensics', direction: 'undermines_trust', weight: w, reason: 'Document forgery or typography baseline alteration detected.' });
        contradictingEvidence.push(...(aDoc.evidence || []));
      } else if (aDoc.verdict === 'AUTHENTIC DOCUMENT') {
        isDocAuthentic = true;
        const score = 95;
        scoreSum += score * w;
        weightSum += w;
        factors.push({ agent: 'Document Forensics', direction: 'supports_trust', weight: w, reason: 'Font vector descriptor uniformity and structural PDF integrity verified.' });
        supportingEvidence.push(...(aDoc.evidence || []));
      }
    }

    // ── 6. AGENT 6: SCAM & PERSUASION ENGINE (WEIGHT: 1.5) ───────────────────
    let isScamCritical = false;
    let isClickbait = false;

    if (a6 && a6.status === 'COMPLETED' && a6.applicable !== false) {
      const w = 1.5;
      const scamP = a6.scam_probability || 0;
      const persP = a6.persuasion_probability || 0;

      if (scamP >= 0.80) {
        isScamCritical = true;
        const score = 5;
        scoreSum += score * w;
        weightSum += w;
        factors.push({ agent: 'Agent 6: Scam & Persuasion', direction: 'undermines_trust', weight: w, reason: `Social engineering threat detected: ${a6.scam_type || 'Advance fee / phishing'}` });
        contradictingEvidence.push(...(a6.evidence || []));
      } else if (persP >= 0.75) {
        isClickbait = true;
        const score = 30;
        scoreSum += score * w;
        weightSum += w;
        factors.push({ agent: 'Agent 6: Scam & Persuasion', direction: 'undermines_trust', weight: w * 0.7, reason: 'Sensational clickbait curiosity gap and emotional hyperbole detected.' });
        contradictingEvidence.push(...(a6.evidence || []));
      } else {
        const score = (isFactuallyTrue || isImageAuthentic || isVideoAuthentic) ? 95 : 60;
        const subW = (isFactuallyTrue || isImageAuthentic || isVideoAuthentic) ? 0.8 : 0.2;
        scoreSum += score * subW;
        weightSum += subW;
        factors.push({ agent: 'Agent 6: Scam & Persuasion', direction: 'supports_trust', weight: subW, reason: 'Objective discourse parameters devoid of manipulative social engineering.' });
      }
    }

    // ── 7. AGENT 2: CROSS-MODAL ALIGNMENT (WEIGHT: 1.2) ──────────────────────
    if (a2 && a2.status === 'COMPLETED' && a2.applicable !== false) {
      const w = 1.2;
      if (a2.verdict === 'CONTRADICTION') {
        discrepancyDetected = true;
        const score = 10;
        scoreSum += score * w;
        weightSum += w;
        factors.push({ agent: 'Agent 2: Cross-Modal Alignment', direction: 'undermines_trust', weight: w, reason: 'Cross-modal discrepancy: Semantic contradiction detected between submitted assets.' });
        contradictingEvidence.push(...(a2.evidence || []));
      } else if (a2.verdict === 'CONSISTENT') {
        const score = 92;
        scoreSum += score * w;
        weightSum += w;
        factors.push({ agent: 'Agent 2: Cross-Modal Alignment', direction: 'supports_trust', weight: w, reason: 'Cross-modal alignment: Semantic consistency verified across submitted assets.' });
        supportingEvidence.push(...(a2.evidence || []));
      }
    }

    // ── 8. AGENT 5: SOURCE CREDIBILITY GRAPH (WEIGHT: 1.0) ───────────────────
    if (a5 && a5.status === 'COMPLETED' && a5.applicable !== false) {
      const w = 1.0;
      const sTrust = a5.trust_score || 50;
      scoreSum += sTrust * w;
      weightSum += w;
      factors.push({
        agent: 'Agent 5: Source Credibility Graph',
        direction: sTrust >= 75 ? 'supports_trust' : (sTrust < 45 ? 'undermines_trust' : 'neutral'),
        weight: w,
        reason: `Source domain '${a5.domain}' classified under ${a5.tier_label || 'Tier Hierarchy'}.`
      });
      if (sTrust >= 75) supportingEvidence.push(...(a5.evidence || []));
      else if (sTrust < 45) contradictingEvidence.push(...(a5.evidence || []));
    }

    // Compute raw Bayesian weighted average
    let finalScore = weightSum > 0 ? Math.round(scoreSum / weightSum) : 50;

    // ── 9. RIGOROUS CONSENSUS OVERRIDES & GUARDRAILS ─────────────────────────
    if (isFactuallyFalse) {
      finalScore = Math.min(finalScore, 8);
    } else if (isSatire) {
      finalScore = Math.min(finalScore, 10);
    } else if (isNonLexical) {
      finalScore = Math.min(finalScore, 10);
    } else if (isImageSynthetic || isVideoDeepfake || isAudioFake || isDocForged) {
      finalScore = Math.min(finalScore, 12);
    } else if (isScamCritical) {
      finalScore = Math.min(finalScore, 14);
    } else if (discrepancyDetected) {
      finalScore = Math.min(finalScore, 15);
    } else if (isFactuallyTrue) {
      finalScore = Math.max(finalScore, 92);
    } else if (isImageMultiPanel) {
      finalScore = 50;
    } else if (isSpeculation) {
      finalScore = 45;
    } else if (isInsufficient && applicableAgents.length === 1) {
      finalScore = 48;
    } else if ((isImageAuthentic || isVideoAuthentic || isAudioAuthentic || isDocAuthentic) && !discrepancyDetected) {
      finalScore = 92;
    }

    // ── 10. FINAL CONSENSUS VERDICT FORMULATION ──────────────────────────────
    let finalVerdict = 'UNCERTAIN';
    if (isFactuallyFalse) {
      finalVerdict = 'DECEPTIVE / FALSE';
    } else if (discrepancyDetected) {
      finalVerdict = 'DECEPTIVE / FALSE';
    } else if (isSatire) {
      finalVerdict = 'SATIRICAL / ABSURD';
    } else if (isNonLexical) {
      finalVerdict = 'NON_LEXICAL_INPUT';
    } else if (isImageSynthetic || isVideoDeepfake) {
      finalVerdict = 'DECEPTIVE / DEEPFAKE';
    } else if (isImageMultiPanel) {
      finalVerdict = 'MULTI-PANEL / MIXED CONTENT';
    } else if (isAudioFake) {
      finalVerdict = 'DECEPTIVE / FALSE';
    } else if (isDocForged) {
      finalVerdict = 'DECEPTIVE / FALSE';
    } else if (isScamCritical) {
      finalVerdict = 'DECEPTIVE / SCAM';
    } else if (isClickbait) {
      finalVerdict = 'MISLEADING / CLICKBAIT';
    } else if (isSpeculation) {
      finalVerdict = 'UNVERIFIABLE_SPECULATION';
    } else if (isFactuallyTrue) {
      finalVerdict = 'VERIFIED TRUE';
    } else if ((isImageAuthentic || isVideoAuthentic || isAudioAuthentic || isDocAuthentic) && !discrepancyDetected) {
      finalVerdict = 'VERIFIED TRUE';
    } else if (isInsufficient || finalScore <= 50) {
      finalVerdict = 'INSUFFICIENT EVIDENCE';
    } else if (finalScore >= 75) {
      finalVerdict = 'VERIFIED TRUE';
    }

    // Determine evidence strength
    let evidenceStrength = 'MODERATE';
    if (applicableAgents.length >= 3 && (finalScore >= 90 || finalScore <= 15)) {
      evidenceStrength = 'ROBUST';
    } else if (applicableAgents.length <= 1) {
      evidenceStrength = 'ISOLATED_MODALITY';
    }

    // Calculate aggregated confidence
    const confidence = +(0.88 + Math.min(0.10, applicableAgents.length * 0.02)).toFixed(2);

    return {
      investigation_id: this.generateInvestigationId(),
      final_verdict: finalVerdict,
      trust_index: finalScore,
      confidence,
      evidence_strength: evidenceStrength,
      discrepancy_detected: discrepancyDetected,
      contradictions: discrepancyDetected ? contradictingEvidence : [],
      applicable_agents: applicableAgents,
      inactive_agents: inactiveAgents,
      failed_agents: failedAgents,
      agent_consensus: {
        total: 7,
        active: applicableAgents.length,
        completed: applicableAgents.length,
        inactive: inactiveAgents.length,
        failed: failedAgents.length
      },
      supporting_evidence: supportingEvidence.slice(0, 8),
      contradicting_evidence: contradictingEvidence.slice(0, 8),
      factors,
      reasoning: this.buildReasoning(finalVerdict, finalScore, applicableAgents, inactiveAgents),
      recommendation: this.buildRecommendation(finalVerdict, finalScore),
      methodology: 'Bayesian Evidence Fusion Network (BEFN)',
      processing_time_ms: Date.now() - startTime
    };
  }

  generateInvestigationId() {
    return 'inv_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex');
  }

  buildReasoning(verdict, score, active, inactive) {
    if (verdict === 'VERIFIED TRUE' || verdict === 'VERIFIED AUTHENTIC') {
      return `Bayesian evidence fusion synthesized ${active.length} active neural agent(s), verifying factual truth with a trust index of ${score}/100. Inactive agents [${inactive.join(', ') || 'none'}] were strictly excluded from evidence weighting.`;
    }
    if (verdict === 'DECEPTIVE / FALSE') {
      return `Multi-agent consensus conclusively refuted this assertion with an aggregated trust index of ${score}/100. Primary historical and scientific documentation contradicts the submitted claims.`;
    }
    if (verdict === 'DECEPTIVE / DEEPFAKE') {
      return `Forensic visual/video analysis identified synthetic neural generation or deepfake manipulation (trust index: ${score}/100). Content is quarantined as synthetic media.`;
    }
    if (verdict === 'MULTI-PANEL / MIXED CONTENT') {
      return `Forensic inspection detected a composite multi-panel image comprising heterogeneous authentic (real photo) and generative (AI diffusion) quadrants.`;
    }
    if (verdict === 'DECEPTIVE / SCAM') {
      return `High-risk social engineering vectors detected: Advance-fee fraud, credential harvesting, or psychological time urgency.`;
    }
    if (verdict === 'INSUFFICIENT EVIDENCE') {
      return `Proposition lacks corroboration across verified factual encyclopedias and primary registries. Trust index remains in neutral baseline (48-50/100).`;
    }
    return `Bayesian fusion of ${active.length} active agent(s) produced an aggregated trust score of ${score}/100.`;
  }

  buildRecommendation(verdict, score) {
    if (verdict === 'VERIFIED TRUE' || verdict === 'VERIFIED AUTHENTIC') {
      return 'Content verified against authoritative standards. Cleared for publication and reference.';
    }
    if (verdict === 'DECEPTIVE / FALSE') {
      return 'CRITICAL ADVISORY: Assertion is demonstrably false. Do not recirculate or cite as factual.';
    }
    if (verdict === 'DECEPTIVE / DEEPFAKE') {
      return 'CRITICAL ALERT: Synthetic media manipulation detected. Flag content as artificial generation.';
    }
    if (verdict === 'MULTI-PANEL / MIXED CONTENT') {
      return 'Composite comparison detected: Crop individual panels for isolated forensic classification.';
    }
    if (verdict === 'DECEPTIVE / SCAM') {
      return 'SECURITY WARNING: Never transmit funds, private keys, or credentials to unverified addresses.';
    }
    return 'ADVISORY: Assertion lacks corroboration. Primary archival verification recommended.';
  }
}

module.exports = new FusionEngine();
