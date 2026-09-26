# Aegis Underwrite | AI Loan Eligibility Checker & BFSI Intelligence Platform

An institutional-grade, full-stack BFSI (Banking, Financial Services & Insurance) decision platform combining deterministic financial underwriting engines, Google Sheets audit persistence, and Anthropic Claude AI reasoning.

![Aegis Platform Preview](public/logo.svg)

---

## 🌟 Key Features & Integrated Tools

1. **Loan Eligibility Checker**
   * **FOIR Underwriting**: Applies standardized Fixed Obligation to Income Ratio caps (40% to 50% depending on credit score profile).
   * **EMI Principal Solver**: Solves standard EMI equation for maximum allowable principal:  
     $$P = E \times \frac{(1 + r)^n - 1}{r(1 + r)^n}$$
   * **Claude Underwriting Analysis**: Backend calls Anthropic Claude 3.5 Sonnet to synthesize plain-language risk explanations.

2. **Credit Score Analyzer**
   * **Weighted Underwriting Model**: Computes an estimated bureau score on a 300–900 scale across 5 core pillars:
     * Payment History (35% weight / 210 pts)
     * Credit Utilization Ratio (30% weight / 180 pts)
     * Credit Vintage / History Age (15% weight / 90 pts)
     * Hard Inquiries in 12 Months (10% weight / 60 pts)
     * Active Accounts Mix (10% weight / 60 pts)
   * **Claude Priority Actions**: Generates 2–3 prioritized, specific improvement actions based on actual user input parameters.

3. **EMI & Repayment Calculator**
   * **Live Math Engine**: Instant calculation of monthly EMI, total interest payable, and total amount.
   * **Visual Principal vs. Interest Distribution**: Dynamic progress bar distribution.
   * **Yearly Amortization Schedule**: Full breakdown table for yearly principal vs. interest amortization.

4. **AI Financial Advisor**
   * **Streaming Advisory**: Free-text prompt box for loan restructuring, debt reduction, or credit recovery.
   * **Real-time SSE Streaming**: Backend streams Claude responses chunk-by-chunk using Server-Sent Events (SSE).

5. **Google Sheets Audit Logging & Local Backup**
   * Every user submission appends a row to a Google Sheet with separate tabs (`Loan`, `Credit`, `EMI`, `Tips`).
   * Includes a `GET /api/history/:tool` endpoint and in-app modal to audit recent submissions.
   * Features automatic local JSON backup fallback (`data/submissions.json`) so the platform operates seamlessly even without active cloud API keys.

---

## 🚀 Tech Stack

* **Frontend**: React 19 + Vite, plain modular CSS (`src/index.css` with dark glassmorphism styling, no Tailwind dependency).
* **Backend**: Node.js + Express proxy server, ensuring API keys and service account secrets never reach the browser.
* **AI Engine**: Anthropic Claude API (`@anthropic-ai/sdk`, `claude-3-5-sonnet-20241022` / `claude-sonnet-4-6`).
* **Storage & Audit**: Google Sheets API v4 via `googleapis` Service Account Auth (JWT).

---

## 🛠️ Setup & Installation Guide

### Prerequisites
* Node.js v18+ and npm installed.

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd NASSCOM-PROJECT
npm install
```

---

### 2. Configure Google Cloud Service Account & Google Sheet

1. **Create Service Account in Google Cloud Console**:
   * Go to [Google Cloud Console](https://console.cloud.google.com/).
   * Create a project (e.g. `Aegis-BFSI-Audit`).
   * Enable the **Google Sheets API** under *APIs & Services > Library*.
   * Go to *APIs & Services > Credentials*, click **Create Credentials > Service Account**.
   * Create a key under **Keys > Add Key > Create new key (JSON)**. Download the JSON key file.

2. **Create & Share Google Sheet**:
   * Open [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
   * Copy the **Spreadsheet ID** from the URL:  
     `https://docs.google.com/spreadsheets/d/`**`<SPREADSHEET_ID>`**`/edit`
   * Click **Share** on the top right of your sheet, and grant **Editor** access to the service account email (found inside your JSON key file as `client_email`).

---

### 3. Obtain Anthropic Claude API Key

1. Sign up at [Anthropic Console](https://console.anthropic.com/).
2. Navigate to **API Keys** and generate a new key.

---

### 4. Configure Environment Variables

Create a `.env` file in the root directory (based on `.env.example`):

```env
PORT=3000

# Anthropic Claude API Key
ANTHROPIC_API_KEY=sk-ant-api03-xxxx...

# Google Sheets Service Account Key (Paste the raw JSON string OR absolute file path)
GOOGLE_SERVICE_ACCOUNT_JSON={"type": "service_account", "project_id": "...", ...}

# Google Spreadsheet ID
SPREADSHEET_ID=1BxiMVs0XRA5nFMdKbBUI6H6wMh1X8U9...
```

---

## 🏃 Running the Application

### Option A: Full-Stack Production Mode (Express serving Vite build)
```bash
npm run build
npm start
```
Access the application at `http://localhost:3000`.

### Option B: Development Mode (Vite Dev Server with Express Proxy)
Start the Express backend proxy:
```bash
npm run server
```
In a second terminal, start the Vite dev server:
```bash
npm run dev
```
Access the frontend with hot-module replacement (HMR) at `http://localhost:5173`.

---

## 📊 Underwriting Formulas & Assumptions

* **Fixed Obligation to Income Ratio (FOIR)**:
  * Credit Score ≥ 750 (Excellent): **50% FOIR cap**
  * Credit Score 650–749 (Good/Fair): **45% FOIR cap**
  * Credit Score < 650 (Poor/Fair): **40% FOIR cap**
  * *Assumption*: FOIR represents the maximum percentage of net monthly income allowed for total debt obligations.

* **Credit Score Rating Scale (300 to 900)**:
  * 740 – 900: **Excellent** (Mint)
  * 670 – 739: **Good** (Mint)
  * 580 – 669: **Fair** (Amber)
  * 300 – 579: **Poor** (Red)

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/loan-eligibility` | Computes FOIR loan principal, calls Claude explanation, appends to `Loan` tab |
| `POST` | `/api/credit-score` | Analyzes credit factors, calls Claude improvement steps, appends to `Credit` tab |
| `POST` | `/api/emi` | Calculates live EMI & breakdown, appends to `EMI` tab |
| `POST` | `/api/financial-tips` | Streams Claude AI financial advice via SSE, appends to `Tips` tab |
| `GET` | `/api/history/:tool` | Fetches last 5 submission rows for specified tool from Google Sheets / local JSON |
| `GET` | `/api/health` | System health check reporting active Claude & Sheets integrations |

---

## 📄 License
ISC License — Aegis Engineering
