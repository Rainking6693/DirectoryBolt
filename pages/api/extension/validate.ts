import type { NextApiRequest, NextApiResponse } from 'next';
import { getSheets } from '../../../lib/googleSheets';

function cors(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const LIMITS: Record<string, number> = {
  starter: 50,
  growth: 75,
  professional: 150,
  enterprise: 500,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, code: 'METHOD_NOT_ALLOWED' });

  const customerId = (req.query.customerId || '').toString().trim();
  if (!/^DIR-/.test(customerId)) {
    return res
      .status(400)
      .json({ ok: false, code: 'BAD_ID_FORMAT', message: 'Customer ID must start with "DIR-".' });
  }
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    return res
      .status(500)
      .json({ ok: false, code: 'MISSING_SHEET_ID', message: 'GOOGLE_SHEET_ID not set.' });
  }

  try {
    const sheets = await getSheets();
    const range = 'Customers!A2:Z';
    const resp = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = resp.data.values || [];

    const row = rows.find((r) => (r[0] || '').toString().trim() === customerId);
    if (!row)
      return res.status(404).json({ ok: false, code: 'NOT_FOUND', message: 'Customer ID not found.' });

    const pkg = (row[3] || 'starter').toString().toLowerCase();
    const directoryLimit = LIMITS[pkg] ?? 50;

    return res.status(200).json({ ok: true, customerId, package: pkg, directoryLimit });
  } catch (err: any) {
    console.error('[validate] error', { name: err?.name, message: err?.message });
    return res.status(500).json({ ok: false, code: 'SERVER_ERROR', message: 'Validation service unavailable.' });
  }
}
