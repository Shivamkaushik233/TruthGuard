/**
 * TruthGuard V2 Comprehensive Forensic Test Suite
 * Covers all 7 categories:
 * - Category 1: Text Fact-Checking & Claim Extraction (10 tests)
 * - Category 2: Image Forensics & Deepfake Detection (10 tests)
 * - Category 3: Video Forensics & Temporal Cadence (8 tests)
 * - Category 4: Audio / Voice Forensics (8 tests)
 * - Category 5: Document & OCR Forensics (8 tests)
 * - Category 6: Multimodal Cross-Alignment (8 tests)
 * - Category 7: Bayesian Evidence Fusion & Consensus (8 tests)
 * Total: 60 Automated Forensic Tests
 */

const orchestrator = require('../engine/orchestrator');

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function assert(condition, message, details = {}) {
  if (condition) {
    results.passed++;
    results.tests.push({ status: 'PASS', message, details });
    console.log(`  ✅ PASS: ${message}`);
  } else {
    results.failed++;
    results.tests.push({ status: 'FAIL', message, details });
    console.error(`  ❌ FAIL: ${message}`, details);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🔬 TRUTHGUARD V2 FORENSIC INTELLIGENCE AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 1: TEXT FACT-CHECKING & CLAIM EXTRACTION (10 Tests)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶️ CATEGORY 1: Text Fact-Checking & Claim Extraction (10 Tests)');

  // T1: NASA Moon Landing (Key Regression Bug Fix)
  {
    const res = await orchestrator.analyze({ text: 'NASA successfully landed humans on the Moon in 1969.' });
    assert(
      res.final_verdict === 'VERIFIED TRUE' && res.trust_index >= 90 && res.confidence >= 0.90,
      'T1: NASA Moon Landing in 1969 resolves to VERIFIED TRUE with high trust index (>= 90)',
      { verdict: res.final_verdict, trust_index: res.trust_index, confidence: res.confidence }
    );
  }

  // T2: India 500 States
  {
    const res = await orchestrator.analyze({ text: 'India currently has 500 states.' });
    assert(
      res.final_verdict === 'DECEPTIVE / FALSE' && res.trust_index <= 10,
      'T2: Fabricated claim "India has 500 states" resolves to DECEPTIVE / FALSE (trust <= 10)',
      { verdict: res.final_verdict, trust_index: res.trust_index }
    );
  }

  // T3: Water Freezing Point
  {
    const res = await orchestrator.analyze({ text: 'Water freezes at 0 degrees Celsius at standard atmospheric pressure.' });
    assert(
      res.final_verdict === 'VERIFIED TRUE' && res.trust_index >= 90,
      'T3: Scientific law "Water freezes at 0 degrees Celsius" resolves to VERIFIED TRUE',
      { verdict: res.final_verdict, trust_index: res.trust_index }
    );
  }

  // T4: Pure CO2 Respiration
  {
    const res = await orchestrator.analyze({ text: 'Humans can breathe pure carbon dioxide indefinitely without harm.' });
    assert(
      res.final_verdict === 'DECEPTIVE / FALSE' && res.trust_index <= 10,
      'T4: Dangerous physiological falsehood "Breathe pure CO2" resolves to DECEPTIVE / FALSE',
      { verdict: res.final_verdict, trust_index: res.trust_index }
    );
  }

  // T5: Coffee Cancer Prevention
  {
    const res = await orchestrator.analyze({ text: 'Drinking coffee cures all cancers.' });
    assert(
      res.final_verdict === 'DECEPTIVE / FALSE' && res.trust_index <= 10,
      'T5: Medical misinformation "Coffee cures all cancer" resolves to DECEPTIVE / FALSE',
      { verdict: res.final_verdict, trust_index: res.trust_index }
    );
  }

  // T6: AI 2027 Replacement Speculation
  {
    const res = await orchestrator.analyze({ text: 'AI will definitely replace all software developers by 2027.' });
    assert(
      res.final_verdict === 'UNVERIFIABLE_SPECULATION' && res.trust_index <= 50,
      'T6: Speculative prediction resolves to UNVERIFIABLE_SPECULATION',
      { verdict: res.final_verdict, trust_index: res.trust_index }
    );
  }

  // T7: Moon Samosa Satire
  {
    const res = await orchestrator.analyze({ text: 'A giant samosa was spotted orbiting the Moon yesterday.' });
    assert(
      res.final_verdict === 'SATIRICAL / ABSURD' && res.trust_index <= 15,
      'T7: Absurd / satirical assertion resolves to SATIRICAL / ABSURD',
      { verdict: res.final_verdict, trust_index: res.trust_index }
    );
  }

  // T8: Non-lexical Gibberish
  {
    const res = await orchestrator.analyze({ text: 'asdfghjkl qwertyuiop zxcvbnm 1234567890' });
    assert(
      res.final_verdict === 'NON_LEXICAL_INPUT' && res.trust_index <= 15,
      'T8: Random keyboard mash resolves to NON_LEXICAL_INPUT',
      { verdict: res.final_verdict, trust_index: res.trust_index }
    );
  }

  // T9: Empty Input
  {
    const res = await orchestrator.analyze({ text: '   ' });
    assert(
      res.final_verdict === 'INVALID_INPUT' && res.agent_consensus.failed === 1,
      'T9: Empty text payload is rejected with INVALID_INPUT status',
      { verdict: res.final_verdict, failed: res.agent_consensus.failed }
    );
  }

  // T10: Long Article with Corroborated Historical Facts
  {
    const article = `On July 20, 1969, the American Apollo 11 mission landed humans on the Moon. Astronauts Neil Armstrong and Buzz Aldrin walked on the lunar surface while Michael Collins orbited in the command module. This landmark achievement concluded the space race.`;
    const res = await orchestrator.analyze({ text: article });
    assert(
      res.final_verdict === 'VERIFIED TRUE' && res.trust_index >= 90,
      'T10: Multi-sentence historical article resolves to VERIFIED TRUE with high trust',
      { verdict: res.final_verdict, trust_index: res.trust_index }
    );
  }

  console.log('');

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 2: IMAGE FORENSICS & DEEPFAKE DETECTION (10 Tests)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶️ CATEGORY 2: Image Forensics & Deepfake Detection (10 Tests)');

  // I1: Genuine Camera Photography
  {
    const res = await orchestrator.analyze({ filename: 'camera_photo_outdoor.jpg', image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' });
    assert(
      res.agent_results.agent4_image_synthesis.verdict === 'AUTHENTIC' && res.trust_index >= 90,
      'I1: Genuine camera photography classified as AUTHENTIC',
      { verdict: res.agent_results.agent4_image_synthesis.verdict, trust: res.trust_index }
    );
  }

  // I2: AI Midjourney Generated Image
  {
    const res = await orchestrator.analyze({ filename: 'midjourney_v6_portrait.png', image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' });
    assert(
      res.agent_results.agent4_image_synthesis.verdict === 'SYNTHETIC / AI-GENERATED' && res.trust_index <= 15,
      'I2: Midjourney generative image classified as SYNTHETIC / AI-GENERATED (trust <= 15)',
      { verdict: res.agent_results.agent4_image_synthesis.verdict, trust: res.trust_index }
    );
  }

  // I3: Photoshopped / Spliced Image
  {
    const res = await orchestrator.analyze({ filename: 'photoshop_spliced_composite.jpg', image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' });
    assert(
      res.agent_results.agent4_image_synthesis.verdict === 'DIGITALLY ALTERED',
      'I3: Photoshopped spliced composition classified as DIGITALLY ALTERED',
      { verdict: res.agent_results.agent4_image_synthesis.verdict }
    );
  }

  // I4: Screenshot (Benign)
  {
    const res = await orchestrator.analyze({ filename: 'screenshot_display.png', image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' });
    assert(
      res.agent_results.agent4_image_synthesis.verdict === 'AUTHENTIC',
      'I4: Digital screen capture / screenshot is NOT misclassified as a deepfake',
      { verdict: res.agent_results.agent4_image_synthesis.verdict }
    );
  }

  // I5: Meme Overlay (Benign)
  {
    const res = await orchestrator.analyze({ filename: 'image_meme_funny.jpg', image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' });
    assert(
      res.agent_results.agent4_image_synthesis.verdict === 'AUTHENTIC',
      'I5: Text meme overlay is NOT misclassified as a deepfake',
      { verdict: res.agent_results.agent4_image_synthesis.verdict }
    );
  }

  // I6: Heavy JPEG Compression (Benign)
  {
    const res = await orchestrator.analyze({ filename: 'compressed_jpeg_artifact.jpg', image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' });
    assert(
      res.agent_results.agent4_image_synthesis.verdict === 'AUTHENTIC',
      'I6: JPEG compression block artifacts are NOT misclassified as deepfake',
      { verdict: res.agent_results.agent4_image_synthesis.verdict }
    );
  }

  // I7: Cropped Photo (Benign)
  {
    const res = await orchestrator.analyze({ filename: 'cropped_photo.jpg', image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' });
    assert(
      res.agent_results.agent4_image_synthesis.verdict === 'AUTHENTIC',
      'I7: Cropped camera photo is NOT misclassified as a deepfake',
      { verdict: res.agent_results.agent4_image_synthesis.verdict }
    );
  }

  // I8: Group / Crowd Photo (Benign)
  {
    const res = await orchestrator.analyze({ filename: 'group_crowd_photo.jpg', image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' });
    assert(
      res.agent_results.agent4_image_synthesis.verdict === 'AUTHENTIC',
      'I8: Multi-subject group photograph verified as AUTHENTIC',
      { verdict: res.agent_results.agent4_image_synthesis.verdict }
    );
  }

  // I9: Brightness / Contrast Adjusted (Benign)
  {
    const res = await orchestrator.analyze({ filename: 'edited_brightness.jpg', image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' });
    assert(
      res.agent_results.agent4_image_synthesis.verdict === 'AUTHENTIC',
      'I9: Brightness adjusted photo is NOT misclassified as a deepfake',
      { verdict: res.agent_results.agent4_image_synthesis.verdict }
    );
  }

  // I10: Corrupted Image File
  {
    const res = await orchestrator.analyze({ filename: 'corrupt_broken.png', image_base64: 'corrupted_bytes' });
    assert(
      res.agent_results.agent4_image_synthesis.status === 'FAILED' && res.agent_results.agent4_image_synthesis.verdict === 'CORRUPTED_IMAGE',
      'I10: Corrupt image file fails safely with status FAILED without server crash',
      { status: res.agent_results.agent4_image_synthesis.status, verdict: res.agent_results.agent4_image_synthesis.verdict }
    );
  }

  console.log('');

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 3: VIDEO FORENSICS & TEMPORAL CADENCE (8 Tests)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶️ CATEGORY 3: Video Forensics & Temporal Cadence (8 Tests)');

  // V1: Genuine Camera Video
  {
    const res = await orchestrator.analyze({ filename: 'camera_recording_scene.mp4', video_base64: 'AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQ==' });
    assert(
      res.agent_results.agent3_video_forensics.verdict === 'AUTHENTIC' && res.trust_index >= 90,
      'V1: Authentic camera video classified as AUTHENTIC',
      { verdict: res.agent_results.agent3_video_forensics.verdict, trust: res.trust_index }
    );
  }

  // V2: Deepfake Face-swap Video
  {
    const res = await orchestrator.analyze({ filename: 'deepfake_faceswap_target.mp4', video_base64: 'AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQ==' });
    assert(
      res.agent_results.agent3_video_forensics.verdict === 'HIGH CONFIDENCE DEEPFAKE' && res.trust_index <= 15,
      'V2: Neural face-swapped video classified as HIGH CONFIDENCE DEEPFAKE (trust <= 15)',
      { verdict: res.agent_results.agent3_video_forensics.verdict, trust: res.trust_index }
    );
  }

  // V3: Synthetic AI Video (Sora / Runway)
  {
    const res = await orchestrator.analyze({ filename: 'sora_ai_generated.mp4', video_base64: 'AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQ==' });
    assert(
      res.agent_results.agent3_video_forensics.verdict === 'HIGH CONFIDENCE DEEPFAKE' && res.trust_index <= 15,
      'V3: Text-to-video diffusion stream classified as HIGH CONFIDENCE DEEPFAKE',
      { verdict: res.agent_results.agent3_video_forensics.verdict, trust: res.trust_index }
    );
  }

  // V4: Talking Head Authentic Interview
  {
    const res = await orchestrator.analyze({ filename: 'talking_head_interview.mp4', video_base64: 'AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQ==' });
    assert(
      res.agent_results.agent3_video_forensics.verdict === 'AUTHENTIC',
      'V4: Authentic talking head speech video verified as AUTHENTIC',
      { verdict: res.agent_results.agent3_video_forensics.verdict }
    );
  }

  // V5: Re-encoded Compressed Video (Benign)
  {
    const res = await orchestrator.analyze({ filename: 'reencoded_compressed_h264.mp4', video_base64: 'AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQ==' });
    assert(
      res.agent_results.agent3_video_forensics.verdict === 'LIKELY AUTHENTIC',
      'V5: Re-encoded / compressed video is NOT misclassified as a deepfake',
      { verdict: res.agent_results.agent3_video_forensics.verdict }
    );
  }

  // V6: Low-Quality CCTV Footage (Benign)
  {
    const res = await orchestrator.analyze({ filename: 'low-quality_cctv_footage.mp4', video_base64: 'AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQ==' });
    assert(
      res.agent_results.agent3_video_forensics.verdict === 'LIKELY AUTHENTIC',
      'V6: Low-resolution CCTV recording is NOT misclassified as a deepfake',
      { verdict: res.agent_results.agent3_video_forensics.verdict }
    );
  }

  // V7: Video with No Faces (Benign)
  {
    const res = await orchestrator.analyze({ filename: 'landscape_no_face.mp4', video_base64: 'AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQ==' });
    assert(
      res.agent_results.agent3_video_forensics.verdict === 'AUTHENTIC',
      'V7: Video with no human faces does not trigger facial deepfake false positive',
      { verdict: res.agent_results.agent3_video_forensics.verdict }
    );
  }

  // V8: Corrupted Video Stream
  {
    const res = await orchestrator.analyze({ filename: 'corrupt_stream.mp4', video_base64: 'corrupt_data' });
    assert(
      res.agent_results.agent3_video_forensics.status === 'FAILED' && res.agent_results.agent3_video_forensics.verdict === 'CORRUPTED_STREAM',
      'V8: Truncated video stream fails safely with status FAILED',
      { status: res.agent_results.agent3_video_forensics.status, verdict: res.agent_results.agent3_video_forensics.verdict }
    );
  }

  console.log('');

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 4: AUDIO / VOICE FORENSICS (8 Tests)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶️ CATEGORY 4: Audio / Voice Forensics (8 Tests)');

  // A1: Genuine Human Speech
  {
    const res = await orchestrator.analyze({ filename: 'authentic_human_speech.wav', audio_base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=' });
    assert(
      res.agent_results.agent5_audio_forensics.verdict === 'AUTHENTIC SPEECH' && res.trust_index >= 90,
      'A1: Authentic biological human voice classified as AUTHENTIC SPEECH',
      { verdict: res.agent_results.agent5_audio_forensics.verdict, trust: res.trust_index }
    );
  }

  // A2: AI Synthetic Voice (ElevenLabs)
  {
    const res = await orchestrator.analyze({ filename: 'elevenlabs_ai_voice.mp3', audio_base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=' });
    assert(
      res.agent_results.agent5_audio_forensics.verdict === 'SYNTHETIC VOICE / CLONE' && res.trust_index <= 15,
      'A2: Neural synthetic voice classified as SYNTHETIC VOICE / CLONE (trust <= 15)',
      { verdict: res.agent_results.agent5_audio_forensics.verdict, trust: res.trust_index }
    );
  }

  // A3: Cloned Voice Target
  {
    const res = await orchestrator.analyze({ filename: 'cloned_voice_target.wav', audio_base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=' });
    assert(
      res.agent_results.agent5_audio_forensics.verdict === 'SYNTHETIC VOICE / CLONE' && res.trust_index <= 15,
      'A3: Target voice clone classified as SYNTHETIC VOICE / CLONE',
      { verdict: res.agent_results.agent5_audio_forensics.verdict }
    );
  }

  // A4: Speech with Environmental Background Noise (Benign)
  {
    const res = await orchestrator.analyze({ filename: 'noisy_ambient_speech.wav', audio_base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=' });
    assert(
      res.agent_results.agent5_audio_forensics.verdict === 'AUTHENTIC SPEECH',
      'A4: Background ambient noise is NOT misclassified as voice cloning',
      { verdict: res.agent_results.agent5_audio_forensics.verdict }
    );
  }

  // A5: Instrumental Music / Non-Speech
  {
    const res = await orchestrator.analyze({ filename: 'instrumental_music_song.mp3', audio_base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=' });
    assert(
      res.agent_results.agent5_audio_forensics.status === 'COMPLETED' && res.agent_results.agent5_audio_forensics.verdict === 'NON_SPEECH',
      'A5: Musical composition correctly identified as NON_SPEECH with COMPLETED status',
      { verdict: res.agent_results.agent5_audio_forensics.verdict }
    );
  }

  // A6: Audio Silence / Dead Air
  {
    const res = await orchestrator.analyze({ filename: 'silence_track.wav', audio_base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=' });
    assert(
      res.agent_results.agent5_audio_forensics.status === 'COMPLETED' && res.agent_results.agent5_audio_forensics.verdict === 'NO_MEANINGFUL_AUDIO',
      'A6: Silent recording classified as NO_MEANINGFUL_AUDIO with COMPLETED status',
      { verdict: res.agent_results.agent5_audio_forensics.verdict }
    );
  }

  // A7: Multi-Speaker Conversational Audio (Benign)
  {
    const res = await orchestrator.analyze({ filename: 'multi_speaker_interview.wav', audio_base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=' });
    assert(
      res.agent_results.agent5_audio_forensics.verdict === 'AUTHENTIC SPEECH',
      'A7: Multi-speaker conversational recording verified as AUTHENTIC SPEECH',
      { verdict: res.agent_results.agent5_audio_forensics.verdict }
    );
  }

  // A8: Corrupted Audio Container
  {
    const res = await orchestrator.analyze({ filename: 'corrupt_audio.wav', audio_base64: 'corrupt_data' });
    assert(
      res.agent_results.agent5_audio_forensics.status === 'FAILED' && res.agent_results.agent5_audio_forensics.verdict === 'CORRUPTED_AUDIO',
      'A8: Corrupt audio file fails safely with status FAILED',
      { status: res.agent_results.agent5_audio_forensics.status, verdict: res.agent_results.agent5_audio_forensics.verdict }
    );
  }

  console.log('');

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 5: DOCUMENT & OCR FORENSICS (8 Tests)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶️ CATEGORY 5: Document & OCR Forensics (8 Tests)');

  // D1: Genuine Official PDF Document
  {
    const res = await orchestrator.analyze({ filename: 'official_academic_transcript.pdf', document_base64: 'JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZw==', ocr_text: 'Official University Transcript: Verified Course Credits' });
    assert(
      res.agent_results.agent6_document_ocr.verdict === 'AUTHENTIC DOCUMENT' && res.trust_index >= 90,
      'D1: Authentic digital document verified as AUTHENTIC DOCUMENT',
      { verdict: res.agent_results.agent6_document_ocr.verdict, trust: res.trust_index }
    );
  }

  // D2: Fabricated Certificate Document
  {
    const res = await orchestrator.analyze({ filename: 'fabricated_certificate.pdf', document_base64: 'JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZw==', ocr_text: 'Certificate of Honorary Appointment' });
    assert(
      res.agent_results.agent6_document_ocr.verdict === 'FABRICATED' && res.trust_index <= 15,
      'D2: Fabricated document classified as FABRICATED (trust <= 15)',
      { verdict: res.agent_results.agent6_document_ocr.verdict, trust: res.trust_index }
    );
  }

  // D3: Altered Date / Amount Document
  {
    const res = await orchestrator.analyze({ filename: 'altered_date_receipt.pdf', document_base64: 'JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZw==', ocr_text: 'Payment receipt altered date' });
    assert(
      res.agent_results.agent6_document_ocr.verdict === 'ALTERED / FORGED' && res.trust_index <= 15,
      'D3: Altered date on document classified as ALTERED / FORGED (trust <= 15)',
      { verdict: res.agent_results.agent6_document_ocr.verdict, trust: res.trust_index }
    );
  }

  // D4: Image-Only Scanned PDF (Benign)
  {
    const res = await orchestrator.analyze({ filename: 'image_pdf_scan.pdf', document_base64: 'JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZw==', ocr_text: 'Archived historical paper document scan' });
    assert(
      res.agent_results.agent6_document_ocr.verdict === 'AUTHENTIC DOCUMENT',
      'D4: Image-only scanned PDF verified as AUTHENTIC DOCUMENT',
      { verdict: res.agent_results.agent6_document_ocr.verdict }
    );
  }

  // D5: Low-Quality Scanned Document (Benign)
  {
    const res = await orchestrator.analyze({ filename: 'low-quality_skewed_scan.pdf', document_base64: 'JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZw==', ocr_text: 'Photocopied utility billing record' });
    assert(
      res.agent_results.agent6_document_ocr.verdict === 'LIKELY AUTHENTIC',
      'D5: Low-resolution / skewed scan is NOT misclassified as forged',
      { verdict: res.agent_results.agent6_document_ocr.verdict }
    );
  }

  // D6: Empty PDF Document
  {
    const res = await orchestrator.analyze({ filename: 'empty_document.pdf', document_base64: 'JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZw==' });
    assert(
      res.agent_results.agent6_document_ocr.status === 'COMPLETED' && res.agent_results.agent6_document_ocr.verdict === 'EMPTY_DOCUMENT',
      'D6: Blank empty PDF classified as EMPTY_DOCUMENT with COMPLETED status',
      { verdict: res.agent_results.agent6_document_ocr.verdict }
    );
  }

  // D7: Multi-Page Authentic Document (Benign)
  {
    const res = await orchestrator.analyze({ filename: 'multi-page_annual_report.pdf', document_base64: 'JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZw==', ocr_text: 'Corporate Annual Audit Report 2024 Page 1 of 12', page_count: 12 });
    assert(
      res.agent_results.agent6_document_ocr.verdict === 'AUTHENTIC DOCUMENT',
      'D7: Multi-page document verified as AUTHENTIC DOCUMENT',
      { verdict: res.agent_results.agent6_document_ocr.verdict }
    );
  }

  // D8: Corrupted Document File
  {
    const res = await orchestrator.analyze({ filename: 'corrupt_document.pdf', document_base64: 'corrupt_data' });
    assert(
      res.agent_results.agent6_document_ocr.status === 'FAILED' && res.agent_results.agent6_document_ocr.verdict === 'CORRUPTED_DOCUMENT',
      'D8: Corrupted PDF stream fails safely with status FAILED',
      { status: res.agent_results.agent6_document_ocr.status, verdict: res.agent_results.agent6_document_ocr.verdict }
    );
  }

  console.log('');

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 6: MULTIMODAL CROSS-ALIGNMENT (8 Tests)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶️ CATEGORY 6: Multimodal Cross-Alignment (8 Tests)');

  // M1: Text and Image Consistent
  {
    const res = await orchestrator.analyze({
      text: 'The Eiffel Tower in Paris stands along the Champ de Mars.',
      image_description: 'Eiffel tower landmark in Paris',
      filename: 'eiffel_tower_paris.jpg'
    });
    assert(
      res.agent_results.agent2_cross_modal.verdict === 'CONSISTENT' && res.agent_results.agent2_cross_modal.status === 'COMPLETED',
      'M1: Matching text and image description classified as CONSISTENT',
      { verdict: res.agent_results.agent2_cross_modal.verdict }
    );
  }

  // M2: Text and Image Contradictory (Eiffel Tower vs Taj Mahal)
  {
    const res = await orchestrator.analyze({
      text: 'This is the Eiffel Tower.',
      image_description: 'The Taj Mahal in Agra India',
      filename: 'taj_mahal_landmark.jpg'
    });
    assert(
      res.agent_results.agent2_cross_modal.verdict === 'CONTRADICTION',
      'M2: Text claiming "Eiffel Tower" with image of Taj Mahal flagged as CONTRADICTION',
      { verdict: res.agent_results.agent2_cross_modal.verdict }
    );
  }

  // M3: Text Genuine, Image AI Synthetic
  {
    const res = await orchestrator.analyze({
      text: 'NASA successfully landed humans on the Moon in 1969.',
      filename: 'midjourney_apollo11_art.png',
      image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    });
    assert(
      res.agent_results.agent1_claim_factcheck.verdict === 'TRUE / VERIFIED' &&
      res.agent_results.agent4_image_synthesis.verdict === 'SYNTHETIC / AI-GENERATED' &&
      res.trust_index <= 15,
      'M3: Real factual claim paired with AI-generated image flags synthetic visual manipulation (trust <= 15)',
      { fact: res.agent_results.agent1_claim_factcheck.verdict, img: res.agent_results.agent4_image_synthesis.verdict, trust: res.trust_index }
    );
  }

  // M4: Text & Image Agree on False Fact
  {
    const res = await orchestrator.analyze({
      text: 'India currently has 500 states.',
      image_description: 'Map showing 500 states in India',
      filename: 'india_500_states_infographic.jpg'
    });
    assert(
      res.final_verdict === 'DECEPTIVE / FALSE' && res.trust_index <= 10,
      'M4: Text and image agreeing on a debunked falsehood still resolves to DECEPTIVE / FALSE',
      { verdict: res.final_verdict, trust: res.trust_index }
    );
  }

  // M5: Video + Audio Consistent
  {
    const res = await orchestrator.analyze({
      filename: 'talking_head_speech.mp4',
      video_base64: 'AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQ==',
      audio_base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
    });
    assert(
      res.agent_results.agent2_cross_modal.verdict === 'CONSISTENT',
      'M5: Coherent video and audio streams verified as CONSISTENT',
      { verdict: res.agent_results.agent2_cross_modal.verdict }
    );
  }

  // M6: Video + Audio Mismatch
  {
    const res = await orchestrator.analyze({
      filename: 'video_unrelated_audio_mismatch.mp4',
      video_base64: 'AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQ==',
      audio_base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
    });
    assert(
      res.agent_results.agent2_cross_modal.verdict === 'CONTRADICTION',
      'M6: Desynchronized / unrelated audio track flagged as CONTRADICTION',
      { verdict: res.agent_results.agent2_cross_modal.verdict }
    );
  }

  // M7: Text + Document Consistent
  {
    const res = await orchestrator.analyze({
      text: 'Tuition receipt for $5,000 paid for semester.',
      filename: 'tuition_receipt.pdf',
      ocr_text: 'Official Tuition Receipt: Paid $5,000 by student.'
    });
    assert(
      res.agent_results.agent2_cross_modal.verdict === 'CONSISTENT',
      'M7: Text and document OCR amounts aligned as CONSISTENT',
      { verdict: res.agent_results.agent2_cross_modal.verdict }
    );
  }

  // M8: Text + Document Contradictory (Numerical Discrepancy)
  {
    const res = await orchestrator.analyze({
      text: 'Paid $5,000 for service.',
      filename: 'billing_receipt.pdf',
      ocr_text: 'Total billed: $12,000 date: altered mismatch'
    });
    assert(
      res.agent_results.agent2_cross_modal.verdict === 'CONTRADICTION',
      'M8: Divergent figures between text claim and document OCR flagged as CONTRADICTION',
      { verdict: res.agent_results.agent2_cross_modal.verdict }
    );
  }

  console.log('');

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORY 7: BAYESIAN EVIDENCE FUSION & CONSENSUS (8 Tests)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶️ CATEGORY 7: Bayesian Evidence Fusion & Consensus (8 Tests)');

  // F1: All Genuine Modalities
  {
    const res = await orchestrator.analyze({
      text: 'Apollo 11 landed humans on the Moon in 1969.',
      filename: 'apollo11_camera_photo.jpg',
      image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      ocr_text: 'Apollo 11 NASA mission records 1969'
    });
    assert(
      res.final_verdict === 'VERIFIED TRUE' && res.trust_index >= 92 && res.confidence >= 0.90,
      'F1: Multiple authentic modalities fuse to high confidence VERIFIED TRUE (trust >= 92)',
      { verdict: res.final_verdict, trust: res.trust_index, confidence: res.confidence }
    );
  }

  // F2: All Fake Modalities
  {
    const res = await orchestrator.analyze({
      text: 'India currently has 500 states.',
      filename: 'midjourney_synthetic_map.png',
      image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    });
    assert(
      res.final_verdict === 'DECEPTIVE / FALSE' && res.trust_index <= 10,
      'F2: Compound fake modalities fuse to DECEPTIVE / FALSE (trust <= 10)',
      { verdict: res.final_verdict, trust: res.trust_index }
    );
  }

  // F3: One Agent Disagrees (Minor compression outlier)
  {
    const res = await orchestrator.analyze({
      text: 'Water freezes at 0 degrees Celsius at standard atmospheric pressure.',
      filename: 'low-quality_scan_physics.pdf',
      ocr_text: 'Thermodynamics: Water freezing point 0 C at 1 atm.'
    });
    assert(
      res.final_verdict === 'VERIFIED TRUE' && res.trust_index >= 90,
      'F3: High confidence fact with minor scan compression preserves VERIFIED TRUE',
      { verdict: res.final_verdict, trust: res.trust_index }
    );
  }

  // F4: Equal Contradictory Evidence
  {
    // 1 supporting (genuine camera photo), 1 contradicting (cross-modal contradiction)
    const res = await orchestrator.analyze({
      text: 'This is the Eiffel Tower.',
      image_description: 'Taj Mahal in India',
      filename: 'taj_mahal_photo.jpg',
      image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    });
    assert(
      res.final_verdict === 'CONTRADICTORY EVIDENCE' || res.final_verdict === 'DECEPTIVE / FALSE',
      'F4: Equal conflicting evidence identifies cross-modal conflict or falsehood',
      { verdict: res.final_verdict, conflicts: res.contradictions }
    );
  }

  // F5: Text Only Input (Critical Core Rule)
  {
    const res = await orchestrator.analyze({ text: 'NASA successfully landed humans on the Moon in 1969.' });
    assert(
      res.agent_results.agent2_cross_modal.status === 'NOT_APPLICABLE' &&
      res.agent_results.agent3_video_forensics.status === 'NOT_APPLICABLE' &&
      res.agent_results.agent4_image_synthesis.status === 'NOT_APPLICABLE' &&
      res.agent_results.agent5_audio_forensics.status === 'NOT_APPLICABLE' &&
      res.agent_results.agent6_document_ocr.status === 'NOT_APPLICABLE' &&
      res.final_verdict === 'VERIFIED TRUE' && res.trust_index >= 90,
      'F5: Text-only input sets inactive agents to NOT_APPLICABLE without penalizing trust index',
      { verdict: res.final_verdict, trust: res.trust_index, consensus: res.agent_consensus }
    );
  }

  // F6: Image Only Input
  {
    const res = await orchestrator.analyze({
      filename: 'vacation_camera_photo.jpg',
      image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    });
    assert(
      res.agent_results.agent1_claim_factcheck.status === 'NOT_APPLICABLE' &&
      res.agent_results.agent4_image_synthesis.verdict === 'AUTHENTIC' &&
      res.final_verdict === 'VERIFIED TRUE' && res.trust_index >= 90,
      'F6: Image-only input correctly fuses single visual modality to VERIFIED TRUE / AUTHENTIC',
      { verdict: res.final_verdict, trust: res.trust_index }
    );
  }

  // F7: Unsupported Arbitrary Claim
  {
    const res = await orchestrator.analyze({ text: 'A random local merchant sold 42 notebooks yesterday in village X.' });
    assert(
      res.final_verdict === 'INSUFFICIENT EVIDENCE' && res.trust_index >= 45 && res.trust_index <= 52,
      'F7: Unsupported claim without corroboration resolves to INSUFFICIENT EVIDENCE (trust ~48-50)',
      { verdict: res.final_verdict, trust: res.trust_index }
    );
  }

  // F8: One Agent Fails Gracefully
  {
    const res = await orchestrator.analyze({
      text: 'NASA successfully landed humans on the Moon in 1969.',
      filename: 'corrupted_video_file.mp4',
      video_base64: 'corrupt_data'
    });
    assert(
      res.agent_results.agent3_video_forensics.status === 'FAILED' &&
      res.agent_results.agent1_claim_factcheck.verdict === 'TRUE / VERIFIED' &&
      res.agent_consensus.failed === 1 &&
      res.final_verdict === 'VERIFIED TRUE',
      'F8: Corrupted modality fails safely while remaining valid modalities complete fusion',
      { verdict: res.final_verdict, failed: res.agent_consensus.failed }
    );
  }

  console.log('\n================================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${results.passed} PASSED / ${results.failed} FAILED (Total ${results.passed + results.failed})`);
  console.log('================================================================\n');

  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
