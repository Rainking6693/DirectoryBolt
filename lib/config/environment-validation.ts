// Environment Variable Validation & Security Config
import { z } from 'zod'

const environmentSchema = z.object({
  // Core Application
  BASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  
  // Database
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  
  // Payment Processing
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  
  // AI Services
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-').optional(),
  
  // Security
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
  
  // Rate Limiting
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).default('900000'), // 15 minutes
})

type Environment = z.infer<typeof environmentSchema>

class EnvironmentValidator {
  private static instance: EnvironmentValidator
  private validatedEnv: Environment

  private constructor() {
    this.validateEnvironment()
  }

  static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator()
    }
    return EnvironmentValidator.instance
  }

  private validateEnvironment() {
    try {
      this.validatedEnv = environmentSchema.parse(process.env)
      console.log('✅ Environment validation successful')
    } catch (error) {
      console.error('❌ Environment validation failed:', error)
      process.exit(1)
    }
  }

  getEnv(): Environment {
    return this.validatedEnv
  }

  // Security checks
  isProduction(): boolean {
    return process.env.NODE_ENV === 'production'
  }

  getSecureHeaders() {
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': this.getCSP()
    }
  }

  private getCSP(): string {
    const baseCSP = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.stripe.com https://*.supabase.co",
      "frame-src https://js.stripe.com"
    ]
    
    return baseCSP.join('; ')
  }
}

export const envValidator = EnvironmentValidator.getInstance()
export const env = envValidator.getEnv()