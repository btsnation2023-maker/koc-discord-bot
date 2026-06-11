# 🤖 KOC Application Bot — EHP Labs

A Discord bot that posts a persistent **Apply Now** button in `#koc-apply`. When clicked, a modal form pops up collecting applicant info, which is saved directly to a Google Sheet.

---

## 📋 What it does

1. Bot starts → finds `#koc-apply` channel → posts a branded embed with an **Apply Now** button
2. User clicks button → Discord Modal popup opens with 5 fields
3. User submits → response saved to your Google Sheet instantly
4. User sees a private confirmation message ✅

---

## 🚀 Setup Guide (Step by Step)

### Step 1 — Create your Discord Bot

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** → name it (e.g. "KOC Bot")
3. Go to **Bot** tab → click **Reset Token** → copy the token
4. Under **Bot** → enable **Message Content Intent**
5. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Read Message History`, `Manage Messages`, `Embed Links`
6. Copy the generated URL → paste in browser → invite bot to your server

### Step 2 — Set up Google Sheets

1. Create a new Google Sheet at [sheets.google.com](https://sheets.google.com)
2. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/**THIS_PART**/edit`
3. Go to [console.cloud.google.com](https://console.cloud.google.com)
4. Create a new project (or use existing)
5. Enable **Google Sheets API** (search in APIs & Services)
6. Go to **IAM & Admin → Service Accounts** → Create Service Account
7. Click on the service account → **Keys** tab → **Add Key → JSON**
8. Download the JSON file
9. **Share your Google Sheet** with the `client_email` from the JSON file (Editor access)

### Step 3 — Configure environment

```bash
# Copy the example env file
cp .env.example .env

# Fill in your values:
DISCORD_TOKEN=         ← from Step 1
GOOGLE_SHEET_ID=       ← from Step 2
GOOGLE_SERVICE_ACCOUNT_JSON=  ← paste the entire contents of the downloaded JSON (as one line)
```

### Step 4 — Run locally

```bash
npm install
npm start
```

---

## ☁️ Hosting 24/7 (Free/Cheap Options)

### Option A — Railway (Recommended, easiest)
1. Push this folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add your 3 environment variables in the Railway dashboard
4. Deploy! ✅ Railway keeps it running forever

### Option B — Render
1. Push to GitHub
2. [render.com](https://render.com) → New → Web Service → Connect repo
3. Build command: `npm install`
4. Start command: `node index.js`
5. Add env vars in dashboard

### Option C — VPS (DigitalOcean / Hetzner)
```bash
# On your server:
git clone your-repo
cd koc-discord-bot
cp .env.example .env
nano .env  # fill in your values

npm install

# Run forever with PM2:
npm install -g pm2
pm2 start index.js --name koc-bot
pm2 save
pm2 startup  # auto-restart on reboot
```

---

## 📊 Google Sheet Output

The bot automatically creates headers on first run:

| Timestamp | Discord Username | Social Media Link | Contact Number | Email | On TikTok Shop? | Promoted EHP Labs Before? |
|-----------|-----------------|-------------------|----------------|-------|-----------------|--------------------------|
| 11/06/2026 | username#0000 | instagram.com/... | +61 400... | user@... | Yes | No |

---

## 🛠 Customisation

- **Channel name**: Change `CHANNEL_NAME` in `index.js` (default: `koc-apply`)
- **Embed colours/text**: Edit the `EmbedBuilder` block in `index.js`
- **Add more fields**: Discord modals support up to **5 fields** (already at max)
- **Notification channel**: Add a line after `appendToSheet()` to also send the submission to a private staff channel

---

## ❓ Troubleshooting

| Problem | Fix |
|---------|-----|
| Bot doesn't post button | Make sure bot has `Send Messages` + `Read Message History` perms in `#koc-apply` |
| Google Sheets error | Check the service account email is a Sheet Editor |
| Bot goes offline | Use Railway/Render/PM2 — not just `node index.js` on your laptop |
| Modal doesn't open | Ensure `applications.commands` scope was included when inviting the bot |
