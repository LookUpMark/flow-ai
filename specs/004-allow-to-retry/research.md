# Research: Stage Retry with Continue Confirmation

## Unknowns and Decisions

- Retry limit per stage
  - Decision: No hard limit; show soft guidance if >5 attempts within 10 minutes.
  - Rationale: Avoid blocking exploration while discouraging runaway retries.
  - Alternatives: Fixed cap (3), cooldown timer.

- Editable parameters before retry
  - Decision: Allow editing stage prompt/temperature and any stage-local parameters shown in UI.
  - Rationale: Enables targeted improvements without changing upstream outputs.
  - Alternatives: Lock parameters to keep reproducibility; allow global changes.

- Non-interactive/auto-run mode
  - Decision: Continue requires explicit user action in interactive UI; auto-run mode bypasses confirmation only if explicitly enabled in settings.
  - Rationale: Safety first; allow automation by explicit opt-in.
  - Alternatives: Always confirm; never confirm.

- Downstream invalidation policy
  - Decision: When a different attempt is approved for stage N, mark N+1..end as Stale and require re-run.
  - Rationale: Ensures consistency with updated lineage.
  - Alternatives: Selective recomputation; diff-based invalidation.

- Persistence scope
  - Decision: Persist flow state and attempts per stage in-memory; optionally mirror to localStorage for session recovery.
  - Rationale: Keep implementation simple; no backend.
  - Alternatives: Backend persistence via API.

## Best Practices
- Provide clear affordances: Retry, Approve, Continue actions grouped per stage.
- Show attempt metadata (time, parameters) and enable compare/select.
- Prevent accidental advance: confirmation dialog with summary.
- Log user actions for audit (using existing logging service).
- Make state transitions explicit and testable.

## Final Choices
- UI-only in this iteration; document potential backend contracts.
- Add Vitest + Testing Library for unit/integration tests.
