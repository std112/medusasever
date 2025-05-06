
const express = require('express');
const fetch = require('node-fetch');
const { parse } = require('csv-parse/sync');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTAN9rqHsH7osXxUUfze3jOkAhTHbd-gTaL_0vkyYlCqft46ZX2M0_3ZQsLQAhgyS5x8F8wkW3oMrxr/pub?gid=0&single=true&output=csv';

app.post('/check', async (req, res) => {
  const key = req.body.key?.trim();
  if (!key) return res.status(400).json({ valid: false, reason: 'missing_key' });

  try {
    const response = await fetch(SHEET_URL);
    const csv = await response.text();
    const records = parse(csv, { columns: true, skip_empty_lines: true });

    const today = new Date();
    const match = records.find(row =>
      row['license_key']?.trim() === key &&
      row['status']?.trim().toLowerCase() === 'active' &&
      new Date(row['expiry_date']) >= today
    );

    if (!match) return res.json({ valid: false });

    return res.json({ valid: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ valid: false, reason: 'server_error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔐 License server running on port ${PORT}`));
