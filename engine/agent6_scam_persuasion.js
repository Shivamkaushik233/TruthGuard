/**
 * TruthGuard Agent 06: Scam & Persuasion Forensics Engine
 * Responsibilities:
 * - Detect social engineering vectors, urgency exploitation, and financial fraud
 * - Distinctly separate SCAM RISK from PERSUASION RISK:
 *   - Scam Risk: Financial advance-fee fraud, crypto doubling schemes, credential phishing, lottery/grant lures, fake authority demands
 *   - Persuasion Risk: Rhetorical intensity, sensational clickbait ("Doctors are terrified!", "You won't believe..."), emotional manipulation
 * - Status: COMPLETED when text is analyzed, or NOT_APPLICABLE if no text provided
 * - Return standardized agent response format with behavioral vectors
 */

class ScamPersuasionAgent {
  constructor() {
    this.name = 'Agent 6: Scam & Persuasion Engine';
  }

  /**
   * Main analysis entrypoint
   * @param {Object} input - { text }
   * @returns {Object} Standardized Agent Response
   */
  async analyze(input = {}) {
    const startTime = Date.now();
    const text = (input.text || '').trim();

    // 1. If no text provided, return NOT_APPLICABLE
    if (!text) {
      return {
        agent: this.name,
        status: 'NOT_APPLICABLE',
        applicable: false,
        verdict: 'NO_TEXT_PROVIDED',
        confidence: 1.0,
        scam_probability: 0.0,
        scam_risk: 'NONE',
        persuasion_probability: 0.0,
        persuasion_risk: 'NONE',
        behavioral_vector: { urgency: 0.0, financial_lure: 0.0, psychological_manipulation: 0.0, authority_coercion: 0.0 },
        evidence: ['No textual message submitted for scam or persuasion analysis.'],
        limitations: ['Scam and persuasion analysis requires textual discourse or message payload.'],
        processing_time_ms: Date.now() - startTime
      };
    }

    const t = text.toLowerCase();

    // ── 2. SCAM DETECTION SIGNALS ────────────────────────────────────────────
    const advanceFeePatterns = [
      /\b(wire|send|transfer|deposit|pay)\s+(\$|usd|euro|inr|fees?|charges?|money)\b/i,
      /\b(claim|receive|awarded|won)\s+(\$|usd|million|grant|lottery|prize|reward)\b/i,
      /\b(processing fee|administrative fee|clearance deposit|customs fee|guaranteed return)\b/i
    ];
    const hasAdvanceFee = advanceFeePatterns.some(p => p.test(t));

    const cryptoScamPatterns = [
      /\b(double your (btc|bitcoin|eth|crypto))\b/i,
      /\b(crypto giveaway|bitcoin giveaway|send \d+ btc get \d+ back)\b/i,
      /\b(elon musk.*giveaway|tesla.*giveaway)\b/i
    ];
    const hasCryptoScam = cryptoScamPatterns.some(p => p.test(t));

    const phishingPatterns = [
      /\b(verify your (bank|account|password|identity|ssn))\b/i,
      /\b(account (suspended|locked|terminated|compromised))\b/i,
      /\b(click (here|link) to (unlock|restore|verify|confirm))\b/i,
      /\b(irs|fbi|police|tax department|central bank).*(arrest|warrant|penalty|fine|pay immediately)\b/i
    ];
    const hasPhishing = phishingPatterns.some(p => p.test(t));

    // Calculate Scam Probability
    let scamProb = 0.02;
    let scamRisk = 'NONE';
    let scamType = 'Informational Content';

    if (hasAdvanceFee || hasCryptoScam || hasPhishing) {
      if (hasAdvanceFee && hasPhishing) {
        scamProb = 0.98;
        scamRisk = 'CRITICAL';
        scamType = 'Coercive Phishing & Advance Fee Fraud';
      } else if (hasCryptoScam) {
        scamProb = 0.96;
        scamRisk = 'CRITICAL';
        scamType = 'Cryptocurrency Doubling Scheme';
      } else if (hasPhishing) {
        scamProb = 0.94;
        scamRisk = 'HIGH';
        scamType = 'Authority Impersonation & Credential Phishing';
      } else {
        scamProb = 0.92;
        scamRisk = 'HIGH';
        scamType = 'Advance Fee / Lottery Prize Fraud';
      }
    } else if (/\b(free iphone|free recharge|jio recharge|claim reward|unclaimed money)\b/i.test(t)) {
      scamProb = 0.76;
      scamRisk = 'MEDIUM';
      scamType = 'Promotional Reward Bait';
    }

    // ── 3. PERSUASION & CLICKBAIT DETECTION SIGNALS ──────────────────────────
    const urgencyPatterns = [
      /\b(act now|limited time|expires in \d+|only \d+ left|immediately|urgent notice|final notice|before it's deleted|hurry)\b/i
    ];
    const hasUrgency = urgencyPatterns.some(p => p.test(t));

    const clickbaitPatterns = [
      /\b(you won'?t believe|doctors are terrified|what happens next will blow your mind|shocking truth|they don'?t want you to know)\b/i,
      /\b(this one trick|secret remedy|miracle cure|mind-blowing|jaw-dropping)\b/i
    ];
    const hasClickbait = clickbaitPatterns.some(p => p.test(t));

    const hyperbolicPatterns = [
      /\b(absolutely shocking|pure evil|total disaster|miracle|guaranteed miracle|revolutionary discovery)\b/i
    ];
    const hasHyperbole = hyperbolicPatterns.some(p => p.test(t));

    // Calculate Persuasion Probability
    let persuasionProb = 0.05;
    let persuasionRisk = 'NEUTRAL_INFORMATIVE';

    if (hasClickbait && hasUrgency) {
      persuasionProb = 0.94;
      persuasionRisk = 'COERCIVE_MANIPULATION';
    } else if (hasClickbait) {
      persuasionProb = 0.88;
      persuasionRisk = 'SENSATIONAL_CLICKBAIT';
    } else if (hasUrgency || hasHyperbole) {
      persuasionProb = 0.65;
      persuasionRisk = 'MILD_RHETORIC';
    }

    // ── 4. Unified Verdict Formulation ───────────────────────────────────────
    let verdict = 'LEGITIMATE_CONTENT';
    const evidence = [];

    if (scamProb >= 0.80) {
      verdict = hasPhishing ? 'PHISHING_ATTEMPT' : 'FINANCIAL_SCAM_ALERT';
      evidence.push(`CRITICAL SCAM THREAT: Identified '${scamType}' with ${(scamProb * 100).toFixed(0)}% algorithmic confidence.`);
      evidence.push('Text deploys financial lure heuristics, fraudulent prize guarantees, or deceptive credential harvesting.');
    } else if (persuasionProb >= 0.75) {
      verdict = 'CLICKBAIT_PERSUASION';
      evidence.push(`HIGH PERSUASION INDEX: Sensational clickbait and emotional hyperbole detected (${(persuasionProb * 100).toFixed(0)}% persuasion index).`);
      evidence.push('Text deploys cognitive curiosity gaps, artificial urgency cues, or fearmongering formulas.');
    } else {
      verdict = 'LEGITIMATE_CONTENT';
      evidence.push('Text exhibits standard objective discourse parameters without exploitative social engineering vectors.');
    }

    return {
      agent: this.name,
      status: 'COMPLETED',
      applicable: true,
      verdict,
      confidence: 0.94,
      scam_probability: scamProb,
      scam_risk: scamRisk,
      scam_type: scamType,
      persuasion_probability: persuasionProb,
      persuasion_risk: persuasionRisk,
      behavioral_vector: {
        urgency: hasUrgency ? 0.92 : 0.08,
        financial_lure: hasAdvanceFee || hasCryptoScam ? 0.96 : 0.05,
        psychological_manipulation: hasClickbait || hasHyperbole ? 0.88 : 0.12,
        authority_coercion: hasPhishing ? 0.95 : 0.04
      },
      indicators: [
        ...(hasAdvanceFee ? ['Advance Fee Fraud formula'] : []),
        ...(hasCryptoScam ? ['Cryptocurrency Doubling Bait'] : []),
        ...(hasPhishing ? ['Credential Harvesting / Impersonation'] : []),
        ...(hasUrgency ? ['Artificial Temporal Scarcity (Urgency)'] : []),
        ...(hasClickbait ? ['Sensational Clickbait Formula (Curiosity Gap)'] : []),
        ...(hasHyperbole ? ['Emotional Hyperbolic Amplification'] : [])
      ],
      evidence,
      limitations: [
        'Behavioral heuristic evaluation isolates persuasion and fraud syntax independently from external factual claims.'
      ],
      processing_time_ms: Date.now() - startTime
    };
  }
}

module.exports = new ScamPersuasionAgent();
