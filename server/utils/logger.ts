import chalk from "chalk";

class Logger {
  level: string;

  constructor(level?: string) {
    this.level = process.env.LOG_LEVEL || "info";
  }

  log(message: string, args?: any): void {
    if (this.shouldPrintLog()) {
      console.log(this.formatLog(message, args));
    }
  }

  info(message: string, args?: any): void {
    if (this.shouldPrintLog()) {
      console.log(this.formatLog(`${chalk.blue("ℹ")} ${message}`, args));
    }
  }

  success(message: string, args?: any): void {
    if (this.shouldPrintLog()) {
      console.log(this.formatLog(`${chalk.green("✔")} ${message}`, args));
    }
  }

  start(message: string, args?: any): void {
    if (this.shouldPrintLog()) {
      console.log(this.formatLog(`${chalk.blue("▸")} ${message}`, args));
    }
  }

  error(message: string, args?: any): void {
    if (this.shouldPrintLog()) {
      console.log(this.formatLog(`${chalk.red(`✖ ${message}`)}`, args));
    }
  }

  warn(message: string, args?: any): void {
    if (this.shouldPrintLog()) {
      console.log(this.formatLog(`${chalk.yellow(`⚠ ${message}`)}`, args));
    }
  }

  debug(message: string, args?: any): void {
    if (this.shouldPrintLog() && this.level === "debug") {
      console.log(this.formatLog(`${chalk.gray("✏")}${message}`, args));
    }
  }

  private shouldPrintLog(): boolean {
    return this.level !== "silent";
  }

  private formatLog(message: string, args?: any): string {
    return args ? `${message}. Details: ${args}` : message;
  }
}

export const logger = new Logger("debug");
