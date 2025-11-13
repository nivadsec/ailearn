# Lernova Firebase Proxy

Proxy server for Firebase (Firestore) hosted on Render.

## How it Works
Front-end → api.lernova.ir (Render proxy) → Firestore

## Deployment
1. Upload folder to GitHub.
2. On Render, create a new **Web Service** linked to this repo.
3. Build Command: `npm install`
4. Start Command: `node index.js`
5. Region: Oregon (US)

## CORS
Restricted to `https://leran-one.vercel.app` for security.

## Optional Security
Set a header `x-proxy-key: your-secret-key` in your front-end requests to limit access.

## Example Request
```js
const PROXY = 'https://api.lernova.ir';
const FIREBASE_URL = encodeURIComponent('https://firestore.googleapis.com/v1/projects/lernova-db/databases/(default)/documents/students');
fetch(`${PROXY}/?url=${FIREBASE_URL}`)
  .then(r => r.json())
  .then(console.log);
```