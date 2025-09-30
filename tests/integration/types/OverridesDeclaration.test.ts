import ga, { trackEvent as trackGaEvent } from '@/lib/analytics/enhanced-ga4'
import css, { extractCritical } from '@/lib/utils/critical-css'
import analyzer, { analyzeDirectory } from '@/lib/wasm/directory-analyzer'

// These assertions verify the ambient overrides compile correctly.
// The actual runtime values are stubs, so we only ensure typing works.

const htmlSnippet = '<html><head></head><body><div>test</div></body></html>'
const critical = extractCritical(htmlSnippet)
css.extractCritical(htmlSnippet)

trackGaEvent('test_event', { foo: 'bar' })
ga.trackEvent('another_event')

const wasmInput = new Uint8Array([0, 1, 2, 3])
analyzeDirectory(wasmInput)
analyzer.analyzeDirectory(wasmInput)

// Provide a dummy export so the test file is treated as a module.
export const overrideDeclarationsCompile = !!critical

