# MISSION_STATUS — AutoBolt Crisis Recovery

This file is the single-line check-in feed. Agents must append one line every 5 minutes while the mission is active.

Format:
`<ISO8601 timestamp> | <Agent> | <Status> | <Short Next Steps> | <Blockers>`

Example:
`2025-09-14T15:05:00Z | Auth | In-progress: Validating admin API keys | Next: rotate ADMIN_API_KEY if invalid | Blockers: missing SUPABASE_SERVICE_KEY`
