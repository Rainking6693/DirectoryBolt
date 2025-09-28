export interface PackageTierEngineOptions {
  apiBase?: string
  endpoint?: string
  timeout?: number
  fetch?: typeof fetch
  cache?: Map<string, PackageTierResult>
  engine?: PackageTierEngine
}

export interface PackageTierResult {
  ok: boolean
  customerId: string
  package: string
  directoryLimit: number
  message?: string
  code?: string
}

export default class PackageTierEngine {
  customerId?: string
  packageTier: string
  directoryLimit: number
  lastResponse: PackageTierResult | null

  constructor(customerOrOptions?: string | PackageTierEngineOptions)
  static init(
    customerId: string,
    options?: string | PackageTierEngine | PackageTierEngineOptions,
  ): Promise<{ engine: PackageTierEngine; result: PackageTierResult }>
  init(customerId?: string): Promise<PackageTierResult>
  validate(customerId?: string): Promise<PackageTierResult>
  getCachedResult(customerId: string): PackageTierResult | undefined
  fetchValidation(customerId: string): Promise<PackageTierResult>
  buildSuccess(response: Response, payload: unknown): PackageTierResult
  buildFailure(
    response: Response | null,
    code: string,
    message: string,
  ): PackageTierResult
  getDirectoryLimit(packageType: string): number
}