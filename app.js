/** =========================================
 *  app.js — Passenger entry
 *  Debug env visibility + start Next server
 *  ========================================= */

const next = require("next");
const http = require("http");

// Optional: load .env locally only (won't affect production)
if (process.env.NODE_ENV !== "production") {
  try { require("dotenv").config(); } catch (_) {}
}

console.log("[boot] NODE_ENV:", process.env.NODE_ENV);
console.log("[boot] PORT:", process.env.PORT);
console.log("[boot] ADMIN_API_KEY:", process.env.ADMIN_API_KEY ? "set" : "missing");
console.log("[boot] ADMIN_API_URL:", process.env.ADMIN_API_URL ? "set" : "missing");
console.log("[boot] API_BASE_URL:", process.env.API_BASE_URL ? "set" : "missing");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const port = Number(process.env.PORT) || 3000;
  http.createServer((req, res) => handle(req, res)).listen(port, "0.0.0.0", () => {
    console.log(`[boot] server listening on ${port} (dev=${dev})`);
  });
});