# EMERGENCY_HALT — Suspend Other Workstreams

All non-mission workstreams are paused until this mission completes. This file documents the halt.

Actions:
- Do not merge PRs into `main` until mission complete and `EMERGENCY_HALT.md` is removed or updated.
- CI builds for `main` should be paused by admins (branch protection or workflow pause recommended).
- Anyone working on unrelated features must stop and update `MISSION_STATUS.md` with an acknowledgement.

Requested admin action:
- Add branch protection to `main` to require a `MISSION_COMPLETE` label prior to merges, or pause workflows in GitHub Actions.
