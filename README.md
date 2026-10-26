# TruthGuard

TruthGuard separates factual verification, source metadata, scam indicators, and media measurements. It does not invent authenticity percentages or infer truth from filenames.

## Run

Use Node.js 22.13 or newer. Run `npm ci`, then `npm start`. Open http://localhost:8080 (or the configured PORT). Set GEMINI_API_KEY on the server for grounded factual verification and image/text comparison. GEMINI_MODEL defaults to gemini-2.5-flash. Without a working key those analyses explicitly report insufficient evidence.

## Analysis roles

Seven primary roles cover claim extraction, cross-modal comparison, video inspection, image inspection, source metadata, scam indicators, and factual verification. Auxiliary audio inspection and document extraction feed the report. Each role returns applicability, execution status, evidence, and limitations independently.

Images are decoded with Sharp, with actual dimensions, pixel statistics, regions, and re-encoding residuals. Videos are probed and decoded with FFmpeg; sampled frames support measured temporal differences. Audio is decoded into PCM for signal measurements. PDFs use PDF.js; scanned pages and image documents use Tesseract English OCR. OCR confidence measures recognition, not truth.

**No validated deepfake model weights were found in the repository.** Image, video, and audio authenticity remains uncertain. Pixel statistics, compression residuals, and frame differences are not calibrated deepfake detectors. Cross-modal image comparison uses a general-purpose model and has no calibrated probability. Video/audio semantic comparison and voice-clone classification are unavailable.

Factual verification uses Gemini Search grounding, retrieves public source pages, and requires matching source quotations before accepting evidence. A second model evaluates the claim/evidence relationship. Retrieval failures, missing sources, unsupported claims, and conflicts remain explicit. Model judgments can still be incorrect; inspect the linked evidence. Scam rules detect explicit English persuasion patterns and are not a comprehensive fraud classifier.

## API

POST `/api/investigate` accepts JSON with text, url, image_base64, video_base64, audio_base64, document_base64, or ocr_text. Optional crop coordinates operate on decoded image pixels. Upload bytes must be canonical base64. Overall decoded media is limited to 12 MB, images to 24 MP, media duration to 120 seconds, and PDF extraction to 10 pages.

GET `/api/health` reports version and configured capabilities. GET `/api/investigation/{id}` and its `/agents` and `/evidence` endpoints require the originating session cookie. Reports are held in memory for one hour and disappear on restart. There is no durable account history. Public debug listing endpoints have been removed.

Remote sources are restricted to public HTTP/S addresses, with DNS pinning and redirect validation. Requests, downloads, media subprocesses, document workers, and model calls have bounds. The service permits one active investigation per process to limit memory pressure. Capacity limits return retryable errors. Do not treat this prototype as a multi-tenant production service without load testing and operational controls.

## Validation

`npm test` runs 159 tests covering real generated media decoding, transformations, scanned-PDF OCR, schema validation, evidence policy, and session isolation. `pytest -q` runs the same Node suite through a bridge. Provider unit tests use explicit doubles. Generated fixtures are functional tests, not a labelled authenticity benchmark. No Taj Mahal fixture or validated deepfake benchmark is included.

`npm run test:live -- https://truthguard-4the.onrender.com outputs/live-check.json` checks deployed APIs, including grounded factual examples. Those checks fail when a configured provider cannot produce evidence; they do not silently substitute canned answers.

## Render

The existing TruthGuard service must use an empty Root Directory, `npm ci --omit=dev` as Build Command, and `node server.js` as Start Command. Use Node 22.22.0 or newer, NODE_ENV=production, OCR_ENABLED=true, and a server-side GEMINI_API_KEY. The server binds to Render's PORT. Health path is `/api/health`.

render.yaml documents the intended configuration. Review service identity before applying a Blueprint to an existing account; do not create duplicate services inadvertently. The old standalone agent folders and nested server have been removed so there is one application entry point.
