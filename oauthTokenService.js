require("dotenv").config();
const axios = require("axios");

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  const now = Date.now();

  if (cachedToken && now < tokenExpiresAt - 30_000) {
    return cachedToken;
  }

  const tokenUrl = process.env.OAUTH_TOKEN_URL;
  const merchantId = process.env.OAUTH_CLIENT_ID;
  const secretKey = process.env.OAUTH_CLIENT_SECRET;

  if (!tokenUrl || !merchantId || !secretKey) {
    throw new Error("Missing OAuth env vars.");
  }

  const resp = await axios.post(
    tokenUrl,
    {
      merchantId,
      secretKey
    },
    {
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 5000
    }
  );

  console.log("OAuth token response:", resp.data);

  const token =
    resp.data?.access_token ||
    resp.data?.token ||
    resp.data?.AuthorizationToken ||
    resp.data?.authorizationToken;

  const expiresIn = Number(resp.data?.expires_in ?? 3600);

  if (!token) {
    throw new Error("OAuth response missing token.");
  }

  cachedToken = token;
  tokenExpiresAt = now + expiresIn * 1000;

  return token;
}

module.exports = { getAccessToken };