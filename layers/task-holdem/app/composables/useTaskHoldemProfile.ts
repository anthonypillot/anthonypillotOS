import { readTaskHoldemProfile, saveTaskHoldemProfile } from "../utils/task-holdem-storage";
import type { TaskHoldemProfile } from "../../shared/types/task-holdem.type";

export function useTaskHoldemProfile() {
  const profile = ref<TaskHoldemProfile>(import.meta.client ? readTaskHoldemProfile() : { name: "", avatar: "dragon" });

  function save(value: TaskHoldemProfile): void {
    profile.value = value;
    saveTaskHoldemProfile(value);
  }

  return { profile: readonly(profile), save };
}
