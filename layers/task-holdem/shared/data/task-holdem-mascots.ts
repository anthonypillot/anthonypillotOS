import type { TaskHoldemProfile } from "../types/task-holdem.type";

export const taskHoldemMascots = {
  cowboy: { name: "Cowboy", description: "A steady hand for the next frontier.", color: "#fbbf24" },
  officer: { name: "Police Officer", description: "Keeping every estimate on the right track.", color: "#93c5fd" },
  firefighter: { name: "Firefighter", description: "Calm under pressure, ready to help.", color: "#fb923c" },
  princess: { name: "Princess", description: "Big ideas, a little sparkle.", color: "#f9a8d4" },
  doctor: { name: "Doctor", description: "A thoughtful diagnosis for every task.", color: "#5eead4" },
  robot: { name: "Robot", description: "Processing fresh perspectives.", color: "#7dd3fc" },
} satisfies Record<TaskHoldemProfile["avatar"], { name: string; description: string; color: string }>;
