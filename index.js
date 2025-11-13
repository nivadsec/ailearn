// ✅ فعال‌سازی DNS شکن در سطح Node.js
import dns from "dns";
dns.setServers(["178.22.122.100", "185.51.200.2"]); // Shecan DNS
console.log("✅ Shecan DNS activated inside Node.js");

// 🚀 تنظیمات و ماژول‌ها
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.text({ type: "*/*" }));

// 🌐 Proxy اصلی: هر درخواست را از سایت مقصد واکشی و بازگشت می‌دهد
app.get("*", async (req, res) => {
  const target = "https://leran-one.vercel.app" + req.originalUrl;
  try {
    const response = await fetch(target, {
      headers: {
        "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
      },
    });

    const data = await response.text();
    const contentType = response.headers.get("content-type") || "text/html";

    res.set("Content-Type", contentType);
    res.status(response.status).send(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Internal Proxy Error ❌");
  }
});

// ⚙️ اجرای سرور
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🌍 Mirror Proxy running on port ${PORT} with US IP + Shecan DNS`)
);
