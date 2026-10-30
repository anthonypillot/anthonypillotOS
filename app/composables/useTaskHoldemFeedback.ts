import type { TaskHoldemRoom } from "#shared/types/task-holdem.type";
import { readTaskHoldemFeedback, saveTaskHoldemFeedback, taskHoldemSounds, type TaskHoldemCue } from "~/utils/task-holdem-feedback";

export function useTaskHoldemFeedback() {
  const preferences = reactive(readTaskHoldemFeedback());
  const audioStatus = ref<"locked" | "ready" | "unavailable">("locked");
  const permission = ref<NotificationPermission | "unsupported">("unsupported");
  const notificationError = ref<string | null>(null);
  const enabling = ref(false);
  const lastPlayed = new Map<TaskHoldemCue, number>();
  const voices = new Set<OscillatorNode>();
  const notifications = new Map<Notification, string>();
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let registration: ServiceWorkerRegistration | undefined;
  let preparing: Promise<void> | undefined;
  let notificationGeneration = 0;
  let disposed = false;

  async function unlock(): Promise<void> {
    if (disposed || preferences.muted || !preferences.volume) return;
    try {
      if (!("AudioContext" in window)) {
        audioStatus.value = "unavailable";
        return;
      }
      if (!context) {
        context = new AudioContext();
        master = context.createGain();
        master.gain.value = preferences.volume;
        master.connect(context.destination);
      }
      if (context.state === "suspended") await context.resume();
      if (!disposed) audioStatus.value = context.state === "running" ? "ready" : "locked";
    } catch {
      if (!disposed) audioStatus.value = "unavailable";
    }
  }

  function play(cue: TaskHoldemCue, preview = false): void {
    const sound = taskHoldemSounds[cue];
    if (disposed || preferences.muted || !preferences.volume || (!preview && !preferences.categories[sound.category]) || context?.state !== "running" || !master) return;
    const now = performance.now();
    const passive = cue === "vote-received" || cue === "joined" || cue === "left";
    if ((!preview && passive && now - (lastPlayed.get(cue) ?? -Infinity) < 80) || voices.size > 12) return;
    lastPlayed.set(cue, now);
    try {
      for (const note of sound.notes) {
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        const start = context.currentTime + note.delay;
        oscillator.type = "sine";
        oscillator.frequency.value = note.frequency;
        envelope.gain.setValueAtTime(0, start);
        envelope.gain.linearRampToValueAtTime(0.18, start + 0.008);
        envelope.gain.exponentialRampToValueAtTime(0.001, start + note.duration);
        oscillator.connect(envelope);
        envelope.connect(master);
        voices.add(oscillator);
        oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
        oscillator.start(start);
        oscillator.stop(start + note.duration + 0.01);
      }
    } catch {
      // Feedback must never interrupt a room action if the audio device disappears.
    }
  }

  function refreshPermission(): void {
    permission.value = "Notification" in window && window.isSecureContext ? Notification.permission : "unsupported";
  }

  async function prepareNotifications(): Promise<void> {
    if (!("serviceWorker" in navigator) || registration || disposed) return;
    if (preparing) return preparing;
    preparing = (async () => {
      try {
        const worker = await navigator.serviceWorker.register("/tools/task-holdem/notifications.js", { scope: "/tools/task-holdem/" });
        if (!disposed) registration = worker;
      } catch {
        // Desktop notifications can work even when service workers are unavailable.
      }
    })();
    try { await preparing; } finally { preparing = undefined; }
  }

  async function enableNotifications(): Promise<void> {
    if (permission.value === "unsupported" || enabling.value) return;
    enabling.value = true;
    notificationError.value = null;
    try {
      const result = await Notification.requestPermission();
      if (disposed) return;
      permission.value = result;
      if (result !== "granted") return;
      preferences.notifications = true;
      await prepareNotifications();
    } catch {
      if (!disposed) notificationError.value = "Notifications couldn't be enabled in this browser.";
    } finally {
      if (!disposed) enabling.value = false;
    }
  }

  async function notifyRound(room: TaskHoldemRoom): Promise<void> {
    if (disposed) return;
    refreshPermission();
    if (disposed || !preferences.notifications || permission.value !== "granted" || (document.visibilityState === "visible" && document.hasFocus())) return;
    const generation = ++notificationGeneration;
    const deliver = async () => {
      if (disposed || generation !== notificationGeneration) return;
      const key = `task-holdem:notified:${room.id}`;
      try { if (localStorage.getItem(key) === room.round.id) return; } catch { /* Storage can be restricted. */ }
      if (await showRoundNotification(room, generation)) {
        try { localStorage.setItem(key, room.round.id); } catch { /* The notification still works without storage. */ }
      }
    };
    try {
      if (navigator.locks) await navigator.locks.request(`task-holdem:notify:${room.id}`, deliver);
      else await deliver();
    } catch {
      if (!disposed) notificationError.value = "Notifications aren't available here. New rounds will still appear in the room.";
    }
  }

  async function showRoundNotification(room: TaskHoldemRoom, generation: number): Promise<boolean> {
    const url = new URL("/tools/task-holdem/application", window.location.origin);
    url.searchParams.set("id", room.id);
    const options: NotificationOptions = {
      body: room.round.topic || `Round ${room.round.number} is ready. Join your team and pick a card.`,
      icon: "/svg/task-holdem/logo.svg", tag: `task-holdem:${room.id}`, data: { url: url.href },
    };
    const title = `TaskHold’em · Round ${room.round.number}`;
    registration ??= await navigator.serviceWorker?.getRegistration("/tools/task-holdem/");
    if (disposed || generation !== notificationGeneration || !preferences.notifications || (document.visibilityState === "visible" && document.hasFocus())) return false;
    if (registration?.active) {
      await registration.showNotification(title, options);
    } else {
      const notification = new Notification(title, options);
      notifications.set(notification, room.id);
      notification.onclick = () => { window.focus(); notification.close(); };
      notification.onclose = () => { notifications.delete(notification); };
      notification.onerror = () => { if (!disposed) notificationError.value = "This browser couldn't display the notification. Keep the room open to see new rounds."; };
    }
    return true;
  }

  async function dismissNotifications(roomId: string): Promise<void> {
    notificationGeneration++;
    for (const [notification, id] of notifications) {
      if (id === roomId) { notification.close(); notifications.delete(notification); }
    }
    try {
      registration ??= await navigator.serviceWorker?.getRegistration("/tools/task-holdem/");
      const active = await registration?.getNotifications({ tag: `task-holdem:${roomId}` });
      active?.forEach(notification => notification.close());
    } catch {
      // Notification cleanup is best-effort when the browser has disabled service workers.
    }
  }

  async function testSound(): Promise<void> {
    await unlock();
    play("round-start", true);
  }

  function stopVoices(): void {
    for (const voice of voices) {
      try { voice.stop(); } catch { /* The audio device may already have stopped this voice. */ }
    }
    voices.clear();
  }

  watch(preferences, () => {
    saveTaskHoldemFeedback(preferences);
    if (master) master.gain.value = preferences.muted ? 0 : preferences.volume;
    if (preferences.muted || !preferences.volume) stopVoices();
  }, { deep: true });

  watch(() => preferences.notifications, (enabled) => {
    notificationGeneration++;
    if (enabled && permission.value === "granted") void prepareNotifications();
    if (!enabled) {
      for (const notification of notifications.keys()) notification.close();
      void dismissWorkerNotifications();
    }
  });

  onMounted(() => {
    refreshPermission();
    if (preferences.notifications && permission.value === "granted") void prepareNotifications();
    document.addEventListener("pointerdown", unlock, { passive: true });
    document.addEventListener("keydown", unlock);
    window.addEventListener("focus", refreshPermission);
  });
  onScopeDispose(() => {
    disposed = true;
    document.removeEventListener("pointerdown", unlock);
    document.removeEventListener("keydown", unlock);
    window.removeEventListener("focus", refreshPermission);
    stopVoices();
    for (const notification of notifications.keys()) notification.close();
    if (context) void closeAudio(context);
  });

  async function closeAudio(audio: AudioContext): Promise<void> {
    try { await audio.close(); } catch { /* The browser may already have closed the device. */ }
  }

  async function dismissWorkerNotifications(): Promise<void> {
    try {
      const active = await registration?.getNotifications();
      active?.filter(notification => notification.tag.startsWith("task-holdem:")).forEach(notification => notification.close());
    } catch {
      // The browser can revoke notification access while the settings panel is open.
    }
  }

  return { preferences, audioStatus, permission, notificationError, enabling, play, notifyRound, dismissNotifications, enableNotifications, testSound };
}
