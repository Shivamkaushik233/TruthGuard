/**
 * TruthGuard Agent 01: Claim Extractor
 * Responsibilities:
 * - Decompose unstructured text into atomic, independently verifiable claims
 * - Categorize claims by type: factual, temporal, numerical, causal, attribute, opinion, vital_status, office_holder
 * - Extract named entities: people, organizations, locations, geopolitical entities, historical events, dates, quantities
 * - Measure opinion vs fact density and linguistic uncertainty (hedging, speculative modals)
 * - CRITICAL: Agent 1 does NOT classify claims as TRUE or FALSE (that is strictly delegated to Agent 7)
 * - Status: COMPLETED when text is processed, or NOT_APPLICABLE if no text submitted
 */

class ClaimExtractorAgent {
  constructor() {
    this.name = 'Agent 1: Claim Extractor';
  }

  /**
   * Main analysis entrypoint
   * @param {Object} input - { text, apiKey, url, hasOtherModality }
   * @returns {Object} Standardized Agent Response
   */
  async analyze(input = {}) {
    const startTime = Date.now();
    const rawText = (input.text || '').trim();

    // If no text provided, return NOT_APPLICABLE
    if (!rawText) {
      const hasOther = Boolean(input.hasOtherModality);
      return {
        agent: this.name,
        status: hasOther ? 'NOT_APPLICABLE' : 'FAILED',
        applicable: false,
        verdict: hasOther ? 'NO_TEXT_PROVIDED' : 'INVALID_INPUT',
        confidence: hasOther ? 1.0 : 0.0,
        claims: [],
        claim_count: 0,
        entities: [],
        dates: [],
        locations: [],
        quantities: [],
        opinion_ratio: 0.0,
        uncertainty_level: 'NONE',
        evidence: [hasOther ? 'No text content submitted; claim extraction not applicable.' : 'No text input provided.'],
        limitations: [hasOther ? 'Non-text media only.' : 'Empty text payload.'],
        processing_time_ms: Date.now() - startTime
      };
    }

    // 1. Extract metadata, entities, dates, locations, quantities
    const extractedMetadata = this.extractEntitiesAndMetadata(rawText);

    // 2. Decompose into atomic claims
    const atomicClaims = this.decomposeClaims(rawText);

    // 3. Assess linguistic uncertainty and opinion density
    const opinionClaims = atomicClaims.filter(c => c.is_opinion);
    const opinionRatio = atomicClaims.length > 0
      ? +(opinionClaims.length / atomicClaims.length).toFixed(2)
      : 0.0;

    let uncertaintyLevel = 'LOW';
    const highUncertaintyCount = atomicClaims.filter(c => c.uncertainty === 'high').length;
    if (highUncertaintyCount > 0) uncertaintyLevel = 'HIGH';
    else if (atomicClaims.some(c => c.uncertainty === 'medium')) uncertaintyLevel = 'MEDIUM';

    return {
      agent: this.name,
      status: 'COMPLETED',
      applicable: true,
      verdict: 'CLAIMS_EXTRACTED',
      confidence: 0.96,
      claims: atomicClaims,
      claim_count: atomicClaims.length,
      entities: extractedMetadata.entities,
      dates: extractedMetadata.dates,
      locations: extractedMetadata.locations,
      quantities: extractedMetadata.quantities,
      opinion_ratio: opinionRatio,
      uncertainty_level: uncertaintyLevel,
      has_temporal_claims: atomicClaims.some(c => c.type === 'temporal' || c.dates.length > 0),
      has_numerical_claims: atomicClaims.some(c => c.type === 'numerical' || c.quantities.length > 0),
      evidence: [
        `Extracted ${atomicClaims.length} atomic verifiable claim(s) across ${extractedMetadata.entities.length} identified entity references.`,
        opinionRatio > 0.4 ? `High subjective/opinion density detected (${Math.round(opinionRatio * 100)}% opinion assertions).` : 'Predominantly objective factual syntax.'
      ],
      limitations: [
        'Agent 01 performs structural claim decomposition and semantic categorization only. Verification of factual veracity is delegated to Agent 07.'
      ],
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

    const claims = [];
    sentences.forEach((sentence, idx) => {
      if (sentence.length < 5) return;

      const type = this.classifyClaimType(sentence);
      const isOpinion = this.detectOpinion(sentence);
      const uncertainty = this.detectUncertainty(sentence);
      const meta = this.extractEntitiesAndMetadata(sentence);

      claims.push({
        id: idx + 1,
        text: sentence,
        type,
        is_opinion: isOpinion,
        uncertainty,
        entities: meta.entities,
        dates: meta.dates,
        locations: meta.locations,
        quantities: meta.quantities,
        confidence: 0.92
      });
    });

    return claims;
  }

  /**
   * Classify claim into structural category
   */
  classifyClaimType(sentence) {
    const s = sentence.toLowerCase();
    if (/\b(died|dead|passed away|assassinated|killed|murdered|survived|living|alive)\b/i.test(s)) {
      return 'vital_status';
    }
    if (/\b(prime minister|president|chief minister|ceo|chancellor|governor|monarch|king|queen|elected|appointed)\b/i.test(s)) {
      return 'office_holder';
    }
    if (/\b(\d{4}|january|february|march|april|may|june|july|august|september|october|november|december|yesterday|today|tomorrow|century|decade)\b/i.test(s)) {
      return 'temporal';
    }
    if (/\b(freezes|boils|evaporates|orbits|gravity|light speed|compound|cures|cancer|disease|virus|bacteria|physics|chemistry)\b/i.test(s)) {
      return 'scientific_law';
    }
    if (/\b(capital of|located in|bordering|states|territories|provinces|country|ocean|river|mountain)\b/i.test(s)) {
      return 'geopolitical';
    }
    if (/\b(\$|%|\b\d+\b|million|billion|trillion|thousand|percent)\b/i.test(s)) {
      return 'numerical';
    }
    if (/\b(because|caused|results in|leads to|due to|therefore|consequently)\b/i.test(s)) {
      return 'causal';
    }
    if (/\b(think|believe|feel|opinion|best|worst|beautiful|ugly|terrible|awesome|should|must)\b/i.test(s)) {
      return 'opinion';
    }
    return 'factual';
  }

  /**
   * Detect subjective opinion expressions
   */
  detectOpinion(text) {
    const opinionPatterns = [
      /\b(i think|i believe|in my opinion|in my view|i feel|i guess)\b/i,
      /\b(the best|the worst|the greatest|the most beautiful|ugly|awful|wonderful|amazing|disgusting)\b/i,
      /\b(should|ought to|must be considered|everyone knows that|obviously)\b/i
    ];
    return opinionPatterns.some(p => p.test(text));
  }

  /**
   * Detect hedging or speculative uncertainty
   */
  detectUncertainty(text) {
    if (/\b(allegedly|reportedly|unconfirmed|rumored|claims without proof)\b/i.test(text)) {
      return 'high';
    }
    if (/\b(might|maybe|possibly|perhaps|could be|likely|seems to)\b/i.test(text)) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Extract entities and structured metadata
   */
  extractEntitiesAndMetadata(text) {
    const entities = new Set();
    const dates = [];
    const locations = [];
    const quantities = [];

    // Proper Noun sequences (Title Case words)
    const titleCaseRegex = /\b([A-Z][a-z0-9]+(?:\s+[A-Z][a-z0-9]+)*)\b/g;
    let match;
    while ((match = titleCaseRegex.exec(text)) !== null) {
      const ent = match[1].trim();
      const lower = ent.toLowerCase();
      if (!['The', 'A', 'An', 'On', 'In', 'At', 'This', 'That', 'These', 'Those', 'It', 'Is', 'Are', 'Was', 'Were'].includes(ent)) {
        entities.add(ent);
      }
    }

    // Specific well-known institutions/actors
    const knownActors = [
      'NASA', 'ISRO', 'ESA', 'Roscosmos', 'WHO', 'UN', 'FBI', 'CIA', 'IRS', 'RBI',
      'Apollo 11', 'United States', 'India', 'China', 'Russia', 'United Kingdom', 'European Union',
      'Neil Armstrong', 'Buzz Aldrin', 'Michael Collins', 'Narendra Modi', 'Joe Biden',
      'Donald Trump', 'Elon Musk', 'Bill Gates', 'Steve Jobs', 'Barack Obama', 'Droupadi Murmu',
      'Taj Mahal', 'Eiffel Tower', 'Moon', 'Mars', 'Earth', 'Sun'
    ];
    for (const actor of knownActors) {
      if (new RegExp(`\\b${actor}\\b`, 'i').test(text)) {
        entities.add(actor);
      }
    }

    // Dates
    const yearRegex = /\b(1[7-9]\d{2}|20\d{2})\b/g;
    while ((match = yearRegex.exec(text)) !== null) dates.push(match[1]);

    const datePattern = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,\s*\d{4})?\b/gi;
    while ((match = datePattern.exec(text)) !== null) dates.push(match[0]);

    // Quantities
    const quantRegex = /(?:[\$€£₹]\s*[\d,]+(?:\.\d+)?|\b[\d,]+(?:\.\d+)?\s*(?:percent|%|million|billion|trillion|thousand|kg|km|celsius|degrees|states)\b)/gi;
    while ((match = quantRegex.exec(text)) !== null) quantities.push(match[0]);

    // Known Locations
    const knownLocs = ['Moon', 'Mars', 'Earth', 'India', 'United States', 'USA', 'Paris', 'New Delhi', 'Agra', 'Washington', 'London', 'Berlin', 'Moscow', 'Beijing', 'Tokyo'];
    for (const loc of knownLocs) {
      if (new RegExp(`\\b${loc}\\b`, 'i').test(text)) locations.push(loc);
    }

    return {
      entities: Array.from(entities),
      dates: Array.from(new Set(dates)),
      locations: Array.from(new Set(locations)),
      quantities: Array.from(new Set(quantities))
    };
  }
}

module.exports = new ClaimExtractorAgent();
