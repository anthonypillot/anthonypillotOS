import { readTaskHoldemProfile, saveTaskHoldemProfile } from "../utils/storage";
import type { TaskHoldemProfile } from "../../shared/types/room.type";

export function useTaskHoldemProfile() {
  const profile = ref<TaskHoldemProfile>(import.meta.client ? readTaskHoldemProfile() : { name: "", avatar: "cowboy" });

  function save(value: TaskHoldemProfile): void {
    profile.value = value;
    saveTaskHoldemProfile(value);
  }

  return { profile: readonly(profile), save };
}
