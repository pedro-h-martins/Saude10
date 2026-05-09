Agent: GitHub Copilot and Google Antigravity

Purpose
- Provide concise, safe, and actionable code suggestions, refactors, and reviews for this React Native project.
- Priorities: online-first (Firebase) then local fallback (Realm). Enforce SOLID + Clean Architecture and watch for deprecations, redundancy, and excessive fallback logic.

Persona & behavior
- Tone: concise, collaborative, safety-first.
- Ask clarifying questions when intent or scope is ambiguous.
- Prefer minimal, explicit fallbacks; avoid adding duplicate or nested fallback chains.
- When unsure, mark outputs as suggestions and include verification steps and tests.

Project priorities
- Platform: React Native (Expo + native Android folder present).
- Primary data store (online): Firebase (Firestore/Auth or Realtime where used).
- Secondary/local store: Realm (local-first for offline, as fallback/sync layer).
- Architecture: SOLID principles + Clean Architecture (entities → use-cases → repositories → data-sources → presentation).
- React Native files that depend on `react-native-get-random-values` must import `import 'react-native-get-random-values';` as the very first statement in the file.

Capabilities
- Read repository context and propose code changes, tests, and CI updates.
- Suggest refactors to align with SOLID & Clean Architecture.
- Identify deprecated APIs and dependency issues; propose migrations.
- Find redundancy and excessive fallback patterns; recommend simplifications.
- Provide minimal, testable code examples and migration steps.

Integrations & tools (recommended)
- CI: GitHub Actions (or existing CI in this repo).
- Linting: ESLint + TypeScript rules.
- Type checking: `tsc`.
- Use `npx expo install` for Expo-native package dependencies.
- Look for update documentation on the web

- Static checks:
```bash
npm run lint
```

Guidelines for online-first / local-fallback behavior
- Canonical source: Firebase. Always attempt read/write to Firebase first when network is available.
- Fallback policy:
  - Local writes: persist to Realm only when remote write fails or network is unavailable.
  - Queue local writes for background sync to Firebase; ensure idempotency and conflict resolution.
  - Limit fallback depth: do not chain multiple fallbacks. Prefer a single, central SyncService responsible for online vs local behavior.
- Timeouts & retries: use exponential backoff, max retries, and circuit-breaker style fallback to local only after the retry window.

Detecting redundancy & excessive fallbacks (what to look for)
- Duplicate logic: repeated remote+local write blocks across components — centralize into a repository or SyncService.
- Nested fallbacks: code that tries A → B → C inside UI components. Move to a single orchestrator.
- Multiple conflicting fallback strategies in code (some modules retry forever, others immediately write to Realm).
- Redundant data models: similar DTO/entity types duplicated across modules — unify domain entities.
- Overuse of defensive code: many try/catch swallowing errors without logging/metrics.

Recommended architecture patterns (practical)
- Layers: Presentation (screens/components) → Use Cases / Domain → Repositories → Data Sources (Firebase, Realm).
- Dependency Injection: pass repositories/data sources into use cases; avoid direct Firebase/Realm access in components.
- Single Responsibility: one class per responsibility (e.g., `HydrationRepository` coordinates remote/local).
- Interface-first: define repository interfaces, implement Firebase and Realm data sources separately.
- Tests: unit tests for use cases & repository logic; integration tests for sync behavior.

Refactor suggestions (examples)
- Implement a `SyncService` or `Repository` per domain entity:
  - Expose `save(entity): Promise<void>` which does online-first logic, falls back to local queue on failure, and schedules background sync.
- Replace duplicated remote/local write code with calls to repository methods.
- Add `isOnline()` centralized utility and a single retry policy used across services.

Safety & data handling
- Never log or expose secrets (API keys, tokens). Use environment-specific config files.
- Do not dump PII into logs or code examples.
- Flag security-sensitive recommendations (auth, encryption, data export) for human review.

Example minimal policy for fallbacks (copyable)
- "All write operations must use their domain `Repository`. Repository performs:
  1. Try remote write with 10s timeout and 3 retries (exponential backoff).
  2. If remote ultimately fails, persist event to Realm queue with metadata for later sync.
  3. Emit an event/metric for failure, and surface a concise UI notice if user action is needed."

Operational notes
- Keep AGENT.md updated when architecture, CI, or major tooling changes.
- Update log: track date, author, and summary of changes.

## Update Log
- 2026-04-25 (Antigravity): Completed migration to Firebase-first data sync with Realm offline fallback via centralized `useSync` hook. Addressed auth error propagation and persistence.
- 2026-04-23 (Assistant): Initial draft created.
