import express from "express";
import fetch from "node-fetch";
import dns from "dns";
import https from "https";

const app = express();
const PORT = process.env.PORT || 8080;
const TARGET = "https://leran-one.vercel.app";
const FIRESTORE = "https://firestore.googleapis.com";

// --- DNS resolver (Shecan) ---
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
    console.error("DNS lookup fallback:", hostname);
    return { address: hostname, family: 4 };
  }
};

const agent = new https.Agent({ lookup });

// --- Core ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MIME type fix
app.use((req, res, next) => {
  if (req.path.endsWith(".woff2")) res.type("font/woff2");
  else if (req.path.endsWith(".woff")) res.type("font/woff");
  next();
});

// Proxy handling
app.all("*", async (req, res) => {
  try {
    const targetUrl = req.originalUrl.includes("google.firestore.v1.")
      ? FIRESTORE + req.originalUrl
      : TARGET + req.originalUrl;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

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
    clearTimeout(timeout);

    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");

    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.status(response.status);
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Proxy error:", err.name, err.message);
    res.status(502).send("Proxy Error: " + err.message);
  }
});

app.listen(PORT, () =>
  console.log(`🌍 Mirror Proxy active on port ${PORT}`)
);
