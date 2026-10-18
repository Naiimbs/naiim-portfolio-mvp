# AI Workflow Design Guide & Toolkit

## From messy process to reliable, human-centered automation

This playbook helps designers, founders, operators, and AI builders decide what to automate, where AI adds value, and where human judgment must remain in the loop.

## 1. Start with the outcome
Choose one recurring process with a clear owner and measurable result. Good candidates are repetitive, information-heavy, slow, or error-prone. Avoid starting with a tool; start with the outcome.

Write: When **[trigger]** happens, **[person/system]** performs **[steps]** so that **[outcome]** is achieved.

## 2. Map the current state
For every step record the owner, trigger, inputs, action, decision, output, tool, pain point, and exceptions. A workflow that only works on the happy path is not production-ready.

## 3. Choose the automation mode
- **Manual:** rare, sensitive, creative, or hard to evaluate consistently.
- **AI-assisted:** extraction, classification, summarisation, comparison, or drafting with human approval.
- **Automated:** deterministic actions with clear rules, such as creating a task or syncing fields.
- **Human gate:** required before external communication, financial, legal, medical, hiring, deletion, or publication actions.

## 4. Design the To-Be workflow
Use six layers: **Trigger → Context → Reasoning task → Validation → Human gate → Action and logging**. Keep every AI step narrow and testable. Define structured outputs, uncertainty behaviour, and source boundaries.

## 5. Validate quality and safety
Test normal cases, incomplete inputs, conflicting information, duplicates, adversarial wording, and edge cases. Track accuracy, correction rate, time saved, failure rate, cost per outcome, and user trust. Add permissions, rate limits, logs, rollback, and monitoring.

## 6. Measure value
Estimated monthly value = monthly time saved × hourly value − monthly tool and maintenance cost. Saving time while increasing errors is not success.

## Worked example: Job Search Agent
A daily run collects job results, scores fit against explicit criteria, removes duplicates, explains evidence, and creates a shortlist. The candidate reviews the shortlist before applying. The goal is to reduce search effort, not automate the career decision.

## Final checklist
Is the outcome measurable? Is there a named owner? Are sources explicit? Is each AI step narrow? Are missing values handled safely? Is a human gate present where risk requires it? Are actions logged and reversible? Has the workflow been tested on failures?
