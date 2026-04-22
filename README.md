# FLINT Command Center

Phone-first daily ops app. Reads live from Notion. No writes.

## Stack
- Static HTML + React (no bundler)
- Vercel serverless functions for Notion API proxy
- Claude API for Intake tab task extraction

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create a Notion integration
1. Go to https://www.notion.so/my-integrations
2. Create a new integration — name it "FLINT Command Center"
3. Copy the Internal Integration Token
4. Open your Tasks DB in Notion → ... menu → Connections → add your integration

### 3. Set environment variables
```bash
cp .env.example .env.local
# Fill in NOTION_TOKEN with your integration token
# NOTION_TASKS_DB is already set to your DB ID
```

Add both variables to Vercel:
- Dashboard → your project → Settings → Environment Variables
- Add NOTION_TOKEN and NOTION_TASKS_DB

### 4. Link your team members' Notion user IDs
After deploying, call:
```
GET /api/team-ids
```
Copy each person's `id` value into `api/team.js` in the TEAM array, matching by name.

### 5. Run locally
```bash
npm run dev
# Opens at http://localhost:3000
```

### 6. Deploy
```bash
npm run deploy
```

## File structure
```
/
├── index.html              # App shell — loads all scripts
├── ios-frame.jsx           # iOS device frame component (unchanged)
├── src/
│   ├── app.jsx             # All React components — wired to live data
│   ├── data.jsx            # Constants only (categories, intake placeholder)
│   └── useNotion.js        # Fetches /api/* and exposes myTasks, team, waitingOn
├── api/
│   ├── _notion.js          # Shared Notion client + normalizer
│   ├── tasks.js            # GET /api/tasks — your tasks only
│   ├── team.js             # GET /api/team — team tasks grouped by person
│   ├── waiting.js          # GET /api/waiting — stub until Waiting On DB exists
│   └── team-ids.js         # GET /api/team-ids — one-time utility
├── vercel.json
├── package.json
└── .env.example
```

## Waiting On DB (when ready)
Create a Notion DB with:
- Item (title)
- Waiting on (text)  
- Date flagged (date)
- Status (select: Active / Resolved)

Then replace the stub in `api/waiting.js` with a real Notion query filtered to `Status = Active`.

## Work categories
The five categories in `src/data.jsx` must exactly match the select option names
in your Notion Work Category field. Update if they differ.
