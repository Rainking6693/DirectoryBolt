# Stage 6 Performance Optimizations Research

## Next.js Config Patterns
- reactStrictMode is currently disabled in next.config.js despite other performance flags.
- swcMinify already true.
- experimental block lacks appDir.
- Existing images config already includes AVIF/WEBP formats and domain allowlist.

## Lazy Loading Components
- No file named AIAnalysisCharts located under components/.
- Dashboard uses components like RealTimeDashboard, SupabaseRealTimeDashboard, AutoBoltProgress.
- Existing lazy loading examples in components/LandingPage.tsx use dynamic import without loading placeholder.
- Spinner variants live in components/ui/LoadingStates.tsx (LoadingSpinner) and LoadingState.tsx.

## Web Vitals Reporting
- pages/_app.tsx exports default App but no reportWebVitals function.
- page already injects GA scripts and custom performance monitoring via Script tag loading web-vitals from CDN.
- No existing tests covering web vitals logging.

## Open Questions
- Need clarification whether to repurpose existing LoadingSpinner instead of new Spinner component.
- Need to confirm desired file path for AIAnalysisCharts since file does not exist.


