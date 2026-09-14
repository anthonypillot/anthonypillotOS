export type ToolId = "task-holdem" | "history-cleaner" | "it-facts";

export type Tool = {
  id: ToolId;
  name: string;
  category: string;
  description: string;
  to: string;
  icon: string;
};
