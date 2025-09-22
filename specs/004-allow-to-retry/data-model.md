# Data Model: Stage Retry & Continue

## Entities
- Flow
  - id: string
  - name: string
  - status: enum(Running, Paused, AwaitingReview, AwaitingContinue)
  - currentStageIndex: number

- Stage
  - id: string
  - name: string
  - inputs: any
  - status: enum(Running, AwaitingReview, Approved, AwaitingContinue, Stale)
  - approvedAttemptId: string | null

- StageAttempt
  - id: string
  - stageId: string
  - startedAt: datetime
  - finishedAt: datetime
  - parameters: object
  - outcome: enum(Success, Failure)
  - output: any
  - summary: string
  - userFeedback: string | null

- ApprovalDecision
  - stageId: string
  - attemptId: string
  - approvedBy: string
  - approvedAt: datetime
  - note: string | null

- ContinueConfirmation
  - fromStageId: string
  - toStageId: string
  - confirmedBy: string
  - confirmedAt: datetime

## Relationships
- Flow has many Stages (ordered)
- Stage has many StageAttempts
- Stage has one approved attempt (approvedAttemptId)
- ContinueConfirmation references two adjacent stages

## State Transitions (Stage)
- Running → AwaitingReview (on attempt completion)
- AwaitingReview → Approved (on selection of attempt)
- Approved → AwaitingContinue (on approval complete)
- AwaitingContinue → Running(next stage) (on continue)
- Any → Stale (when upstream approved attempt changes)
