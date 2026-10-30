import type { TaskHoldemProfile } from "../types/task-holdem.type";

export const taskHoldemMascots = {
  dragon: { name: "Jade Dragon", description: "A little courage, a fresh perspective.", color: "#6ee7b7" },
  slime: { name: "Azure Slime", description: "Curious, bouncy, always adapting.", color: "#7dd3fc" },
  phoenix: { name: "Amber Phoenix", description: "Every round is a new beginning.", color: "#fbbf24" },
  spirit: { name: "Violet Spirit", description: "Quietly thinking outside the box.", color: "#c4b5fd" },
  golem: { name: "Moss Golem", description: "Steady hands. Solid estimates.", color: "#bef264" },
  mushroom: { name: "Starshroom", description: "Small ideas can grow into big things.", color: "#f9a8d4" },
} satisfies Record<TaskHoldemProfile["avatar"], { name: string; description: string; color: string }>;
