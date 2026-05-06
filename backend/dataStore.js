import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const PARSE_LOG_FILE = path.join(DATA_DIR, 'parseLogs.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function loadParseLogs() {
  ensureDataDir();
  if (!fs.existsSync(PARSE_LOG_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(PARSE_LOG_FILE, 'utf8')); }
  catch { return []; }
}

export function appendParseLog(entry) {
  ensureDataDir();
  const logs = loadParseLogs();
  logs.unshift(entry); // newest first
  // Keep last 1000 entries
  if (logs.length > 1000) logs.splice(1000);
  fs.writeFileSync(PARSE_LOG_FILE, JSON.stringify(logs, null, 2));
}
