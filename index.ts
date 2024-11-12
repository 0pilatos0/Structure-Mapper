import { join, extname } from "path";
import { existsSync, mkdirSync } from "fs";
import { parseArgs } from "util";
import chalk from "chalk";
import ora from "ora";

// Define supported file extensions
const SUPPORTED_EXTENSIONS = [".json"];

// CLI argument parsing
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

// Help text with colored output
const helpText = `
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

// Validation functions
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

// Logger utility
const logger = {
  info: (message: string) => {
    if (!values.silent) console.log(chalk.blue(message));
  },
  success: (message: string) => {
    if (!values.silent) console.log(chalk.green(message));
  },
  error: (message: string) => console.error(chalk.red(message)),
  verbose: (message: string) => {
    if (values.verbose && !values.silent) console.log(chalk.dim(message));
  },
};

// Show help and exit if requested or if no input file provided
if (values.help || (!values.input && positionals.length === 0)) {
  console.log(helpText);
  process.exit(0);
}

// Get and validate paths
const inputPath = values.input || positionals[0];
validateInputPath(inputPath);

const outputPath = values.output || join(process.cwd(), "output", "structure.json");
validateOutputPath(outputPath);

// Create output directory if it doesn't exist
const outputDir = outputPath.split("/").slice(0, -1).join("/");
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Function to merge object structures
function mergeStructures(structures: any[]): any {
  if (structures.length === 0) return {};

  // If all structures are primitive types or "empty[]", return the most specific one
  if (structures.every((s) => typeof s !== "object" || s === "empty[]")) {
    const nonEmptyStructures = structures.filter((s) => s !== "empty[]");
    return nonEmptyStructures.length > 0 ? nonEmptyStructures[0] : "empty[]";
  }

  const merged: Record<string, any> = {};
  structures.forEach((struct) => {
    if (typeof struct === "object" && struct !== null) {
      Object.entries(struct).forEach(([key, value]) => {
        if (!(key in merged)) {
          merged[key] = value;
        } else {
          // If either current or new value is an array, merge them
          const currentIsArray = Array.isArray(merged[key]);
          const newIsArray = Array.isArray(value);

          if (currentIsArray || newIsArray) {
            // Convert both to arrays if they aren't already
            const currentArray = currentIsArray ? merged[key] : [merged[key]];
            const newArray = newIsArray ? value : [value];

            // Combine and merge the arrays
            const combinedArrays = [...currentArray, ...newArray].filter((item) => item !== "empty[]");
            if (combinedArrays.length > 0) {
              merged[key] = [mergeStructures(combinedArrays)];
            } else {
              merged[key] = "empty[]";
            }
          } else {
            // For non-array values, keep the existing structure
            merged[key] = merged[key];
          }
        }
      });
    }
  });
  return merged;
}

// Enhanced structure determination with progress tracking
function determineJsonStructure(data: any, depth: number = 0): any {
  if (Array.isArray(data)) {
    if (data.length === 0) return "empty[]";

    const structures: any[] = [];
    data.forEach((item, index) => {
      if (values.verbose && index % 100 === 0 && depth === 0) {
        logger.verbose(`Processing item ${index + 1}/${data.length}`);
      }
      structures.push(determineJsonStructure(item, depth + 1));
    });

    return [mergeStructures(structures)];
  }

  if (data === null) return "null";

  if (typeof data === "object") {
    const structure: Record<string, any> = {};
    const entries = Object.entries(data);

    entries.forEach(([key, value], index) => {
      if (values.verbose && index % 1000 === 0 && depth === 0) {
        logger.verbose(`Processing field: ${key}`);
      }
      structure[key] = determineJsonStructure(value, depth + 1);
    });

    return structure;
  }

  return typeof data;
}

// Main execution
async function main() {
  const spinner = ora();
  try {
    if (!values.silent) spinner.start("Reading file");

    const file = Bun.file(inputPath);
    const json = await file.text();

    if (!values.silent) spinner.succeed("File read successfully");
    logger.verbose(`File size: ${(file.size / 1024).toFixed(2)} KB`);

    if (!values.silent) spinner.start("Parsing JSON");
    const data = JSON.parse(json);
    if (!values.silent) spinner.succeed("JSON parsed successfully");

    if (!values.silent) spinner.start("Analyzing structure");
    const startTime = performance.now();
    const structure = determineJsonStructure(data);
    const endTime = performance.now();
    if (!values.silent) spinner.succeed("Structure analysis complete");

    if (!values.silent) spinner.start("Writing results");
    const outputFile = Bun.file(outputPath);
    await Bun.write(outputFile, JSON.stringify(structure, null, 2));
    if (!values.silent) spinner.succeed("Results written successfully");

    logger.success("\nAnalysis Summary:");
    logger.info(`⏱️  Time taken: ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
    logger.info(`📊 Input size: ${(file.size / 1024).toFixed(2)} KB`);
    logger.info(`📝 Output: ${outputPath}`);

    // Ensure spinner is stopped and process exits cleanly
    spinner.stop();
    process.exit(0);
  } catch (error: any) {
    // Stop spinner before showing error
    spinner.stop();

    if (error instanceof SyntaxError) {
      logger.error("\nError: Invalid JSON format in input file");
    } else {
      logger.error(`\nError: ${error.message}`);
    }
    process.exit(1);
  }
}

// Wrap main execution in process error handlers
process.on("uncaughtException", (error) => {
  console.error("\nFatal error:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("\nUnhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

main();
