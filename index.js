// -----------------------------
// Mirror Proxy - Stable Release
// Author: MohammadHasan
// -----------------------------

import express from "express";
import fetch from "node-fetch";
import dns from "dns";
import https from "https";

const app = express(); // <— این خط باید قبل از app.use باشد
const PORT = process.env.PORT || 8080;

const TARGET = "https://leran-one.vercel.app";
const FIRESTORE = "https://firestore.googleapis.com";

// ===== DNS Resolver (Shecan) =====
const resolver = new dns.promises.Resolver();
resolver.setServers([
  "178.22.122.100",
  "185.51.200.2",
  "185.55.225.25",
  "178.22.122.101"
]);

const lookup = async (hostname) => {
  try {
    const [ip] = await resolver.resolve4(hostname);
    return { address: ip, family: 4 };
  } catch {
    return { address: hostname, family: 4 };
  }
};

const agent = new https.Agent({ lookup });

// ===== Express Middlewares =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MIME-Type Fix
app.use((req, res, next) => {
  if (req.path.endsWith(".woff2")) res.type("font/woff2");
  else if (req.path.endsWith(".woff")) res.type("font/woff");
  next();
});

// ===== Proxy Logic =====
app.all("*", async (req, res) => {
  try {
    const isFirestore = req.originalUrl.includes("google.firestore.v1.");
    const targetUrl = isFirestore
      ? FIRESTORE + req.originalUrl
      : TARGET + req.originalUrl;

    const isListen = req.originalUrl.includes("google.firestore.v1.Firestore/Listen");
    const controller = new AbortController();
    const timeout = !isListen ? setTimeout(() => controller.abort(), 20000) : null;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { ...req.headers, host: undefined },
      body:
        ["GET", "HEAD"].includes(req.method) || !req.body
          ? undefined
          : JSON.stringify(req.body),
      agent,
      signal: controller.signal
    });
    if (timeout) clearTimeout(timeout);

    // CORS fix
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");

    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.status(response.status);
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(502).send("Proxy Error: " + err.message);
  }
});

// ===== Start Server =====
app.listen(PORT, () =>
  console.log(`🌍 Mirror Proxy running on port ${PORT}`)
);
