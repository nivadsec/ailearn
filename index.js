import https from "https";
import dns from "dns";
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

// DNS شکن Shecan
const shecanDNS = ["178.22.122.100", "185.51.200.2"];
dns.setServers(shecanDNS);

// lookup اختصاصی جهت اطمینان از resolve با Shecan
const lookup = (hostname, options, callback) => {
  dns.lookup(hostname, options, callback);
};
const agent = new https.Agent({ lookup });

const app = express();
app.use(cors());
app.use(express.text({ type: "*/*" }));

// مسیر اصلی: محتوای سایت leran-one.vercel.app را واکشی و بازگشت می‌دهد
app.get("/", async (req, res) => {
  const target = "https://leran-one.vercel.app";
  try {
    const response = await fetch(target, { agent });
    const html = await response.text();
    res.set("Content-Type", response.headers.get("content-type") || "text/html");
    res.status(response.status).send(html);
  } catch (err) {
    console.error("Proxy DNS error:", err);
    res.status(500).send("<h3>❌ خطا در واکشی دامنه مقصد</h3>" + err.message);
  }
});

// سایر مسیرها نیز Mirror خواهند بود
app.get("*", async (req, res) => {
  const target = "https://leran-one.vercel.app" + req.originalUrl;
  try {
    const response = await fetch(target, { agent });
    const data = await response.text();
    res.set("Content-Type", response.headers.get("content-type") || "text/html");
    res.status(response.status).send(data);
  } catch (err) {
    res.status(500).send("Internal Proxy DNS Error ❌");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🌍 Mirror Proxy running (DNS: Shecan) port ${PORT}`)
);
