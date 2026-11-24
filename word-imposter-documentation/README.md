# Word Imposter Documentation Package

This package defines product behavior, architecture, data contracts, APIs, security, testing, and deployment guidance for Word Imposter.

## Source of truth
- Finalized game rules: PRD.md and GAME_RULES.md.
- Approved word-pair contract: DATABASE_DESIGN.md.
- Unresolved decisions: OPEN_QUESTIONS.md.
- API and realtime contracts: API_DOCUMENTATION.md and SOCKET_EVENTS.md.

## Recommended reading order for an AI coding agent
1. PRD.md and GAME_RULES.md
2. OPEN_QUESTIONS.md
3. SYSTEM_ARCHITECTURE.md and TRD.md
4. DATABASE_DESIGN.md
5. GAME_STATE_MACHINE.md and GAME_LOGIC.md
6. API_DOCUMENTATION.md and SOCKET_EVENTS.md
7. USER_ROLES_PERMISSIONS.md and SECURITY_DOCUMENTATION.md
8. WORKFLOW.md, UI_UX_GUIDELINES.md, COMPONENT_LIBRARY.md
9. TESTING_DOCUMENTATION.md and ACCEPTANCE_CRITERIA.md
10. DEPLOYMENT_GUIDE.md and ENVIRONMENT_SETUP.md

## Repository guidance
Keep Markdown as the editable source of truth. PDFs are generated reading copies. Update both formats after approved changes and rerun the consistency audit.
