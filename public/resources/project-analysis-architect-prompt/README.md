# Senior Software Engineer & Architect — Project Analysis Prompt

A copy-ready prompt for analyzing an existing repository before implementation changes.

## Included

- `Project-Analysis-Architect-Prompt-en.md` — English prompt
- `Project-Analysis-Architect-Prompt-fr.md` — French prompt
- `Project-Analysis-Architect-Prompt-ar.md` — Arabic prompt
- `Real-Project-Analysis-Examples-en.md` — practical examples from the real Naïm Bsili portfolio
- `Real-Project-Analysis-Examples-fr.md` — French examples
- `Real-Project-Analysis-Examples-ar.md` — Arabic examples
- `Example-Input-and-Expected-Output.md` — practical usage example
- `Analysis-Review-Checklist.md` — approval checklist before implementation
- `01-cms-publishing-flow.png` — visual evidence for the CMS publishing analysis
- `02-nginx-resource-route.png` — visual evidence for the Nginx 403 analysis
- `03-secure-download-boundary.png` — visual evidence for the secure download analysis
- `project-analysis-architect-prompt-cover-visual.webp` — text-free editorial cover

## How to use

1. Open the repository in an AI coding tool that has read access to the project files.
2. Replace the values between brackets in the prompt.
3. Send the prompt without granting write access yet.
4. Review the analysis, confirmed findings, assumptions, affected files, tests, and open questions.
5. Approve implementation only after the plan and acceptance criteria are clear.

The live CMS detail page for this resource also shows the Prompt-specific parameters, a copy-ready prompt, workflow modes, three real analyses from the Naïm Bsili portfolio, and a visual evidence gallery. The resource type is `prompt`, so these sections are rendered through the CMS-driven `/resources/:slug` detail page rather than a hardcoded resource page.

## Safety boundary

The prompt is for repository analysis and planning. It must not request secrets, API keys, passwords, private customer data, or production credentials. Keep write access disabled during the analysis phase.

This resource is a software-analysis aid, not a substitute for security review, legal advice, or production change management.
