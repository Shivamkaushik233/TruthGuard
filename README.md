# 🛡️ TruthGuard

### Towards Automated Real-Time Detection of Digital Deception Through Multi-Modal AI

**TruthGuard** is a multi-modal digital deception analysis platform designed to investigate potentially misleading **text, images, videos, audio, documents, URLs, and source information**.

Instead of producing unsupported authenticity percentages, TruthGuard separates **factual verification, source metadata, scam indicators, and measurable media analysis** and reports the available evidence, execution status, and limitations of each analysis independently.

🔗 **Live Demo:** https://projectminor.onrender.com/

---

## 🚀 Key Features

- 🔎 **Factual Claim Verification**
- 🖼️ **Image Analysis**
- 🎥 **Video Analysis**
- 🎙️ **Audio Analysis**
- 📄 **Document & PDF Analysis**
- 🌐 **Source Metadata Analysis**
- 🚨 **Scam Indicator Detection**
- 🔗 **Cross-Modal Comparison**
- 🤖 **AI-Assisted Evidence Evaluation**
- 📊 **Evidence-Based Investigation Reports**
- 🔐 **Session-Isolated Investigation Reports**
- ⚡ **Deployed REST API**
- 🧪 **159 Automated Tests**

---

## 🧠 Multi-Agent Analysis Pipeline

TruthGuard uses multiple specialized analysis roles rather than relying on a single model or verdict.

```text
                    ┌─────────────────────┐
                    │   User Input        │
                    │ Text / URL / Media  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Investigation API   │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
   Claim Extraction      Media Inspection    Source Analysis
          │                    │                    │
          ▼                    ▼                    ▼
   Factual Verification  Image/Video/Audio   Metadata Analysis
          │                    │                    │
          └────────────────────┼────────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │ Evidence Evaluation │
                    └──────────┬──────────┘
                               ▼
                    ┌─────────────────────┐
                    │ Investigation Report│
                    └─────────────────────┘
```

### Primary Analysis Roles

TruthGuard contains seven primary analysis roles covering:

1. **Claim Extraction**
2. **Cross-Modal Comparison**
3. **Video Inspection**
4. **Image Inspection**
5. **Source Metadata**
6. **Scam Indicators**
7. **Factual Verification**

Additional **audio inspection** and **document extraction** capabilities feed into the investigation report.

---

## 🤖 AI & Analysis Technologies

### Factual Verification

TruthGuard uses **Gemini Search grounding** to retrieve public source pages and evaluate factual claims.

The verification pipeline requires matching source quotations before evidence is accepted.

A second model evaluates the relationship between:

```text
Claim → Retrieved Evidence → Source → Model Evaluation
```

Retrieval failures, unsupported claims, missing sources, and conflicting evidence remain explicitly reported.

> AI-generated judgments may still be incorrect. Users should inspect the linked evidence.

---

## 🖼️ Image Analysis

Images are processed using **Sharp** for measurable media analysis.

The system can inspect:

- Image dimensions
- Pixel statistics
- Image regions
- Re-encoding residuals
- Cross-modal image comparisons

TruthGuard deliberately does **not** represent these measurements as calibrated deepfake probabilities.

---

## 🎥 Video Analysis

Videos are processed using **FFmpeg**.

The system performs:

- Video probing
- Frame decoding
- Sampled-frame analysis
- Temporal difference measurements

Frame differences are treated as measurable signals rather than a validated deepfake classifier.

---

## 🎙️ Audio Analysis

Audio is decoded into PCM data for signal-level measurements.

The platform currently does not claim validated:

- Voice-clone classification
- Audio authenticity probability
- Full semantic voice verification

---

## 📄 Document & OCR Analysis

PDF documents are processed using **PDF.js**.

For scanned pages and image-based documents, TruthGuard uses **Tesseract English OCR**.

OCR confidence represents **recognition confidence**, not factual truth.

```text
PDF / Image Document
        ↓
   PDF.js / OCR
        ↓
 Extracted Text
        ↓
 Claim Analysis
        ↓
 Evidence Verification
```

---

## 🚨 Scam Indicator Detection

TruthGuard contains rule-based scam indicator detection for explicit English persuasion patterns.

It can identify suspicious patterns such as:

- Urgency
- Pressure-based language
- Suspicious requests
- Persuasive scam-like wording

This is a **rule-based indicator system**, not a comprehensive fraud classifier.

---

## 🔬 Evidence-First Architecture

A major design principle of TruthGuard is:

> **Do not manufacture certainty when evidence is unavailable.**

The system explicitly reports:

- Applicability
- Execution status
- Evidence
- Limitations
- Retrieval failures
- Unsupported claims
- Conflicting evidence

If a required provider or evidence source is unavailable, the system reports **insufficient evidence** rather than generating a fabricated verdict.

---

## 🔐 Security & Resource Controls

TruthGuard includes several protections around remote sources and resource consumption.

### Remote Source Protection

Remote sources are restricted to public:

```text
HTTP / HTTPS
```

The service performs:

- DNS pinning
- Redirect validation
- Request bounds
- Download limits

### Media Limits

| Resource | Limit |
|---|---:|
| Overall decoded media | 12 MB |
| Images | 24 MP |
| Media duration | 120 seconds |
| PDF extraction | 10 pages |
| Active investigations | 1 per process |

Investigation reports are held in memory for **one hour** and disappear when the service restarts.

There is currently no durable account history.

---

## 🔌 API

### Investigate

```http
POST /api/investigate
```

Accepts JSON containing one or more of:

```text
text
url
image_base64
video_base64
audio_base64
document_base64
ocr_text
```

Optional crop coordinates can be supplied for decoded images.

Uploaded media must use canonical Base64 encoding.

---

### Health Check

```http
GET /api/health
```

Returns service version and configured capabilities.

---

### Investigation

```http
GET /api/investigation/{id}
```

Additional endpoints:

```http
GET /api/investigation/{id}/agents
GET /api/investigation/{id}/evidence
```

Investigation endpoints require the originating session cookie.

---

## 🧪 Testing

TruthGuard currently contains **159 automated tests**.

Run:

```bash
npm test
```

The test suite covers:

- Real generated media decoding
- Media transformations
- Scanned-PDF OCR
- Schema validation
- Evidence policy
- Session isolation
- Provider behavior

You can also run:

```bash
pytest -q
```

which executes the Node test suite through the project's bridge.

### Live Deployment Tests

```bash
npm run test:live -- https://truthguard-4the.onrender.com
```

The live checks validate deployed APIs, including grounded factual examples.

Provider failures are surfaced instead of being silently replaced with canned responses.

---

## 🛠️ Tech Stack

### Backend

- Node.js
- Express
- REST API

### AI

- Gemini
- Gemini Search Grounding
- Model-based evidence evaluation

### Media Processing

- Sharp
- FFmpeg
- PDF.js
- Tesseract OCR

### Frontend

- HTML
- JavaScript

### Testing

- Node.js Test Suite
- Pytest Bridge

### Deployment

- Render

---

## ⚙️ Local Setup

### Requirements

- Node.js **22.13+**
- Gemini API key for grounded factual verification and image/text comparison

### 1. Clone the repository

```bash
git clone https://github.com/Shivamkaushik233/TruthGuard.git
cd TruthGuard
```

### 2. Install dependencies

```bash
npm ci
```

### 3. Configure environment variables

Create a `.env` file:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash
OCR_ENABLED=true
NODE_ENV=development
```

### 4. Start the application

```bash
npm start
```

Open:

```text
http://localhost:8080
```

The application uses the configured `PORT` environment variable when deployed.

---

## ☁️ Render Deployment

The repository includes:

```text
render.yaml
```

Recommended production configuration:

```text
Root Directory: empty
Build Command: npm ci --omit=dev
Start Command: node server.js
Node Version: 22.22.0+
NODE_ENV: production
OCR_ENABLED: true
GEMINI_API_KEY: configured server-side
Health Check: /api/health
```

The server binds to Render's assigned `PORT`.

---

## ⚠️ Current Limitations

TruthGuard is an **evidence-oriented prototype**, not a certified forensic authenticity system.

The repository does **not** contain validated deepfake model weights.

Therefore:

- Image authenticity is not definitively classified.
- Video authenticity is not definitively classified.
- Audio authenticity is not definitively classified.
- Pixel statistics are not calibrated deepfake detection.
- Compression residuals are not calibrated deepfake detection.
- Frame differences are not calibrated deepfake detection.
- Cross-modal comparison does not provide calibrated probabilities.
- Voice-clone classification is unavailable.
- Scam detection is not a complete fraud classifier.
- AI-generated factual judgments may still be incorrect.

These limitations are intentionally surfaced instead of hidden.

---

## 📈 Testing Philosophy

The generated media fixtures included in the repository are intended for **functional testing**.

They are **not a labelled authenticity benchmark**.

TruthGuard therefore avoids making unsupported claims such as:

```text
"This image is 97% real."
"This video is definitely fake."
```

Instead, the system reports measurable evidence and clearly identifies uncertainty.

---

## 📁 Project Structure

```text
TruthGuard/
│
├── .github/
│   └── workflows/
│
├── engine/
│
├── public/
│
├── test/
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── render.yaml
├── server.js
└── README.md
```

---

## 🌐 Live Application

### 🚀 Try TruthGuard

**https://projectminor.onrender.com/**

The deployed application demonstrates the investigation workflow and multi-modal analysis capabilities.

---

## 🎯 Project Objective

TruthGuard aims to provide an evidence-driven approach to analyzing potentially deceptive digital content.

Instead of treating AI as an unquestionable source of truth, the system focuses on:

```text
Evidence
   ↓
Verification
   ↓
Independent Analysis
   ↓
Limitations
   ↓
Transparent Investigation Report
```

---

## 👨‍💻 Author

### Shivam Kaushik

**B.Tech Computer Science & Engineering — VIT Vellore**  
**Batch of 2027**

GitHub: **@Shivamkaushik233**

---

## ⭐ Support

If you find TruthGuard interesting, consider giving the repository a ⭐ and exploring the project.

**TruthGuard — Evidence before certainty.**
