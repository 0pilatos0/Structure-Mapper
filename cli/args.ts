import { parseArgs } from "util";
import { extname, join, resolve } from "path";
import { existsSync } from "fs";
import chalk from "chalk";
import pkg from "../package.json" assert { type: "json" };

export const SUPPORTED_EXTENSIONS = [".json"];

interface CliOptions {
  inputPath?: string;
  outputPath?: string;
  print: boolean;
  stdin: boolean;
  silent: boolean;
  verbose: boolean;
  noColor: boolean;
  version: boolean;
  help: boolean;
}

export function parseCliArgs(): { options: CliOptions } {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      input: { type: "string", short: "i" },
      output: { type: "string", short: "o" },
      print: { type: "boolean", short: "p" },
      stdin: { type: "boolean" },
      help: { type: "boolean", short: "h" },
      verbose: { type: "boolean", short: "v" },
      silent: { type: "boolean", short: "s" },
      version: { type: "boolean" },
      "no-color": { type: "boolean" },
    },
    allowPositionals: true,
  });

  const noColor = values["no-color"] ?? false;
  if (noColor) {
    // disable chalk colors
    (chalk as any).level = 0;
  }

  if (values.version) {
    console.log((pkg as any).version ?? "0.0.0");
    process.exit(0);
  }

  if (
    values.help ||
    (positionals.length === 0 && !values.input && !values.stdin)
  ) {
    console.log(getHelpText());
    process.exit(0);
  }

  const stdin = values.stdin ?? false;
  let inputPath: string | undefined;
  if (!stdin) {
    const supplied = values.input || positionals[0];
    if (!supplied) {
      console.error(chalk.red("Error: input path or --stdin required"));
      process.exit(1);
    }
    inputPath = resolve(supplied);
    validateInputPath(inputPath);
  }

  let outputPath: string | undefined;
  if (!(values.print ?? false)) {
    outputPath = resolve(
      values.output || join(process.cwd(), "output", "structure.json")
    );
    validateOutputPath(outputPath);
  }

  const options: CliOptions = {
    inputPath,
    outputPath,
    print: values.print ?? false,
    stdin,
    silent: values.silent ?? false,
    verbose: values.verbose ?? false,
    noColor,
    version: values.version ?? false,
    help: values.help ?? false,
  };

  return { options };
}

function getHelpText() {
  return `\n${chalk.bold.blue("JSON Structure Analyzer")}
${chalk.dim("Analyze JSON and output its structural schema.")}

${chalk.yellow("Usage:")}
  $ npx structuremapper [options] <file>
  $ bun run structuremapper [options] <file>
  $ cat data.json | structuremapper --stdin --print

${chalk.yellow("Options:")}
  ${chalk.green(
    "-i, --input"
  )}       Input JSON file path (positional also works)
  ${chalk.green(
    "-o, --output"
  )}      Output file path (default: ./output/structure.json)
  ${chalk.green(
    "-p, --print"
  )}       Print structure to stdout instead of writing file
      ${chalk.green("--stdin")}       Read JSON from STDIN (ignore input path)
      ${chalk.green("--no-color")}    Disable colored output
      ${chalk.green("--version")}     Show version number
  ${chalk.green("-v, --verbose")}     Show detailed progress
  ${chalk.green("-s, --silent")}      Suppress all non-error output
  ${chalk.green("-h, --help")}        Show this help message

${chalk.yellow("Examples:")}
  $ structuremapper data.json
  $ structuremapper -i data.json -o schema.json
  $ structuremapper data.json --print
  $ cat data.json | structuremapper --stdin -p
  $ structuremapper data.json -v
`;
}

function validateInputPath(path: string): void {
  if (!path) {
    console.error(chalk.red("Error: Input file path is required"));
    process.exit(1);
  }

  if (!existsSync(path)) {
    console.error(chalk.red(`Error: Input file not found: ${path}`));
    process.exit(1);
  }

  const extension = extname(path).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    console.error(
      chalk.red(
        `Error: Unsupported file type. Supported types: ${SUPPORTED_EXTENSIONS.join(
          ", "
        )}`
      )
    );
    process.exit(1);
  }
}

function validateOutputPath(path: string): void {
  const extension = extname(path).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    console.error(
      chalk.red(`Warning: Output file should have .json extension`)
    );
  }
}
