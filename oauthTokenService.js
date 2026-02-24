// oauthTokenService.js
require("dotenv").config();
const axios = require("axios");

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * OAuth 2.0 Client Credentials Grant:
 * - Requests access token from token endpoint
 * - Caches token until just before expiration
 */
async function getAccessToken() {
  const now = Date.now();

  // reuse token if valid (30s buffer)
  if (cachedToken && now < tokenExpiresAt - 30_000) return cachedToken;

  const tokenUrl = process.env.OAUTH_TOKEN_URL;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  if (!tokenUrl || !clientId || !clientSecret) {
    throw new Error("Missing OAuth env vars (OAUTH_TOKEN_URL / CLIENT_ID / CLIENT_SECRET).");
  }

  // Common format: application/x-www-form-urlencoded
  const body = new URLSearchParams();
  body.append("grant_type", "client_credentials");
  body.append("client_id", clientId);
  body.append("client_secret", clientSecret);

  const resp = await axios.post(tokenUrl, body.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 5000
  });

  const token = resp.data?.access_token;
  const expiresIn = Number(resp.data?.expires_in ?? 3600);

  if (!token) throw new Error("OAuth response missing access_token.");

  cachedToken = token;
  tokenExpiresAt = now + expiresIn * 1000;

  return token;
}

module.exports = { getAccessToken };
