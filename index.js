/**
 * Lernova Firebase Proxy Server
 * Deploy-ready for Railway / Node.js v22
 */

import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());

// ✅ تنظیم امنیتی CORS فقط برای دامنه اصلی
app.use(cors({
  origin: "https://leran-one.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// ✅ مسیر سلامت برای Railway Healthcheck
app.get("/", (req, res) => {
  res.status(200).send("✅ Lernova Firebase Proxy is running successfully!");
});

// ✅ هسته‌ی پروکسی
app.use(async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).json({ error: "Missing ?url parameter" });

  try {
    const response = await fetch(target, {
      method: req.method,
      headers: { ...req.headers, host: undefined },
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });

    const body = await response.text();
    res.status(response.status).send(body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ پورت پویا برای سازگاری با Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 Proxy is live on port ${PORT}`);
});
