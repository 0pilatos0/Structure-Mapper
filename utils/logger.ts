import chalk from "chalk";

export class Logger {
  silent: boolean;
  verbose: boolean;
  private startTime: number;

  constructor(silent: boolean, verbose: boolean) {
    this.silent = silent;
    this.verbose = verbose;
    this.startTime = Date.now();
  }

  info(message: string) {
    if (!this.silent) console.log(chalk.blue(message));
  }

  success(message: string) {
    if (!this.silent) console.log(chalk.green(message));
  }

  error(message: string) {
    console.error(chalk.red(message));
  }

  verboseLog(message: string) {
    if (this.verbose && !this.silent) {
      const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
      console.log(chalk.dim(`[${elapsed}s] ${message}`));
    }
  }
}
