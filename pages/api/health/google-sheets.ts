import type { NextApiRequest, NextApiResponse } from 'next';
import { getSheets } from '../../../lib/googleSheets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID missing');
    }
    const sheets = await getSheets();
    await sheets.spreadsheets.get({ spreadsheetId });
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ ok: false, reason: err?.message || 'unknown' });
  }
}
