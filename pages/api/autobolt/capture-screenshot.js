/**
 * AutoBolt Screenshot Capture API
 * Captures screenshots during directory submission process
 */

import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join(process.cwd(), 'public', 'screenshots', 'autobolt')

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        })
    }

    try {
        const { customerId, directoryName, url, fullPage = true } = req.body
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const filename = `${timestamp}-${customerId || 'system'}-${directoryName || 'capture'}.png`
            .replace(/[^a-zA-Z0-9.-]/g, '_')
        const filepath = path.join(SCREENSHOT_DIR, filename)
        const publicUrl = `/screenshots/autobolt/${filename}`

        let browser
        try {
            // Use system Chrome if available, fallback to bundled Chromium
            const chromePath = process.env.CHROME_EXECUTABLE_PATH || 
                              '/usr/bin/google-chrome' || 
                              '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

            browser = await puppeteer.launch({
                headless: 'new',
                executablePath: chromePath,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-first-run',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding'
                ]
            })

            const page = await browser.newPage()
            
            // Set viewport for consistent screenshots
            await page.setViewport({ 
                width: 1920, 
                height: 1080,
                deviceScaleFactor: 1
            })

            // If URL is provided, navigate to it, otherwise capture current active tab
            if (url) {
                await page.goto(url, { 
                    waitUntil: 'networkidle2',
                    timeout: 30000 
                })
                
                // Wait a bit for any dynamic content to load
                await page.waitForTimeout(2000)
            } else {
                // For capturing current system state, go to a basic page
                await page.goto('data:text/html,<html><body><h1>AutoBolt System Screenshot</h1><p>Timestamp: ' + new Date().toISOString() + '</p></body></html>')
            }

            // Take screenshot
            await page.screenshot({
                path: filepath,
                fullPage: fullPage,
                type: 'png',
                quality: 90
            })

            console.log(`📸 Screenshot captured: ${filename}`)

            // Log the screenshot capture
            await logScreenshotCapture({
                customerId,
                directoryName,
                filename,
                url,
                timestamp: new Date().toISOString()
            })

            res.status(200).json({
                success: true,
                screenshotUrl: publicUrl,
                filename,
                timestamp: new Date().toISOString(),
                metadata: {
                    customerId,
                    directoryName,
                    url,
                    fullPage
                }
            })

        } finally {
            if (browser) {
                await browser.close()
            }
        }

    } catch (error) {
        console.error('❌ Screenshot capture failed:', error)
        
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        })
    }
}

async function logScreenshotCapture(data) {
    try {
        const logEntry = {
            id: Date.now().toString(),
            timestamp: data.timestamp,
            level: 'info',
            source: 'autobolt',
            message: `Screenshot captured: ${data.filename}`,
            customerId: data.customerId,
            directoryName: data.directoryName,
            data: {
                filename: data.filename,
                url: data.url,
                action: 'screenshot_capture'
            }
        }

        // Store in logs (this would integrate with your logging system)
        console.log('📝 Screenshot log:', logEntry)
        
        // Here you could also save to database or file
        // await saveToDatabase('autobolt_logs', logEntry)
        
    } catch (error) {
        console.error('Failed to log screenshot capture:', error)
    }
}