import { beforeEach, describe, expect, test } from "vitest";
import { taskHoldemAvatarSchema, taskHoldemProfileSchema } from "../../../shared/schemas/task-holdem.schema";
import { taskHoldemMascots } from "../../../shared/data/task-holdem-mascots";
import { getTaskHoldemMascotPaths, taskHoldemMascotArt } from "../../../app/utils/task-holdem-mascots";
import { readTaskHoldemProfile, saveTaskHoldemProfile } from "../../../app/utils/task-holdem-storage";

beforeEach(() => localStorage.clear());

describe("Task Hold'em character catalog", () => {
  test("offers exactly the six requested characters with distinct pixel art", () => {
    expect(taskHoldemAvatarSchema.options).toEqual(["cowboy", "officer", "firefighter", "princess", "doctor", "robot"]);
    expect(Object.values(taskHoldemMascots).map(character => character.name)).toEqual(["Cowboy", "Police Officer", "Firefighter", "Princess", "Doctor", "Robot"]);
    expect(new Set(Object.values(taskHoldemMascotArt).map(art => JSON.stringify(art.rows))).size).toBe(6);
  });

  test.each(taskHoldemAvatarSchema.options)("%s has complete 16-by-16 artwork and animated eyes", (avatar) => {
    const art = taskHoldemMascotArt[avatar];
    expect(art.rows).toHaveLength(16);
    for (const row of art.rows) {
      expect(row).toHaveLength(16);
      for (const pixel of row) {
        if (pixel !== ".") expect(art.colors[pixel]).toMatch(/^#[a-f0-9]{6}$/i);
      }
    }
    const paths = getTaskHoldemMascotPaths(avatar);
    expect(paths.some(part => part.eyes && part.path.length > 0)).toBe(true);
    expect(paths.every(part => part.color && part.path.length > 0)).toBe(true);
    const profile = { name: "Alice", avatar };
    expect(taskHoldemProfileSchema.parse(profile)).toEqual(profile);
    saveTaskHoldemProfile(profile);
    expect(readTaskHoldemProfile()).toEqual(profile);
  });

  test("uses the cowboy when no valid profile is remembered", () => {
    expect(readTaskHoldemProfile()).toEqual({ name: "", avatar: "cowboy" });
    localStorage.setItem("task-holdem:v3:profile", JSON.stringify({ name: "Alice", avatar: "missing-character" }));
    expect(readTaskHoldemProfile()).toEqual({ name: "", avatar: "cowboy" });
  });
});
