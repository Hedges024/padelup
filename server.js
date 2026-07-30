require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@libsql/client');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

if (!process.env.TURSO_DATABASE_URL) {
  console.error(
    'Missing TURSO_DATABASE_URL. Copy .env.example to .env (locally) or set it ' +
    'in your Render environment variables. See README.md for setup steps.'
  );
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

const DEFAULT_PLAYERS = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS kv (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

async function getValue(key, fallback) {
  const result = await db.execute({
    sql: 'SELECT value FROM kv WHERE key = ?',
    args: [key]
  });
  if (result.rows.length === 0) return fallback;
  try {
    return JSON.parse(result.rows[0].value);
  } catch (e) {
    return fallback;
  }
}

async function setValue(key, value) {
  await db.execute({
    sql: `
      INSERT INTO kv (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    args: [key, JSON.stringify(value)]
  });
}

// ---------- API ----------
app.get('/api/data', async (req, res) => {
  try {
    const players = await getValue('players', DEFAULT_PLAYERS);
    const matches = await getValue('matches', []);
    const bookings = await getValue('bookings', []);
    res.json({ players, matches, bookings });
  } catch (e) {
    console.error('GET /api/data failed', e);
    res.status(500).json({ error: 'Failed to load data' });
  }
});

app.post('/api/players', async (req, res) => {
  try {
    const { players } = req.body;
    if (!Array.isArray(players)) {
      return res.status(400).json({ error: 'players must be an array' });
    }
    await setValue('players', players);
    res.json({ ok: true });
  } catch (e) {
    console.error('POST /api/players failed', e);
    res.status(500).json({ error: 'Failed to save players' });
  }
});

app.post('/api/matches', async (req, res) => {
  try {
    const { matches } = req.body;
    if (!Array.isArray(matches)) {
      return res.status(400).json({ error: 'matches must be an array' });
    }
    await setValue('matches', matches);
    res.json({ ok: true });
  } catch (e) {
    console.error('POST /api/matches failed', e);
    res.status(500).json({ error: 'Failed to save matches' });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { bookings } = req.body;
    if (!Array.isArray(bookings)) {
      return res.status(400).json({ error: 'bookings must be an array' });
    }
    await setValue('bookings', bookings);
    res.json({ ok: true });
  } catch (e) {
    console.error('POST /api/bookings failed', e);
    res.status(500).json({ error: 'Failed to save bookings' });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`PadelUp listening on port ${PORT}`));
  })
  .catch((e) => {
    console.error('Failed to initialize database', e);
    process.exit(1);
  });
