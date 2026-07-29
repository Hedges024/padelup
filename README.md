# PadelUp

An Americano padel tournament tracker: rotate teams, log 3-set match results,
and see a live points leaderboard. This version runs as a small Node.js
server with a real SQLite database behind it, so any device that opens the
URL sees the same, permanent data.

## A quick note on "local SQLite file"

You asked for the data saved in "a local SQLite file hosted in the same
place." I looked into that specifically and it won't actually work on
Render's **free** tier: free web services there don't get a persistent
disk, and the container's filesystem is wiped every time the service
restarts (which happens automatically after ~15 minutes of no traffic). A
plain local `.db` file would get deleted regularly — the exact problem
you're trying to fix.

Instead, this project uses **[Turso](https://turso.tech)** — a database
that speaks normal SQLite/SQL, but is hosted separately so it survives
your web service restarting. Their free tier is genuinely free (no card
required) and gives you 5GB of storage, which is far more than this app
will ever need. Everything else about the code is exactly what you'd write
for local SQLite — same SQL, same simplicity — it's just pointed at a
persistent SQLite database instead of a file that disappears.

## How it's put together

- `server.js` — a small Express server. It serves the app and exposes
  three endpoints: `GET /api/data`, `POST /api/players`, `POST /api/matches`.
- `public/index.html` — the app itself (unchanged from before, just now
  talking to the API above instead of browser storage).
- Data is stored as two rows (`players`, `matches`) in a `kv` table — the
  same shape the app already used, just persisted centrally now.

## 1. Create your free Turso database

1. Go to [turso.tech](https://turso.tech) and sign up (free, no card).
2. Create a database (via their web dashboard, or the CLI: `turso db create padelup`).
3. Get your connection URL: `turso db show padelup --url`
4. Create an auth token: `turso db tokens create padelup`
5. Keep both values handy — you'll paste them into Render in step 3.

## 2. Push this project to GitHub

1. Unzip the project you downloaded from this chat.
2. In that folder, run:
   ```bash
   git init
   git add .
   git commit -m "PadelUp"
   ```
3. Create a new **empty** repository on GitHub, then follow GitHub's
   instructions to push an existing repo (something like):
   ```bash
   git remote add origin https://github.com/<your-username>/padelup.git
   git branch -M main
   git push -u origin main
   ```

## 3. Deploy to Render (free)

1. Go to [render.com](https://render.com) and sign up (free).
2. Click **New +** → **Web Service**, and connect the GitHub repo you just pushed.
3. Render should auto-detect Node. Confirm:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. Under **Environment**, add two environment variables:
   - `TURSO_DATABASE_URL` → the URL from step 1
   - `TURSO_AUTH_TOKEN` → the token from step 1
5. Click **Create Web Service**. The first deploy takes a minute or two.
6. Once it's live, Render gives you a URL like
   `https://padelup.onrender.com` — open that on your laptop, your phone,
   anyone's phone. Everyone sees and updates the same tournament data.

(A `render.yaml` is included if you'd rather use Render's "Blueprint"
import instead of the manual steps above — same result.)

## Good to know

- **Free tier cold start:** Render's free web services spin down after
  ~15 minutes of no traffic. The next visit takes 30–60 seconds to wake
  back up — totally fine for a weekend tournament, just don't expect an
  instant load if it's been sitting idle.
- **No login/access control:** anyone with the URL can view and edit the
  tournament. That's fine for sharing with your padel group, but don't
  post the link somewhere public if you don't want strangers editing it.
- **Local testing:** copy `.env.example` to `.env`, fill in your Turso
  credentials, then run:
  ```bash
  npm install
  npm start
  ```
  and open `http://localhost:3000`.
