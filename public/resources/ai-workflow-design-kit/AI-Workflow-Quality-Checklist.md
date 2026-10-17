# AI Workflow Quality & Safety Checklist

## Framing

- [ ] One measurable outcome is defined.
- [ ] A process owner is named.
- [ ] The trigger and completion condition are explicit.
- [ ] Success metrics include quality, not only speed.

## Data and context

- [ ] Every input has a known source.
- [ ] Sensitive data is minimised or removed.
- [ ] Data freshness and retention are defined.
- [ ] Missing values have a safe fallback.

## AI step

- [ ] The model has one narrow task.
- [ ] The output schema is explicit.
- [ ] The prompt says not to invent facts.
- [ ] Confidence or uncertainty is captured.
- [ ] A representative evaluation set exists.

## Validation and safety

- [ ] Structured output is schema-validated.
- [ ] Duplicates and malformed records are rejected.
- [ ] High-impact actions require human approval.
- [ ] Permissions follow least privilege.
- [ ] Rate limits and retry limits are configured.
- [ ] Failed runs are visible and recoverable.
- [ ] Actions are logged with timestamp and owner.
- [ ] A rollback or manual fallback exists.

## Launch readiness

- [ ] Normal, incomplete, ambiguous, and adversarial cases were tested.
- [ ] Human correction rate is acceptable.
- [ ] Cost per successful outcome is understood.
- [ ] The owner knows how to pause the workflow.
- [ ] A review date is scheduled.
