# UI/UX Guidelines
**Version:** 1.0 | **Design direction:** classic, playful, clear, mobile-first

## 1. Design principles
- Make the next valid action obvious.
- Keep secret information visually and technically private.
- Use clear status labels rather than relying on color alone.
- Prefer focused game screens over dense dashboards.
- Keep primary actions thumb-reachable on mobile.
- Motion should reinforce state changes, not delay gameplay.

## 2. Visual system
Use a restrained neutral base with one primary brand color, one accent, and semantic success/warning/danger colors. Define tokens centrally and test contrast. Suggested initial token names: `color.bg`, `color.surface`, `color.text`, `color.muted`, `color.primary`, `color.accent`, `color.success`, `color.warning`, `color.danger`, `radius.card`, `space.1..8`, `shadow.card`. Final hex values should be selected and contrast-checked during visual design rather than treated as product rules.

Typography: use a legible sans-serif with clear numeric styles for room codes and scores. Establish heading/body/caption scale and line heights. Avoid long uppercase labels.

## 3. Responsive behavior
Design mobile-first. Use fluid widths, max-width containers on desktop, stacked cards on narrow screens, and horizontal tables only where they can scroll accessibly. Test 320px+ widths, common phone sizes, tablet portrait/landscape, laptop, and wide desktop. No screen should require horizontal page scrolling.

## 4. Screen inventory and key content
| Screen | Primary content | Main action |
|---|---|---|
| Landing | Game explanation, create/join | Create room / Join |
| Create room | Room creation progress/error | Create |
| Join room | Code and display name | Join |
| Lobby | Room code, invite, players, settings | Host: Start |
| Settings | Player bounds, imposters, difficulty, category | Save |
| Role reveal | Mystery card, role, secret word | Hide / Continue |
| Game | Round, speaking order, player states | Mark as Spoken |
| Discussion | Active roster and phase status | Host: Start Voting |
| Voting | Eligible target cards | Submit Vote |
| Results | Vote totals and elimination/tie outcome | Continue |
| Winner | Winning team, scores | Rematch |
| Leaderboard | All players, score, status | View / Rematch |
| Error states | Safe explanation and recovery action | Retry / Return |

## 5. Important component behavior
- **Player card:** display name, Host marker, connected/away state, active/eliminated state; never expose role unless explicitly revealed by game rules.
- **Role card:** private local presentation; prevent accidental public rendering in shared room components; hide action must obscure the word.
- **Speaking list:** fixed order, current turn, completed state; eliminated players are excluded from future active turns.
- **Vote card:** disable self and invalid targets; show submitted state without showing vote target to other players.
- **Results:** show aggregate counts only after server confirms all eligible votes submitted.
- **Leaderboard:** include active and eliminated players; update score only on completed game.
- **Audio settings:** user-level controls; sound failure never blocks an action.

## 6. States
Every interactive component needs default, hover, focus-visible, pressed, disabled, loading, success, and error states where applicable. Provide empty/loading/error states for room, lobby, leaderboard, and reconnecting views.

## 7. Motion and audio
Role reveal can use a short card flip; respect `prefers-reduced-motion`. Never make animation completion a prerequisite for server state progression. Audio must be opt-in after a user gesture where required by browser policy; provide master mute and avoid overlapping effects.

## 8. Accessibility
Use semantic headings, buttons, labels, and live regions for state announcements. All actions must be keyboard reachable. Do not communicate status by color alone. Maintain contrast, visible focus, sufficient touch target size, and reduced-motion behavior.

## 9. Text wireframes
**Lobby mobile:** top bar with room name/code; copy/share row; player count; vertically stacked player cards; collapsible settings; sticky Host start button.  
**Game mobile:** phase label and round number; current turn card; speaking order list; player cards; bottom action area.  
**Voting mobile:** clear instruction; grid/list of valid player cards; disabled self card; fixed submit action; submitted confirmation.  
**Desktop:** centered content column with secondary sidebar for room info/leaderboard where it improves context, not a generic admin dashboard.
