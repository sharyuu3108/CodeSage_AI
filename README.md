# CodeSage AI

CodeSage AI is an AI-powered developer platform providing real-time code reviews, performance and memory optimizations, and cross-language transpilation.

---

## Project Structure

```text
CodeSage_AI/
├── backend/          # Express API server, Mongoose models, Gemini AI services
│   ├── src/          # API source code (controllers, routes, middleware, services)
│   ├── tests/        # Automated Vitest test suite
│   ├── .env          # Backend environment variables
│   └── package.json  # Backend dependencies and scripts
│
├── frontend/         # Vite + React 18 frontend with Monaco Code Editor
│   ├── src/          # React components, pages, context, and styles
│   ├── public/       # Static assets
│   ├── vite.config.js# Vite configuration and API proxy
│   └── package.json  # Frontend dependencies and scripts
│
└── package.json      # Root project orchestrator
```

---

## Running Frontend & Backend Separately

You can run each folder in its own dedicated terminal window:

### 1. Backend Terminal (Port 5000)

```powershell
# Navigate to the backend directory
cd backend

# Start development server with auto-reload (nodemon)
npm run dev
```

> **Backend API URL**: `http://localhost:5000`  
> **Health Check**: `http://localhost:5000/api/health`

### 2. Frontend Terminal (Port 5173)

```powershell
# Navigate to the frontend directory
cd frontend

# Start Vite development server
npm run dev
```

> **Frontend Application URL**: `http://localhost:5173`

---

## Alternative: Running From the Root Directory

If you prefer executing commands from the project root:

- **Run both concurrently in one terminal**:
  ```powershell
  npm run dev
  ```
- **Run backend only**:
  ```powershell
  npm run dev:backend
  ```
- **Run frontend only**:
  ```powershell
  npm run dev:frontend
  ```
- **Run backend test suite**:
  ```powershell
  npm run test:backend
  ```
- **Build frontend for production**:
  ```powershell
  npm run build:frontend
  ```
