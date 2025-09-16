import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export async function getSheets() {
  const saPath = path.join(process.cwd(), 'config', 'google-service-account.json');
  if (!fs.existsSync(saPath)) {
    throw new Error('Service account JSON not found at config/google-service-account.json');
  }
  const raw = JSON.parse(fs.readFileSync(saPath, 'utf8'));

  const auth = new google.auth.JWT({
    email: raw.client_email,
    key: raw.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  await auth.authorize();
  return google.sheets({ version: 'v4', auth });
}
