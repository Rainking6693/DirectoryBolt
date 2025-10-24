import os from 'os';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

export type WorkerStatus = 'starting' | 'idle' | 'running' | 'paused' | 'error';
type DesiredState = 'running' | 'paused';

interface WorkerStatusReporterOptions {
  workerId?: string;
  heartbeatIntervalMs?: number;
}

export class WorkerStatusReporter {
  private readonly supabase: SupabaseClient | null;
  private readonly workerId: string;
  private readonly heartbeatInterval: number;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private desiredState: DesiredState = 'running';
  private currentStatus: WorkerStatus = 'starting';
  private initialized = false;

  constructor(options: WorkerStatusReporterOptions = {}) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    this.workerId = options.workerId || process.env.WORKER_ID || os.hostname();
    this.heartbeatInterval = options.heartbeatIntervalMs ?? Number(process.env.HEARTBEAT_INTERVAL || '15000');

    if (supabaseUrl && supabaseServiceKey) {
      this.supabase = createClient(supabaseUrl, supabaseServiceKey);
      logger.info('Worker status reporter connected to Supabase backend', {
        component: 'worker-status',
        workerId: this.workerId
      });
    } else {
      this.supabase = null;
      logger.warn('Supabase credentials not provided; worker status updates disabled', {
        component: 'worker-status'
      });
    }
  }

  isEnabled(): boolean {
    return this.supabase !== null;
  }

  async init(initialStatus: WorkerStatus = 'starting'): Promise<void> {
    if (!this.supabase) return;
    if (this.initialized) return;

    await this.refreshDesiredState();
    await this.sendHeartbeat(initialStatus, true);
    this.startHeartbeatLoop();
    this.initialized = true;
  }

  async updateStatus(status: WorkerStatus): Promise<void> {
    if (!this.supabase) return;
    this.currentStatus = status;
    await this.refreshDesiredState();
    await this.sendHeartbeat(status, true);
  }

  async shouldPause(): Promise<boolean> {
    if (!this.supabase) return false;

    const state = await this.refreshDesiredState();
    if (state === 'paused') {
      if (this.currentStatus !== 'paused') {
        await this.sendHeartbeat('paused', true);
      }
      return true;
    }

    // If we were paused previously but now resumed, make sure status reflects that.
    if (this.currentStatus === 'paused') {
      await this.sendHeartbeat('idle', true);
    }

    return false;
  }

  async shutdown(finalStatus: WorkerStatus = 'idle'): Promise<void> {
    if (!this.supabase) return;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    await this.sendHeartbeat(finalStatus, true);
  }

  private startHeartbeatLoop(): void {
    if (!this.supabase) return;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    const heartbeat = async () => {
      try {
        await this.refreshDesiredState();
        await this.sendHeartbeat();
      } catch (error: any) {
        logger.warn('Failed to send scheduled worker heartbeat', {
          component: 'worker-status',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    };

    this.heartbeatTimer = setInterval(() => {
      heartbeat().catch(() => {});
    }, this.heartbeatInterval);
  }

  private async sendHeartbeat(statusOverride?: WorkerStatus, immediate = false): Promise<void> {
    if (!this.supabase) return;
    if (statusOverride) {
      this.currentStatus = statusOverride;
    }

    try {
      const payload = {
        worker_id: this.workerId,
        status: this.currentStatus,
        desired_state: this.desiredState,
        last_heartbeat: new Date().toISOString()
      };
      const { error } = await this.supabase
        .from('worker_status')
        .upsert(payload, { onConflict: 'worker_id' });

      if (error) {
        throw error;
      }

      if (immediate) {
        logger.debug('Worker status updated', {
          component: 'worker-status',
          workerId: this.workerId,
          status: this.currentStatus,
          desiredState: this.desiredState
        });
      }
    } catch (error) {
      logger.warn('Failed to upsert worker status', {
        component: 'worker-status',
        workerId: this.workerId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async refreshDesiredState(): Promise<DesiredState> {
    if (!this.supabase) return this.desiredState;

    try {
      const { data, error } = await this.supabase
        .from('worker_status')
        .select('desired_state')
        .eq('worker_id', this.workerId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data?.desired_state === 'paused') {
        this.desiredState = 'paused';
      } else if (data?.desired_state === 'running') {
        this.desiredState = 'running';
      }
    } catch (error) {
      logger.warn('Failed to refresh desired worker state', {
        component: 'worker-status',
        workerId: this.workerId,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return this.desiredState;
  }
}
