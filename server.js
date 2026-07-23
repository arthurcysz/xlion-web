/* Minimal zero-dependency static server for Railway (or any Node host).
   Serves the X-LION static site, sets security headers, and blocks dev/source files. */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.pdf': 'application/pdf',
  '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

// Paths that must never be served publicly (dev docs, sources, backups, junk).
const DENY = [
  /\.md$/i,                          // CLAUDE.md, 进度记录.md, 网站规划.md, 部署说明.md
  /^\/(?!assets\/datasheets\/).*\.pdf$/i, // any PDF except assets/datasheets/*
  /-old-backup\./i, /-keyed-backup\./i, /-blackbg-backup\./i,
  /hero-old-backup\./i, /global-staticmap-backup\.html$/i,
  /tergeo-render\.png$/i, /tergeo-crop\.png$/i, /logo-new\.png$/i,
  /xlion-site\.zip$/i, /ziiJu0j2$/i,
  /^\/(?!assets\/).*\.mp4$/i,        // root .mp4 originals (assets/*.mp4 allowed)
  /\/p\d+_x\d+_.*\.png$/i,           // assets/p*_x*.png junk
  /vac-v40\.png$/i, /vac-v50\.png$/i,
  /^\/(server\.js|package\.json|package-lock\.json|_headers|\.gitignore)$/i,
  /\/\./                              // any dotfile / hidden path
];

const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: https://*.basemaps.cartocdn.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://formspree.io; form-action 'self' https://formspree.io; media-src 'self'; font-src 'self'; upgrade-insecure-requests",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Cross-Origin-Opener-Policy': 'same-origin'
};

function send(res, status, headers, body) {
  res.writeHead(status, Object.assign({}, SECURITY_HEADERS, headers));
  res.end(body);
}

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
    if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
    // pretty URL: /about -> /about.html
    if (!path.extname(urlPath) && !urlPath.endsWith('/')) {
      if (fs.existsSync(path.join(ROOT, urlPath + '.html'))) urlPath += '.html';
    }

    if (DENY.some((re) => re.test(urlPath))) return send(res, 404, { 'Content-Type': 'text/plain' }, 'Not found');

    const filePath = path.normalize(path.join(ROOT, urlPath));
    if (!filePath.startsWith(ROOT)) return send(res, 403, { 'Content-Type': 'text/plain' }, 'Forbidden');

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) return send(res, 404, { 'Content-Type': 'text/html; charset=utf-8' }, '<h1>404 — Not found</h1>');
      const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
      const cache = /\.(css|js|png|jpg|jpeg|webp|svg|ico|woff2?|mp4|pdf)$/i.test(filePath)
        ? 'public, max-age=86400' : 'no-cache';
      res.writeHead(200, Object.assign({}, SECURITY_HEADERS, { 'Content-Type': type, 'Cache-Control': cache }));
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (e) {
    send(res, 500, { 'Content-Type': 'text/plain' }, 'Server error');
  }
});

server.listen(PORT, () => console.log('X-LION site running on port ' + PORT));
