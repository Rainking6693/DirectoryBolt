import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Enhanced Google Sheets service with read/write capabilities
export async function getSheets() {
  const saPath = path.join(process.cwd(), 'config', 'directorybolt-Googlesheetskey.json');
  if (!fs.existsSync(saPath)) {
    throw new Error('Service account JSON not found at config/directorybolt-Googlesheetskey.json');
  }
  const raw = JSON.parse(fs.readFileSync(saPath, 'utf8'));

  const auth = new google.auth.JWT({
    email: raw.client_email,
    key: raw.private_key,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly'
    ],
  });

  await auth.authorize();
  return google.sheets({ version: 'v4', auth });
}

// Customer ID validation
export function validateCustomerId(customerId: string): boolean {
  const pattern = /^DIR-\d{8}-\d{6}$/;
  return pattern.test(customerId);
}

// Generate new customer ID
export function generateCustomerId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `DIR-${year}${month}${day}-${random}`;
}

// Package limits
export const PACKAGE_LIMITS = {
  starter: 50,
  growth: 75,
  professional: 150,
  enterprise: 500,
} as const;

export type PackageType = keyof typeof PACKAGE_LIMITS;

// Get package limit
export function getPackageLimit(packageType: string): number {
  return PACKAGE_LIMITS[packageType as PackageType] || PACKAGE_LIMITS.starter;
}

// Validate package type
export function validatePackageType(packageType: string): boolean {
  return Object.keys(PACKAGE_LIMITS).includes(packageType);
}
