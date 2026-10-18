# Analysis review checklist

Before approving implementation, confirm that the AI has:

- [ ] Inspected the real repository structure and configuration.
- [ ] Named only files, modules, dependencies, and routes that actually exist.
- [ ] Separated confirmed findings from assumptions.
- [ ] Explained the relevant request-to-code path.
- [ ] Identified security and data-handling risks without exposing secrets.
- [ ] Preserved existing behavior unless a change is explicitly required.
- [ ] Proposed a prioritized plan with small, reviewable steps.
- [ ] Listed affected files and the reason for each.
- [ ] Defined tests, acceptance criteria, and regression checks.
- [ ] Mentioned breaking changes and rollback considerations.
- [ ] Asked open questions that materially affect the implementation.
- [ ] Waited for explicit approval before changing files.

If any item is missing, ask the AI to complete the analysis before granting write access.
