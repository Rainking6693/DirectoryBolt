export default function handler(req, res) {
  console.log('Simple test API called')
  res.status(200).json({ 
    success: true, 
    message: 'Simple test works',
    timestamp: new Date().toISOString()
  })
}