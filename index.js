import express from "express";
import fetch from "node-fetch";
import dns from "dns";
import https from "https";

const app = express();
const PORT = process.env.PORT || 8080;

// ✅ هدف آینه (Frontend یا سایتی که قراره Mirror بشه)
const TARGET = "https://leran-one.vercel.app";
const FIRESTORE = "https://firestore.googleapis.com";

// ✅ Resolver اختصاصی برای DNS شکن
const resolver = new dns.promises.Resolver();
resolver.setServers([
  "178.22.122.100",
  "185.51.200.2",
  "185.55.225.25",
  "178.22.122.101",
]);

async function customLookup(hostname) {
  try {
    const [ip] = await resolver.resolve4(hostname);
    return { address: ip, family: 4 };
  } catch (err) {
    console.error("DNS Resolve Error:", err);
    throw err;
  }
}

// ✅ HTTPS Agent با override کردن DNS شکن
const agent = new https.Agent({ lookup: customLookup });

// 🧩 Middleware برای پارس درخواست‌ها
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ MIME-Type fix برای WOFF/WOFF2 (حل ارور فونت‌ها)
app.use((req, res, next) => {
  if (req.path.endsWith(".woff2")) res.type("font/woff2");
  else if (req.path.endsWith(".woff")) res.type("font/woff");
  next();
});

// ✅ پشتیبانی از تمام متدها + بازنویسی مسیر Firestore
app.all("*", async (req, res) => {
  try {
    const isFirestore = req.originalUrl.includes("google.firestore.v1.");
    const targetUrl = isFirestore
      ? FIRESTORE + req.originalUrl
      : TARGET + req.originalUrl;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: undefined,
        origin: undefined,
        referer: undefined,
      },
      agent,
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : JSON.stringify(req.body),
    });

    // ✅ CORS Header برای مرورگر
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");

    // ✅ عبور دادن بقیه headerها از پاسخ اصلی
    response.headers.forEach((v, k) => {
      res.setHeader(k, v);
    });

    res.status(response.status);
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("❌ Proxy Error:", err);
    res.status(500).send("Proxy failed");
  }
});

app.listen(PORT, () =>
  console.log(`✅ Mirror Proxy running on port ${PORT}`)
);
