import chalk from "chalk";

export class Logger {
  silent: boolean;
  verbose: boolean;

  constructor(silent: boolean, verbose: boolean) {
    this.silent = silent;
    this.verbose = verbose;
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
    if (this.verbose && !this.silent) console.log(chalk.dim(message));
  }
}
