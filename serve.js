const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = 8080;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function resolveFile(requestPath) {
  const safePath = decodeURIComponent(requestPath.split('?')[0]);
  const normalized = path.normalize(safePath).replace(/^(\.\.[\\/])+/, '');
  let filePath = path.join(root, normalized);

  if (safePath === '/' || safePath === '') {
    filePath = path.join(root, 'index.html');
  }

  return filePath;
}

const server = http.createServer((req, res) => {
  const filePath = resolveFile(req.url);

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(port, () => {
  console.log(`White Heron Academy server running at http://localhost:${port}/`);
});

server.on('error', (err) => {
  console.error('Server failed to start:', err.message);
  process.exit(1);
});
