import crypto from "node:crypto";
import "dotenv/config";
import cors from "cors";
import express from "express";
import session from "express-session";

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5500";
const isProduction = process.env.NODE_ENV === "production";

app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json());
app.use(session({
  name: "sdr.sid",
  secret: process.env.SESSION_SECRET || "development-only-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction
  }
}));

function requireConfig(keys) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length) {
    const error = new Error(`Missing environment variables: ${missing.join(", ")}`);
    error.statusCode = 503;
    throw error;
  }
}

function createState(provider) {
  const state = crypto.randomBytes(24).toString("hex");
  if (!state) throw new Error("Could not create OAuth state");
  return `${provider}.${state}`;
}

function consumeState(req, provider, value) {
  const expected = req.session.oauthState;
  delete req.session.oauthState;
  return typeof value === "string" && expected === value && value.startsWith(`${provider}.`);
}

function redirectToFrontend(res, path) {
  res.redirect(`${frontendUrl}${path}`);
}

async function exchangeCode(provider, code) {
  const isSlack = provider === "slack";
  const endpoint = isSlack
    ? "https://slack.com/api/oauth.v2.access"
    : `${process.env.RINGCENTRAL_SERVER_URL || "https://platform.ringcentral.com"}/restapi/oauth/token`;
  const body = isSlack
    ? new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: process.env.SLACK_REDIRECT_URI
      })
    : new URLSearchParams({
        code,
        redirect_uri: process.env.RINGCENTRAL_REDIRECT_URI,
        grant_type: "authorization_code"
      });
  const headers = { "content-type": "application/x-www-form-urlencoded" };

  if (!isSlack) {
    headers.authorization = `Basic ${Buffer.from(`${process.env.RINGCENTRAL_CLIENT_ID}:${process.env.RINGCENTRAL_CLIENT_SECRET}`).toString("base64")}`;
  }

  const response = await fetch(endpoint, { method: "POST", headers, body });
  const data = await response.json();
  if (!response.ok || (isSlack && !data.ok) || !data.access_token) {
    throw new Error(`OAuth token exchange failed for ${provider}`);
  }
  return data;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "sdr-script-library-server" });
});

app.get("/auth/:provider/start", (req, res, next) => {
  try {
    const { provider } = req.params;
    const state = createState(provider);
    req.session.oauthState = state;

    if (provider === "slack") {
      requireConfig(["SLACK_CLIENT_ID", "SLACK_REDIRECT_URI"]);
      const params = new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID,
        user_scope: process.env.SLACK_SCOPES || "openid,profile,email",
        redirect_uri: process.env.SLACK_REDIRECT_URI,
        state
      });
      return res.redirect(`https://slack.com/oauth/v2/authorize?${params}`);
    }

    if (provider === "ringcentral") {
      requireConfig(["RINGCENTRAL_CLIENT_ID", "RINGCENTRAL_REDIRECT_URI"]);
      const params = new URLSearchParams({
        response_type: "code",
        client_id: process.env.RINGCENTRAL_CLIENT_ID,
        redirect_uri: process.env.RINGCENTRAL_REDIRECT_URI,
        state
      });
      return res.redirect(`https://platform.ringcentral.com/restapi/oauth/authorize?${params}`);
    }

    return res.status(404).json({ error: "Unsupported provider" });
  } catch (error) {
    return next(error);
  }
});

app.get("/auth/:provider/callback", async (req, res, next) => {
  try {
    const { provider } = req.params;
    if (!consumeState(req, provider, req.query.state)) {
      return res.status(400).send("Invalid OAuth state.");
    }

    if (!req.query.code) return res.status(400).send("OAuth authorization code is missing.");
    requireConfig(provider === "slack"
      ? ["SLACK_CLIENT_ID", "SLACK_CLIENT_SECRET", "SLACK_REDIRECT_URI"]
      : ["RINGCENTRAL_CLIENT_ID", "RINGCENTRAL_CLIENT_SECRET", "RINGCENTRAL_REDIRECT_URI"]);

    const tokenData = await exchangeCode(provider, req.query.code);
    // Tokens remain in the server session and are never sent to the browser.
    req.session.connected = { provider, connectedAt: new Date().toISOString() };
    req.session.tokens = {
      ...req.session.tokens,
      [provider]: tokenData
    };
    return redirectToFrontend(res, `/?connected=${provider}`);
  } catch (error) {
    return next(error);
  }
});

app.get("/api/session", (req, res) => {
  res.json({ connected: req.session.connected || null });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.status(204).end());
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.statusCode || 500).json({ error: error.message || "Unexpected server error" });
});

app.listen(port, () => {
  console.log(`SDR integration server listening on port ${port}`);
});
