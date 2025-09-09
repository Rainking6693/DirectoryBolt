// pages/api/test-airtable.js
export default async function handler(req, res) {
  try {
    const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/customerID`, {
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`)
    }
    
    res.json({ success: true, message: 'Airtable connection working' })
  } catch (error) {
    res.json({ success: false, error: error.message })
  }
}