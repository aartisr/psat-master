#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

function parseArgs(argv) {
  const args = {
    dryRun: false,
    includeExternal: false,
    siteBaseUrl: process.env.SITE_BASE_URL || 'https://aartisr.github.io/psat-master/',
    wikiBaseUrl: process.env.WIKI_BASE_URL || '',
    indexNowHost: process.env.INDEXNOW_HOST || 'aartisr.github.io',
    indexNowKey: process.env.INDEXNOW_KEY || '',
    indexNowKeyLocation: process.env.INDEXNOW_KEY_LOCATION || '',
    endpoint: process.env.INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow',
    rootDir: process.env.REPO_ROOT || process.cwd(),
    maxUrls: Number(process.env.INDEXNOW_MAX_URLS || 1000)
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === '--dry-run') {
      args.dryRun = true;
    } else if (token === '--include-external') {
      args.includeExternal = true;
    } else if (token === '--site-base-url' && next) {
      args.siteBaseUrl = next;
      i += 1;
    } else if (token === '--wiki-base-url' && next) {
      args.wikiBaseUrl = next;
      i += 1;
    } else if (token === '--indexnow-host' && next) {
      args.indexNowHost = next;
      i += 1;
    } else if (token === '--indexnow-key' && next) {
      args.indexNowKey = next;
      i += 1;
    } else if (token === '--indexnow-key-location' && next) {
      args.indexNowKeyLocation = next;
      i += 1;
    } else if (token === '--endpoint' && next) {
      args.endpoint = next;
      i += 1;
    } else if (token === '--root' && next) {
      args.rootDir = next;
      i += 1;
    } else if (token === '--max-urls' && next) {
      args.maxUrls = Number(next);
      i += 1;
    }
  }

  return args;
}

function resolveKeyLocation(args) {
  if (args.indexNowKeyLocation) {
    return args.indexNowKeyLocation;
  }
  return new URL('indexnow-key.txt', args.siteBaseUrl).toString();
}

function normalizeUrl(value) {
  try {
    const parsed = new URL(value);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return '';
  }
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(value);
}

function toAbsoluteUrl(baseUrl, relativePath) {
  const normalized = relativePath.replace(/^\.\//, '');
  return new URL(normalized, baseUrl).toString();
}

function fileToPublicUrl(filePath, args) {
  const relPath = path.relative(path.join(args.rootDir, 'docs'), filePath).replace(/\\/g, '/');
  if (!relPath || relPath.startsWith('..')) {
    return '';
  }
  if (relPath === 'index.html') {
    return new URL('/', args.siteBaseUrl).toString();
  }
  return toAbsoluteUrl(args.siteBaseUrl, relPath);
}

function collectHtmlUrls(filePath, args) {
  const content = fs.readFileSync(filePath, 'utf8');
  const urls = new Set();

  const canonicalMatch = content.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i);
  if (canonicalMatch?.[1]) {
    const canonical = isHttpUrl(canonicalMatch[1])
      ? normalizeUrl(canonicalMatch[1])
      : normalizeUrl(toAbsoluteUrl(args.siteBaseUrl, canonicalMatch[1]));
    if (canonical) urls.add(canonical);
  }

  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = hrefRegex.exec(content))) {
    const href = match[1];
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:') || href.startsWith('#')) {
      continue;
    }
    if (isHttpUrl(href)) {
      const absolute = normalizeUrl(href);
      if (absolute) {
        const pathname = new URL(absolute).pathname;
        if (pathname === '/' || pathname.endsWith('.html')) {
          urls.add(absolute);
        }
      }
    } else {
      const absolute = normalizeUrl(toAbsoluteUrl(fileToPublicUrl(filePath, args), href));
      if (absolute) {
        const pathname = new URL(absolute).pathname;
        if (pathname === '/' || pathname.endsWith('.html')) {
          urls.add(absolute);
        }
      }
    }
  }

  return urls;
}

function collectMarkdownUrls(filePath, args) {
  const content = fs.readFileSync(filePath, 'utf8');
  const urls = new Set();
  const pageSlug = path.basename(filePath, path.extname(filePath)).toLowerCase();
  const wikiBase = args.wikiBaseUrl || '';

  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(content))) {
    const target = match[2].trim().split(/\s+/)[0];
    if (target.startsWith('mailto:') || target.startsWith('tel:') || target.startsWith('#')) {
      continue;
    }
    if (isHttpUrl(target)) {
      const absolute = normalizeUrl(target);
      if (absolute) {
        const pathname = new URL(absolute).pathname;
        if (pathname === '/' || pathname.endsWith('.html')) {
          urls.add(absolute);
        }
      }
      continue;
    }
    if (!wikiBase) {
      continue;
    }
    const normalizedTarget = target.replace(/^\.\//, '');
    const wikiPath = normalizedTarget.endsWith('.md')
      ? normalizedTarget.replace(/\.md$/i, '.html')
      : normalizedTarget;
    const pageUrl = new URL(`${pageSlug}.html`, wikiBase.endsWith('/') ? wikiBase : `${wikiBase}/`).toString();
    const absolute = normalizeUrl(toAbsoluteUrl(pageUrl, wikiPath));
    if (absolute) {
      const pathname = new URL(absolute).pathname;
      if (pathname === '/' || pathname.endsWith('.html')) {
        urls.add(absolute);
      }
    }
  }

  return urls;
}

function collectUrls(args) {
  const urls = new Set();
  const skippedExternal = new Set();
  const docsDir = path.join(args.rootDir, 'docs');
  const wikiDir = path.join(args.rootDir, 'wiki');

  if (fs.existsSync(docsDir)) {
    for (const entry of fs.readdirSync(docsDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
      const filePath = path.join(docsDir, entry.name);
      for (const url of collectHtmlUrls(filePath, args)) {
        if (url.includes('github.com/')) {
          skippedExternal.add(url);
          if (args.includeExternal) urls.add(url);
          continue;
        }
        if (url.startsWith(args.siteBaseUrl) || (args.wikiBaseUrl && url.startsWith(args.wikiBaseUrl))) {
          urls.add(url);
        }
      }
    }
  }

  if (fs.existsSync(wikiDir)) {
    for (const entry of fs.readdirSync(wikiDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const filePath = path.join(wikiDir, entry.name);
      for (const url of collectMarkdownUrls(filePath, args)) {
        if (url.includes('github.com/')) {
          skippedExternal.add(url);
          if (args.includeExternal) urls.add(url);
          continue;
        }
        if (args.wikiBaseUrl && url.startsWith(args.wikiBaseUrl)) {
          urls.add(url);
        }
      }
    }
  }

  return {
    urls: Array.from(urls).filter(Boolean).sort(),
    skippedExternal: Array.from(skippedExternal).sort()
  };
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function submitBatch(endpoint, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const request = https.request(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body)
      }
    }, (response) => {
      let data = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
          resolve({ statusCode: response.statusCode, body: data });
          return;
        }
        reject(new Error(`IndexNow request failed (${response.statusCode}): ${data}`));
      });
    });

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

async function main() {
  const args = parseArgs(process.argv);
  args.indexNowKeyLocation = resolveKeyLocation(args);
  const { urls, skippedExternal } = collectUrls(args);

  if (!args.indexNowKey || !args.indexNowKeyLocation) {
    console.error('Missing INDEXNOW_KEY or INDEXNOW_KEY_LOCATION. Set both before submitting.');
    console.error(`Collected ${urls.length} in-scope URL(s).`);
    if (skippedExternal.length) {
      console.error(`Skipped ${skippedExternal.length} external URL(s) that IndexNow cannot accept.`);
    }
    process.exitCode = 1;
    return;
  }

  const host = args.indexNowHost;
  const submittedUrls = urls.filter((url) => {
    try {
      return new URL(url).host === host;
    } catch {
      return false;
    }
  });

  const rejectedByHost = urls.filter((url) => !submittedUrls.includes(url));

  console.log(`Collected ${urls.length} in-scope URL(s).`);
  console.log(`Submitting ${submittedUrls.length} URL(s) to IndexNow for host ${host}.`);
  if (skippedExternal.length) {
    console.log(`Skipped ${skippedExternal.length} external URL(s), including GitHub links IndexNow cannot submit.`);
  }
  if (rejectedByHost.length) {
    console.log(`Skipped ${rejectedByHost.length} URL(s) because their host did not match ${host}.`);
  }

  if (args.dryRun) {
    submittedUrls.forEach((url) => console.log(url));
    return;
  }

  const batches = chunk(submittedUrls.slice(0, args.maxUrls), 50);

  for (const batch of batches) {
    const endpoint = args.endpoint;
    const payload = {
      host,
      key: args.indexNowKey,
      keyLocation: args.indexNowKeyLocation,
      urlList: batch
    };
    const response = await submitBatch(endpoint, payload);
    console.log(`Submitted ${batch.length} URL(s): ${response.statusCode}`);
  }
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exitCode = 1;
});