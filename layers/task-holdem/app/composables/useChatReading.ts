import type { Ref } from "vue";
import type { TaskHoldemMessage } from "../../shared/types/room.type";

type TaskHoldemChatReadingOptions = {
  messages: () => TaskHoldemMessage[];
  participantId: () => string;
  open: Readonly<Ref<boolean>>;
  list: Readonly<Ref<HTMLElement | null>>;
  end: Readonly<Ref<HTMLElement | null>>;
};

export function useTaskHoldemChatReading(options: TaskHoldemChatReadingOptions) {
  const unread = shallowReactive(new Set<string>());
  const atBottom = ref(true);
  let endVisible = false;
  let observer: IntersectionObserver | undefined;
  let disposed = false;

  function markRead(): void {
    if (options.open.value && atBottom.value && endVisible && document.visibilityState === "visible" && document.hasFocus()) unread.clear();
  }

  function updatePosition(): void {
    const list = options.list.value;
    atBottom.value = !list || list.scrollHeight - list.scrollTop - list.clientHeight <= 16;
    const bounds = options.end.value?.getBoundingClientRect();
    const inViewport = !!bounds && bounds.top >= 0 && bounds.bottom <= window.innerHeight && bounds.left >= 0 && bounds.right <= window.innerWidth;
    if (!observer) endVisible = inViewport;
    if (inViewport) markRead();
  }

  function showLatest(): void {
    const list = options.list.value;
    if (list) list.scrollTop = list.scrollHeight;
    updatePosition();
  }

  watch(options.messages, async (messages, previous) => {
    const retained = new Set(messages.map(message => message.id));
    const previousIds = new Set(previous?.map(message => message.id));
    for (const id of unread) if (!retained.has(id)) unread.delete(id);
    let ownMessage = false;
    for (const message of messages) {
      if (previousIds.has(message.id)) continue;
      if (message.participantId === options.participantId()) ownMessage = true;
      else unread.add(message.id);
    }
    const follow = options.open.value && (atBottom.value || ownMessage);
    await nextTick();
    if (disposed) return;
    if (follow) showLatest();
    else updatePosition();
  }, { immediate: true });

  watch(options.open, async (open) => {
    endVisible = false;
    if (!open) return;
    await nextTick();
    if (!disposed) showLatest();
  });

  watch(options.end, (element, previous) => {
    if (previous) observer?.unobserve(previous);
    endVisible = false;
    if (element) observer?.observe(element);
  }, { flush: "post" });

  onMounted(() => {
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(([entry]) => { endVisible = entry?.isIntersecting ?? false; updatePosition(); }, { threshold: 1 });
      if (options.end.value) observer.observe(options.end.value);
    }
    document.addEventListener("visibilitychange", updatePosition);
    window.addEventListener("focus", updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { passive: true });
  });
  onScopeDispose(() => {
    disposed = true;
    observer?.disconnect();
    document.removeEventListener("visibilitychange", updatePosition);
    window.removeEventListener("focus", updatePosition);
    window.removeEventListener("resize", updatePosition);
    window.removeEventListener("scroll", updatePosition);
  });

  return { unreadCount: computed(() => unread.size), updatePosition, showLatest };
}
