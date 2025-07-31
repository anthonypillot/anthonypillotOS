import { SquaresPlusIcon, ArrowPathRoundedSquareIcon } from "@heroicons/vue/24/outline";

export interface Tool {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: any; // Vue component
}

export const tools: Tool[] = [
  {
    id: "task-holdem",
    name: "TaskHold'em",
    description: "Poker planning tool for agile teams",
    href: "/tools/task-holdem",
    icon: SquaresPlusIcon,
  },
  {
    id: "github-history-cleaner",
    name: "GitHub History Cleaner",
    description: "Delete all your GitHub project history",
    href: "/tools/github/history-cleaner",
    icon: ArrowPathRoundedSquareIcon,
  },
];