# Session Logs Directory

This directory stores session handover logs when context window is exhausted.

## Naming Convention

`session_YYYYMMDD_NNN.md`

Example: `session_20251223_001.md`

## Template

```markdown
# Session Handover Log

> **Session ID**: session_YYYYMMDD_NNN
> **Date**: YYYY-MM-DD
> **Mode**: [Builder/Auditor/Manager]
> **Agent**: [CTO/Engineer/etc...]

## Summary

[Brief summary of what was accomplished in this session]

## Completed Items

- [x] Item 1
- [x] Item 2

## In Progress

- [ ] Item 3 (status notes)

## Pending Issues

- Issue 1: Description
- Issue 2: Description

## Next Steps

1. Step 1
2. Step 2

## Notes for Next Session

[Any important context or decisions made]

---
END OF SESSION
```
