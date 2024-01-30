import chalk from "chalk";

class Logger {
  level: string;

  constructor(level?: string) {
    this.level = process.env.LOG_LEVEL || "info";
  }

  log(message: string, args?: any): void {
    if (this.level !== "silent") {
      const log = `${message}${args ? ` ${args}` : ""}`;
      console.log(log);
    }
  }

  info(message: string, args?: any): void {
    if (this.level !== "silent") {
      const log = `${chalk.blue("ℹ")} ${message}${args ? ` ${args}` : ""}`;
      console.log(log);
    }
  }

  success(message: string, args?: any): void {
    if (this.level !== "silent") {
      const log = `${chalk.green("✔")} ${message}${args ? ` ${args}` : ""}`;
      console.log(log);
    }
  }

  start(message: string, args?: any): void {
    if (this.level !== "silent") {
      const log = `${chalk.blue("▸")} ${message}${args ? ` ${args}` : ""}`;
      console.log(log);
    }
  }

  error(message: string, args?: any): void {
    if (this.level !== "silent") {
      const log = `${chalk.red(`✖ ${message}`)}${args ? ` ${args}` : ""}`;
      console.log(log);
    }
  }

  warn(message: string, args?: any): void {
    if (this.level !== "silent") {
      const log = `${chalk.yellow(`⚠ ${message}`)}${args ? ` ${args}` : ""}`;
      console.log(log);
    }
  }

  debug(message: string, args?: any): void {
    if (this.level !== "silent") {
      if (this.level === "debug") {
        const log = `${chalk.gray("✏")}${message}${args ? ` ${args}` : ""}`;
        console.log(log);
      }
    }
  }
}

export const logger = new Logger("debug");
