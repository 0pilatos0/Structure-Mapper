import { parseArgs } from "util";
import { extname, join, resolve } from "path";
import { existsSync } from "fs";
import chalk from "chalk";

export const SUPPORTED_EXTENSIONS = [".json"];

export function parseCliArgs() {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      input: { type: "string", short: "i" },
      output: { type: "string", short: "o" },
      help: { type: "boolean", short: "h" },
      verbose: { type: "boolean", short: "v" },
      silent: { type: "boolean", short: "s" },
    },
    allowPositionals: true,
  });

  if (values.help || (!values.input && positionals.length === 0)) {
    console.log(getHelpText());
    process.exit(0);
  }

  const inputPath = resolve(values.input || positionals[0]);
  validateInputPath(inputPath);

  const outputPath = resolve(values.output || join(process.cwd(), "output", "structure.json"));
  validateOutputPath(outputPath);

  return { inputPath, outputPath, values };
}

function getHelpText() {
  return `
${chalk.bold.blue("JSON Structure Analyzer")}
${chalk.dim("Analyzes JSON files and outputs their structure")}

${chalk.yellow("Usage:")}
  $ bun run index.ts [options]

${chalk.yellow("Options:")}
  ${chalk.green("-i, --input")}    Input JSON file path ${chalk.red("(required)")}
  ${chalk.green("-o, --output")}   Output file path ${chalk.dim("(default: ./output/structure.json)")}
  ${chalk.green("-v, --verbose")}  Show detailed progress
  ${chalk.green("-s, --silent")}   Suppress all output except errors
  ${chalk.green("-h, --help")}     Show this help message

${chalk.yellow("Examples:")}
  $ bun run index.ts -i ./data.json
  $ bun run index.ts -i ./data.json -o ./custom/output.json
  $ bun run index.ts -i ./data.json -v
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
    console.error(chalk.red(`Error: Unsupported file type. Supported types: ${SUPPORTED_EXTENSIONS.join(", ")}`));
    process.exit(1);
  }
}

function validateOutputPath(path: string): void {
  const extension = extname(path).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    console.error(chalk.red(`Warning: Output file should have .json extension`));
  }
}
