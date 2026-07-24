# Deploying BluePay for free (shareable link for evaluators)

This gets you a live URL you can hand to an evaluator — no laptop-must-stay-open
required. Three pieces, three (free) providers:

| Piece | Provider | Why |
|---|---|---|
| Frontend (React) | **Vercel** | Free static hosting, deploys straight from GitHub |
| Backend (Flask API) | **Render** | Free Python web service, no credit card needed |
| Database (MySQL) | **Railway** (or **db4free.net** as a permanent-free fallback) | Managed MySQL |

**Heads-up before you start:** Render's free tier spins your backend down after
15 minutes of no traffic, and the next request takes 30-60 seconds to wake it
back up. That's normal — just mention it if an evaluator's first click seems
slow, or open the link yourself a minute before your demo starts to "warm it up."

---

## Step 1 — Push the project to GitHub

Both Render and Vercel deploy from a GitHub repo, so you need one first.

1. Create a new **public or private** repo on GitHub (e.g. `bluepay`).
2. From your project folder:
   ```bash
   cd bluepay
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/bluepay.git
   git push -u origin main
   ```
   (`.env` files are already excluded via `.gitignore` — don't commit real passwords.)

---

## Step 2 — Create the MySQL database (Railway)

1. Go to **railway.app** → sign up (GitHub login is fastest) → **New Project** → **Provision MySQL**.
2. Once it's created, click the MySQL service → **Variables** tab. You'll see `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE` (or a single `MYSQL_URL`). Keep this tab open — you'll need these values in Step 3.
3. Railway gives new accounts a small monthly free credit, enough for a light student-project database. If you'd rather have something with no time/credit limit at all, use **db4free.net** instead: sign up there, create a database, and you'll get a host/user/password/db name the same way.

---

## Step 3 — Deploy the backend (Render)

1. Go to **render.com** → sign up → **New** → **Web Service** → connect your GitHub repo.
2. Configure:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn run:app`
   - **Instance Type:** Free
3. Add environment variables (Render's **Environment** tab) using the MySQL values from Step 2:
   ```
   DB_USER=<from Railway>
   DB_PASSWORD=<from Railway>
   DB_HOST=<from Railway>
   DB_PORT=<from Railway>
   DB_NAME=<from Railway>
   JWT_SECRET_KEY=<make up a long random string>
   CORS_ORIGINS=http://localhost:5173
   ```
   (You'll update `CORS_ORIGINS` again in Step 5 once you know your real frontend URL.)
4. Click **Create Web Service**. Render will build and deploy — watch the logs. When it's done you'll get a URL like:
   ```
   https://bluepay-backend.onrender.com
   ```
5. Test it: open `https://bluepay-backend.onrender.com/api/health` in a browser. You should see `{"status":"ok"}`. The first load may take up to a minute (cold start).

---

## Step 4 — Deploy the frontend (Vercel)

1. Go to **vercel.com** → sign up → **Add New Project** → import the same GitHub repo.
2. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add an environment variable:
   ```
   VITE_API_URL=https://bluepay-backend.onrender.com/api
   ```
   (use your actual Render URL from Step 3)
4. Click **Deploy**. You'll get a URL like:
   ```
   https://bluepay.vercel.app
   ```

---

## Step 5 — Connect the two (update CORS)

Go back to Render → your web service → **Environment** → update:
```
CORS_ORIGINS=https://bluepay.vercel.app
```
Save — Render will redeploy automatically. This tells your Flask backend to accept requests from your live frontend (without it, the browser blocks the API calls for security reasons).

---

## Step 6 — Create demo accounts on the live database

The `seed.py` script needs to run against your live MySQL, not your laptop's.
Easiest way — run it locally but pointed at Railway:

```bash
cd backend
source venv/bin/activate      # or venv\Scripts\activate.bat on Windows
```
Temporarily edit `.env` to use the **Railway** DB values from Step 2 instead of your local MySQL, then:
```bash
python database/seed.py
```
This creates `rohan@example.com` / `priya@example.com` (password `password123`) directly in the live database. Change `.env` back afterward if you still want to run locally too.

---

## Step 7 — Share the link

Give evaluators: **`https://bluepay.vercel.app`**

Demo flow: log in as `rohan@example.com` in one browser, `priya@example.com` in an incognito window, turn Bluetooth on in both, then Pair & Pay from one side.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Frontend loads but API calls fail (Network tab shows CORS error) | `CORS_ORIGINS` on Render doesn't match your exact Vercel URL — check for a trailing slash or `www.` mismatch |
| First request after idle takes ~30-60s | Normal Render free-tier cold start — not a bug |
| "Internal Server Error" from the backend | Check Render's **Logs** tab — usually a missing/wrong DB environment variable |
| `pymysql.err.OperationalError` about SSL | Some managed MySQL providers require SSL; Railway's default connection usually doesn't need it, but if you switch providers, check their connection docs for an SSL parameter to add to the connection string |
