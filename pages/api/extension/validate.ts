import type { NextApiRequest, NextApiResponse } from 'next';
import { getSheets } from '../../../lib/googleSheets';

const LIMITS: Record<string, number> = {
  starter: 50,
  growth: 75,
  professional: 150,
  enterprise: 500,
};

function applyCors(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ ok: false, code: 'METHOD_NOT_ALLOWED' });
  }

  const rawCustomerId = req.query.customerId;
  const customerId = Array.isArray(rawCustomerId) ? rawCustomerId[0] : rawCustomerId;
  const cleanedId = (customerId || '').toString().trim().toUpperCase();

  if (!/^DIR-\d{8}-\d{6}$/.test(cleanedId)) {
    return res.status(400).json({
      ok: false,
      code: 'BAD_ID_FORMAT',
      message: 'Customer ID must start with "DIR-" and match DIR-YYYYMMDD-XXXXXX.',
    });
  }

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    return res.status(500).json({
      ok: false,
      code: 'MISSING_SHEET_ID',
      message: 'GOOGLE_SHEET_ID not set.',
    });
  }

  try {
    const sheets = await getSheets();
    const range = 'Sheet1!A1:Z';
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        code: 'EMPTY_SHEET',
        message: 'No data in sheet.',
      });
    }

    const headers = rows[0].map((header) => (header || '').toString().trim().toLowerCase());
    const records = rows.slice(1);

    const idx = (name: string) => headers.indexOf(name.toLowerCase().trim());

    const COLS = {
      customerid: idx('customerid'),
      firstname: idx('firstname'),
      lastname: idx('lastname'),
      packagetype: idx('packagetype'),
      businessname: idx('businessname'),
      email: idx('email'),
      phone: idx('phone'),
      address: idx('address'),
      city: idx('city'),
      state: idx('state'),
      zip: idx('zip'),
    };

    if (COLS.customerid === -1 || COLS.packagetype === -1) {
      return res.status(500).json({
        ok: false,
        code: 'MISSING_COLUMNS',
        message: 'Required columns not found: customerid, packageType',
      });
    }

    const match = records.find((record) => {
      const value = record[COLS.customerid];
      return (value || '').toString().trim().toUpperCase() === cleanedId;
    });

    if (!match) {
      return res.status(404).json({
        ok: false,
        code: 'NOT_FOUND',
        message: 'Customer ID not found.',
      });
    }

    const packageTypeRaw = (match[COLS.packagetype] || '').toString().trim().toLowerCase();
    // Map "pro" to "professional"
    const normalizedPackage = packageTypeRaw === 'pro' ? 'professional' : packageTypeRaw;
    const directoryLimit = LIMITS[normalizedPackage] ?? LIMITS.starter;

    return res.status(200).json({
      ok: true,
      customerId: cleanedId,
      firstName: COLS.firstname !== -1 ? (match[COLS.firstname] || '').toString().trim() : '',
      lastName: COLS.lastname !== -1 ? (match[COLS.lastname] || '').toString().trim() : '',
      package: normalizedPackage || 'starter',
      directoryLimit,
      businessName: COLS.businessname !== -1 ? (match[COLS.businessname] || '').toString().trim() : '',
      email: COLS.email !== -1 ? (match[COLS.email] || '').toString().trim() : '',
      phone: COLS.phone !== -1 ? (match[COLS.phone] || '').toString().trim() : '',
      address: COLS.address !== -1 ? (match[COLS.address] || '').toString().trim() : '',
      city: COLS.city !== -1 ? (match[COLS.city] || '').toString().trim() : '',
      state: COLS.state !== -1 ? (match[COLS.state] || '').toString().trim() : '',
      zip: COLS.zip !== -1 ? (match[COLS.zip] || '').toString().trim() : '',
    });
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string };
    console.error('[extension.validate] error', { name: err?.name, message: err?.message });
    return res.status(500).json({
      ok: false,
      code: 'SERVER_ERROR',
      message: 'Validation service unavailable.',
    });
  }
}
