"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const data = require("./data");

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3000);
const frontendDir = path.resolve(__dirname, "..", "frontend");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webp": "image/webp"
};

let session = {
  signedIn: false
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": Buffer.byteLength(text)
  });
  res.end(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        req.destroy(new Error("Request body is too large"));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function docSummary(id) {
  const doc = data.docs[id];
  if (!doc) return null;

  return {
    id,
    conf: doc.conf,
    domain: doc.domain,
    pages: doc.pages,
    source: doc.source,
    title: doc.title,
    type: doc.type
  };
}

async function handleApi(req, res, url) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Origin": "*"
    });
    res.end();
    return true;
  }

  if (url.pathname === "/api/health" && req.method === "GET") {
    sendJson(res, 200, { ok: true, service: "gift-translate-backend" });
    return true;
  }

  if (url.pathname === "/api/bootstrap" && req.method === "GET") {
    sendJson(res, 200, {
      ...data,
      session,
      updatedAt: new Date().toISOString()
    });
    return true;
  }

  if (url.pathname === "/api/docs" && req.method === "GET") {
    sendJson(res, 200, data.library.map(docSummary).filter(Boolean));
    return true;
  }

  const docMatch = url.pathname.match(/^\/api\/docs\/([^/]+)$/);
  if (docMatch && req.method === "GET") {
    const id = decodeURIComponent(docMatch[1]);
    const doc = data.docs[id];
    sendJson(res, doc ? 200 : 404, doc ? { id, ...doc } : { error: "Document not found" });
    return true;
  }

  if (url.pathname === "/api/terms" && req.method === "GET") {
    sendJson(res, 200, data.terms);
    return true;
  }

  const termMatch = url.pathname.match(/^\/api\/terms\/([^/]+)$/);
  if (termMatch && req.method === "GET") {
    const id = decodeURIComponent(termMatch[1]);
    const term = data.terms[id];
    sendJson(res, term ? 200 : 404, term ? { id, ...term } : { error: "Term not found" });
    return true;
  }

  if (url.pathname === "/api/session" && req.method === "GET") {
    sendJson(res, 200, session);
    return true;
  }

  if (url.pathname === "/api/session" && req.method === "POST") {
    try {
      const body = await readBody(req);
      session = { signedIn: Boolean(body.signedIn) };
      sendJson(res, 200, session);
    } catch (error) {
      sendJson(res, 400, { error: "Invalid JSON body" });
    }
    return true;
  }

  return false;
}

function resolveFrontendPath(pathname) {
  const routeMap = {
    "/": "Gift Translate.dc.html",
    "/guide": "操作指南.dc.html"
  };
  const relativePath = routeMap[pathname] || decodeURIComponent(pathname.replace(/^\/+/, ""));
  const filePath = path.resolve(frontendDir, relativePath);

  if (!filePath.startsWith(frontendDir + path.sep) && filePath !== frontendDir) {
    return null;
  }

  return filePath;
}

function serveStatic(req, res, url) {
  const filePath = resolveFrontendPath(url.pathname);
  if (!filePath) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      sendText(res, 404, "Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = mimeTypes[ext] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=3600"
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || `${host}:${port}`}`);

  try {
    if (url.pathname.startsWith("/api/")) {
      const handled = await handleApi(req, res, url);
      if (!handled) sendJson(res, 404, { error: "API route not found" });
      return;
    }

    serveStatic(req, res, url);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "Internal server error" });
  }
});

server.listen(port, host, () => {
  console.log(`Gift Translate running at http://${host}:${port}`);
});
