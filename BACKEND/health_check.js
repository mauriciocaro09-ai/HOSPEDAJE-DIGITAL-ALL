require('dotenv').config();

const fs = require('fs');
const path = require('path');
const http = require('http');
const mysql = require('mysql2/promise');

const backendPort = Number(process.env.PORT || 3000);
const backendHost = 'localhost';
const backendBaseUrl = `http://${backendHost}:${backendPort}`;

const frontendCandidates = [
  path.resolve(__dirname, '..', 'mi_proyecto_frontend'),
  path.resolve(__dirname, '..', 'mi-proyecto-frontend')
];

function printHeader(title) {
  console.log(`\n=== ${title} ===`);
}

function printResult(status, message) {
  const icon = status ? 'OK' : 'FAIL';
  console.log(`[${icon}] ${message}`);
}

function httpGetJson(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        let parsed;
        try {
          parsed = body ? JSON.parse(body) : null;
        } catch {
          parsed = body;
        }

        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          statusCode: res.statusCode,
          body: parsed
        });
      });
    });

    req.on('error', (error) => {
      resolve({ ok: false, statusCode: 0, error: error.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ ok: false, statusCode: 0, error: 'timeout' });
    });
  });
}

async function checkBackend() {
  printHeader('Backend API');

  const endpoints = [
    '/',
    '/health',
    '/api/habitaciones',
    '/api/reservas',
    '/api/debug/estructura'
  ];

  let passed = 0;

  for (const endpoint of endpoints) {
    const result = await httpGetJson(`${backendBaseUrl}${endpoint}`);
    if (result.ok) {
      passed += 1;
      printResult(true, `${endpoint} responded with ${result.statusCode}`);
    } else {
      const detail = result.error ? ` (${result.error})` : '';
      printResult(false, `${endpoint} unavailable${detail}`);
    }
  }

  return passed === endpoints.length;
}

async function checkDatabase() {
  printHeader('MySQL Database');

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospedaje'
  };

  let connection;

  try {
    connection = await mysql.createConnection(config);
    printResult(true, `Connected to database '${config.database}'`);

    const requiredTables = ['cliente', 'habitacion', 'reserva', 'servicio'];
    const [rows] = await connection.execute('SHOW TABLES');

    const tableNames = new Set(rows.map((row) => Object.values(row)[0]));

    let allTablesPresent = true;
    for (const table of requiredTables) {
      const exists = tableNames.has(table);
      allTablesPresent = allTablesPresent && exists;
      printResult(exists, `Table '${table}' ${exists ? 'found' : 'missing'}`);
    }

    return allTablesPresent;
  } catch (error) {
    printResult(false, `Database check failed: ${error.message}`);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

function findFrontendPath() {
  return frontendCandidates.find((candidate) => fs.existsSync(candidate));
}

function collectFrontendFiles(frontendPath) {
  const files = [];
  const pending = [frontendPath];

  while (pending.length > 0) {
    const current = pending.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function checkFrontendIntegration() {
  printHeader('Frontend Integration');

  const frontendPath = findFrontendPath();
  if (!frontendPath) {
    printResult(false, 'Frontend folder not found (mi_proyecto_frontend or mi-proyecto-frontend)');
    return false;
  }

  printResult(true, `Frontend folder found: ${frontendPath}`);

  const indexPath = path.join(frontendPath, 'index.html');
  const hasIndex = fs.existsSync(indexPath);
  printResult(hasIndex, hasIndex ? 'index.html found' : 'index.html missing');

  const files = collectFrontendFiles(frontendPath).filter((file) => /\.(js|html)$/i.test(file));
  let pointsToBackend = false;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('localhost:3000/api') || content.includes('/api')) {
        pointsToBackend = true;
        break;
      }
    } catch {
      // Ignore unreadable files and continue scanning.
    }
  }

  printResult(pointsToBackend, pointsToBackend
    ? 'Frontend API configuration appears to target backend endpoints'
    : 'No clear API endpoint reference found in frontend files');

  return hasIndex && pointsToBackend;
}

async function main() {
  console.log('Hospedaje Digital - Health Check');
  console.log(`Backend expected at: ${backendBaseUrl}`);

  const backendOk = await checkBackend();
  const dbOk = await checkDatabase();
  const frontendOk = checkFrontendIntegration();

  printHeader('Summary');
  printResult(backendOk, 'Backend runtime checks');
  printResult(dbOk, 'Database connectivity and core tables');
  printResult(frontendOk, 'Frontend integration readiness');

  const overallOk = backendOk && dbOk && frontendOk;
  console.log(`\nOverall status: ${overallOk ? 'HEALTHY' : 'ISSUES DETECTED'}`);

  process.exit(overallOk ? 0 : 1);
}

main().catch((error) => {
  console.error('[FAIL] Unexpected error while running health checks:', error.message);
  process.exit(1);
});
