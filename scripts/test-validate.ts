/* eslint-disable @typescript-eslint/no-var-requires */
const http = require('http');

const id = process.argv[2] || 'DIR-20250914-000001';
const url = `http://localhost:3000/api/extension/validate?customerId=${encodeURIComponent(id)}`;
console.log('Testing:', url);

http
  .get(url, (resp) => {
    let data = '';
    console.log('Status:', resp.statusCode);
    resp.on('data', (chunk) => (data += chunk));
    resp.on('end', () => console.log('Body:', data));
  })
  .on('error', (e) => console.error('Error:', e.message));
