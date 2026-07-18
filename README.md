# VyaparAI – AI-Powered Smart Business Operating System 🚀

VyaparAI is a production-grade business operating platform designed for Indian small and medium businesses (SMBs), with specific localizations for retail and wholesale dealers in Assam. 

Instead of a basic CRUD dashboard, VyaparAI behaves like an active business intelligence layer combining features of **Zoho Inventory**, **Tally GST Invoicing**, **Salesforce CRM**, and **Gemini AI Decision Agents** into one cohesive platform.

---

## 🌟 Premium Features

### 🧠 1. AI Business Brain
A decision-making agent that takes budget limits and current stock levels to recommend restocking targets.
- Suggests: "Buy Johabir Rice due to sales acceleration (est profit ₹23,000)."
- Identifies Bihu festival demand spikes.

### 📊 2. Daily Business Health Index
Morning scorecard metrics reporting overall health, cash flows, stockout warnings, and action steps.

### 🎙️ 3. Voice Dashboard Briefing
Synthesizes spoken status logs: "Good Morning, Boss. Yesterday's sales were..." with interactive voice commands.

### 🚨 4. AI Loss & Theft Prevention
Cross-references inventory counts with invoices to detect anomalies and flag suspicious transaction drops.

### 🧭 5. Geofenced GPS Attendance
Verifies coordinates to check in staff within geofenced parameters of the physical store location.

### 💳 6. Split Payment POS & GST Invoicing
Supports split checkouts (Cash + UPI + Credit Ledger), interstate (IGST) or local (CGST/SGST) tax calculations, QR Code links, and offline-ready downloads.

### 🔌 7. Offline First & Emergency Mode
No connection? No problem. Full database operations (creating invoices, checking in, updating stock) run locally on IndexedDB. Syncs automatically when back online.

---

## 🏗️ Architecture

```
vyapar-ai/
├── client/               # Next.js 15 App Router Frontend
│   ├── src/
│   │   ├── app/          # Main application page router
│   │   ├── components/   # UI layouts (Sidebar, Header, AI Brain)
│   │   ├── lib/          # Zustand State Manager, Axios client, Utils
│   │   └── globals.css   # Dark glassmorphic theme styling
│   └── package.json
└── server/               # Node.js/Express Backend Server
    ├── src/
    │   ├── controllers/  # Products, Invoices, AI Brain engines
    │   ├── models/       # Mongoose schemas
    │   ├── services/     # Gemini AI and Tesseract OCR models
    │   └── index.js      # App entry point with Socket.IO
    └── seed/             # Realistic Assam business seed scripts
```

---

## 🚀 Getting Started

### 1. Backend Setup
1. Enter the server folder:
   ```bash
   cd server
   ```
2. Create your `.env` file from the example template:
   ```bash
   copy .env.example .env
   ```
3. Set your Google Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Seed database with realistic local data (Guwahati general stores):
   ```bash
   npm run seed
   ```
   *(Ensure local MongoDB is running)*
6. Boot the development server:
   ```bash
   npm start
   ```

### 2. Frontend Setup
1. Enter the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development portal:
   ```bash
   npm run dev
   ```
4. Access `http://localhost:3000` and prefill the credentials of your choice (Owner, Manager, or Staff) to showcase permissions!
