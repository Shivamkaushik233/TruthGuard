/**
 * Agent 1: Claim Extraction & Fact-Check Agent
 * Responsibilities:
 * - Extract atomic factual claims
 * - Identify entities, dates, locations, quantities, temporal and causal claims
 * - Classify claim types (historical fact, scientific law, geopolitical, vital status, opinion, speculation, satire)
 * - Fact-check claims using authoritative knowledge base & evidence grounding
 * - Return standardized agent response format
 */

const knowledgeBase = require('./knowledge_base');

class ClaimFactCheckAgent {
  constructor() {
    this.name = 'Agent 1: Claim Extraction & Fact-Check';
  }

  /**
   * Main entry point
   * @param {Object} input - { text: string, url?: string, apiKey?: string }
   * @returns {Object} Standardized Agent Response
   */
  async analyze(input = {}) {
    const startTime = Date.now();
    const rawText = (input.text || '').trim();

    // 1. Validate input presence
    if (!rawText) {
      const hasOther = Boolean(input.hasOtherModality);
      return {
        agent: this.name,
        status: hasOther ? 'NOT_APPLICABLE' : 'FAILED',
        verdict: hasOther ? 'NO_TEXT_PROVIDED' : 'INVALID_INPUT',
        confidence: hasOther ? 1.0 : 0.0,
        claims: [],
        entities: [],
        dates: [],
        locations: [],
        quantities: [],
        evidence: [hasOther ? 'No text was submitted; claim fact-checking not applicable.' : 'No text input provided for claim extraction or verification.'],
        limitations: [hasOther ? 'No text content provided.' : 'Text payload was empty or contained only whitespace.'],
        processing_time_ms: Date.now() - startTime
      };
    }

    // 2. Extract entities, dates, locations, quantities
    const extractedData = this.extractEntitiesAndMetadata(rawText);

    // 3. Decompose into atomic claims
    const atomicClaims = this.decomposeClaims(rawText);

    // 4. Ground and evaluate each claim using authoritative knowledge base
    const evaluatedClaims = atomicClaims.map((c, idx) => {
      const evalResult = knowledgeBase.evaluateClaim(c.text);
      return {
        id: idx + 1,
        claim: c.text,
        type: c.type,
        entities: c.entities,
        dates: c.dates,
        locations: c.locations,
        quantities: c.quantities,
        verdict: evalResult.verdict,
        confidence: evalResult.confidence,
        evidence: evalResult.evidence,
        limitations: evalResult.limitations,
        sourceTier: evalResult.sourceTier || 'TIER 1'
      };
    });

    // 5. Aggregate overall verdict and confidence across claims
    const overall = this.aggregateClaimVerdicts(evaluatedClaims, rawText);

    return {
      agent: this.name,
      status: overall.status,
      verdict: overall.verdict,
      confidence: overall.confidence,
      claims: evaluatedClaims,
      entities: extractedData.entities,
      dates: extractedData.dates,
      locations: extractedData.locations,
      quantities: extractedData.quantities,
      evidence: overall.evidence,
      limitations: overall.limitations,
      processing_time_ms: Date.now() - startTime
    };
  }

  /**
   * Decompose text into individual factual claims
   */
  decomposeClaims(text) {
    const sentences = text
      .split(/(?<=[.!?])\s+|\n+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (sentences.length === 0) {
      sentences.push(text.trim());
    }

    return sentences.map(s => {
      let type = 'factual_claim';
      const lower = s.toLowerCase();

      if (/\b(died|dies|dead|passed away|assassinated|killed|murdered|demise)\b/i.test(s)) {
        type = 'vital_status_claim';
      } else if (/\b(prime minister|president|chief minister|ceo|chancellor|monarch|king|queen)\b/i.test(s)) {
        type = 'office_holder_claim';
      } else if (/\b(yesterday|today|tomorrow|\d{4}|century|decade|bce?|ce)\b/i.test(s)) {
        type = 'temporal_claim';
      } else if (/\b(in|at|near|country|state|city|orbit|space|moon|mars)\b/i.test(s)) {
        type = 'location_claim';
      } else if (/\b(\$|%|\d+|million|billion|trillion|hundred|thousand)\b/i.test(s)) {
        type = 'quantity_claim';
      } else if (/\b(caused|causes|leads to|results in|because of|due to)\b/i.test(s)) {
        type = 'causal_claim';
      } else if (/\b(will definitely|will certainly|in 20\d\d)\b/i.test(s)) {
        type = 'speculative_claim';
      }

      const meta = this.extractEntitiesAndMetadata(s);

      return {
        text: s,
        type,
        entities: meta.entities,
        dates: meta.dates,
        locations: meta.locations,
        quantities: meta.quantities
      };
    });
  }

  /**
   * Extract key entities, dates, locations, and quantities
   */
  extractEntitiesAndMetadata(text) {
    const entities = [];
    const dates = [];
    const locations = [];
    const quantities = [];

    // Named entities (Capitalized noun sequences)
    const entityMatches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    const stopWords = new Set(['The', 'A', 'An', 'This', 'That', 'These', 'Those', 'In', 'On', 'At', 'By', 'For', 'With', 'About', 'Against', 'Between', 'Into', 'Through', 'During', 'Before', 'After', 'Above', 'Below', 'To', 'From', 'Up', 'Down', 'It', 'Its', 'They', 'Their', 'We', 'Our', 'He', 'His', 'She', 'Her']);
    
    for (const ent of entityMatches) {
      if (!stopWords.has(ent) && ent.length > 2 && !entities.includes(ent)) {
        entities.push(ent);
      }
    }

    // Dates (years 1000-2099, specific month day years)
    const dateMatches = text.match(/\b(?:\d{4}|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember))\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})\b/gi) || [];
    for (const d of dateMatches) {
      if (!dates.includes(d)) dates.push(d);
    }

    // Locations
    const locationKeywords = ['Moon', 'Earth', 'Mars', 'Sun', 'India', 'United States', 'USA', 'US', 'China', 'Russia', 'France', 'Germany', 'United Kingdom', 'UK', 'Paris', 'New Delhi', 'Washington', 'London', 'Berlin', 'Moscow', 'Beijing', 'Tokyo', 'Uttar Pradesh', 'California'];
    for (const loc of locationKeywords) {
      const reg = new RegExp(`\\b${loc}\\b`, 'i');
      if (reg.test(text) && !locations.includes(loc)) {
        locations.push(loc);
      }
    }

    // Quantities ($ amounts, percentages, large numerals)
    const qtyMatches = text.match(/\b(?:\$\d+(?:\.\d+)?(?:\s*(?:million|billion|trillion|k|m|b))?|\d+(?:\.\d+)?%|\d+(?:,\d{3})*(?:\.\d+)?\s*(?:km|miles|meters|degrees|celsius|kelvin|states|years|hours|days|seconds|liters|kg|grams|atoms|dollars|rupees)?)\b/gi) || [];
    for (const q of qtyMatches) {
      if (!quantities.includes(q)) quantities.push(q);
    }

    return { entities, dates, locations, quantities };
  }

  /**
   * Aggregate verdicts from atomic claims into overall Agent 1 verdict
   */
  aggregateClaimVerdicts(claims, rawText) {
    if (claims.length === 0) {
      return {
        status: 'FAILED',
        verdict: 'NO_CLAIMS_FOUND',
        confidence: 0.0,
        evidence: ['No parseable claims found in input text.'],
        limitations: ['Text lacked parseable grammatical clauses.']
      };
    }

    // If any claim is non-lexical
    if (claims.some(c => c.verdict === 'NON_LEXICAL_INPUT')) {
      return {
        status: 'COMPLETED',
        verdict: 'NON_LEXICAL_INPUT',
        confidence: 0.95,
        evidence: ['Input contains pseudo-random keyboard mash or non-lexical token sequences devoid of grammatical or semantic propositions.'],
        limitations: ['Cannot perform factual verification on non-linguistic input.']
      };
    }

    // If any claim is satirical / absurd
    if (claims.some(c => c.verdict === 'SATIRICAL / ABSURD')) {
      return {
        status: 'COMPLETED',
        verdict: 'SATIRICAL / ABSURD',
        confidence: 0.96,
        evidence: ['Input matches recognized patterns of satirical parody, hyperbole, or physical absurdity.'],
        limitations: ['Satire is not evaluated as literal truth.']
      };
    }

    // If any claim is speculative future
    if (claims.some(c => c.verdict === 'UNVERIFIABLE_SPECULATION')) {
      return {
        status: 'COMPLETED',
        verdict: 'UNVERIFIABLE_SPECULATION',
        confidence: 0.90,
        evidence: ['Assertion pertains to future projections and speculative timeline predictions that are intrinsically unverifiable in present factual records.'],
        limitations: ['Empirical verification cannot be applied to future events.']
      };
    }

    // Check for falsified claims
    const falseClaims = claims.filter(c => c.verdict === 'FALSE');
    if (falseClaims.length > 0) {
      const allEvidence = [];
      falseClaims.forEach(c => allEvidence.push(...c.evidence));
      return {
        status: 'COMPLETED',
        verdict: 'FALSE',
        confidence: +(falseClaims.reduce((acc, c) => acc + c.confidence, 0) / falseClaims.length).toFixed(2),
        evidence: allEvidence,
        limitations: ['Claim directly contradicts authoritative factual and scientific records.']
      };
    }

    // Check for verified true claims
    const trueClaims = claims.filter(c => c.verdict === 'TRUE / VERIFIED');
    if (trueClaims.length === claims.length) {
      const allEvidence = [];
      trueClaims.forEach(c => allEvidence.push(...c.evidence));
      return {
        status: 'COMPLETED',
        verdict: 'TRUE / VERIFIED',
        confidence: +(trueClaims.reduce((acc, c) => acc + c.confidence, 0) / trueClaims.length).toFixed(2),
        evidence: allEvidence,
        limitations: []
      };
    }

    if (trueClaims.length > 0 && trueClaims.length > falseClaims.length) {
      const allEvidence = [];
      trueClaims.forEach(c => allEvidence.push(...c.evidence));
      return {
        status: 'COMPLETED',
        verdict: 'LIKELY TRUE',
        confidence: 0.85,
        evidence: allEvidence,
        limitations: ['Partial factual corroboration achieved.']
      };
    }

    // Unverified claims
    return {
      status: 'COMPLETED',
      verdict: 'INSUFFICIENT_EVIDENCE',
      confidence: 0.45,
      evidence: [
        'Claim is not currently corroborated in authoritative primary registries or verified encyclopedic references.',
        'No institutional primary documentation or verifiable archival citation was provided to substantiate this assertion.'
      ],
      limitations: [
        'Requires independent corroboration from accredited primary sources or peer-reviewed literature.'
      ]
    };
  }
}

module.exports = new ClaimFactCheckAgent();
