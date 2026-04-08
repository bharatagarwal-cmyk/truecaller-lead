# Truecaller mWeb Lead Gen — Prototype

A mobile-optimised lead generation page with Truecaller one-tap verification and OTP fallback.

---

## How it works

1. User taps **"Continue with Truecaller"**
2. Truecaller app opens on their phone (via deeplink)
3. User approves → Truecaller POSTs an access token to your `/truecaller/callback`
4. Your server fetches the user's profile (name, phone) from Truecaller's API
5. Frontend polls `/truecaller/poll` and **prefills the form** automatically
6. User submits → lead is captured ✓

If Truecaller is not installed → falls back to manual phone + OTP flow.

---

## Step-by-step: Get it live in 15 minutes

### Step 1 — Get Truecaller Partner Key

1. Go to [developer.truecaller.com](https://developer.truecaller.com)
2. Sign up / log in
3. Click **"Add New App"** → choose **Web**
4. Fill in:
   - **App Name**: Your brand name (shown to users in the consent dialog)
   - **App Domain**: Your Railway domain (e.g. `myapp.up.railway.app`) — you'll get this in Step 3, come back and update
   - **Callback URL**: `https://YOUR-RAILWAY-DOMAIN/truecaller/callback`
5. Save → copy your **Partner Key (appKey)**

### Step 2 — Push to GitHub

```bash
cd truecaller-lead
git init
git add .
git commit -m "initial commit"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/truecaller-lead.git
git push -u origin main
```

### Step 3 — Deploy to Railway

1. Go to [railway.app](https://railway.app) → **New Project**
2. Choose **"Deploy from GitHub repo"** → select your repo
3. Railway auto-detects Node.js and deploys
4. Once deployed, click your service → **Settings → Networking → Generate Domain**
5. Copy the domain (e.g. `myapp.up.railway.app`)

### Step 4 — Set Environment Variables on Railway

In Railway dashboard → your service → **Variables** tab, add:

| Key | Value |
|-----|-------|
| `TRUECALLER_PARTNER_KEY` | Your key from Step 1 |
| `PARTNER_NAME` | Your app/brand name |

Railway will auto-restart the service.

### Step 5 — Update Truecaller App Domain & Callback

Go back to [developer.truecaller.com](https://developer.truecaller.com):
- Update **App Domain** → `myapp.up.railway.app`
- Update **Callback URL** → `https://myapp.up.railway.app/truecaller/callback`

### Step 6 — Test on Android (or iOS)

Open `https://myapp.up.railway.app` on a phone with Truecaller installed.
Tap **"Continue with Truecaller"** → approve → watch the form prefill. 🎉

---

## Local development

```bash
npm install
cp .env.example .env
# Edit .env with your partner key
npm run dev
# Server at http://localhost:3000
```

For local Truecaller testing, use [ngrok](https://ngrok.com) to expose localhost:
```bash
ngrok http 3000
# Use the ngrok HTTPS URL as your callback URL in Truecaller developer portal
```

---

## Project structure

```
truecaller-lead/
├── server.js          # Express backend (3 endpoints)
├── public/
│   └── index.html     # Full mWeb frontend
├── package.json
├── railway.json       # Railway deployment config
├── .env.example       # Environment variables template
└── README.md
```

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Serve the frontend |
| POST | `/truecaller/callback` | Receive token from Truecaller |
| GET | `/truecaller/poll?requestId=X` | Frontend polls for profile data |
| GET | `/truecaller/config` | Serve partner key to frontend |

---

## Production upgrades (next steps)

- **Replace in-memory store** (`pendingRequests`) with Redis for multi-instance support
- **Save leads** to a database (Postgres/MongoDB) or push to a CRM (HubSpot, Salesforce)
- **Add OTP logic** — integrate Twilio/MSG91 for the fallback flow
- **Rate limiting** — add `express-rate-limit` on the callback endpoint
- **HTTPS** — Railway provides this automatically ✓
