#!/bin/bash
echo '=== TypeScript Audit ===' > AuditReport.md
npx tsc --noEmit --skipLibCheck >> AuditReport.md 2>&1

