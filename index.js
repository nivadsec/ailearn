import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

// 💢 فعال کردن CORS برای آزمایش
app.use(cors());
app.use(express.text({ type: "*/*" }));

// 🎯 مسیر اصلی — سایت مقصد را فچ کرده و نمایش می‌دهد
app.get("*", async (req, res) => {
  const targetURL = "https://leran-one.vercel.app" + req.originalUrl;
  try {
    const response = await fetch(targetURL, {
      headers: { "User-Agent": req.headers["user-agent"] || "Mozilla/5.0" },
    });

    // محتوای دریافتی (HTML، CSS، JS، ...‌)
    const data = await response.text();

    // هدر مناسب برای Browser
    res.set("Content-Type", response.headers.get("content-type") || "text/html");
    res.status(response.status).send(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Internal proxy error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🌍 Mirror is running on port ${PORT} (US IP active)`)
);
