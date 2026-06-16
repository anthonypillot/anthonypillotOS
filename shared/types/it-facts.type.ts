export type ItFact = {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
  source?: string;
};

export const itFactsApplication = {
  id: "it-facts",
  name: "IT Facts",
  description:
    "IT Facts is a solo mini-game about the IT universe. Read a statement, decide whether it is true or false, and see how well you know the history of software, hardware, and the companies that shaped them.",
  path: "/tools/it-facts/application",
};
