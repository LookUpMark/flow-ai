# Tasks: Stage Retry with Continue Confirmation

Feature directory: `/home/marc-antonio-lopez/Documenti/github/flow-ai/specs/004-allow-to-retry`
Spec: `/home/marc-antonio-lopez/Documenti/github/flow-ai/specs/004-allow-to-retry/spec.md`
Plan: `/home/marc-antonio-lopez/Documenti/github/flow-ai/specs/004-allow-to-retry/plan.md`

Conventions:
- [P] = Can be executed in parallel with others in the same group
- Use TDD: write/adjust tests before implementation where possible
- Prefer small, verifiable PRs per task or group

## T000 — Setup and Tooling
- [X] T001: Add test tooling (Vitest + @testing-library/react)
  - Files: `package.json`, `vite.config.ts`, `tests/` scaffolding
  - Steps: Add deps, create `tests/unit/` and `tests/integration/` folders, basic config
  - Command: `npm i -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom`
- [X] T002: Add test scripts and base config
  - Files: `package.json`
  - Steps: Add `"test":"vitest"`, `"test:ui":"vitest --ui"`
- [X] T003 [P]: Create testing helpers
  - Files: `tests/setup.ts`
  - Steps: Setup JSDOM, import `@testing-library/jest-dom`

## T100 — Contracts (optional backend)
- [X] T101 [P]: Contract test - Retry endpoint
  - Files: `tests/contract/retry.contract.test.ts`
  - Use `/contracts/openapi.yaml` to validate expected shapes (mock only)
- [X] T102 [P]: Contract test - Attempts listing
  - Files: `tests/contract/attempts.contract.test.ts`
- [X] T103 [P]: Contract test - Approve endpoint
  - Files: `tests/contract/approve.contract.test.ts`
- [X] T104 [P]: Contract test - Continue endpoint
  - Files: `tests/contract/continue.contract.test.ts`

## T200 — Data Model & Types
- [X] T201: Extend types for stage states and attempts
  - Files: `types.ts`
  - Add: `StageStatus`, `StageAttempt`, `ApprovalDecision`, `ContinueConfirmation`
- [X] T202 [P]: Define state selectors/utilities
  - Files: `utils/state.ts`
  - Helpers to: get current stage, mark downstream stale, clone with updated attempt

## T300 — Core Logic
- T301: Add retry action handler (re-run only selected stage)
  - Files: `services/aiService.ts`, `App.tsx`
  - Ensure upstream outputs are frozen; capture attempt metadata
- T302: Add approval selection logic
  - Files: `App.tsx`, `hooks/useHistory.ts`
  - Mark selected attempt as approved; move stage to `AwaitingContinue`
- T303: Add continue confirmation flow
  - Files: `components/PreviewModal.tsx` or new confirm component, `App.tsx`
  - Block auto-advance; require explicit confirmation to move to next stage
- T304: Invalidate downstream on upstream approval change
  - Files: `App.tsx`, `utils/state.ts`
  - Mark stages N+1..end as `Stale`; require re-run
- T305: Error handling for retry failures
  - Files: `services/errorService.ts`, `components/NotificationSystem.tsx`
  - Show clear error and allow retry or revert to approved attempt
- T306: Action logging (retry, approve, continue)
  - Files: `services/loggingService.ts`

## T400 — UI Components
- T401: Add "Retry this stage" control
  - Files: `components/StageDisplay.tsx` or `components/OutputPanel.tsx`
- T402: Attempt history with selection UI
  - Files: `components/HistoryPanel.tsx`
  - Show attempts list with timestamp, summary, parameters
- T403: Continue button + confirmation dialog
  - Files: `components/OutputPanel.tsx`, `components/PreviewModal.tsx`
- T404 [P]: Visual states and badges
  - Files: `components/StageDisplay.tsx`
  - Indicate `AwaitingReview`, `Approved`, `AwaitingContinue`, `Stale`

## T500 — Tests (TDD)
- T501: Unit tests - state transitions
  - Files: `tests/unit/state.transitions.test.ts`
  - Cases: retry → AwaitingReview; approve → AwaitingContinue; continue → next stage; upstream change → Stale downstream
- T502 [P]: Integration test - retry → approve → continue (happy path)
  - Files: `tests/integration/retry-approve-continue.spec.tsx`
- T503 [P]: Integration test - failed retry handling
  - Files: `tests/integration/retry-failure.spec.tsx`
- T504 [P]: Integration test - downstream invalidation on upstream change
  - Files: `tests/integration/invalidate-downstream.spec.tsx`

## T600 — Docs & Quickstart
- T601 [P]: Update quickstart with new flows
  - Files: `specs/004-allow-to-retry/quickstart.md`
- T602 [P]: Update README feature summary
  - Files: `README.md`

## Parallel Execution Guidance
- Group 1 [P]: Contract tests (T101–T104) can run independently
- Group 2 [P]: Utilities and visuals (T202, T404) can run with other tasks
- Group 3 [P]: Integration tests (T502–T504) can be authored in parallel
- Group 4 [P]: Docs (T601–T602) can run anytime

## Suggested Commands
- Install tests: `npm i -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom`
- Run tests: `npm run test`
- Run UI tests (watch): `npm run test:ui`

## Dependency Notes
- Setup (T001–T003) precedes all tests
- Data model/types (T201) before core logic and UI
- Core logic (T301–T306) before integration tests execution, but tests should be authored first
- UI tasks (T401–T403) depend on logic handlers
- Polish/docs can be parallelized
