"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const data = require("./data");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) process.env[key] = value;
  }
}

const rootDir = path.resolve(__dirname, "..");
loadEnvFile(path.join(rootDir, ".env"));

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3000);
const frontendDir = path.join(rootDir, "frontend");
const oxfordConfig = {
  appId: process.env.OXFORD_APP_ID || "",
  appKey: process.env.OXFORD_APP_KEY || "",
  baseUrl: process.env.OXFORD_BASE_URL || "https://od-api.oxforddictionaries.com/api/v2",
  language: process.env.OXFORD_LANGUAGE || "en-us"
};

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

function normalizeSearchText(value) {
  return String(value || "").trim().toLowerCase();
}

function termSearchFields(term) {
  return [
    term.en,
    term.zh,
    term.domain,
    term.defn,
    term.recommended,
    term.context,
    ...(Array.isArray(term.common) ? term.common : [])
  ].map(normalizeSearchText).filter(Boolean);
}

function lookupLocalTerms(query) {
  const q = normalizeSearchText(query);
  if (!q) return [];

  return Object.entries(data.terms)
    .map(([id, term]) => {
      const fields = termSearchFields(term);
      const exact = fields.some((field) => field === q);
      const startsWith = fields.some((field) => field.startsWith(q));
      const includes = fields.some((field) => field.includes(q));
      if (!exact && !startsWith && !includes) return null;

      const score = exact ? 3 : startsWith ? 2 : 1;
      return {
        id,
        ...term,
        commonStr: Array.isArray(term.common) ? term.common.join(" / ") : "",
        score
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.en.localeCompare(b.en))
    .slice(0, 8);
}

function isOxfordConfigured() {
  return Boolean(oxfordConfig.appId && oxfordConfig.appKey);
}

function hasLatinText(value) {
  return /[A-Za-z]/.test(String(value || ""));
}

function collectOxfordSenses(senses, out = []) {
  for (const sense of senses || []) {
    out.push(sense);
    collectOxfordSenses(sense.subsenses, out);
  }

  return out;
}

function firstOxfordPronunciation(entry) {
  const pronunciations = entry && Array.isArray(entry.pronunciations) ? entry.pronunciations : [];
  return pronunciations.find((item) => item.phoneticSpelling || item.audioFile) || null;
}

function parseOxfordEntries(payload, query) {
  const entries = [];

  for (const result of payload.results || []) {
    for (const lexicalEntry of result.lexicalEntries || []) {
      const lexicalCategory = lexicalEntry.lexicalCategory && (lexicalEntry.lexicalCategory.text || lexicalEntry.lexicalCategory.id) || "";
      const headword = lexicalEntry.text || result.word || result.id || query;

      for (const entry of lexicalEntry.entries || []) {
        const pronunciation = firstOxfordPronunciation(entry);
        const phonetic = pronunciation && pronunciation.phoneticSpelling || "";
        const audioFile = pronunciation && pronunciation.audioFile || "";
        const etymology = Array.isArray(entry.etymologies) ? entry.etymologies[0] : "";

        for (const sense of collectOxfordSenses(entry.senses)) {
          const definition = sense.definitions && sense.definitions[0] || sense.shortDefinitions && sense.shortDefinitions[0];
          if (!definition) continue;

          const example = sense.examples && sense.examples[0] && sense.examples[0].text || "";
          entries.push({
            id: `oxford:${normalizeSearchText(headword)}:${entries.length}`,
            en: headword,
            zh: definition,
            domain: lexicalCategory ? `Oxford · ${lexicalCategory}` : "Oxford",
            defn: example ? `例句：${example}` : "Oxford Dictionaries",
            common: [phonetic ? `/${phonetic}/` : "", example].filter(Boolean),
            commonStr: [phonetic ? `/${phonetic}/` : "", example].filter(Boolean).join(" / "),
            recommended: headword,
            context: [phonetic ? `/${phonetic}/` : "", oxfordConfig.language].filter(Boolean).join(" · ") || "Oxford Dictionaries",
            note: etymology || "",
            source: "oxford",
            sourceLabel: "Oxford",
            lexicalCategory,
            phoneticSpelling: phonetic,
            audioFile,
            example,
            score: 4
          });

          if (entries.length >= 8) return entries;
        }
      }
    }
  }

  return entries;
}

async function fetchWithTimeout(url, options, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function lookupOxfordTerms(query) {
  const q = String(query || "").trim();
  if (!isOxfordConfigured() || !hasLatinText(q)) return { results: [], skipped: true };

  const wordId = encodeURIComponent(q.toLowerCase());
  const endpoint = `${oxfordConfig.baseUrl.replace(/\/$/, "")}/entries/${encodeURIComponent(oxfordConfig.language)}/${wordId}`;
  const response = await fetchWithTimeout(endpoint, {
    headers: {
      app_id: oxfordConfig.appId,
      app_key: oxfordConfig.appKey
    }
  });

  if (response.status === 404) return { results: [] };
  if (!response.ok) {
    throw new Error(`Oxford API returned HTTP ${response.status}`);
  }

  return {
    results: parseOxfordEntries(await response.json(), q)
  };
}

async function lookupTerms(query) {
  const localResults = lookupLocalTerms(query);

  if (!isOxfordConfigured()) {
    return {
      provider: "local",
      providerConfigured: false,
      fallbackUsed: true,
      message: "未配置牛津 API，已使用本地词库结果",
      results: localResults
    };
  }

  try {
    const oxford = await lookupOxfordTerms(query);
    if (oxford.results.length) {
      return {
        provider: "oxford",
        providerConfigured: true,
        fallbackUsed: false,
        message: "",
        results: oxford.results
      };
    }

    return {
      provider: "oxford",
      providerConfigured: true,
      fallbackUsed: localResults.length > 0,
      message: localResults.length ? "牛津未返回匹配项，已显示本地词库结果" : "牛津词典未找到匹配项",
      results: localResults
    };
  } catch (error) {
    return {
      provider: "local",
      providerConfigured: true,
      fallbackUsed: true,
      message: localResults.length ? "牛津接口暂不可用，已使用本地词库结果" : "牛津接口暂不可用",
      results: localResults
    };
  }
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

  if (url.pathname === "/api/lookup" && req.method === "GET") {
    const query = url.searchParams.get("q") || "";
    const lookup = await lookupTerms(query);
    sendJson(res, 200, {
      query,
      ...lookup
    });
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
