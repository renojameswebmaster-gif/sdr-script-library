# SDR Integration Server

Secure OAuth backend for the SDR Script Library. Provider secrets must stay in server environment variables and must never be placed in the GitHub Pages frontend.

## Local setup

```powershell
Copy-Item .env.example .env
npm install
npm start
```

Health check: `http://localhost:3000/health`

## Provider setup

Create a Slack app and RingCentral Developer App, then set the client IDs, client secrets, and callback URLs from `.env.example`.

For Render, use these callback URLs after deployment:

- `https://YOUR-RENDER-SERVICE.onrender.com/auth/slack/callback`
- `https://YOUR-RENDER-SERVICE.onrender.com/auth/ringcentral/callback`

Set `FRONTEND_URL` to the deployed SDR Script Library URL. Never commit `.env` or provider secrets.

## Current routes

- `GET /auth/slack/start`
- `GET /auth/ringcentral/start`
- `GET /auth/:provider/callback`
- `GET /api/session`
- `POST /api/logout`
- `GET /health`
