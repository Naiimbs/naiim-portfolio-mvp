# AI Workflow Prompt Pack

## Structured extraction
Role: Extract only explicit actions from the source.
Task: Identify title, owner, due date, priority, evidence, and confidence.
Rules: Use only the supplied source. Never invent missing data. Return JSON. Use null when absent.

## Classification
Classify each item into the allowed categories. Return category, confidence, evidence, and review_required. If confidence is below the threshold, set review_required to true.

## Meeting to tasks
Convert meeting notes into explicit tasks only. Separate decisions, questions, and tasks. Preserve the original evidence. Flag ambiguous ownership or dates for human review.

## Research synthesis
Compare the supplied sources, preserve source links, separate facts from interpretation, identify conflicts, and produce a concise recommendation with uncertainty and human-review questions.

## Pre-action review
Before any external or high-impact action, summarize the proposed action, source evidence, risks, missing information, and rollback option. Do not execute; wait for explicit approval.
