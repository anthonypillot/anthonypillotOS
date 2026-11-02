import type { TaskHoldemProfile } from "../../shared/types/room.type";

export type TaskHoldemMascotArt = { rows: string[]; colors: Record<string, string> };
export type TaskHoldemMascotPixel = { x: number; y: number; ink: string };
export type TaskHoldemMascotPose = "rest" | "blink" | "look-left" | "look-right" | "nod" | "gesture" | "flourish" | "mischief" | "ponder" | "shrug" | "sip" | "step-left" | "step-right";

type Pixels = Map<string, TaskHoldemMascotPixel>;
type Region = { x: number; y: number; width: number; height: number };
type Offset = { x: number; y: number };
type Patch = { x: number; y: number; rows: string[] };

export const taskHoldemMascotPropColors: Record<string, string> = { C: "#f1f5f9", S: "#477f89", P: "#fef3c7", I: "#6366f1" };

function paint(pixels: Pixels, patch: Patch, mode: "replace" | "overlay" = "replace"): void {
  patch.rows.forEach((row, dy) => {
    [...row].forEach((ink, dx) => {
      if (ink === "." && mode === "overlay") return;
      const x = patch.x + dx;
      const y = patch.y + dy;
      const key = `${x},${y}`;
      if (ink === ".") pixels.delete(key);
      else pixels.set(key, { x, y, ink });
    });
  });
}

function move(pixels: Pixels, region: Region, offset: Offset): void {
  const moving = [...pixels.values()].filter(pixel => pixel.x >= region.x && pixel.x < region.x + region.width && pixel.y >= region.y && pixel.y < region.y + region.height);
  for (const pixel of moving) pixels.delete(`${pixel.x},${pixel.y}`);
  for (const pixel of moving) {
    const x = pixel.x + offset.x;
    const y = pixel.y + offset.y;
    pixels.set(`${x},${y}`, { ...pixel, x, y });
  }
}

function look(pixels: Pixels, avatar: TaskHoldemProfile["avatar"], direction: number): void {
  const eyes = [...pixels.values()].filter(pixel => pixel.ink === "e");
  for (const pixel of eyes) pixels.set(`${pixel.x},${pixel.y}`, { ...pixel, ink: avatar === "robot" ? "l" : "f" });
  for (const pixel of eyes) {
    const x = pixel.x + direction;
    pixels.set(`${x},${pixel.y}`, { ...pixel, x });
  }
}

function raiseHand(pixels: Pixels, avatar: TaskHoldemProfile["avatar"], high: boolean): void {
  const sleeve = { cowboy: "j", officer: "j", firefighter: "y", princess: "p", doctor: "l", robot: "b" }[avatar];
  const hand = avatar === "robot" ? "l" : "f";
  const y = avatar === "cowboy" ? high ? 2 : 3 : avatar === "officer" || avatar === "firefighter" ? 4 : high ? 5 : 7;
  const forearm = Math.max(10, y + 5) - y - 4;
  paint(pixels, { x: 11, y: 10, rows: ["o....", "o....", "o...."] });
  paint(pixels, { x: 11, y, rows: [".oo..", `o${hand}${hand}o.`, `.o${hand}o.`, ...Array.from({ length: forearm }, (_, index) => `..o${index < 2 ? hand : sleeve}o`), `.o${sleeve}${sleeve}o`, `o${sleeve}${sleeve}o.`] }, "overlay");
}

function signature(pixels: Pixels, avatar: TaskHoldemProfile["avatar"], high: boolean): void {
  if (avatar === "cowboy") {
    move(pixels, { x: 0, y: 0, width: 16, height: 4 }, { x: 0, y: high ? -2 : -1 });
    raiseHand(pixels, avatar, high);
  } else if (avatar === "officer") {
    raiseHand(pixels, avatar, true);
    if (high) paint(pixels, { x: 10, y: 4, rows: ["..oo", ".off", "offo"] });
  } else if (avatar === "firefighter") {
    move(pixels, { x: 4, y: 0, width: 8, height: 4 }, { x: high ? 1 : 0, y: high ? 0 : 1 });
    raiseHand(pixels, avatar, true);
  } else if (avatar === "princess") {
    raiseHand(pixels, avatar, high);
    if (high) paint(pixels, { x: 1, y: 1, rows: [".a.", "aaa", ".a."] }, "overlay");
  } else if (avatar === "doctor") {
    paint(pixels, { x: 5, y: 9, rows: ["S....S", "S....S", ".S..S.", "..SS..", "..SC.."] }, "overlay");
    raiseHand(pixels, avatar, high);
  } else {
    move(pixels, { x: 7, y: 0, width: 2, height: 2 }, { x: high ? 1 : -1, y: 0 });
    look(pixels, avatar, high ? 1 : -1);
    raiseHand(pixels, avatar, high);
  }
}

function mischief(pixels: Pixels, avatar: TaskHoldemProfile["avatar"]): void {
  if (avatar === "cowboy" || avatar === "firefighter" || avatar === "princess") {
    move(pixels, { x: 0, y: 0, width: 16, height: avatar === "princess" ? 3 : 4 }, { x: avatar === "cowboy" ? 0 : 1, y: avatar === "cowboy" ? 2 : 1 });
    raiseHand(pixels, avatar, true);
  } else if (avatar === "officer") {
    paint(pixels, { x: 9, y: 10, rows: ["ooooo", "oPPPo", "oIIPo", "oPPPo", "ooooo"] });
  } else if (avatar === "doctor") {
    paint(pixels, { x: 9, y: 9, rows: ["ooooo", "oCCCo", "oCICo", "oCCCo", "ooooo"] });
    paint(pixels, { x: 6, y: 10, rows: ["S..", "S..", ".SS"] }, "overlay");
  } else {
    move(pixels, { x: 7, y: 0, width: 2, height: 2 }, { x: -2, y: 0 });
    look(pixels, avatar, 1);
    raiseHand(pixels, avatar, false);
  }
}

export function getTaskHoldemMascotPixels(art: TaskHoldemMascotArt, avatar: TaskHoldemProfile["avatar"], pose: TaskHoldemMascotPose): TaskHoldemMascotPixel[] {
  const pixels: Pixels = new Map();
  paint(pixels, { x: 0, y: 0, rows: art.rows });
  if (pose === "blink") {
    const eyes = [...pixels.values()].filter(pixel => pixel.ink === "e");
    for (const pixel of eyes) {
      pixels.set(`${pixel.x},${pixel.y}`, { ...pixel, ink: avatar === "robot" ? "l" : "f" });
      if (avatar !== "robot" || pixel.y === 6) paint(pixels, { x: pixel.x, y: avatar === "robot" ? 6 : 7, rows: ["ee"] });
    }
  } else if (pose === "look-left" || pose === "look-right") {
    look(pixels, avatar, pose === "look-left" ? -1 : 1);
  } else if (pose === "nod") {
    move(pixels, { x: 0, y: 0, width: 16, height: 9 }, { x: 0, y: 1 });
  } else if (pose === "gesture" || pose === "flourish") {
    signature(pixels, avatar, pose === "flourish");
  } else if (pose === "mischief") {
    mischief(pixels, avatar);
  } else if (pose === "ponder") {
    const hand = avatar === "robot" ? "l" : "f";
    paint(pixels, { x: 11, y: 10, rows: ["o....", "o....", "o...."] });
    paint(pixels, { x: 8, y: 8, rows: [".oo..", `o${hand}${hand}o.`, ".oo.."] }, "overlay");
    look(pixels, avatar, -1);
  } else if (pose === "shrug") {
    raiseHand(pixels, avatar, false);
    const hand = avatar === "robot" ? "l" : "f";
    paint(pixels, { x: 0, y: 10, rows: ["....o", "....o", "....o"] });
    paint(pixels, { x: 0, y: 7, rows: ["..oo.", `.o${hand}${hand}o`, `.o${hand}${hand}o`, "..oo."] });
  } else if (pose === "sip") {
    paint(pixels, { x: 9, y: 9, rows: [".S.S..", "......", "ooooo.", "oCCCoC", "oCCCoC", ".ooo.."] });
  } else if (pose === "step-left" || pose === "step-right") {
    move(pixels, { x: 0, y: 14, width: 16, height: 2 }, { x: pose === "step-left" ? -1 : 1, y: 0 });
  }
  return [...pixels.values()];
}
