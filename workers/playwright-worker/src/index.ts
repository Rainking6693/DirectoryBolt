import 'dotenv/config';
import { logger } from './logger'
import { getNextJob, updateProgress, completeJob } from './apiClient'
import { processJob } from './jobProcessor'

const POLL_INTERVAL = Number(process.env.POLL_INTERVAL || '5000')

async function main() {
  logger.info('Playwright Worker starting...', { component: 'main' })

  while (true) {
    try {
      logger.info('Polling for jobs...', { component: 'poller' })
      const response = await getNextJob()

      // API returns { success: true, data: jobPayload } or { success: true, data: null }
      if (response && response.success && response.data) {
        const job = response.data
        logger.info('Job received', { jobId: job.jobId, customerId: job.customerId })

        // Map API response fields to job processor format
        const jobPayload = {
          id: job.jobId,
          customer_id: job.customerId,
          business_name: job.customerName || job.businessData?.business_name || '',
          email: job.customerEmail || job.businessData?.email || '',
          phone: job.businessData?.phone || '',
          website: job.businessData?.website || job.metadata?.website || '',
          address: job.businessData?.address || job.metadata?.address || '',
          city: job.businessData?.city || job.metadata?.city || '',
          state: job.businessData?.state || job.metadata?.state || '',
          zip: job.businessData?.zip || job.metadata?.zip || '',
          description: job.businessData?.description || '',
          category: job.businessData?.category || '',
          directory_limit: job.directoryLimit,
          package_size: job.packageType
        }

        try {
          await processJob(jobPayload, { updateProgress, completeJob })
          logger.info('Job processed', { jobId: job.jobId })
        } catch (jobErr:any) {
          logger.error('Job processing failed', { jobId: job.jobId, error: jobErr?.message })
          // try to mark failed completion
          try {
            await completeJob(job.jobId, { finalStatus: 'failed', summary: { total: job.directoryLimit || 0, submitted: 0, failed: 0, success_rate: 0 }, errorMessage: jobErr?.message })
          } catch {}
        }
      }
    } catch (err:any) {
      logger.error('Polling error', { error: err?.message })
    } finally {
      await new Promise(r => setTimeout(r, POLL_INTERVAL))
    }
  }
}

main().catch((e) => {
  logger.error('Fatal worker error', { error: e?.message })
  process.exit(1)
})
