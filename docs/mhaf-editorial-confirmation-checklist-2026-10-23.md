# MHAF case study — editorial confirmation checklist

**Purpose:** prepare an evidence-based FDE case study without inserting unconfirmed project steps or claims. This is a review document only. It does not change the published MHAF entry, the Content Registry, or a published snapshot.

## Current source status

A read-only query of the portfolio project’s `content_registry` observed the entry `mhaf-accessibility` as `published` / `public`, at `/work/mhaf-accessibility`, updated 23 October 2026. Its current process is five generic steps — “Add a site”, “Verify ownership”, “Configure”, “Install”, and “Check” — with five French and five Arabic translation entries. Those steps have no FDE stage types or stable stage IDs yet. Do not assume they correspond to the six proposed FDE stages.

The published challenge copy currently frames the problem as difficulty discovering, configuring, and integrating accessibility options, and mentions site owners and visitors. It also warns that a widget is not a substitute for semantic markup, keyboard access, sufficient contrast, captions, alt text, or a WCAG review. These are descriptions of the current public copy, not independent verification of the project’s research or implementation.

## Confirmation checklist

| Topic | What is currently established | Owner evidence / decision needed | State |
|---|---|---|---|
| Original problem and intended audience | The current public copy describes accessibility options as difficult to find, configure, and integrate; it names site owners and visitors. | Confirm the original brief, the primary user group, who commissioned/used the work, and whether both audiences were researched. Link the source brief or interview/research notes. | **Pending confirmation** |
| Specific accessibility issues investigated | The published copy mentions several accessibility principles as caveats, but does not establish which issues were researched or tested for MHAF. | Identify issues actually investigated, method, sample/devices/assistive technologies, and artifacts. Do not imply a formal accessibility or WCAG audit without a report. | **Pending confirmation** |
| Solution actually implemented | The public record presents MHAF as an accessibility widget and includes an installation guide and product imagery. | Confirm the shipped feature set, version/date, what each control does, what is configurable, and which parts are product UI versus portfolio illustration. Provide a release tag, source diff, or verified production walkthrough. | **Pending confirmation** |
| Confirmed integrations and constraints | The public registry lists React 18, Vite, Supabase, an ES-module widget, and Shadow DOM as technology tags. Tags alone do not verify architecture or runtime behavior. | Confirm the embed/configuration flow, domain verification, browser support, data sent/stored, Supabase role/RLS constraints, failure/default behavior, and installation-check limits from code or a current technical note. | **Pending confirmation** |
| Tests and validation evidence | No test results or validation report were present in the case-study fields reviewed. | Attach the actual automated/manual test report, test cases, browser/device matrix, assistive-technology coverage if performed, defects/fixes, and date. Clearly distinguish usability QA from conformance testing. | **Pending confirmation** |
| Demonstrable outcomes | No measured outcome or test-result field was present in the public case-study metadata reviewed. | Provide a source, baseline, measurement method, sample, and timeframe for any outcome claim. If none exists, keep the case study outcome qualitative and say no measured impact is available. | **Pending confirmation** |
| Project contribution and chronology | The Content Registry does not establish, by itself, who completed each activity or when. | Confirm the author’s role, collaborators, responsibilities, decision ownership, duration, and which work is shipped versus exploratory. | **Pending confirmation** |
| Evidence artifacts per stage | The current entry has shared evidence/gallery fields, not evidence mapped to each FDE stage. | For each stage approved for publication, link only artifacts that substantiate that stage (brief, research notes, flow, prototype, code/PR, test report, or release evidence). Remove or redact private information. | **Pending confirmation** |
| EN / FR / AR equivalence | The existing translations each contain five generic process entries. Their accuracy and equivalence have not been editorially approved here. | Review each approved stage title and description in context, independently in EN, FR, and AR; confirm Arabic reading direction and meaning. | **Pending confirmation** |

## Optional FDE stage mapping — do not populate until confirmed

The portfolio MEP now supports these stage types as optional reusable fields. The mapping below is intentionally blank so the editor does not turn a generic process step into an unsupported claim.

| Optional stage | Candidate source step / artifact | Factual activity and scope confirmed? | Localized copy reviewed? |
|---|---|---|---|
| Problem & Context | Pending | No | No |
| Discovery & Investigation | Pending | No | No |
| Solution Design | Pending | No | No |
| Build & Integration | Pending | No | No |
| Validation & Iteration | Pending | No | No |
| Outcome & Learnings | Pending | No | No |

Stages may remain absent or hidden when they were not performed or lack sufficient evidence. The Content Registry readiness gate does not require all six. Do not add placeholder claims, estimated metrics, assumed validation, or unverified outcomes; review this document and the actual source artifacts before saving or publishing any stage content.
