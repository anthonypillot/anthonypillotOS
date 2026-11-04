import type { InjectionKey, Ref } from "vue";
import type { TaskHoldemRoom, TaskHoldemSelf } from "../../shared/types/room.type";
import { getTaskHoldemMascotReactions, type TaskHoldemMascotReaction } from "../utils/mascot-reactions";

type Reactions = { get: (participantId: string) => TaskHoldemMascotReaction | undefined; greet: (participantId: string) => void };
const reactionsKey: InjectionKey<Reactions> = Symbol("task-holdem-mascot-reactions");

export function provideTaskHoldemMascotReactions(room: Readonly<Ref<TaskHoldemRoom | null>>, self: Readonly<Ref<TaskHoldemSelf | null>>, active: () => boolean): void {
  const reactions = shallowReactive(new Map<string, TaskHoldemMascotReaction>());
  const lastHello = new Map<string, number>();

  watch([room, self, active], ([nextRoom, nextSelf, enabled], [previousRoom, previousSelf, wasEnabled]) => {
    if (nextRoom?.id !== previousRoom?.id || nextSelf?.participantId !== previousSelf?.participantId) {
      reactions.clear();
      lastHello.clear();
    }
    if (!enabled) reactions.clear();
    const ids = new Set(nextRoom?.participants.map(participant => participant.id));
    for (const id of reactions.keys()) if (!ids.has(id)) reactions.delete(id);
    for (const id of lastHello.keys()) if (!ids.has(id)) lastHello.delete(id);
    const motions = getTaskHoldemMascotReactions({ room: previousRoom, self: previousSelf, active: wasEnabled }, { room: nextRoom, self: nextSelf, active: enabled });
    for (const [id, motion] of motions) reactions.set(id, { motion, kind: "passive" });
  });

  function greet(participantId: string): void {
    const participant = room.value?.participants.find(member => member.id === participantId);
    if (!active() || !participant?.connected || Date.now() - (lastHello.get(participantId) ?? -Infinity) < 8000) return;
    lastHello.set(participantId, Date.now());
    reactions.set(participantId, { motion: participant.profile.avatar === "robot" ? "moonwalk" : "mischief", kind: "reaction" });
  }

  provide(reactionsKey, { get: participantId => reactions.get(participantId), greet });
}

export function useTaskHoldemMascotReaction(participantId: () => string) {
  const reactions = inject(reactionsKey, undefined);
  return { reaction: computed(() => reactions?.get(participantId())), greet: () => reactions?.greet(participantId()) };
}
