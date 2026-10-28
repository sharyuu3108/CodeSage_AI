# 🧙‍♂️ CodeSage AI

<p align="center">
  <strong>An Intelligent, Multi-Modal Developer Platform for Automated Code Review, Static Analysis, Algorithmic Optimization, and Cross-Language Transpilation.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Monaco_Editor-VS_Code_Core-007ACC?logo=visualstudiocode&logoColor=white" alt="Monaco Editor" />
  <img src="https://img.shields.io/badge/Google_Gemini-3.8_Flash-4285F4?logo=google&logoColor=white" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/Tests-34%2F34_Passing-success?logo=vitest&logoColor=white" alt="Vitest Passing" />
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License" />
</p>

---

## 🌟 Overview

**CodeSage AI** is a modern, developer-centric platform designed to elevate code quality, audit security vulnerabilities, and streamline refactoring. Built on a decoupled **React 18 (Vite)** frontend with **Monaco Editor** and a robust **Node.js/Express** backend, it pairs local AST heuristic analysis with the intelligence of **Google Gemini AI**.

Whether you're a senior engineer conducting production audits or a beginner learning clean code principles, CodeSage AI adapts to your understanding level through dual technical and intuitive explanation modes.

---

## ✨ Key Features

### 🔍 1. AI Code Review & Vulnerability Assessment
* **Dual Explanation Modes**:
  * 💻 **Developer Mode**: In-depth technical AST breakdown, cyclomatic complexity calculations, maintainability rating ($A \rightarrow F$), line-by-line diagnostics, and engineering remediation standards.
  * 📖 **Beginner Story Mode**: Simplifies complex bugs using everyday real-world analogies (e.g., *"The Secret Key Taped to the Front Door"*, *"The Shouting Waiter in a Quiet Restaurant"*, *"Searching Every Pocket in Every Closet"*).
* **🎧 Audio Narration (TTS)**: Built-in text-to-speech engine allows beginners to listen to analogies explained aloud like an interactive audio lesson.
* **📍 Monaco Editor In-Line Highlighting & Click-to-Jump**:
  * Live squiggly diagnostic underlines and error markers with detailed hover tooltips.
  * Clickable `Line X ↗` badges and carousel navigation that smoothly center and highlight the offending line in the editor viewport.
* **↔️ Compact Horizontal Issue Carousel**: Clean, horizontal carousel with header arrow toggles, status pills, and keyboard shortcut support (<kbd>←</kbd> / <kbd>→</kbd>).
* **📄 Exportable Audit Reports**: One-click export that compiles the complete audit, metrics, issues, and analogies into a downloadable `CodeSage_Audit_Report.md`.

---

### ⚡ 2. Code Optimization & Algorithmic Refactoring
* **Targeted Goals**:
  * **Performance**: Reduces time complexity (e.g., $O(n^2) \rightarrow O(n)$), eliminates redundant allocations, and optimizes loop cache locality.
  * **Memory**: Minimizes heap footprint, avoids closures holding references, and reduces garbage collection pressure.
  * **Readability**: Applies DRY principles, modularizes functions, and refactors for clean, self-documenting code.
* **Side-by-Side Complexity Metrics**: Compares original vs. optimized Big-O time and space complexity with clear visual tags.

---

### 🔄 3. Cross-Language Transpilation
* Seamless conversion between:
  * 🐍 **Python**
  * 🟨 **JavaScript (ES6+)**
  * ☕ **Java**
  * ⚡ **C++**
* Preserves language-specific idioms, standard library mappings, naming conventions, and type safety constraints with transparent conversion caveats.

---

### 🔀 4. Side-by-Side Monaco Diff Viewer ("1-Click Fix")
* Integrated VS Code-style git diff comparison displaying original code (red) alongside the AI-corrected solution (green).
* **✨ 1-Click Fix**: Instant acceptance button that updates the editor workspace with the refactored code with a single click.

---

### 📊 5. Saved Sessions & Activity History
* **Workspaces & Sessions**: Persist, tag, and reload code snippets and reviews.
* **Searchable Activity Stream**: Filter past reviews, optimizations, and conversions by language, date, or keyword.
* **Developer Statistics**: Real-time aggregation of lines reviewed, average health score, issue severities, and quota usage.

---

## 🛡️ Security & DevSecOps Hardening

CodeSage AI implements an enterprise-grade defense-in-depth posture:

* **🛡️ Data Loss Prevention (DLP) Scrubber**: Before any code is transmitted to external LLM APIs, an automated regex engine scrubs live secrets (AWS Access Keys, GitHub PATs, JWT tokens, RSA private keys, and hardcoded credential assignments) to prevent sensitive leaks.
* **🔒 Prompt Injection & Boundary Defense**: Encapsulates untrusted user submissions inside `<UNTRUSTED_USER_CODE>` defense blocks, instructing the model to treat input strictly as inert static data and resist jailbreaks.
* **🍪 Authentication & Cookie Security**:
  * JWT tokens stored in `HttpOnly`, `SameSite=Lax`, secure cookies.
  * Bcrypt password hashing (10 salt rounds) with dummy hash comparison to eliminate timing attacks for non-existent users.
  * Mass-assignment protection preventing unauthorized role or email privilege escalations.
* **💉 NoSQL Injection & Sanitization**: Strips mongo operators (`$gt`, `$ne`, `$where`) using dedicated sanitization middleware.
* **🛡️ HTTP Protection**: Configured with Helmet HTTP response headers, CORS whitelisting, and strict request body limits (100 KB payload, 50 KB code limit).
* **⏱️ Rate Limiting & User Quotas**: Tiered IP and per-user daily quota limits to prevent DoS attacks and resource exhaustion.

---

## 🏗️ Architecture & Tech Stack

```text
CodeSage_AI/
├── backend/                  # Node.js + Express API Server
│   ├── src/
│   │   ├── config/           # MongoDB database connection
│   │   ├── controllers/      # AI, Auth, Session, History, and Profile controllers
│   │   ├── middleware/       # Auth, CSRF, NoSQL sanitization, rate limiting, error handling
│   │   ├── models/           # Mongoose schemas (User, CodeSession, History)
│   │   ├── routes/           # RESTful API route definitions
│   │   ├── services/         # Gemini AI SDK & DLP Sanitizer integration
│   │   └── server.js         # Server entry point & middleware pipeline
│   ├── tests/                # Automated Vitest integration test suite (34 tests)
│   ├── .env.example          # Environment variable template
│   └── package.json
│
├── frontend/                 # Vite + React 18 Single Page Application
│   ├── src/
│   │   ├── components/       # Monaco CodeEditor, DiffEditor, Navbar, UserMenu
│   │   ├── context/          # AuthContext (sessions) & ToastContext (notifications)
│   │   ├── pages/            # Review, Optimize, Convert, History, Dashboard, Profile
│   │   ├── services/         # API client with credentials support
│   │   ├── utils/            # Multi-language sample code snippets
│   │   └── index.css         # Custom modern design system
│   ├── vite.config.js        # Vite config & API reverse proxy
│   └── package.json
│
├── .gitignore                # Strict ignore rules (excludes .env and dependencies)
├── package.json              # Root concurrent orchestrator
└── README.md
```

### Technology Matrix

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, Monaco Editor (`@monaco-editor/react`), React Router 6 |
| **Backend** | Node.js 18+, Express 4.21, Mongoose 8, Zod Validation |
| **AI / ML** | Google Gemini API (`@google/genai`, `gemini-3.8-flash`), Custom AST Fallback Engine |
| **Security** | Helmet, Bcryptjs, Cookie-Parser, Express-Rate-Limit, Express-Mongo-Sanitize |
| **Testing** | Vitest 3, Supertest 7, MongoDB Memory Server |

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017/codesage_ai`) or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
* **Gemini API Key**: Free key from [Google AI Studio](https://aistudio.google.com/)

---

### 1. Clone the Repository
```bash
git clone https://github.com/sharyuu3108/CodeSage_AI.git
cd CodeSage_AI
```

---

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/codesage_ai

# Gemini AI API Key (https://aistudio.google.com/)
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash

# JWT Secret (minimum 32 random characters)
JWT_SECRET=your_super_secret_cryptographic_key_here_minimum_32_characters
JWT_EXPIRES_IN=7d

# User Quotas
AI_DAILY_QUOTA_PER_USER=50
MAX_CODE_SIZE_BYTES=51200
```

---

### 3. Install Dependencies
You can install dependencies for both services from the root directory:
```bash
# Backend dependencies
cd backend && npm install

# Frontend dependencies
cd ../frontend && npm install

# Root orchestrator dependencies
cd .. && npm install
```

---

### 4. Running the Application

You can run both servers independently in separate terminals, or together from the root:

#### Option A: Running Separately (Recommended for Development)

* **Terminal 1 (Backend API Server)**:
  ```bash
  cd backend
  npm run dev
  ```
  > Runs on: `http://localhost:5000`  
  > Health Check: `http://localhost:5000/api/health`

* **Terminal 2 (Frontend Client)**:
  ```bash
  cd frontend
  npm run dev
  ```
  > Runs on: `http://localhost:5173`

#### Option B: Running Simultaneously from Root
```bash
npm run dev
```

---

## 🧪 Testing & Verification

CodeSage AI includes an automated Vitest integration test suite covering authentication, session isolation, timing attack resistance, mass assignment protection, and AI static fallbacks:

```bash
# Run all backend test suites
npm run test:backend
```

```text
 Test Files  5 passed (5)
      Tests  34 passed (34)
   Start at  12:59:36
   Duration  9.88s (100% passing across health, auth, ai, sessions, profile)
```

To verify the production frontend build:
```bash
npm run build:frontend
```

---

## 🔌 API Reference Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health & database connection status | No |
| `POST` | `/api/auth/register` | Register user & issue HTTP-only auth cookie | No |
| `POST` | `/api/auth/login` | Log in via username/email with timing defense | No |
| `POST` | `/api/auth/logout` | Clear authentication cookie | Yes |
| `GET` | `/api/auth/me` | Retrieve authenticated user session | Yes |
| `POST` | `/api/ai/review` | Run static AST & Gemini AI code review | Yes |
| `POST` | `/api/ai/optimize` | Optimize code for performance, memory, or clean code | Yes |
| `POST` | `/api/ai/convert` | Transpile code between supported languages | Yes |
| `GET` | `/api/ai/quota` | Check remaining daily AI requests | Yes |
| `GET` | `/api/sessions` | List saved user code sessions | Yes |
| `POST` | `/api/sessions` | Save a new code session | Yes |
| `GET` | `/api/history` | Retrieve user activity stream | Yes |
| `DELETE`| `/api/history` | Clear personal activity records | Yes |
| `GET` | `/api/profile/stats` | Retrieve aggregated developer statistics | Yes |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/sharyuu3108">Sharvari</a> • Powered by Google Gemini
</p>
