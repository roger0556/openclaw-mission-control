# Mission Control — Current State Snapshot

_Last updated: 2026-03-12_

This file is a single-reference snapshot of the current Mission Control state on this machine, including:
- what Mission Control is
- how the local repo is configured right now
- GitHub upstream and fork information
- the custom changes made in this branch
- validation status
- rollback paths
- links to canonical documentation

> This is a practical working snapshot, not a byte-for-byte mirror of every upstream doc page.

---

## 1. What Mission Control is

Mission Control is the browser GUI for OpenClaw.

Purpose:
- monitor AI agents in real time
- chat with agents
- manage tasks, cron jobs, memory, channels, keys, models, logs, and terminal access
- inspect health, usage, costs, and security
- operate OpenClaw from a single dashboard

Core product position from the upstream README:
- a local GUI and AI agent dashboard for OpenClaw
- designed as a thin layer over OpenClaw rather than a separate data platform
- runs locally and reflects the live OpenClaw system directly
- intended to avoid separate databases, sync layers, or independent state stores

Canonical upstream repo:
- https://github.com/robsannaa/openclaw-mission-control

Current fork repo:
- https://github.com/roger0556/openclaw-mission-control

Homepage:
- https://agentbay.space

License:
- MIT

Primary language:
- TypeScript

---

## 2. Upstream README documentation summary

### Product summary
Mission Control is described upstream as:
- the command center for OpenClaw
- a single-screen browser dashboard to see and control the running OpenClaw environment
- a local-first interface with no separate database or sync layer

### Major features documented upstream
- Dashboard overview
- Agent chat
- Tasks / Kanban
- Cron jobs and run history
- Usage and cost tracking
- Agent/team management
- Memory and vector search
- Model and key management
- Doctor / health monitoring
- Terminal access
- Channels and messaging integrations
- Documents and search
- Security and permissions
- Tailscale remote access
- Crash-proof panel isolation via error boundaries

### Thin-layer philosophy
The upstream README explicitly positions Mission Control as a transparent window into OpenClaw rather than a separate platform.

Practical implications:
- no separate Mission Control database is intended as source of truth
- actions go directly to OpenClaw
- the dashboard should reflect live state
- if Mission Control stops, OpenClaw agents keep running

### Upstream install / quick start documented in README
```bash
cd ~/.openclaw
git clone https://github.com/robsannaa/openclaw-mission-control.git
cd openclaw-mission-control
./setup.sh
```

Development / manual modes documented upstream:
```bash
./setup.sh --dev --no-service
npm install && npm run dev
```

Expected local URL from README:
- `http://localhost:3333`

### Upstream environment variables documented in README
- `OPENCLAW_HOME`
- `OPENCLAW_BIN`
- `OPENCLAW_WORKSPACE`
- `OPENCLAW_TRANSPORT`
- `OPENCLAW_GATEWAY_URL`
- `OPENCLAW_GATEWAY_TOKEN`
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS`

### Upstream FAQ topics documented in README
- OpenClaw not found
- whether data leaves the machine
- support for multiple OpenClaw setups
- port already in use

Canonical local source for this summary:
- `/Users/gus/.openclaw/openclaw-mission-control/README.md`

---

## 3. Local repository state on this machine

### Local repo path
- `/Users/gus/.openclaw/openclaw-mission-control`

### Package identity
- package name: `@openclaw/dashboard`
- version: `0.4.6`

### Current remotes
```text
origin   https://github.com/roger0556/openclaw-mission-control.git
upstream https://github.com/robsannaa/openclaw-mission-control.git
```

### Current branch tracking
```text
main                      -> upstream/main
roger/session-persistence -> origin/roger/session-persistence
```

### Working tree state at snapshot time
- clean working tree

### Recent commits at snapshot time
```text
9569b99 fix(chat): hydrate restored history timestamps
b87efbb docs: record mission control fork remote strategy
358dca6 docs: log mission control session persistence changes
2c90c29 feat(chat): persist and resume mission control sessions
f864942 fix(update): sync wizard.lastRunVersion after browser update
7f4b5c5 fix(skills-ui): improve ClawHub missing dependency UX
16c2b72 fix(build): correct xai billing map typing for 0.4.6 install
dc6458a fix(gateway): reduce poll load and coalesce health checks
468234b feat(settings): add Mission Control version in About diagnostics
0f24eb2 chore: bump version to 0.4.6
```

---

## 4. GitHub repository state

## 4A. Upstream repository
Repo:
- `robsannaa/openclaw-mission-control`
- https://github.com/robsannaa/openclaw-mission-control

GitHub API snapshot:
- fork: `false`
- visibility: `public`
- default branch: `main`
- language: `TypeScript`
- homepage: `https://agentbay.space`
- stars: `433`
- forks: `83`
- open issues: `3`
- created: `2026-02-15T10:27:20Z`
- pushed: `2026-03-12T10:58:05Z`

Meaning:
- upstream is the canonical standalone repo
- it is not itself a fork

## 4B. Roger fork repository
Repo:
- `roger0556/openclaw-mission-control`
- https://github.com/roger0556/openclaw-mission-control

GitHub API snapshot:
- fork: `true`
- parent: `robsannaa/openclaw-mission-control`
- visibility: `public`
- default branch: `main`
- language: `TypeScript`
- homepage: `https://agentbay.space`
- stars: `0`
- forks: `0`
- open issues: `0`
- created: `2026-03-04T19:17:24Z`
- pushed: `2026-03-12T21:40:30Z`

Meaning:
- the safer fork structure is now in place
- custom work can live on Roger-controlled branches in the fork
- upstream updates can be merged in intentionally

---

## 5. Custom Mission Control changes made in this session

## 5A. Goal
Enable Mission Control main chat sessions to persist and continue after leaving the current chat page.

## 5B. Root cause found
The main chat page did not retain visible conversation state when navigating away from `/chat` because:
- a fresh random session key was generated on mount
- visible messages lived only in in-memory chat state
- returning to the page did not automatically hydrate prior history from the gateway

## 5C. Changes implemented
### Stable per-agent session persistence
Updated:
- `src/components/chat-view.tsx`

Behavior added:
- store chat session keys in browser `localStorage`
- reuse the saved session key per agent on remount
- create a new session only when the user intentionally clears the chat

### Gateway-backed history reload
Added:
- `src/app/api/chat/history/route.ts`

Behavior added:
- call gateway `chat.history`
- fetch prior messages for a `sessionKey`
- normalize messages for Mission Control UI hydration

### Deep-link session resume
Updated:
- `src/components/chat-view.tsx`

Behavior added:
- support `/chat?session=<sessionKey>`
- infer the agent from the session key
- hydrate that exact session when opened from links or session views

### Timestamp hydration fix
Follow-up fix added:
- convert restored `createdAt` values back into `Date` objects before rendering

This fixed the runtime error:
- `d.toLocaleTimeString is not a function`

---

## 6. Files changed for the custom session-persistence work

Primary code files:
- `src/components/chat-view.tsx`
- `src/app/api/chat/history/route.ts`

Documentation files added/updated:
- `mission-control-changes.md`
- `current-state-mission-control.md`

---

## 7. Validation status

### Build validation
Passed:
```bash
npm run build
```

### Live browser validation
Passed.

Flow verified:
1. seed a chat session through Mission Control `/api/chat`
2. open `/chat?session=<sessionKey>`
3. confirm the seeded conversation renders
4. navigate away to `/tasks`
5. return to `/chat`
6. confirm the same conversation still renders
7. reopen the explicit deep-link and confirm it again

Status:
- session resume behavior verified
- deep-link resume verified
- navigation-away-and-back behavior verified

---

## 8. Backups and rollback coverage

### Backups created before code changes
- `/Users/gus/.openclaw/backups/mission-control-20260312-161411/openclaw-mission-control-full.tar.gz`
- `/Users/gus/.openclaw/backups/mission-control-20260312-161411/chat-view.tsx.bak`
- `/Users/gus/.openclaw/backups/mission-control-20260312-161411/api-chat-route.ts.bak`
- `/Users/gus/.openclaw/backups/mission-control-20260312-161411/api-sessions-route.ts.bak`

### Current custom branch
- `roger/session-persistence`

### Current custom commits
- `2c90c29 feat(chat): persist and resume mission control sessions`
- `358dca6 docs: log mission control session persistence changes`
- `b87efbb docs: record mission control fork remote strategy`
- `9569b99 fix(chat): hydrate restored history timestamps`

### Rollback options
#### Option 1 — switch back to upstream-tracking main
```bash
cd /Users/gus/.openclaw/openclaw-mission-control
git checkout main
```

#### Option 2 — revert specific custom commits
```bash
cd /Users/gus/.openclaw/openclaw-mission-control
git revert 9569b99 b87efbb 358dca6 2c90c29
```

#### Option 3 — restore from backup tarball
Use:
- `/Users/gus/.openclaw/backups/mission-control-20260312-161411/openclaw-mission-control-full.tar.gz`

---

## 9. Current PR / task status

### PR status
Not opened yet.

Planned PR URL:
- `https://github.com/roger0556/openclaw-mission-control/pull/new/roger/session-persistence`

### Mission Control task created for PR follow-up
- Task ID: `704`
- Title: `Open PR for Mission Control session persistence branch`
- Column: `backlog`
- Priority: `high`
- Assignee: `Gus`

---

## 10. Recommended future update workflow

### Safe update flow
```bash
cd /Users/gus/.openclaw/openclaw-mission-control
git checkout main
git fetch upstream
git merge --ff-only upstream/main

git checkout roger/session-persistence
git merge main
# resolve conflicts if needed, test, then push
git push
```

### Why this matters
This keeps:
- upstream history clean and easy to pull from
- Roger customizations isolated in fork-controlled branches
- future upstream Mission Control updates from overwriting custom work by accident

---

## 11. Canonical references

Local files:
- `/Users/gus/.openclaw/openclaw-mission-control/README.md`
- `/Users/gus/.openclaw/openclaw-mission-control/mission-control-changes.md`
- `/Users/gus/.openclaw/openclaw-mission-control/current-state-mission-control.md`

GitHub:
- upstream repo: https://github.com/robsannaa/openclaw-mission-control
- Roger fork: https://github.com/roger0556/openclaw-mission-control
- planned PR URL: https://github.com/roger0556/openclaw-mission-control/pull/new/roger/session-persistence

---

## 12. Bottom line

Mission Control is now in a safer Git state than it was before this session:
- local backups exist
- custom work is committed
- a GitHub fork/upstream structure is in place
- resumed chat behavior has been implemented and validated
- the PR opening step has been captured as Mission Control task `#704`
