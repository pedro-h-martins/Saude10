Agent: GitHub Copilot and Google Antigravity

Purpose
- Keep assistant behavior focused on this React Native app: make small, correct, testable changes.
- Prefer Firebase for remote sync and authenticated cloud features, but make basic CRUD usable offline through Realm when there is no 4G/5G or Wi-Fi, or when the connection is unreliable.
- Treat Realm as the local working store for offline-first basic data, then sync to Firebase when connectivity returns.
- Enforce SOLID and Clean Architecture, and actively remove duplicated fallback logic, redundant models, and deprecated APIs.

Operating style
- Be concise, practical, and safety-first.
- Default to implementation over discussion when the request is clear.
- Ask a clarifying question only when the ambiguity blocks a safe or correct change.
- When a solution has tradeoffs, state the recommendation and the reason briefly, then move to action.

Project rules
- Stack: React Native with Expo; an Android native folder is present and may need native-aware handling.
- Canonical remote source for synced/cloud data: Firebase.
- Canonical local source for offline-capable basic CRUD: Realm.
- Architecture order: presentation → domain/use cases → repositories → data sources.
- UI code should not talk directly to Firebase or Realm when a repository or sync layer can own that responsibility.
- Files that depend on react-native-get-random-values must import it as the first statement.

Decision priorities
- Use Realm first for basic CRUD that must work without internet, then sync to Firebase later.
- Use Firebase first for data that is cloud-owned, collaborative, or requires server authority.
- Fall back to Realm immediately when there is no connection or the connection is unstable.
- Keep fallback depth to one layer; do not add nested A → B → C chains in UI or feature code.
- Centralize retry, timeout, queueing, and conflict resolution in a single repository or SyncService per domain.
- Prefer explicit failure handling over silent catch blocks.

Working process
- Start from the nearest concrete file, symbol, failing command, or test.
- Before the first edit, gather only enough local context to form one falsifiable hypothesis and one cheap check.
- Make the smallest edit that tests the hypothesis.
- After the first substantive edit, run one focused validation step before broadening scope.
- Keep edits minimal and preserve existing style unless a broader change is required.

What to optimize for
- Replace duplicated remote-plus-local write flows with repository methods.
- Move fallback and sync orchestration out of screens and components.
- Keep domain models singular and avoid DTO/entity duplication across layers.
- Prefer interface-first design so Firebase and Realm implementations stay swappable.
- Add tests around use cases, repository behavior, and sync flows when logic changes.

Tools and validation
- Use npx expo install for Expo-native dependencies.
- Favor ESLint and TypeScript checks for validation.
- Run npm run lint for static validation when relevant.
- Use tsc when type safety could be affected.
- Look up current documentation before changing platform-specific or dependency-sensitive behavior.

Safety and data handling
- Never log secrets, API keys, tokens, or raw PII.
- Use environment-specific config for sensitive values.
- Treat auth, encryption, export, and persistence changes as security-sensitive and flag them clearly.

Fallback policy template
- All writes for cloud-owned data should go through the domain repository.
- For basic offline-capable CRUD, the repository should write to Realm first and queue Firebase sync for when connectivity returns.
- For cloud-owned data, the repository should attempt a remote write first, retry with bounded exponential backoff, and fall back to a local queue only after remote failure or confirmed offline state.
- The repository should emit a failure event or metric and surface a concise user message only if user action is needed.

Maintenance
- Keep this file current when architecture, sync behavior, CI, or major tooling changes.
- Record updates with date, author, and a short summary.

## Update Log
- 2026-05-18 (Assistant): Clarified offline mode so basic CRUD can work in Realm when there is no 4G/5G or Wi-Fi, with Firebase reserved for sync and cloud-owned data.
- 2026-04-25 (Antigravity): Completed migration to Firebase-first data sync with Realm offline fallback via centralized useSync hook. Addressed auth error propagation and persistence.
- 2026-04-23 (Assistant): Initial draft created.
