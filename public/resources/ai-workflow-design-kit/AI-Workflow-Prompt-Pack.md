# AI Workflow Prompt Pack

Copy, adapt, and test these prompts inside your workflow. Keep the validation step outside the model.

## 1. Extract structured tasks from meeting notes

```text
You are a project operations assistant. Extract only explicit tasks from the meeting notes below.

Return valid JSON with this schema:
{
  "tasks": [
    {
      "title": "string",
      "owner": "string or null",
      "due_date": "YYYY-MM-DD or null",
      "priority": "low | medium | high | null",
      "evidence": "exact supporting phrase",
      "confidence": 0.0
    }
  ]
}

Rules:
- Do not invent owners, dates, or priorities.
- Use null when the source is silent.
- Confidence must reflect evidence quality.
- Source text only:
{{meeting_notes}}
```

## 2. Classify an incoming request

```text
Classify the request into exactly one category: question, bug, complaint, sales, feature_request, or other.
Return JSON: {"category":"...","urgency":"low|medium|high","reason":"...","needs_human_review":true|false}
Use only the request text. Escalate legal, financial, privacy, security, or threatening content to human review.
Request:
{{request_text}}
```

## 3. Summarise with decisions and open questions

```text
Summarise the source for a busy project owner.
Return JSON with: summary, decisions, open_questions, next_actions, risks.
Keep decisions separate from suggestions. If a fact is not present, write an empty array.
Source:
{{source_text}}
```

## 4. Score job relevance with evidence

```text
You are a transparent job-fit evaluator. Compare the job description with the candidate profile.
Return JSON with: fit_score_0_to_100, strengths, gaps, evidence, questions_before_applying.
Do not infer protected characteristics. Do not make the final career decision. Cite exact evidence from the supplied texts.
Job:
{{job_description}}
Candidate profile:
{{candidate_profile}}
```

## 5. Draft a safe reply

```text
Draft a concise reply using the source and policy below.
Return JSON: {"draft":"...","claims_used":[],"missing_information":[],"needs_human_review":true|false}
Never promise refunds, legal outcomes, security changes, or external actions without human approval.
Policy:
{{policy}}
Source:
{{source}}
```

## 6. Quality reviewer

```text
Review the proposed output against the acceptance criteria.
Return JSON: {"pass":true|false,"issues":[],"severity":"none|low|medium|high","recommended_fix":"..."}
Do not rewrite the output. Identify unsupported claims, missing fields, contradictions, and unsafe actions.
Acceptance criteria:
{{criteria}}
Proposed output:
{{output}}
```

## Prompt testing notes

Use at least five normal cases, three incomplete cases, two ambiguous cases, and one adversarial case. Store the input, output, validation result, human correction, and final outcome for each test.
