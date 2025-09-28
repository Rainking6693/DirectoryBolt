import http from 'http'

const id = process.argv[2] || 'DIR-20250914-000001'
const url = `http://localhost:3000/api/extension/validate?customerId=${encodeURIComponent(id)}`
console.log('Testing:', url)

http
  .get(url, (resp: http.IncomingMessage) => {
    let data = ''
    console.log('Status:', resp.statusCode ?? 'unknown')
    resp.on('data', (chunk: Buffer | string) => {
      data += chunk.toString()
    })
    resp.on('end', () => {
      console.log('Body:', data)
    })
  })
  .on('error', (error: NodeJS.ErrnoException) => {
    console.error('Error:', error.message)
  })
