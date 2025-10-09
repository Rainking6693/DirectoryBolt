# Research Notes

## Current worker setup
- `worker/worker.js` contains Playwright-based DirectoryBolt worker. Primary processing function `processJob` handles navigation, form detection, submission, verification.
- Worker relies on helper classes (`AdvancedFieldMapper`, `DynamicFormDetector`, etc.) assumed to come from extension libs.

## Environment status
- Running `npm list playwright` in `worker/` reports no installed package; `node_modules` folder absent. Dependencies declared in `worker/package.json` include `playwright`, `axios`, `dotenv`, but they need installation before runtime.

## Logging gaps (pre-change)
- `processJob` only logs start/completion + errors; lacks detailed step-by-step instrumentation for navigation, form detection, etc.
- No explicit logging when launching browser or loading directory list in current code.

## Immediate priorities (Steps 1-5)
1. Install Playwright dependencies in `worker/` (`npm install`, `npx playwright install chromium`).
2. Enhance logging at job start, browser launch, directory retrieval, and per-directory submission loop to capture detailed progress/errors.
3. After modifications, run the worker and capture the full console output to diagnose submission failures.
