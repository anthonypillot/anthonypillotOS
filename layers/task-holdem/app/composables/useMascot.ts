import type { InjectionKey, Ref } from "vue";
import type { TaskHoldemProfile } from "../../shared/types/room.type";
import { createTaskHoldemMascotStage, pickTaskHoldemMascotMotion, taskHoldemMascotMotions, type TaskHoldemMascotMotion, type TaskHoldemMascotMotionKind } from "../utils/mascot-motion";
import type { TaskHoldemMascotPose } from "../utils/mascot-poses";

type Stage = ReturnType<typeof createTaskHoldemMascotStage>;
type MascotOptions = {
  root: Readonly<Ref<SVGSVGElement | null>>;
  avatar: () => TaskHoldemProfile["avatar"];
  active: () => boolean;
  ambient: () => boolean;
};

const stageKey: InjectionKey<Stage> = Symbol("task-holdem-mascots");

export function provideTaskHoldemMascots(): void {
  provide(stageKey, createTaskHoldemMascotStage());
}

export function useTaskHoldemMascot(options: MascotOptions) {
  const stage = inject(stageKey, undefined) ?? createTaskHoldemMascotStage();
  const owner = Symbol("mascot");
  const pose = ref<TaskHoldemMascotPose>("rest");
  const motion = ref<TaskHoldemMascotMotion | "rest">("rest");
  const visible = ref(false);
  const pageVisible = ref(false);
  const reduced = ref(true);
  const running = computed(() => options.active() && visible.value && pageVisible.value && !reduced.value);
  let observer: IntersectionObserver | undefined;
  let media: MediaQueryList | undefined;
  let frameTimer: ReturnType<typeof setTimeout> | undefined;
  let blinkTimer: ReturnType<typeof setTimeout> | undefined;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let previousIdle: TaskHoldemMascotMotion | undefined;

  function stop(): void {
    clearTimeout(frameTimer);
    frameTimer = undefined;
    pose.value = "rest";
    motion.value = "rest";
    stage.release(owner);
  }

  function play(value: TaskHoldemMascotMotion, kind: TaskHoldemMascotMotionKind = "reaction"): boolean {
    if (!running.value || (value === "blink" && motion.value !== "rest")) return false;
    if (value !== "blink" && !stage.claim(owner, stop, kind)) return false;
    clearTimeout(frameTimer);
    motion.value = value;
    const frames = taskHoldemMascotMotions[value];
    function advance(index: number): void {
      const frame = frames[index];
      if (!running.value || !frame) { stop(); return; }
      pose.value = frame.pose;
      frameTimer = setTimeout(() => { advance(index + 1); }, frame.duration);
    }
    advance(0);
    return true;
  }

  function scheduleBlink(): void {
    blinkTimer = setTimeout(() => {
      play("blink");
      scheduleBlink();
    }, 3000 + Math.random() * 4500);
  }

  function scheduleIdle(): void {
    if (!options.ambient()) return;
    idleTimer = setTimeout(() => {
      const next = pickTaskHoldemMascotMotion(previousIdle);
      if (play(next, "ambient")) previousIdle = next;
      scheduleIdle();
    }, 10_000 + Math.random() * 16_000);
  }

  function reset(): void {
    clearTimeout(blinkTimer);
    clearTimeout(idleTimer);
    stop();
    if (!running.value) return;
    scheduleBlink();
    scheduleIdle();
  }

  function updateVisibility(): void {
    pageVisible.value = document.visibilityState !== "hidden";
  }

  function updateMotion(): void {
    reduced.value = media?.matches ?? true;
  }

  watch([running, options.avatar, options.ambient], reset, { flush: "sync" });
  onMounted(() => {
    media = window.matchMedia("(prefers-reduced-motion: reduce)");
    updateMotion();
    updateVisibility();
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    if (typeof IntersectionObserver === "undefined") visible.value = true;
    else {
      observer = new IntersectionObserver(([entry]) => { visible.value = entry?.isIntersecting ?? false; });
      if (options.root.value) observer.observe(options.root.value);
    }
  });
  onScopeDispose(() => {
    clearTimeout(blinkTimer);
    clearTimeout(idleTimer);
    stop();
    observer?.disconnect();
    media?.removeEventListener("change", updateMotion);
    document.removeEventListener("visibilitychange", updateVisibility);
  });

  return { pose, motion, running, play };
}
