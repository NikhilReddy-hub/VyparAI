# 🚀 VyaparAI — User Guide & Feature Exploration manual

Welcome to **VyaparAI**, the production-grade, AI-driven Business Operating System built specifically to manage inventory, intelligence, and cash flows for retail general stores like *Sharma General Stores*. 

This manual serves as your step-by-step guide to exploring every feature of the VyaparAI system, complete with walkthrough flows.

---

## 🔑 Login & Access Profiles

VyaparAI features Role-Based Access Control (RBAC). You can instantly explore the system using the pre-configured showcase profiles on the login screen or register your own account.

| Profile | Email | Password | Access Rights |
|:---|:---|:---|:---|
| **👑 Owner** | `owner@vyapar.ai` | `password123` | Full access to financial metrics, AI Brain, Analytics, Staff Management, and Inventory. |
| **👔 Manager** | `manager@vyapar.ai` | `password123` | Mid-level access. Can view inventory, handle sales, manage customers, but has no financial metrics access. |
| **👷 Staff** | `jitul@vyapar.ai` | `password123` | Sales and billing staff level. Access restricted to invoice creation, customer logs, and stock adjustments. |

*Quick Tip: You can also instantly register a fresh account by clicking "Create your account →" on the login screen.*

---

## 📈 Exploring Key Features

### 1. AI Business Brain (Decision-Making Assistant)
* **What it is:** A true generative business advisor powered by the Gemini engine. It doesn't just answer questions; it analyzes your real inventory, upcoming local festivals, and sales records to give concrete purchase recommendations.
* **How to explore:**
  1. Log in as **Owner**.
  2. Navigate to **Dashboard** or click **AI Business Brain** in the sidebar.
  3. Enter a prompt like: *"I have an extra ₹15,000 budget. What products should I buy ahead of Bihu/Diwali?"*
  4. Watch the AI analyze your local context, festival calendar, current low-stock list, and spit out an exact purchasing plan with quantity recommendations, reasoning, and predicted profits.

### 2. CRM & Churn Engine
* **What it is:** An intelligence engine that parses purchase frequencies, average bills, and last-visited dates to flag customers who are at risk of leaving (churning).
* **How to explore:**
  1. Go to the **Customers** section in the sidebar.
  2. You will see a list of customers populated with a **Churn Risk Index** (Low, Medium, High).
  3. Click **"Analyze Churn Risk"** on any high-risk customer.
  4. The Gemini engine will parse their transaction history and give you a **personalized discount pitch** or retention strategy to copy and send via WhatsApp/SMS.

### 3. Smart Invoice Generator & Billing
* **What it is:** A fast billing screen supporting automated GST calculations, item search, quantity adjustments, and receipt generation.
* **How to explore:**
  1. Go to **New Invoice** in the sidebar.
  2. Select a customer or quickly create one.
  3. Add items to the cart using the search bar (e.g. search for tea, sugar, or oil).
  4. Note how GST is calculated automatically based on product categories.
  5. Click **Create & Save Invoice**. The receipt pops up, and your stock levels decrement instantly.

### 4. OCR Invoice Import (Automated Scan)
* **What it is:** Upload a supplier invoice image, and VyaparAI will automatically parse the GSTIN, supplier name, date, invoice total, and add the new products to your inventory.
* **How to explore:**
  1. Navigate to **Inventory** in the sidebar.
  2. Click **Import Invoice via OCR**.
  3. Upload an image of a purchase invoice (or select the sample demo image).
  4. Click **Parse Invoice**. Gemini will extract all line items, SKU, and costs, then auto-fill them into the table so you don't have to type.

### 5. Local-First Offline Mode
* **What it is:** VyaparAI operates fully offline if internet connectivity drops. Invoices and stock adjustments are queued locally in your browser's Dexie database and sync automatically once you are back online.
* **How to explore:**
  1. Open your browser DevTools (Press `F12` -> `Network` tab).
  2. Click the connection dropdown and select **"Offline"**.
  3. You will immediately see a toast notification: *\"Connection lost. Operating in local-first backup mode.\"*
  4. Create a new invoice or adjust stock. The app remains fully interactive.
  5. Set your Network back to **"Online"**.
  6. The sync queue executes, pushes the offline actions to Atlas MongoDB, and shows a green toast: *\"Internet connection restored! Synchronization complete.\"*

### 6. AI Theft & Shrinkage Detector
* **What it is:** Detects unauthorized stock changes. If a product's stock is decreased without a corresponding invoice, the AI flags it for theft or shrinkage.
* **How to explore:**
  1. Go to **Inventory**.
  2. Find any item with stock (e.g. *Tea Packet*) and click **Adjust Stock**.
  3. Select **Subtract** from the type, input a number greater than 5 (e.g., subtract 10 units), choose a reason like *"Missing"* or *"Unknown Loss"*, and submit.
  4. If the loss is flagged as anomalous, a real-time WebSocket theft alert will flash on the dashboard warning the owner about potential shrinkage.

---

## 🛠️ Diagnostics & Setup Guide

If you are running the project locally, here is a quick guide to setting it up:

1. **Clone the Repo:**
   ```bash
   git clone https://github.com/NikhilReddy-hub/VyparAI.git
   cd VyparAI
   ```

2. **Configure Environment (`server/.env`):**
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/vyapar-ai
   JWT_SECRET=vyapar-ai-prod-secret-2026
   JWT_EXPIRES_IN=7d
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Install & Run Backend:**
   ```bash
   cd server
   npm install
   npm run dev
   ```

4. **Install & Run Frontend:**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```
   Open `http://localhost:3000` to interact.

---

Developed by NIKHIL REDDY. Powered by **Google Gemini API** & **MongoDB Atlas**.
