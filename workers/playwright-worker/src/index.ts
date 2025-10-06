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
      const next = await getNextJob()
      if (next && next.job) {
        const job = next.job
        logger.info('Job received', { jobId: job.id, customerId: job.customer_id })
        try {
          await processJob(job, { updateProgress, completeJob })
          logger.info('Job processed', { jobId: job.id })
        } catch (jobErr:any) {
          logger.error('Job processing failed', { jobId: job.id, error: jobErr?.message })
          // try to mark failed completion
          try {
            await completeJob(job.id, { finalStatus: 'failed', summary: { total: job.directory_limit || 0, submitted: 0, failed: 0, success_rate: 0 } })
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
