// index.js — Proxy for Firebase Firestore
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const allowedOrigins = ["https://leran-one.vercel.app"];
app.use(cors({ origin: allowedOrigins }));
app.use(express.text({ type: "*/*" }));

app.all("*", async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl)
      return res.status(400).json({ error: "Missing ?url= parameter" });

    const firebaseRes = await fetch(targetUrl, {
      method: req.method,
      headers: req.headers,
      body:
        req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
    });

    const data = await firebaseRes.text();
    res.status(firebaseRes.status).send(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log("🔥 Proxy running on port 3000"));
