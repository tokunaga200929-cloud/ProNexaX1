# STEP203 search_to_calendar_link

試合検索iframeから本体カレンダーへ大会予定を追加する連携を追加。

- Search iframe sends `PNX_ADD_TOURNAMENT_TO_CALENDAR`
- Parent `index.html` receives the message
- `calendar.js` converts tournament data into all-day calendar events
- Duplicate prevention uses `tournament-{id}`
- Events persist in localStorage key `pronexax.calendar.v2.events.step203`
