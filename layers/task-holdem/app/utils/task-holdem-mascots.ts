import type { TaskHoldemProfile } from "../../shared/types/task-holdem.type";

type MascotArt = { rows: string[]; colors: Record<string, string> };

const outline = "#172338";
const eyes = "#172338";

export const taskHoldemMascotArt: Record<TaskHoldemProfile["avatar"], MascotArt> = {
  dragon: {
    colors: { o: outline, s: "#238577", b: "#34b897", h: "#6ee7b7", l: "#b8f7d7", a: "#fcd34d", e: eyes, p: "#fb9aa5" },
    rows: [
      "....aa....aa....",
      "...oaao..oaao...",
      "...obboooobbo...",
      "..obhhhhhhhbbo..",
      "..obhlhhhhlhbo..",
      "..obhhhhhhhhbo..",
      "..ohhehhhehhho..",
      "..ohhehhhehhho..",
      "...ohhphphho....",
      ".oo.obhllhbo.oo.",
      "obsoobhllhboosbo",
      "obbsobhllhbobbbo",
      ".osoobhaahbooos.",
      "....obhaahbo....",
      "...obboooobbo...",
      "...ooo....ooo...",
    ],
  },
  slime: {
    colors: { o: outline, s: "#2781b8", b: "#38b6de", h: "#7dd3fc", l: "#d1f5ff", a: "#a5b4fc", e: eyes, p: "#f9a8d4" },
    rows: [
      "................",
      "........l.......",
      ".......lhl......",
      "........l.......",
      ".....oooooo.....",
      "....ohhllhho....",
      "...ohhllhhhho...",
      "..obhhhhhhhhho..",
      "..obhehhhehhho..",
      ".obbhhehhhehhho.",
      ".obbhhphphhhhho.",
      "obbbhhhaaahhhhho",
      "obbbbhhhhhhhhhho",
      "obsbbbbhhhhhhsbo",
      ".osssbbbbbbssso.",
      "..oooooooooooo..",
    ],
  },
  phoenix: {
    colors: { o: outline, s: "#d45e31", b: "#f59e42", h: "#fbbf24", l: "#fef08a", a: "#ef7074", e: eyes, p: "#fdba74" },
    rows: [
      ".......l........",
      "......ohl.......",
      ".....ohhlo......",
      ".....ohhbbo.....",
      "....ohllhhbo....",
      "...ohhehhehbo...",
      "...ohhehhehbo...",
      "lo..ohhahhbo..ol",
      "ohloobhllhboolho",
      "obhlobhllhbolhbo",
      ".obhhbhllhbhhbo.",
      "..obbbhllhbbbo..",
      "...ooohhboooo...",
      ".....obaabo.....",
      "....oaaooaao....",
      ".....oo..oo.....",
    ],
  },
  spirit: {
    colors: { o: outline, s: "#8b6bce", b: "#a78bda", h: "#c4b5fd", l: "#ede9fe", a: "#a5f3fc", e: eyes, p: "#f9a8d4" },
    rows: [
      ".........a......",
      "........aha.....",
      ".....ooooa......",
      "....ohhllho.....",
      "...ohhllhhho....",
      "...ohhhhhhhho...",
      "..obhehhhhehho..",
      "..obhehhhhehho..",
      "..obhhphhphhho..",
      ".oobhhhbbhhhhoo.",
      "obhbhhhhhhhbhhbo",
      ".oobhbhhhhbhhoo.",
      "...obbbhhbbbo...",
      "...obobbbobbo...",
      "....o.obo.oo....",
      ".......o........",
    ],
  },
  golem: {
    colors: { o: outline, s: "#5d7871", b: "#8da89a", h: "#b9cbb1", l: "#dce7ce", a: "#bef264", e: eyes, p: "#6ee7b7" },
    rows: [
      "......aa........",
      ".....aaa..aa....",
      "...ooaaaaoaao...",
      "..obhhahhhahbo..",
      "..obhhllhhhhbo..",
      "..obhehhhhehbo..",
      "..obhehhhhehbo..",
      "..obhhbbbbhhbo..",
      ".ooobhhhhhhbooo.",
      "obboobbaabboolbo",
      "obhoobapabboolbo",
      "obsoobbaabbobsbo",
      ".oo.obbbbbbbooo.",
      "....obsbbsbo....",
      "...obboooobbo...",
      "...ooo....ooo...",
    ],
  },
  mushroom: {
    colors: { o: outline, s: "#b55697", b: "#df78b8", h: "#f9a8d4", l: "#fce7f3", a: "#fde68a", e: eyes, p: "#c4b5fd" },
    rows: [
      "........a.......",
      ".......aaa......",
      ".....oooaao.....",
      "....ohhhhhho....",
      "...ohhllhhhho...",
      "..obhhllhhllho..",
      ".obhhhhhhhllhho.",
      ".obllhhhhhhhhho.",
      "obbbllhhhhhhhbbo",
      ".oooobbbbbboooo.",
      "....ollllplo....",
      "....olellelo....",
      "....olellelo....",
      "....olpplplo....",
      "...ollllllplo...",
      "....oooooooo....",
    ],
  },
};

export function getTaskHoldemMascotPaths(avatar: TaskHoldemProfile["avatar"]) {
  const art = taskHoldemMascotArt[avatar];
  const pixels = new Map<string, string[]>();
  art.rows.forEach((row, y) => {
    [...row].forEach((color, x) => {
      if (!art.colors[color]) return;
      const path = pixels.get(color) ?? [];
      path.push(`M${x} ${y}h1v1h-1z`);
      pixels.set(color, path);
    });
  });
  return [...pixels].map(([color, paths]) => ({ color: art.colors[color], eyes: color === "e", path: paths.join("") }));
}
