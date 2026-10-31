import type { TaskHoldemProfile } from "../../shared/types/task-holdem.type";

type MascotArt = { rows: string[]; colors: Record<string, string> };

const outline = "#172338";
const eyes = "#172338";

export const taskHoldemMascotArt: Record<TaskHoldemProfile["avatar"], MascotArt> = {
  cowboy: {
    colors: { o: outline, t: "#b7793b", l: "#e5b56b", h: "#704731", f: "#efbd8f", s: "#d89566", e: eyes, r: "#ef6461", j: "#60a5fa", d: "#38668e", b: "#805138", a: "#fde68a" },
    rows: [
      ".....oooooo.....",
      "....ottlltto....",
      ".ooottttttttooo.",
      ".ollllllllllllo.",
      "....ohffffho....",
      "....offffffo....",
      "....ofeffefo....",
      "....osffffso....",
      ".....offffo.....",
      "...ooorrrrooo...",
      "..ojjjorrojjjo..",
      "..offojjajoffo..",
      "...oojjjjjjoo...",
      ".....oddddo.....",
      "....obboobbo....",
      "....ooo..ooo....",
    ],
  },
  officer: {
    colors: { o: outline, b: "#2563a8", h: "#382b2a", f: "#bc825e", s: "#986346", e: eyes, j: "#60a5fa", a: "#fde68a", d: "#31527e" },
    rows: [
      ".....oooooo.....",
      "....obbbbbbo....",
      "....obbaabbo....",
      "...oobbbbbboo...",
      "....ohffffho....",
      "....offffffo....",
      "....ofeffefo....",
      "....osffffso....",
      ".....offffo.....",
      "...oobbaabboo...",
      "..ojjjojjojjjo..",
      "..offojjajoffo..",
      "...oojjjjjjoo...",
      ".....oddddo.....",
      "....obboobbo....",
      "....ooo..ooo....",
    ],
  },
  firefighter: {
    colors: { o: outline, r: "#ef4444", a: "#fde68a", h: "#75472f", f: "#dfa17c", s: "#bc7656", e: eyes, y: "#f59e0b", l: "#fef08a", b: "#554640" },
    rows: [
      "......oooo......",
      ".....orrrro.....",
      "....orraarro....",
      "...oorrrrrroo...",
      "....ohffffho....",
      "....offffffo....",
      "....ofeffefo....",
      "....osffffso....",
      ".....offffo.....",
      "...ooyyyyyyoo...",
      "..oyyyoyyoyyyo..",
      "..offoyylyoffo..",
      "...oolllllloo...",
      ".....oyyyyo.....",
      "....obboobbo....",
      "....ooo..ooo....",
    ],
  },
  princess: {
    colors: { o: outline, a: "#fde68a", h: "#754330", f: "#c38768", s: "#a76950", e: eyes, p: "#f28ac2", l: "#fce7f3" },
    rows: [
      "....a..aa..a....",
      "....aa.aa.aa....",
      "....oaaaaaao....",
      "....ohhhhhho....",
      "...ohhffffhho...",
      "...ooffffffoo...",
      "...oofeffefoo...",
      "...oosffffsoo...",
      ".....offffo.....",
      "....oppppppo....",
      "...oppppppppo...",
      "..offppppppffo..",
      "...oppppppppo...",
      "..oppppllppppo..",
      ".oppppllllppppo.",
      ".oooooooooooooo.",
    ],
  },
  doctor: {
    colors: { o: outline, l: "#e2f4f2", a: "#38bdf8", h: "#56382d", f: "#e4ac86", s: "#c68d6c", e: eyes, b: "#36a6a0" },
    rows: [
      ".....oooooo.....",
      "....ollllllo....",
      "....ollaallo....",
      "....ollllllo....",
      "....ohffffho....",
      "....offffffo....",
      "....ofeffefo....",
      "....osffffso....",
      ".....offffo.....",
      "...oollbblloo...",
      "..olllobbolllo..",
      "..offollaloffo..",
      "...oolllllloo...",
      ".....obbbbo.....",
      "....obboobbo....",
      "....ooo..ooo....",
    ],
  },
  robot: {
    colors: { o: outline, b: "#6f91aa", l: "#c8e6ef", r: "#fb7185", e: "#38bdf8" },
    rows: [
      ".......rr.......",
      ".......oo.......",
      "....oooooooo....",
      "...obllllllbo...",
      "..oobllllllboo..",
      "..olblellelblo..",
      "..olblellelblo..",
      "...obllrrllbo...",
      "....oooooooo....",
      "......obbo......",
      "...oobbbbbboo...",
      "..obbobllbobbo..",
      "..ollobrrbollo..",
      "...oobbbbbboo...",
      "....obboobbo....",
      "....ooo..ooo....",
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
