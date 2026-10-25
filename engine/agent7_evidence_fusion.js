/**
 * Agent 7: Bayesian Evidence Fusion & TruthGuard Consensus Engine
 * Responsibilities:
 * - Collects outputs from Agents 1 through 6
 * - Filters for ACTIVE modalities (agents with status === 'COMPLETED' and verdict !== 'NOT_APPLICABLE')
 * - CRITICAL: Inactive agents (status: 'NOT_APPLICABLE') are NEVER counted as negative evidence
 * - Evaluates weighted multi-factor Bayesian belief updating across active modalities:
 *   - Agent 1 (Claim Extraction & Fact-Check): weight 2.5
 *   - Agent 2 (Cross-Modal Alignment): weight 1.8
 *   - Agent 3 (Video Forensics): weight 1.6
 *   - Agent 4 (Image Synthesis): weight 1.6
 *   - Agent 5 (Audio Forensics): weight 1.5
 *   - Agent 6 (Document & OCR Forensics): weight 1.7
 * - Detects cross-modal and factual contradictions
 * - Calibrates Trust Index (0-100), Final Verdict, Confidence, and Consensus metrics
 * - Returns standardized final TruthGuard response format
 */

class EvidenceFusionAgent {
  constructor() {
    this.name = 'Agent 7: Bayesian Evidence Fusion';
    this.weights = {
      'Agent 1: Claim Extraction & Fact-Check': 2.5,
      'Agent 2: Cross-Modal Alignment': 1.8,
      'Agent 3: Video Forensics': 1.6,
      'Agent 4: Image Deepfake / Synthesis': 1.6,
      'Agent 5: Audio / Voice Forensics': 1.5,
      'Agent 6: Document & OCR Forensics': 1.7
    };
  }

  /**
   * Main fusion entry point
   * @param {Object|Array} agentResults - Map or Array of Agent 1-6 results
   * @returns {Object} Standardized Final TruthGuard Consensus Response
   */
  async fuse(agentResults = {}) {
    const startTime = Date.now();

    // Normalize inputs into array
    const rawList = Array.isArray(agentResults)
      ? agentResults
      : Object.values(agentResults);

    let supporting = 0;
    let contradicting = 0;
    let neutral = 0;
    let notApplicable = 0;
    let failed = 0;

    const activeFactors = [];
    const contradictions = [];
    const limitations = [];

    // Pre-check special conditions from Agent 1 (Claim Fact-Check)
    const agent1 = rawList.find(a => a && a.agent && a.agent.includes('Agent 1'));
    if (agent1) {
      if (agent1.verdict === 'INVALID_INPUT') {
        return {
          agent: this.name,
          status: 'FAILED',
          final_verdict: 'INVALID_INPUT',
          trust_index: 0,
          confidence: 0.0,
          evidence_strength: 'INSUFFICIENT',
          agent_consensus: { supporting: 0, contradicting: 0, neutral: 0, not_applicable: 0, failed: 1 },
          reasoning: 'Input was empty or contained no parseable modalities.',
          contradictions: [],
          limitations: ['Empty input payload.'],
          factors: [],
          processing_time_ms: Date.now() - startTime
        };
      }

      if (agent1.verdict === 'NON_LEXICAL_INPUT') {
        return {
          agent: this.name,
          status: 'COMPLETED',
          final_verdict: 'NON_LEXICAL_INPUT',
          trust_index: 10,
          confidence: 0.95,
          evidence_strength: 'INSUFFICIENT',
          agent_consensus: { supporting: 0, contradicting: 0, neutral: 1, not_applicable: rawList.length - 1, failed: 0 },
          reasoning: 'Input consists of non-lexical string or random keystroke tokens devoid of factual proposition.',
          contradictions: [],
          limitations: ['Cannot evaluate truth value of non-linguistic input.'],
          factors: [{ agent: agent1.agent, direction: 'neutral', weight: 1.0, reason: 'Non-lexical token sequence.' }],
          processing_time_ms: Date.now() - startTime
        };
      }

      if (agent1.verdict === 'SATIRICAL / ABSURD') {
        return {
          agent: this.name,
          status: 'COMPLETED',
          final_verdict: 'SATIRICAL / ABSURD',
          trust_index: 12,
          confidence: 0.96,
          evidence_strength: 'STRONG',
          agent_consensus: { supporting: 0, contradicting: 1, neutral: 0, not_applicable: rawList.length - 1, failed: 0 },
          reasoning: 'Input matches recognized satirical parody or physically impossible absurdities.',
          contradictions: ['Statement describes physically impossible or humorous scenario.'],
          limitations: ['Satirical content not treated as factual information.'],
          factors: [{ agent: agent1.agent, direction: 'undermines_trust', weight: 2.0, reason: 'Satirical parody detection.' }],
          processing_time_ms: Date.now() - startTime
        };
      }

      if (agent1.verdict === 'UNVERIFIABLE_SPECULATION') {
        return {
          agent: this.name,
          status: 'COMPLETED',
          final_verdict: 'UNVERIFIABLE_SPECULATION',
          trust_index: 45,
          confidence: 0.90,
          evidence_strength: 'MODERATE',
          agent_consensus: { supporting: 0, contradicting: 0, neutral: 1, not_applicable: rawList.length - 1, failed: 0 },
          reasoning: 'Assertion pertains to future projections or unverified predictions that cannot be substantiated empirically in present records.',
          contradictions: [],
          limitations: ['Future predictive statements are inherently unverifiable in current factual databases.'],
          factors: [{ agent: agent1.agent, direction: 'neutral', weight: 1.5, reason: 'Speculative future assertion.' }],
          processing_time_ms: Date.now() - startTime
        };
      }
    }

    let weightedScoreSum = 0;
    let totalWeight = 0;

    for (const res of rawList) {
      if (!res || !res.agent) continue;

      if (res.status === 'NOT_APPLICABLE') {
        notApplicable++;
        continue; // NEVER treat not_applicable as negative evidence!
      }

      if (res.status === 'FAILED') {
        failed++;
        limitations.push(`${res.agent} failed execution: ${res.evidence?.[0] || 'Unknown error'}`);
        continue;
      }

      // Agent succeeded (status === 'COMPLETED')
      const weight = this.weights[res.agent] || 1.0;
      const conf = typeof res.confidence === 'number' ? res.confidence : 0.85;

      let score = 50;
      let dir = 'neutral';

      const v = (res.verdict || '').toUpperCase();

      // Check Supporting (Authentic / True / Consistent)
      if (
        v.includes('TRUE') ||
        v.includes('AUTHENTIC') ||
        v.includes('CONSISTENT') ||
        v.includes('ALIGNED')
      ) {
        supporting++;
        dir = 'supports_trust';
        score = v.includes('LIKELY') ? 85 : 96;
      }
      // Check Contradicting (False / Fake / Deepfake / Altered / Contradiction / Fabricated)
      else if (
        v.includes('FALSE') ||
        v.includes('FAKE') ||
        v.includes('DEEPFAKE') ||
        v.includes('SYNTHETIC') ||
        v.includes('ALTERED') ||
        v.includes('FORGED') ||
        v.includes('FABRICATED') ||
        v.includes('CONTRADICTION')
      ) {
        contradicting++;
        dir = 'undermines_trust';
        score = v.includes('LIKELY') ? 15 : 4;

        if (res.evidence && res.evidence.length > 0) {
          contradictions.push(`${res.agent}: ${res.evidence[0]}`);
        }
      }
      // Check Neutral (Insufficient Evidence / Inconclusive / Mismatch / Non-Speech / Silence)
      else {
        neutral++;
        dir = 'neutral';
        score = v.includes('INSUFFICIENT') ? 48 : 50;
      }

      const effWeight = weight * conf;
      weightedScoreSum += score * effWeight;
      totalWeight += effWeight;

      activeFactors.push({
        agent: res.agent,
        verdict: res.verdict,
        confidence: conf,
        direction: dir,
        weight: +effWeight.toFixed(2),
        reason: res.evidence?.[0] || `Forensic verdict: ${res.verdict}`
      });

      if (res.limitations && res.limitations.length > 0) {
        limitations.push(...res.limitations);
      }
    }

    // Check if NO active agents ran
    const activeCount = supporting + contradicting + neutral;
    if (activeCount === 0) {
      return {
        agent: this.name,
        status: 'COMPLETED',
        final_verdict: 'INSUFFICIENT EVIDENCE',
        trust_index: 50,
        confidence: 0.10,
        evidence_strength: 'INSUFFICIENT',
        agent_consensus: { supporting: 0, contradicting: 0, neutral: 0, not_applicable: notApplicable, failed },
        reasoning: 'No active forensic modalities were applicable or available to evaluate this input.',
        contradictions: [],
        limitations: ['No active modalities submitted for inspection.'],
        factors: [],
        processing_time_ms: Date.now() - startTime
      };
    }

    // Bayesian Weighted Trust Index calculation
    let trustIndex = totalWeight > 0 ? Math.round(weightedScoreSum / totalWeight) : 50;

    // Detect Contradictory Evidence across active agents
    const isDirectContradiction = supporting > 0 && contradicting > 0;
    if (isDirectContradiction) {
      contradictions.push(`Cross-agent conflict: ${supporting} agent(s) found content authentic/true, while ${contradicting} agent(s) flagged fabrication or manipulation.`);
    }

    // Strict Calibrated Overrides:
    // 1. Conclusive Factual Falsification by Agent 1
    const isConclusivelyFalse = activeFactors.some(f => f.agent.includes('Agent 1') && f.direction === 'undermines_trust');
    // 2. Conclusive Media Manipulation (Image/Video/Audio/Doc)
    const hasMediaDeception = activeFactors.some(f => !f.agent.includes('Agent 1') && !f.agent.includes('Agent 2') && f.direction === 'undermines_trust' && f.weight > 1.2);
    // 3. Conclusive Factual Truth by Agent 1
    const isConclusivelyTrue = activeFactors.some(f => f.agent.includes('Agent 1') && f.direction === 'supports_trust');

    let finalVerdict = 'UNCERTAIN';

    if (isConclusivelyFalse) {
      trustIndex = Math.min(trustIndex, 6);
      finalVerdict = 'DECEPTIVE / FALSE';
    } else if (hasMediaDeception) {
      trustIndex = Math.min(trustIndex, 12);
      const decAgent = activeFactors.find(f => f.direction === 'undermines_trust');
      if (decAgent && decAgent.agent.includes('Video')) finalVerdict = 'DECEPTIVE / DEEPFAKE';
      else if (decAgent && decAgent.agent.includes('Image')) finalVerdict = 'DECEPTIVE / DEEPFAKE';
      else if (decAgent && decAgent.agent.includes('Audio')) finalVerdict = 'DECEPTIVE / VOICE CLONE';
      else if (decAgent && decAgent.agent.includes('Document')) finalVerdict = 'DECEPTIVE / FORGED';
      else finalVerdict = 'DECEPTIVE / MANIPULATED';
    } else if (isDirectContradiction && supporting === contradicting) {
      trustIndex = 50;
      finalVerdict = 'CONTRADICTORY EVIDENCE';
    } else if (isConclusivelyTrue && contradicting === 0) {
      trustIndex = Math.max(trustIndex, 94);
      finalVerdict = 'VERIFIED TRUE';
    } else if (supporting > 0 && contradicting === 0 && neutral === 0) {
      trustIndex = Math.max(trustIndex, 92);
      finalVerdict = 'VERIFIED TRUE';
    } else if (supporting > 0 && contradicting === 0 && neutral > 0) {
      trustIndex = Math.max(trustIndex, 82);
      finalVerdict = 'LIKELY TRUE';
    } else if (contradicting > 0 && supporting === 0) {
      trustIndex = Math.min(trustIndex, 15);
      finalVerdict = 'DECEPTIVE / FALSE';
    } else if (neutral > 0 && supporting === 0 && contradicting === 0) {
      trustIndex = 48;
      finalVerdict = 'INSUFFICIENT EVIDENCE';
    } else {
      if (trustIndex >= 85) finalVerdict = 'VERIFIED TRUE';
      else if (trustIndex >= 70) finalVerdict = 'LIKELY TRUE';
      else if (trustIndex <= 20) finalVerdict = 'DECEPTIVE / FALSE';
      else if (trustIndex <= 40) finalVerdict = 'LIKELY FALSE / MISLEADING';
      else finalVerdict = 'INSUFFICIENT EVIDENCE';
    }

    // Calibrate Confidence
    let calibratedConfidence = 0.85;
    if (finalVerdict === 'VERIFIED TRUE' || finalVerdict === 'DECEPTIVE / FALSE' || finalVerdict.includes('DECEPTIVE')) {
      calibratedConfidence = 0.95;
    } else if (finalVerdict === 'CONTRADICTORY EVIDENCE' || finalVerdict === 'INSUFFICIENT EVIDENCE') {
      calibratedConfidence = 0.50;
    } else {
      calibratedConfidence = 0.78;
    }

    // Evidence Strength Assessment
    let evidenceStrength = 'MODERATE';
    if (activeCount >= 2 && (supporting >= 2 || contradicting >= 2) && calibratedConfidence >= 0.90) {
      evidenceStrength = 'STRONG';
    } else if (activeCount === 1 && (isConclusivelyTrue || isConclusivelyFalse || hasMediaDeception)) {
      evidenceStrength = 'STRONG';
    } else if (neutral >= activeCount) {
      evidenceStrength = 'INSUFFICIENT';
    } else if (isDirectContradiction) {
      evidenceStrength = 'WEAK';
    }

    // Build synthesized explanation reasoning
    let reasoning = '';
    if (finalVerdict === 'VERIFIED TRUE') {
      reasoning = `Bayesian Evidence Fusion confirmed truth across ${supporting} active modality/modalities. Primary authoritative evidence confirms factual veracity without contradictory anomalies.`;
    } else if (finalVerdict.includes('DECEPTIVE')) {
      reasoning = `Bayesian Evidence Fusion identified conclusive deception vectors. Content refutation/manipulation confirmed by ${contradicting} forensic agent(s).`;
    } else if (finalVerdict === 'CONTRADICTORY EVIDENCE') {
      reasoning = `Bayesian Evidence Fusion detected severe cross-modal divergence between evaluated modalities (${supporting} supporting vs ${contradicting} contradicting). Manual adjudication recommended.`;
    } else {
      reasoning = `Bayesian Evidence Fusion evaluated ${activeCount} active modality/modalities. Content lacks corroborating authoritative records in verified knowledge bases.`;
    }

    return {
      agent: this.name,
      status: 'COMPLETED',
      final_verdict: finalVerdict,
      trust_index: trustIndex,
      confidence: calibratedConfidence,
      evidence_strength: evidenceStrength,
      agent_consensus: {
        supporting,
        contradicting,
        neutral,
        not_applicable: notApplicable,
        failed
      },
      reasoning,
      contradictions,
      limitations: [...new Set(limitations)],
      factors: activeFactors,
      processing_time_ms: Date.now() - startTime
    };
  }
}

module.exports = new EvidenceFusionAgent();
