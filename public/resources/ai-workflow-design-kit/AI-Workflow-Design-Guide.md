# AI Workflow Design Guide & Toolkit

## From messy process to reliable, human-centered automation

This practical playbook helps designers, founders, operators, and AI builders decide what to automate, where AI adds value, and where human judgment must remain in the loop.

## 1. Start with the process, not the tool

Choose one recurring process that has a clear beginning and a measurable outcome. Good candidates are repetitive, information-heavy, slow, or error-prone. Avoid starting with “I want to use AI”; start with “I want to improve this outcome.”

Write the process in one sentence:

> When **[trigger]** happens, **[person or system]** performs **[steps]** so that **[outcome]** is achieved.

### Signs that a workflow is a good candidate

- The same steps happen at least weekly.
- The process consumes time that could be spent on higher-value work.
- Inputs are reasonably structured: text, files, forms, messages, or records.
- The result can be checked with clear quality criteria.
- A person can approve sensitive or ambiguous decisions.

### Red flags

Do not automate first when the process has no clear owner, no agreed definition of quality, highly sensitive decisions without review, or unstable requirements.

## 2. Map the current state

Use the Workflow Canvas to capture the **As-Is** process before proposing automation.

For every step, record:

1. Owner: who performs it?
2. Trigger: what starts it?
3. Input: what information is needed?
4. Action: what actually happens?
5. Decision: what rule or judgment is applied?
6. Output: what is produced?
7. Tool: where does the work happen?
8. Pain: what is slow, unclear, or error-prone?

Do not skip the exceptions. A workflow that only works for the happy path is not production-ready.

## 3. Decide between manual, AI-assisted, and automated

Use the decision matrix before selecting a platform.

### Manual

Keep a step manual when it is rare, highly sensitive, creative, or difficult to evaluate consistently.

### AI-assisted

Use AI when the work involves language, classification, summarisation, extraction, comparison, drafting, or pattern recognition, while a person still approves the result.

### Fully automated

Automate deterministic actions with clear rules: moving a record, sending a notification, creating a task, calculating a value, or syncing fields.

### Human approval required

Add a review gate before external communication, financial action, legal or medical interpretation, hiring decisions, deletion, publication, or any action that could materially affect a person.

## 4. Design the To-Be workflow

A reliable AI workflow has six layers:

1. **Trigger** — event, schedule, form, webhook, or manual launch.
2. **Context** — the minimum data the AI needs, with source and freshness.
3. **Reasoning task** — one explicit AI job with a structured output.
4. **Validation** — schema checks, confidence threshold, duplicate detection, or policy check.
5. **Human gate** — approval for risk, ambiguity, or external impact.
6. **Action and logging** — write the result, notify the owner, and retain an audit trail.

Keep each AI step narrow. “Handle this process” is too vague; “extract task title, owner, due date, and confidence from this meeting note” is testable.

## 5. Write dependable prompts

A good prompt defines the role, task, source boundaries, output schema, uncertainty behaviour, and examples. Ask for structured JSON when the next step is automated.

Minimum prompt pattern:

```text
Role: You extract structured project actions.
Task: Identify only explicit tasks from the source.
Source: Use only the text provided below; do not invent missing data.
Output: Return JSON with title, owner, due_date, priority, evidence, confidence.
Uncertainty: Use null when a value is absent and explain ambiguity in evidence.
```

Never hide business rules only inside a prompt. Repeat critical constraints in the validation layer.

## 6. Add quality and safety checks

Test the workflow with a small evaluation set before connecting real actions. Include normal cases, incomplete inputs, conflicting information, duplicates, adversarial wording, and edge cases.

Track:

- Accuracy of extracted fields.
- False positives and false negatives.
- Human correction rate.
- Time saved per run.
- Failure rate and retry rate.
- Cost per successful outcome.
- User trust and clarity.

If a workflow cannot explain why it produced a result, keep a human review step or redesign the output.

## 7. Measure ROI

Use the ROI Calculator to compare the current process with the proposed workflow.

Core formula:

> Monthly time saved × hourly value − monthly tool and maintenance cost = estimated monthly value

Also measure quality. Saving time while increasing errors is not a successful automation.

## 8. Implementation plan

### Phase 1 — Frame

Choose one outcome, owner, audience, and success metric.

### Phase 2 — Map

Document the As-Is process and exceptions.

### Phase 3 — Prototype

Build the smallest workflow with mocked actions and sample data.

### Phase 4 — Evaluate

Run the test set, record failures, and refine prompts and rules.

### Phase 5 — Guard

Add permissions, validation, rate limits, human approval, logging, and a rollback path.

### Phase 6 — Operate

Monitor quality, review failures weekly, and update the evaluation set as the process changes.

## Worked example: Job Search Agent

**Trigger:** a scheduled daily run.

**Inputs:** job source results and a candidate profile.

**AI task:** score fit against explicit criteria and explain the evidence.

**Validation:** remove duplicate URLs, reject missing titles, and require a confidence value.

**Human gate:** the candidate reviews the shortlist before applying.

**Outcome:** a focused daily digest with links, fit scores, and reasons.

The point is not to automate every decision. The point is to reduce search effort while keeping the final career decision with the person.

## Final checklist

- Is the outcome measurable?
- Is there a named owner?
- Are inputs and sources explicit?
- Is every AI step narrow and testable?
- Are missing values handled safely?
- Is a human gate present where risk requires it?
- Are actions logged and reversible?
- Has the workflow been tested on failures, not only success cases?
- Is the expected value greater than operating cost?

Use the companion Canvas, Prompt Pack, Blueprint, ROI Calculator, and Quality Checklist to move from this guide to a working first prototype.

## More real workflow examples

### 1. Customer-support triage
**Trigger:** a new support message arrives.
**AI task:** classify urgency, topic, sentiment, and suggested next action.
**Validation:** detect missing context, duplicates, and low confidence.
**Human gate:** urgent, sensitive, or refund-related cases require an agent.
**Outcome:** faster routing without allowing AI to make high-impact commitments.

### 2. Content repurposing
**Trigger:** a long article, podcast, or workshop is approved.
**AI task:** extract claims and create drafts for a short post, carousel, and newsletter.
**Validation:** preserve source meaning, flag unsupported claims, and keep links.
**Human gate:** a designer or editor approves before publishing.
**Outcome:** more distribution from one source while preserving editorial control.

### 3. Research synthesis
**Trigger:** a research folder reaches a review milestone.
**AI task:** compare sources, group themes, identify conflicts, and draft evidence-backed options.
**Validation:** retain citations, separate facts from interpretation, and flag missing evidence.
**Human gate:** the decision owner reviews the recommendation.
**Outcome:** a clearer decision brief instead of an opaque AI answer.
