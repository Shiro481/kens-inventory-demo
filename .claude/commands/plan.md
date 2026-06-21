# /plan — Save an implementation plan for this project

When this command is invoked, write a structured implementation plan to a file inside `.claude/plans/` so that all agents working on this project can read it.

## How to use

- `/plan <topic>` — Create or update a plan file for the given topic.
- `/plan` (no args) — Create a plan for whatever task is currently being discussed.

## What to do

1. Determine a short kebab-case filename based on the topic (e.g. `fix-rls-admin-check.md`, `add-pagination.md`).
2. Write the plan file to `.claude/plans/<filename>.md` using the template below.
3. Tell the user the file path so they know where it lives.

Do NOT write plans anywhere else in the project. Always use `.claude/plans/` as the single source of truth.

## Plan file template

```markdown
# Plan: <Title>

**Created:** <YYYY-MM-DD>
**Status:** draft | in-progress | done

## Goal
One sentence describing what this plan achieves.

## Context
Why this is needed — the problem being solved.

## Steps
1. Step one (file or area affected)
2. Step two
3. ...

## Files to change
- `path/to/file.ts` — what changes and why
- `supabase/migrations/YYYYMMDD_name.sql` — what the migration does

## Risks / Notes
Any gotchas, rollback notes, or dependencies between steps.
```

## Rules

- One plan file per feature or fix. If a plan already exists for the topic, update it in place rather than creating a duplicate.
- Keep plans short — enough for another agent to pick up and execute without re-deriving context.
- Mark `Status: done` when all steps are complete.
- Never delete plan files; they serve as a log of decisions made.
