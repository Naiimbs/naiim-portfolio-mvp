# Example: how to use the prompt

## Filled project context

- Project type: Web App
- Main technologies: React, Vite, Supabase, PostgreSQL
- Main goal: Add a resource download flow without breaking the public catalog
- Current issue or feature: Existing downloads do not distinguish known contacts from new contacts

## What the AI should inspect

- Routing and the public resource detail page
- Resource and marketing services
- Supabase Edge Function used for downloads
- Database access and row-level security assumptions
- Existing translations and modal states
- Build and deployment scripts

## Expected quality of the analysis

The answer should identify confirmed files and code paths before suggesting changes. It should distinguish facts such as “the modal calls this service” from assumptions such as “the database probably has a unique email constraint.” It should propose a small, ordered plan, explain security boundaries, list tests for new and existing contacts, and wait for approval before editing.
