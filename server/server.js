import crypto from "node:crypto";
import "dotenv/config";
import cors from "cors";
import express from "express";
import session from "express-session";

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5500")
  .trim()
  .replace(/^['"]|['"]$/g, "")
  .replace(/[\r\n]/g, "");
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

function requireAuth(req, provider) {
  const tokenData = req.session.tokens?.[provider];
  if (!tokenData?.access_token) {
    const error = new Error(`${provider} is not connected`);
    error.statusCode = 401;
    throw error;
  }
  return tokenData;
}

async function providerRequest(url, tokenData, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      authorization: `Bearer ${tokenData.access_token}`,
      ...(options.headers || {})
    }
  });
  const data = await response.json();
  if (!response.ok || data.error || data.errorCode) {
    const error = new Error(data.error?.message || data.message || "Provider request failed");
    error.statusCode = response.status;
    throw error;
  }
  return data;
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
  const accessToken = data.access_token || data.authed_user?.access_token;
  if (!response.ok || (isSlack && !data.ok) || !accessToken) {
    throw new Error(`OAuth token exchange failed for ${provider}`);
  }
  return { ...data, access_token: accessToken };
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
  res.json({
    connected: req.session.connected || null,
    providers: Object.fromEntries(Object.keys(req.session.tokens || {}).map((provider) => [provider, true]))
  });
});

app.get("/api/slack/channels", async (req, res, next) => {
  try {
    const token = requireAuth(req, "slack");
    res.json(await providerRequest("https://slack.com/api/conversations.list?exclude_archived=true&limit=100", token));
  } catch (error) { next(error); }
});

app.get("/api/slack/messages", async (req, res, next) => {
  try {
    const token = requireAuth(req, "slack");
    const channel = encodeURIComponent(req.query.channel || "");
    if (!channel) return res.status(400).json({ error: "channel is required" });
    res.json(await providerRequest(`https://slack.com/api/conversations.history?channel=${channel}&limit=50`, token));
  } catch (error) { next(error); }
});

app.post("/api/slack/messages", async (req, res, next) => {
  try {
    const token = requireAuth(req, "slack");
    if (!req.body.channel || !req.body.text) return res.status(400).json({ error: "channel and text are required" });
    res.json(await providerRequest("https://slack.com/api/chat.postMessage", token, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ channel: req.body.channel, text: req.body.text })
    }));
  } catch (error) { next(error); }
});

app.get("/api/slack/presence", async (req, res, next) => {
  try {
    const token = requireAuth(req, "slack");
    const user = encodeURIComponent(req.query.user || "me");
    res.json(await providerRequest(`https://slack.com/api/users.getPresence?user=${user}`, token));
  } catch (error) { next(error); }
});

app.get("/api/ringcentral/account", async (req, res, next) => {
  try {
    const token = requireAuth(req, "ringcentral");
    const base = process.env.RINGCENTRAL_SERVER_URL || "https://platform.ringcentral.com";
    res.json(await providerRequest(`${base}/restapi/v1.0/account/~/extension/~`, token));
  } catch (error) { next(error); }
});

app.get("/api/ringcentral/calls", async (req, res, next) => {
  try {
    const token = requireAuth(req, "ringcentral");
    const base = process.env.RINGCENTRAL_SERVER_URL || "https://platform.ringcentral.com";
    res.json(await providerRequest(`${base}/restapi/v1.0/account/~/extension/~/call-log?perPage=50`, token));
  } catch (error) { next(error); }
});

app.get("/api/ringcentral/contacts", async (req, res, next) => {
  try {
    const token = requireAuth(req, "ringcentral");
    const base = process.env.RINGCENTRAL_SERVER_URL || "https://platform.ringcentral.com";
    res.json(await providerRequest(`${base}/restapi/v1.0/account/~/extension/~/address-book/contact?perPage=50`, token));
  } catch (error) { next(error); }
});

app.get("/api/ringcentral/presence", async (req, res, next) => {
  try {
    const token = requireAuth(req, "ringcentral");
    const base = process.env.RINGCENTRAL_SERVER_URL || "https://platform.ringcentral.com";
    res.json(await providerRequest(`${base}/restapi/v1.0/account/~/extension/~/presence`, token));
  } catch (error) { next(error); }
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
