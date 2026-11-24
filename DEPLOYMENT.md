# Word Imposter – Complete Production Deployment Guide

This guide details the complete, step-by-step procedure to deploy the **Word Imposter** real-time multiplayer application to **Render** with **MongoDB Atlas**.

---

## Architecture Overview

- **Hosting Platform:** [Render](https://render.com) (Single Web Service)
- **Database:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Managed Cloud Database)
- **Unified Single-Origin Deployment:** The Node.js Express backend serves the pre-built React/Vite SPA static bundle from `client/dist`. 
  - Express API (`/api/v1/*`), Socket.IO real-time channels (`/socket.io/*`), and Frontend UI run on the **same origin and port**.
  - Eliminates cross-origin cookie/header issues, CORS restrictions, and websocket origin mismatches.

---

## 1. Prerequisites

Before starting deployment, ensure you have:
1. A [GitHub](https://github.com) account with repository access.
2. A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (Free M0 or higher tier).
3. A [Render](https://render.com) account.
4. Node.js v20+ and npm installed locally (for testing).

---

## 2. MongoDB Atlas Setup

### Step 2.1: Create a Cluster
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Click **Create** to deploy a new database cluster.
3. Choose **M0 (Free Tier)**, select your preferred cloud provider (AWS/GCP), and a region closest to your users.
4. Name your cluster (e.g. `word-imposter-cluster`) and click **Create Deployment**.

### Step 2.2: Configure Database User Authentication
1. Navigate to **Security > Database Access**.
2. Click **Add New Database User**.
3. Choose **Password** authentication:
   - **Username:** `word_imposter_app` (or your preferred name)
   - **Password:** Generate a strong random password (save it securely; you will need it for `MONGODB_URI`).
4. Under **Database User Privileges**, select **Read and write to any database** (or restrict to `word_imposter`).
5. Click **Add User**.

### Step 2.3: Configure Network Access
1. Navigate to **Security > Network Access**.
2. Click **Add IP Address**.
3. Select **Allow Access From Anywhere** (`0.0.0.0/0`) — this is required so Render dynamic worker IPs can connect.
4. Enter `Render cloud hosting` as the description and click **Confirm**.

### Step 2.4: Obtain Connection String
1. Navigate to **Database > Clusters** and click **Connect**.
2. Select **Drivers** (Node.js).
3. Copy the connection URI:
   ```text
   mongodb+srv://word_imposter_app:<password>@cluster0.abcde.mongodb.net/word_imposter?retryWrites=true&w=majority
   ```
4. Replace `<password>` with the password created in Step 2.2.

---

## 3. Environment Variables Reference

| Variable Name | Environment | Mandatory | Description / Example |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Production | **Yes** | Set to `production` (enforces security guards and disables fallback in-memory DB). |
| `PORT` | Production | **Auto** | Managed automatically by Render (default is 10000 or 3000). |
| `MONGODB_URI` | Production | **Yes** | Your full MongoDB Atlas connection URI string obtained in Step 2.4. |
| `SESSION_SECRET` | Production | **Yes** | Cryptographically strong secret key used for signing JWT session tokens. |
| `CLIENT_ORIGIN` | Production | Optional | In unified deployment, leave empty. If frontend is hosted on a custom domain, set to `https://your-custom-domain.com`. |
| `DATASET_PATH` | Production | Optional | Leave empty (the server automatically auto-detects `imposter_game_dataset_1500.csv`). |

> [!IMPORTANT]
> To generate a secure `SESSION_SECRET`, run this in your terminal:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## 4. Render Web Service Deployment

### Step 4.1: Create Web Service
1. In the [Render Dashboard](https://dashboard.render.com/), click **New +** and select **Web Service**.
2. Connect your GitHub repository containing the **Word Imposter** project.
3. Configure service details:
   - **Name:** `word-imposter`
   - **Region:** Choose the region closest to your MongoDB Atlas cluster.
   - **Branch:** `main` (or your deployment branch)
   - **Root Directory:** *(leave blank — use repository root)*
   - **Runtime:** `Node`

### Step 4.2: Build & Start Commands
Specify these exact commands:

- **Build Command:**
  ```bash
  npm run install:all && npm run build
  ```
- **Start Command:**
  ```bash
  npm start
  ```

### Step 4.3: Health Check Path
Under **Advanced > Health Check Path**, enter:
```text
/health
```
Render automatically checks this endpoint before routing traffic to new deploys.

### Step 4.4: Add Environment Variables
Under the **Environment Variables** section on Render, add:

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://word_imposter_app:YOUR_PASSWORD@cluster0.abcde.mongodb.net/word_imposter?retryWrites=true&w=majority` |
| `SESSION_SECRET` | `YOUR_SECURE_64_CHAR_HEX_KEY` |

Click **Create Web Service**.

---

## 5. Post-Deployment Verification Checklist

Once Render finishes deploying:

1. **Verify Health Endpoint:**
   Visit: `https://your-service-name.onrender.com/health`
   Expected response (HTTP 200):
   ```json
   {
     "status": "healthy",
     "uptime": 12,
     "database": "connected",
     "timestamp": "2026-11-24T11:00:00.000Z",
     "environment": "production"
   }
   ```

2. **Verify Dataset Auto-Seeding:**
   Check the Render deploy logs. You should see:
   ```text
   Database has 0 word pairs. Attempting auto-seed...
   Auto-seeding word pairs from: .../imposter_game_dataset_1500.csv
   Import summary: 1500 accepted, 0 rejected.
   ```

3. **Verify Web Client UI:**
   Open `https://your-service-name.onrender.com/` in your browser.
   - The landing page should render with options to **Create Room** or **Join Room**.

4. **Verify Multiplayer Gameplay:**
   - Create a room on Tab 1 (Host).
   - Copy the room invitation link or 6-character code.
   - Open Tab 2 and Tab 3 in incognito or separate browsers to join.
   - Verify:
     - Real-time player roster updates.
     - Host starts game (minimum 3 players).
     - Secret words delivered privately.
     - Speaking round progression.
     - Voting round and elimination.
     - Eliminated player spectator mode (no speak/vote options).
     - Imposter role rotation on rematch.

---

## 6. Common Issues & Troubleshooting

### Issue 1: MongoDB Connection Timeout (`MongoServerSelectionError`)
- **Cause:** Network access in MongoDB Atlas does not whitelist Render's dynamic IPs.
- **Fix:** In MongoDB Atlas > **Network Access**, ensure `0.0.0.0/0` is added and Active.

### Issue 2: `FATAL: MONGODB_URI is required in production mode`
- **Cause:** `NODE_ENV=production` is set, but `MONGODB_URI` was omitted or empty in Render's environment settings.
- **Fix:** Add `MONGODB_URI` in Render Environment settings and trigger a redeploy.

### Issue 3: `FATAL: A custom, strong SESSION_SECRET is required in production mode`
- **Cause:** The default development fallback secret was detected in production.
- **Fix:** Generate a unique secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and set it as `SESSION_SECRET` in Render.

### Issue 4: Socket.IO Connection Errors or Disconnections
- **Cause:** Attempting to connect across mismatched protocols (`http` vs `https`) or separate origins.
- **Fix:** With the unified deployment architecture, the client automatically connects to `window.location.origin` via WSS with no extra configuration needed.

---

## 7. Local Production Testing

To test the complete production build locally before pushing to GitHub:

```bash
# 1. Run full build
npm run build

# 2. Test server in production mode
npm start
```
Open [http://localhost:3000](http://localhost:3000) to verify.
