self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url;
  if (typeof target !== "string") return;
  const url = new URL(target, self.location.origin);
  if (url.origin !== self.location.origin || url.pathname !== "/tools/task-holdem/application") return;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const room = windows.find(client => client.url === url.href);
    if (room) await room.focus();
    else await self.clients.openWindow(url.href);
  })());
});
