# Documentation Index

## Core documents
| File | Purpose | Read after |
|---|---|---|
| PRD.md | Product scope and requirements | — |
| TRD.md | Technical requirements and stack | PRD |
| WORKFLOW.md | End-to-end user/game workflows | PRD, GAME_RULES |
| UI_UX_GUIDELINES.md | Screen and design behavior | PRD |
| DATABASE_DESIGN.md | MongoDB entities and dataset schema | PRD, TRD |
| API_DOCUMENTATION.md | REST and Socket.IO contracts | TRD, Database |
| SYSTEM_ARCHITECTURE.md | Components and trust boundaries | TRD |
| TESTING_DOCUMENTATION.md | QA strategy and test cases | All design docs |
| DEPLOYMENT_GUIDE.md | Staging/production operations | TRD, Security |
| PROJECT_ROADMAP.md | Phased implementation | All |
| SECURITY_DOCUMENTATION.md | Threat model and controls | Architecture |
| COMPONENT_LIBRARY.md | React component contracts | UI guidelines |
| USER_ROLES_PERMISSIONS.md | Authorization matrix | Game rules |
| ACCEPTANCE_CRITERIA.md | Testable completion criteria | PRD |

## Supporting documents
GAME_RULES.md, GAME_STATE_MACHINE.md, SOCKET_EVENTS.md, GAME_LOGIC.md, ERROR_HANDLING.md, OPEN_QUESTIONS.md, ENVIRONMENT_SETUP.md, README.md, DOCUMENTATION_STATUS.md.

## Dependency guidance
Implement game state and data contracts before building feature screens. Keep API/socket contracts synchronized with workflows, permissions, and acceptance criteria.
