import { io, type Socket } from "socket.io-client";
import { taskHoldemProfileSchema, taskHoldemRoomIdSchema } from "#shared/schemas/task-holdem.schema";
import {
  taskHoldemProtocolVersion, taskHoldemSocketPath,
  type TaskHoldemClientEvents, type TaskHoldemJoin, type TaskHoldemMessage, type TaskHoldemPreview,
  type TaskHoldemProfile, type TaskHoldemResult, type TaskHoldemRoom, type TaskHoldemSelf,
  type TaskHoldemServerEvents, type TaskHoldemSnapshot, type TaskHoldemVote,
} from "#shared/types/task-holdem.type";
import { createTaskHoldemToken, readTaskHoldemToken, saveTaskHoldemToken } from "~/utils/task-holdem-storage";
import { getTaskHoldemRoomCues } from "~/utils/task-holdem-feedback";

type RoomSocket = Socket<TaskHoldemServerEvents, TaskHoldemClientEvents>;

export function useTaskHoldemRoom() {
  const route = useRoute();
  const router = useRouter();
  const { profile, save: saveProfile } = useTaskHoldemProfile();
  const feedback = useTaskHoldemFeedback();
  const roomId = ref<string | null>(null);
  const room = shallowRef<TaskHoldemRoom | null>(null);
  const self = shallowRef<TaskHoldemSelf | null>(null);
  const preview = shallowRef<TaskHoldemPreview | null>(null);
  const messages = ref<TaskHoldemMessage[]>([]);
  const error = ref<string | null>(null);
  const invalidLink = ref(false);
  const isConnected = ref(false);
  const isAdmitted = ref(false);
  const isLoading = ref(true);
  const isBusy = ref(false);
  const isSending = ref(false);
  const connection = ref<"connecting" | "connected" | "reconnecting" | "offline">("connecting");
  const clock = ref(Date.now());
  const clockOffset = ref(0);
  let socket: RoomSocket | null = null;
  let token: string | null = null;
  let creation: TaskHoldemJoin | null = null;
  let syncing = false;
  let disposed = false;
  let revokedThroughRevision = -1;

  const isJoined = computed(() => room.value !== null && self.value !== null);
  const canAct = computed(() => isConnected.value && isAdmitted.value && !isLoading.value && !isBusy.value && isJoined.value);
  const canJoin = computed(() => isConnected.value && !isLoading.value && !isBusy.value && !invalidLink.value && (!roomId.value || preview.value !== null));
  const selectedVote = computed(() => self.value?.roundId === room.value?.round.id ? self.value?.vote ?? null : null);
  const currentParticipant = computed(() => room.value?.participants.find(participant => participant.id === self.value?.participantId) ?? null);
  const countdown = computed(() => Math.max(0, Math.ceil(((room.value?.round.revealAt ?? 0) - clock.value - clockOffset.value) / 1000)));

  function updateTarget(): void {
    const parsed = taskHoldemRoomIdSchema.safeParse(route.query.id);
    invalidLink.value = route.query.id !== undefined && !parsed.success;
    roomId.value = parsed.success ? parsed.data : null;
  }

  function acceptsRoom(id: string): boolean {
    return !disposed && id === (roomId.value ?? creation?.roomId);
  }

  function clearMembership(revision = room.value?.revision ?? -1): void {
    if (room.value) void feedback.dismissNotifications(room.value.id);
    revokedThroughRevision = Math.max(revokedThroughRevision, revision);
    if (roomId.value) saveTaskHoldemToken(roomId.value, null);
    token = null;
    isAdmitted.value = false;
    self.value = null;
    room.value = null;
    messages.value = [];
  }

  function applyRoom(value: TaskHoldemRoom): void {
    if (!acceptsRoom(value.id) || value.revision <= revokedThroughRevision || (room.value && value.revision < room.value.revision)) return;
    const previous = room.value;
    room.value = value;
    clockOffset.value = value.serverTime - Date.now();
    preview.value = { id: value.id, participantCount: value.participants.length };
    if (previous && self.value && !isLoading.value) {
      const cues = getTaskHoldemRoomCues(previous, value, self.value.participantId);
      for (const cue of cues) feedback.play(cue);
      if (cues.includes("round-start")) void feedback.notifyRound(value);
    }
  }

  function applySelf(value: TaskHoldemSelf): void {
    if (!acceptsRoom(value.roomId) || value.revision <= revokedThroughRevision || (self.value && value.revision < self.value.revision)) return;
    const previous = self.value;
    self.value = value;
    if (previous && previous.roundId === value.roundId && value.roundId === room.value?.round.id && previous.vote !== value.vote && !isLoading.value) feedback.play(value.vote === null ? "vote-clear" : "vote");
  }

  function applySnapshot(value: TaskHoldemSnapshot): void {
    applyRoom(value.room);
    applySelf(value.self);
  }

  function applyMembership(value: TaskHoldemSnapshot): boolean {
    if (!acceptsRoom(value.room.id) || value.room.revision <= revokedThroughRevision) return false;
    applySnapshot(value);
    isAdmitted.value = currentParticipant.value?.id === value.self.participantId;
    return isAdmitted.value;
  }

  async function request<T>(operation: () => Promise<TaskHoldemResult<T>>, quiet = false): Promise<T | undefined> {
    const activeSocket = socket;
    const connectionId = activeSocket?.id;
    try {
      const result = await operation();
      if (disposed || socket !== activeSocket || activeSocket?.id !== connectionId) return undefined;
      if (result.ok) return result.data;
      if (!quiet || result.error.code === "NOT_JOINED") { error.value = result.error.message; feedback.play("error"); }
      if (result.error.code === "NOT_JOINED") clearMembership();
      if (["STALE_ROUND", "ROUND_LOCKED", "TOPIC_CHANGED"].includes(result.error.code)) void sync();
    } catch {
      if (!disposed && socket === activeSocket && activeSocket?.id === connectionId && !quiet) {
        error.value = "We couldn't confirm that action. Check your connection and try again.";
        feedback.play("error");
      }
    }
    return undefined;
  }

  async function bootstrap(client: RoomSocket): Promise<void> {
    isAdmitted.value = false;
    isLoading.value = true;
    error.value = null;
    try {
      if (creation) {
        const command = creation;
        const value = await request(() => client.emitWithAck("room:create", command));
        if (value && client === socket) await finishJoin(value);
      } else if (roomId.value) {
        const id = roomId.value;
        token ??= readTaskHoldemToken(id);
        const parsed = taskHoldemProfileSchema.safeParse(profile.value);
        if (token && parsed.success) {
          const command = { roomId: id, token, profile: parsed.data };
          const value = await request(() => client.emitWithAck("room:join", command));
          if (value && client === socket) applyMembership(value);
        } else {
          const value = await request(() => client.emitWithAck("room:inspect", { roomId: id }));
          if (value && client === socket) preview.value = value;
        }
      }
    } finally {
      if (client === socket) isLoading.value = false;
    }
  }

  function openSocket(): void {
    socket?.removeAllListeners();
    socket?.disconnect();
    socket = null;
    isConnected.value = false;
    isAdmitted.value = false;
    if (invalidLink.value) {
      error.value = "This invitation link is invalid. Check the link or create a new room.";
      isLoading.value = false;
      connection.value = "offline";
      return;
    }
    connection.value = "connecting";
    const client: RoomSocket = io({
      path: taskHoldemSocketPath,
      transports: ["websocket"],
      auth: { protocolVersion: taskHoldemProtocolVersion },
      autoConnect: false,
      ackTimeout: 8000,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });
    socket = client;
    client.on("connect", () => {
      isConnected.value = true;
      connection.value = "connected";
      void bootstrap(client);
    });
    client.on("disconnect", () => {
      isConnected.value = false;
      isAdmitted.value = false;
      connection.value = client.active ? "reconnecting" : "offline";
    });
    client.on("connect_error", (value) => {
      isConnected.value = false;
      isLoading.value = false;
      connection.value = client.active ? "reconnecting" : "offline";
      error.value = client.active ? "The room connection is unavailable. We'll keep trying to reconnect." : value.message;
    });
    client.on("room:state", applyRoom);
    client.on("room:self", applySelf);
    client.on("room:left", (value) => {
      if (acceptsRoom(value.roomId)) clearMembership(value.revision);
    });
    client.on("chat:message", applyMessage);
    client.connect();
  }

  function applyMessage(value: TaskHoldemMessage): void {
    if (!acceptsRoom(value.roomId) || !self.value || messages.value.some(message => message.id === value.id)) return;
    messages.value = [...messages.value, value].slice(-100);
    if (!isLoading.value) feedback.play(value.participantId === self.value.participantId ? "message-sent" : "message-received");
  }

  async function finishJoin(value: TaskHoldemSnapshot): Promise<void> {
    if (!applyMembership(value)) return;
    const id = value.room.id;
    if (token) saveTaskHoldemToken(id, token);
    roomId.value = id;
    creation = null;
    if (route.query.id !== id) await router.replace({ query: { id } });
  }

  async function join(value: TaskHoldemProfile): Promise<void> {
    const parsed = taskHoldemProfileSchema.safeParse(value);
    if (!socket || !canJoin.value || !parsed.success) return;
    const client = socket;
    const wasJoined = isJoined.value;
    isBusy.value = true;
    error.value = null;
    saveProfile(parsed.data);
    try {
      token ??= roomId.value ? readTaskHoldemToken(roomId.value) ?? createTaskHoldemToken() : createTaskHoldemToken();
      const command = { roomId: roomId.value ?? creation?.roomId ?? crypto.randomUUID(), token, profile: parsed.data };
      saveTaskHoldemToken(command.roomId, token);
      let result: TaskHoldemSnapshot | undefined;
      if (roomId.value) {
        result = await request(() => client.emitWithAck("room:join", command));
      } else {
        creation = command;
        result = await request(() => client.emitWithAck("room:create", command));
      }
      if (result && client === socket) {
        await finishJoin(result);
        if (!wasJoined) feedback.play("joined");
      }
    } finally {
      if (client === socket) isBusy.value = false;
    }
  }

  async function sync(): Promise<void> {
    if (!socket || !isConnected.value || !isAdmitted.value || !isJoined.value || syncing || isBusy.value) return;
    const client = socket;
    syncing = true;
    try {
      const value = await request(() => client.emitWithAck("room:sync", {}), true);
      if (value && client === socket) applySnapshot(value);
    } finally {
      if (client === socket) syncing = false;
    }
  }

  async function act(operation: (client: RoomSocket, roundId: string) => Promise<TaskHoldemResult<TaskHoldemSnapshot>>): Promise<boolean> {
    if (!socket || !room.value || !canAct.value) return false;
    const client = socket;
    const roundId = room.value.round.id;
    isBusy.value = true;
    error.value = null;
    let accepted = false;
    try {
      const value = await request(() => operation(client, roundId));
      if (value && client === socket) {
        applySnapshot(value);
        accepted = true;
      }
    } finally {
      if (client === socket) isBusy.value = false;
    }
    if (!accepted && client === socket) void sync();
    return accepted;
  }

  async function vote(value: TaskHoldemVote): Promise<void> {
    const selected = selectedVote.value === value ? null : value;
    await act((client, roundId) => client.emitWithAck("round:vote", { roundId, value: selected }));
  }

  async function reveal(): Promise<void> {
    await act((client, roundId) => client.emitWithAck("round:reveal", { roundId }));
  }

  async function restart(): Promise<void> {
    await act((client, roundId) => client.emitWithAck("round:restart", { roundId }));
  }

  async function setTopic(topic: string, previousTopic: string | null): Promise<boolean> {
    return act((client, roundId) => client.emitWithAck("round:topic", { roundId, topic, previousTopic }));
  }

  async function loadHistory(before?: number) {
    if (!socket || !isConnected.value || !isAdmitted.value || !isJoined.value) return undefined;
    const client = socket;
    return request(() => client.emitWithAck("room:history", before === undefined ? {} : { before }), true);
  }

  async function leave(): Promise<void> {
    if (!socket || !canAct.value) return;
    const client = socket;
    isBusy.value = true;
    try {
      const value = await request(() => client.emitWithAck("room:leave", {}));
      if (value !== undefined && client === socket) { clearMembership(); feedback.play("left"); }
    } finally {
      if (client === socket) isBusy.value = false;
    }
  }

  async function sendMessage(content: string): Promise<boolean> {
    if (!socket || !canAct.value || isSending.value) return false;
    const client = socket;
    isSending.value = true;
    try {
      const message = await request(() => client.emitWithAck("chat:send", { content }));
      if (message) applyMessage(message);
      return message !== undefined;
    } finally {
      if (client === socket) isSending.value = false;
    }
  }

  function retry(): void {
    if (!socket) openSocket();
    else if (socket.connected) void bootstrap(socket);
    else socket.connect();
  }

  function onVisibility(): void {
    if (document.visibilityState === "visible") {
      void sync();
      if (room.value) void feedback.dismissNotifications(room.value.id);
    }
  }

  updateTarget();
  watch(() => route.query.id, () => {
    updateTarget();
    if (room.value?.id === roomId.value) return;
    if (room.value) void feedback.dismissNotifications(room.value.id);
    room.value = null;
    self.value = null;
    preview.value = null;
    messages.value = [];
    token = null;
    creation = null;
    revokedThroughRevision = -1;
    syncing = false;
    isBusy.value = false;
    isSending.value = false;
    error.value = null;
    isLoading.value = true;
    openSocket();
  });

  let clockTimer: ReturnType<typeof setInterval>;
  let syncTimer: ReturnType<typeof setInterval>;
  onMounted(() => {
    openSocket();
    clockTimer = setInterval(() => { clock.value = Date.now(); }, 250);
    syncTimer = setInterval(() => { void sync(); }, 15_000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", retry);
    window.addEventListener("focus", onVisibility);
  });
  onScopeDispose(() => {
    disposed = true;
    clearInterval(clockTimer);
    clearInterval(syncTimer);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("online", retry);
    window.removeEventListener("focus", onVisibility);
    socket?.removeAllListeners();
    socket?.disconnect();
  });

  return {
    roomId, room, self, profile, preview, messages, error, invalidLink, connection, countdown, feedback,
    isConnected, isAdmitted, isLoading, isBusy, isSending, isJoined, canAct, canJoin, selectedVote, currentParticipant,
    join, vote, reveal, restart, setTopic, loadHistory, leave, sendMessage, retry,
  };
}
