// ----------------------------------------------------
// Mirror Proxy - Final Stable Version (Railway Ready)
// Author: MohammadHasan
// ----------------------------------------------------

import express from "express";
import fetch from "node-fetch";
import dns from "dns";
import https from "https";

const app = express();
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
    console.warn("⚠️ DNS fallback for:", hostname);
    return { address: hostname, family: 4 };
  }
};

const agent = new https.Agent({ lookup });

// ===== Express Middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MIME Type Fix (for Fonts)
app.use((req, res, next) => {
  if (req.path.endsWith(".woff2")) res.type("font/woff2");
  else if (req.path.endsWith(".woff")) res.type("font/woff");
  next();
});

// ===== Proxy Core =====
app.all("*", async (req, res) => {
  try {
    const isFirestore = req.originalUrl.includes("google.firestore.v1.");
    const targetUrl = isFirestore
      ? FIRESTORE + req.originalUrl
      : TARGET + req.originalUrl;

    // Dynamic Timeout Management
    const isListen = req.originalUrl.includes(
      "google.firestore.v1.Firestore/Listen"
    );

    const controller = new AbortController();
    let timeout;
    if (!isListen) {
      const time = isFirestore ? 40000 : 25000; // longer for Firestore
      timeout = setTimeout(() => controller.abort(), time);
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { ...req.headers, host: undefined },
      body:
        ["GET", "HEAD"].includes(req.method) || !req.body
          ? undefined
          : JSON.stringify(req.body),
      agent,
      signal: controller.signal,
    });

    if (timeout) clearTimeout(timeout);

    // Apply CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );

    // Copy headers from target response
    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.status(response.status);

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("❌ Proxy error:", err.name, "-", err.message);
    const message =
      err.name === "AbortError"
        ? "Destination timeout — operation took too long."
        : err.message;
    res.status(502).send("Proxy Error: " + message);
  }
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`🚀 Mirror Proxy running on port ${PORT}`);
});
