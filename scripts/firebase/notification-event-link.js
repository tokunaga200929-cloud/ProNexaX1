/* ================================================================
   STEP40: Notification Event Link
   大会・カレンダー・お気に入り更新をNotification Centerへ連携
   ================================================================ */
(function(){
  if (window.PNXNotificationEventLink) return;

  function notify(payload){
    if (!window.PNXNotificationCenter) return null;
    return window.PNXNotificationCenter.add(Object.assign({
      sourceType: payload.sourceType || "system",
      sourceId: payload.sourceId || null,
      relatedEventId: payload.relatedEventId || null,
      tournamentId: payload.tournamentId || null
    }, payload));
  }

  function tournamentTitle(t){
    return (t && (t.title || t.name || t.tournamentTitle)) || "大会";
  }

  const Link = {
    notifyTournamentSaved(tournament){
      return notify({
        id: "notif_tournament_saved_" + (tournament.id || tournament.tournamentId || Date.now()),
        type: "tournamentUpdate",
        title: "大会情報が更新されました",
        body: tournamentTitle(tournament) + " の情報が保存・更新されました。",
        priority: "normal",
        sourceType: "tournament",
        sourceId: tournament.id || tournament.tournamentId || null,
        tournamentId: tournament.id || tournament.tournamentId || null
      });
    },

    notifyCalendarAdded(event){
      return notify({
        id: "notif_calendar_added_" + (event.id || event.tournamentId || Date.now()),
        type: "calendarAdded",
        title: "カレンダーに追加しました",
        body: (event.title || event.name || "大会予定") + " をカレンダーに追加しました。",
        priority: "normal",
        sourceType: "calendar",
        sourceId: event.id || null,
        relatedEventId: event.id || null,
        tournamentId: event.tournamentId || null
      });
    },

    notifyFavoriteChanged(result){
      const fav = result && result.list && result.list[0];
      return notify({
        type: "favoriteUpdate",
        title: "お気に入りを更新しました",
        body: result && result.favorite ? "お気に入りに追加しました。" : "お気に入りを更新しました。",
        priority: "normal",
        sourceType: "favorite",
        sourceId: fav && (fav.id || fav.tournamentId),
        tournamentId: fav && (fav.id || fav.tournamentId)
      });
    },

    notifyDeadlineChanged(tournament){
      return notify({
        id: "notif_deadline_changed_" + (tournament.id || tournament.tournamentId || Date.now()),
        type: "deadlineChanged",
        title: "エントリー締切が更新されました",
        body: tournamentTitle(tournament) + " のエントリー締切を確認してください。",
        priority: "high",
        sourceType: "tournament",
        sourceId: tournament.id || tournament.tournamentId || null,
        tournamentId: tournament.id || tournament.tournamentId || null
      });
    }
  };

  window.PNXNotificationEventLink = Link;

  window.addEventListener("pnx:calendar:events-updated", function(e){
    const item = e.detail && e.detail.item;
    if (item) Link.notifyCalendarAdded(item);
  });

  window.addEventListener("pnx:favorites:updated", function(e){
    Link.notifyFavoriteChanged(e.detail || {});
  });

  window.addEventListener("message", function(event){
    const data = event.data || {};
    if (data.type === "PNX_CMS_TOURNAMENT_SAVED") {
      Link.notifyTournamentSaved(data.payload || {});
    }
    if (data.type === "PNX_TOURNAMENT_DEADLINE_CHANGED") {
      Link.notifyDeadlineChanged(data.payload || {});
    }
  });
})();
