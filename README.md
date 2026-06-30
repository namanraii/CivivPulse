# CivicPulse

**CivicPulse** is an AI-powered civic issue reporting platform built for the **Vibe2Ship Hackathon** by Coding Ninjas x Google for Developers. 

It empowers citizens to effortlessly report civic issues (like potholes, graffiti, or broken infrastructure) simply by snapping a photo.

## ✨ Features
- **AI-Powered Analysis:** Built on **Gemini 2.5 Flash**, the platform automatically extracts the issue's title, category, severity, and generates a formal description just from an image!
- **AI Duplicate Detection:** Prevent spam and duplicate reports! The AI scans the database of recent reports to logically determine if an incoming issue has already been reported.
- **Dynamic Urgency Scoring:** Issues are given a score out of 100 based on their severity.
- **Community Upvoting:** Citizens can upvote issues on the dashboard. Upon upvoting, the AI dynamically recalculates the Urgency Score in real-time.
- **Automated Escalation:** If an issue surpasses a critical urgency score (70/100), the platform automatically drafts a formal escalation letter addressed to the City Council!
- **Persistent Storage:** Images are securely uploaded and stored in Firebase Cloud Storage.

## 🛠️ Tech Stack
- **Frontend:** React (Vite), Tailwind CSS, Framer Motion, React-Leaflet, React-Hot-Toast
- **Backend:** FastAPI, Python, Firebase Admin SDK (Firestore, Storage)
- **AI Integration:** Google Gemini 2.5 Flash (`google-genai` SDK)

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*(Requires a `.env` file with `GEMINI_API_KEY` and a Firebase `serviceAccountKey.json`)*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---
*Built with ❤️ for Vibe2Ship.*
