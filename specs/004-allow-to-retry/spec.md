# Feature Specification: Stage Retry with Continue Confirmation

**Feature Branch**: `004-allow-to-retry`  
**Created**: 2025-09-22  
**Status**: Draft  
**Input**: User description: "Allow to retry a specific stage if the output is not good. Ask to continue to the following stage before"

## Execution Flow (main)
```
1. Parse user description from Input
	→ If empty: ERROR "No feature description provided"
2. Extract key concepts from description
	→ Identify: actors, actions, data, constraints
3. For each unclear aspect:
	→ Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
	→ If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
	→ Each requirement must be testable
	→ Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
	→ If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
	→ If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
	- User types and permissions
	- Data retention/deletion policies  
	- Performance targets and scale
	- Error handling behaviors
	- Integration requirements
	- Security/compliance needs

---

## User Scenarios & Testing (mandatory)

### Primary User Story
As a user running a multi‑stage AI flow, after a stage completes I review its output. If the output is not satisfactory, I can retry just that stage (without re‑running previous stages), optionally adjust stage parameters, and review the new attempt. Before the system proceeds to the next stage, it asks me to confirm continuing. I can approve one attempt as the stage's output and then explicitly continue to the following stage.

### Acceptance Scenarios
1. Given a flow paused at Stage N with its output displayed, When the user chooses "Retry this stage", Then only Stage N is re‑executed using the current approved outputs from prior stages and the stage’s current configuration, and the new attempt is added to the stage’s history for review.
2. Given Stage N has multiple attempts, When the user opens the stage output, Then the user can view prior attempts, compare their summaries, and select one attempt as the approved output for Stage N.
3. Given Stage N just finished an attempt, When the user tries to move forward, Then the system asks for explicit confirmation to continue to Stage N+1 and does not proceed without confirmation.
4. Given Stage N has an approved attempt, When the user confirms "Continue", Then the system advances to Stage N+1 and begins or prepares its execution per the flow’s rules.
5. Given the user retried Stage N after Stage N+1 had previously run, When a different attempt is approved for Stage N, Then all downstream stages (N+1 onward) are marked stale and blocked until the user reconfirms continuation and re‑executes them as needed.
6. Given a retry attempt fails, When the failure is shown, Then the user sees a clear error and can retry again or revert to a previously approved attempt.

### Edge Cases
- What happens if the user exits without confirming continue? The flow should remain paused at the current stage with state preserved.
- How many retries are allowed per stage? [NEEDS CLARIFICATION: retry limit and rate/cost limits]
- Can the user edit stage parameters before retry? [NEEDS CLARIFICATION: which parameters are user‑editable]
- What if auto‑run or non‑interactive mode is active? [NEEDS CLARIFICATION: default continue behavior]
- What happens if a prior stage changes while viewing Stage N? The system should detect changes and require re‑approval of Stage N.
- How are concurrent users handled on the same flow? [NEEDS CLARIFICATION: locking and ownership]
- Can the user undo a continue decision? [NEEDS CLARIFICATION: allow rollback to previous stage]
- Are there cost/time estimates shown before retry? [NEEDS CLARIFICATION: estimation policy]

## Requirements (mandatory)

### Functional Requirements
- **FR-001**: System MUST provide a visible "Retry this stage" action whenever a stage finishes execution and its output is available for review.
- **FR-002**: System MUST re‑execute only the selected stage on retry, using the latest approved outputs from upstream stages and the stage’s current configuration.
- **FR-003**: System MUST maintain a history of stage attempts (including timestamp, attempt number, and a brief summary) and display it to the user.
- **FR-004**: System MUST allow the user to view previous attempts and select one attempt as the approved output for the stage.
- **FR-005**: System MUST require explicit user confirmation (e.g., a confirmation dialog) before proceeding from any stage to the next stage.
- **FR-006**: System MUST block automatic progression to the next stage until the user confirms the continue action.
- **FR-007**: System MUST mark downstream stages as stale when an upstream stage is retried and a different attempt is approved, preventing use of outdated outputs.
- **FR-008**: System MUST allow discarding a retry attempt, preserving the previously approved attempt as the stage’s output.
- **FR-009**: System MUST treat the latest attempt as a draft until explicitly approved or continued with. [NEEDS CLARIFICATION: is implicit approval on continue acceptable?]
- **FR-010**: System MUST allow (where applicable) editing stage parameters/prompts prior to triggering a retry. [NEEDS CLARIFICATION: scope of editable inputs]
- **FR-011**: System MUST handle retry failures gracefully, surfacing clear error messages and allowing additional retries.
- **FR-012**: System MUST record user actions (retry, approve, continue) for audit and troubleshooting.
- **FR-013**: System MUST expose distinct stage/flow states suitable for testing and automation (e.g., AwaitingReview, Approved, AwaitingContinue, Running, Paused, Stale).
- **FR-014**: System MUST preserve flow state so a paused flow can be resumed later without data loss.
- **FR-015**: System MUST inform users about potential time/cost impacts of a retry before execution. [NEEDS CLARIFICATION: metrics and thresholds]
- **FR-016**: System SHOULD allow the user to provide a reason or rating when marking an output "not good" for traceability. [NEEDS CLARIFICATION: required vs optional]

### Key Entities (include if feature involves data)
- **Flow**: An orchestrated sequence of stages; attributes (conceptual): id, name, status, currentStageIndex.
- **Stage**: A unit of work in the flow; attributes: id, name, inputs, outputs (by attempt), status.
- **StageAttempt**: A single execution of a stage; attributes: attemptId, stageId, startedAt, finishedAt, outcome, outputReference, parametersSummary, userFeedback.
- **ApprovalDecision**: The selection of a specific attempt as the approved output; attributes: stageId, attemptId, approvedBy, approvedAt, note.
- **ContinueConfirmation**: A record that the user explicitly chose to advance to the next stage; attributes: fromStageId, toStageId, confirmedBy, confirmedAt.
- **Lineage/Dependency**: Conceptual mapping used to mark downstream stages as stale when upstream approvals change.

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous  
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [ ] User description parsed
- [ ] Key concepts extracted
- [ ] Ambiguities marked
- [ ] User scenarios defined
- [ ] Requirements generated
- [ ] Entities identified
- [ ] Review checklist passed

---

