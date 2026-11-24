# Deployment Guide
**Version:** 1.0

## 1. Environments
Maintain local, staging, and production environments with separate databases, credentials, origins, and secrets. Never use production data for routine tests.

## 2. Prerequisites
Install a supported Node.js LTS release, package manager selected by the repository, Git, and access to MongoDB Atlas or local MongoDB. Exact versions are selected and recorded during implementation.

## 3. Environment variables
Client example:
```env
VITE_API_BASE_URL=https://api.example.com/api/v1
VITE_SOCKET_URL=https://api.example.com
```
Server example:
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=<secret>
CLIENT_ORIGIN=https://app.example.com
SESSION_SECRET=<long-random-secret>
SESSION_TTL_SECONDS=86400
LOG_LEVEL=info
```
Never commit real secrets. Validate required variables at startup and fail safely when missing.

## 4. Local development
1. Clone repository.
2. Install dependencies using lockfile.
3. Configure local environment files.
4. Start MongoDB.
5. Run database migrations/index setup and curated dataset import.
6. Start backend and frontend development servers.
7. Verify REST health check and Socket.IO handshake.
8. Test with multiple browser profiles.

Exact commands must match final package scripts and be added to README.md.

## 5. Production deployment
- Build frontend as static assets and deploy to a static hosting provider.
- Deploy backend to persistent Node.js hosting with WebSocket support.
- Configure MongoDB Atlas network access, least-privilege credentials, backups, and TLS.
- Set frontend origin in backend CORS allowlist.
- Configure HTTPS/WSS, health checks, logs, and deployment rollback.
- Confirm platform proxy timeout and WebSocket upgrade support.

## 6. Socket.IO considerations
Use a persistent process. If multiple instances are used, configure a compatible adapter and sticky-session strategy where required by the deployment topology. Test reconnects and rolling deployments. Do not assume a static frontend host can host the authoritative Socket.IO server.

## 7. CI/CD
Pipeline: lint → typecheck → unit tests → integration tests → build → security/dependency checks → deploy staging → smoke tests → manual/automated production approval. Keep secrets in provider secret manager.

## 8. Operations
Monitor uptime, API errors, socket connection counts, reconnect rate, room/game transition failures, database latency, and rate-limit events. Logs must not include secrets, role assignments, secret words, or raw votes. Document backup restore tests and incident response ownership.

## 9. Troubleshooting
- Socket fails: verify WSS URL, CORS origin, proxy WebSocket support, backend process health.
- Database connection fails: verify URI, IP allowlist, credentials, TLS, connection limits.
- Client stale: request authorized snapshot and compare server version.
- Duplicate actions: inspect idempotency keys and unique indexes.
- Missing audio: check user gesture/autoplay permission and mute preferences.
