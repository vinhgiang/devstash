@AGENTS.md
## Project Overview

This project is a developer knowledge hub for snippets, commands, prompts, notes, files, images, links, and custom types.

## Context files:
Read the following files for context on the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Git Commit Messages

Do not add `Co-Authored-By: Claude ...` lines to commit messages.

## Neon MCP Usage

When using any Neon MCP tool in this project:

- **Project**: Always use the `devstash` project (id: `snowy-cake-08967983`).
- **Branch**: Always target the `dev` branch (id: `br-quiet-smoke-ak31tbag`) by passing `branchId` to every Neon tool call that accepts it.
- **Never touch production**: Do not run any Neon MCP tool against the `production` branch (id: `br-round-mud-ak5kmbwf`) unless I explicitly say so in the request (e.g. "on production", "against prod"). This applies to reads as well as writes — no `run_sql`, `prepare_database_migration`, `reset_from_parent`, `delete_branch`, etc. on production without explicit instruction.
- If a task seems to require production access and I haven't authorized it, stop and ask before proceeding.
