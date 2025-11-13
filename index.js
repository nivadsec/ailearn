// فعال‌سازی DNS شکن (Shecan) در lookup داخلی
import https from "https";
import dns from "dns";
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

// IPهای DNS شکن
const shecanDNS = ["178.22.122.100", "185.51.200.2"];

// تابع lookup سفارشی که برای هر اتصال HTTPS از Shecan استفاده می‌کند
const lookup = (hostname, options, callback) => {
  dns.setServers(shecanDNS);
  dns.lookup(hostname, options, callback);
};

// Agent اختصاصی برای استفاده در همهٔ اتصالات HTTPS
const agent = new https.Agent({ lookup });

const app = express();
app.use(cors());
app.use(express.text({ type: "*/*" }));

// مسیر سلامت (Health Check) برای Railway
app.get("/", (req, res) => {
  res.status(200).send("✅ Mirror Proxy with Shecan DNS is running");
});

// مسیرهای Mirror (سایر درخواست‌ها را پروکسی می‌کند)
app.get("*", async (req, res) => {
  const target = "https://leran-one.vercel.app" + req.originalUrl;
  try {
    const response = await fetch(target, { agent });
    const data = await response.text();
    const contentType = response.headers.get("content-type") || "text/html";

    res.set("Content-Type", contentType);
    res.status(response.status).send(data);
  } catch (err) {
    console.error("Proxy DNS error:", err);
    res.status(500).send("Internal Proxy DNS Error ❌");
  }
});

// پورت Railway (پویا)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Mirror Proxy running on port ${PORT} with Shecan DNS`)
);
