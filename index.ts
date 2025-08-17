import { dirname } from "path";
import { existsSync, mkdirSync } from "fs";
import ora from "ora";
import chalk from "chalk";
import { parseCliArgs } from "./cli/args";
import { Logger } from "./utils/logger";
import { JsonAnalyzer } from "./utils/jsonAnalyzer";

// Parse CLI arguments
const { options } = parseCliArgs();
const { inputPath, outputPath, stdin, print, silent, verbose } = options;

// Create output directory if it doesn't exist
if (outputPath) {
  const outputDir = dirname(outputPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
}

// Initialize logger and JSON analyzer
const logger = new Logger(silent, verbose);
const jsonAnalyzer = new JsonAnalyzer(logger);

// Main execution
async function main() {
  const spinner = ora();
  try {
    if (!silent) {
      spinner.start(
        chalk.blue(stdin ? "Reading from STDIN" : "Reading input file")
      );
    }

    const { json, fileSize } = await readInput(
      stdin,
      inputPath,
      spinner,
      silent
    );

    if (fileSize > 100 * 1024 * 1024) {
      logger.info(
        chalk.yellow("\n⚠️  Large input detected. This might take a while...")
      );
    }
    logger.verboseLog(`Total input size: ${formatFileSize(fileSize)}`);

    if (!silent) {
      spinner.start(chalk.blue("Parsing JSON"));
    }
    logger.verboseLog("Starting JSON parse...");
    const { data, parseTime } = parseJson(json);
    logger.verboseLog(`JSON parsed in ${parseTime.toFixed(2)} seconds`);
    if (!silent) {
      spinner.succeed(chalk.green("JSON parsed successfully"));
    }

    global.gc?.();

    if (!silent) {
      spinner.start(chalk.blue("Analyzing JSON structure"));
    }
    logger.verboseLog("Starting structure analysis...");
    const { structure, timeTaken } = analyzeStructure(data);
    global.gc?.();

    const outputStats = await outputResults(structure, {
      print,
      outputPath,
      silent,
      spinner,
    });

    const compressionRatio =
      fileSize === 0 ? "0" : ((outputStats / fileSize) * 100).toFixed(1);
    const structureComplexity =
      jsonAnalyzer.calculateStructureComplexity(structure);
    const topLevelFields = Object.keys(structure).length;

    displaySummary({
      fileSize,
      outputStats,
      compressionRatio,
      structureComplexity,
      topLevelFields,
      structure,
      timeTaken,
      inputPath,
      stdin,
      print,
      outputPath,
    });

    spinner.stop();
    process.exit(0);
  } catch (error: any) {
    spinner.stop();
    if (error instanceof SyntaxError) {
      logger.error(
        `\n${chalk.bold.red("❌ Error:")} Invalid JSON format in input file`
      );
    } else {
      logger.error(`\n${chalk.bold.red("❌ Error:")} ${error.message}`);
    }
    process.exit(1);
  }
}

function concatUint8(chunks: Uint8Array[]): string {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }
  return Buffer.from(merged).toString("utf8");
}

async function readInput(
  stdin: boolean,
  inputPath: string | undefined,
  spinner: any,
  silent: boolean
): Promise<{ json: string; fileSize: number }> {
  if (stdin) {
    const reader = Bun.stdin.stream().getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    reader.releaseLock();
    const json = concatUint8(chunks);
    const fileSize = Buffer.byteLength(json, "utf8");
    if (!silent) spinner.succeed(chalk.green("Read STDIN successfully"));
    const sanitized = sanitizeStdinJson(json);
    return { json: sanitized, fileSize };
  }
  if (inputPath) {
    const file = Bun.file(inputPath);
    const json = await file.text();
    const fileSize = file.size;
    if (!silent) spinner.succeed(chalk.green("File read successfully"));
    return { json, fileSize };
  }
  throw new Error("No input provided");
}

function parseJson(json: string): { data: any; parseTime: number } {
  const start = performance.now();
  const data = JSON.parse(json);
  const parseTime = (performance.now() - start) / 1000;
  return { data, parseTime };
}

function analyzeStructure(data: any): { structure: any; timeTaken: number } {
  const start = performance.now();
  const structure = jsonAnalyzer.determineJsonStructure(data);
  const timeTaken = (performance.now() - start) / 1000;
  return { structure, timeTaken };
}

async function outputResults(
  structure: any,
  {
    print,
    outputPath,
    silent,
    spinner,
  }: { print: boolean; outputPath?: string; silent: boolean; spinner: any }
): Promise<number> {
  let outputStats = 0;
  if (print) {
    if (!silent) spinner.start(chalk.blue("Outputting results"));
    const outStr = JSON.stringify(structure, null, 2);
    outputStats = Buffer.byteLength(outStr, "utf8");
    process.stdout.write(outStr + "\n");
    if (!silent) spinner.succeed(chalk.green("Printed structure"));
  } else if (outputPath) {
    if (!silent) spinner.start(chalk.blue("Writing results"));
    const outStr = JSON.stringify(structure, null, 2);
    await Bun.write(Bun.file(outputPath), outStr);
    outputStats = Buffer.byteLength(outStr, "utf8");
    if (!silent) spinner.succeed(chalk.green("Analysis complete"));
  }
  return outputStats;
}

function sanitizeStdinJson(raw: string): string {
  let trimmed = raw.trim();
  // PowerShell sometimes wraps the piped literal in single quotes; strip if so and inside looks like JSON
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    const inner = trimmed.slice(1, -1);
    if (inner.startsWith("{") || inner.startsWith("[")) {
      trimmed = inner;
    }
  }
  return trimmed;
}

function displaySummary(params: {
  fileSize: number;
  outputStats: number;
  compressionRatio: string;
  structureComplexity: { maxDepth: number; uniqueFields: number };
  topLevelFields: number;
  structure: any;
  timeTaken: number;
  inputPath?: string;
  stdin: boolean;
  print: boolean;
  outputPath?: string;
}) {
  const {
    fileSize,
    outputStats,
    compressionRatio,
    structureComplexity,
    topLevelFields,
    structure,
    timeTaken,
    inputPath,
    stdin,
    print,
    outputPath,
  } = params;

  logger.info(`\n${chalk.bold.blue("📊 Analysis Summary")}`);
  logger.info(chalk.dim("─".repeat(40)));
  logger.info(`\n${chalk.blue.bold("📁 File Information:")}`);
  if (inputPath) logger.info(chalk.dim("   Input: ") + chalk.white(inputPath));
  logger.info(chalk.dim("   Source: ") + chalk.white(stdin ? "STDIN" : "FILE"));
  if (!print && outputPath)
    logger.info(chalk.dim("   Output: ") + chalk.white(outputPath));
  if (print) logger.info(chalk.dim("   Output: ") + chalk.white("stdout"));
  logger.info(`\n${chalk.blue.bold("📈 Size Analysis:")}`);
  logger.info(
    chalk.dim("   Input Size: ") + chalk.white(formatFileSize(fileSize))
  );
  logger.info(
    chalk.dim("   Output Size: ") + chalk.white(formatFileSize(outputStats))
  );
  logger.info(
    chalk.dim("   Compression: ") +
      (Number(compressionRatio) < 50
        ? chalk.green(`${compressionRatio}%`)
        : chalk.yellow(`${compressionRatio}%`))
  );
  logger.info(`\n${chalk.blue.bold("🔍 Structure Analysis:")}`);
  logger.info(
    chalk.dim("   Max Depth: ") +
      chalk.white(`${structureComplexity.maxDepth} levels`)
  );
  logger.info(
    chalk.dim("   Unique Fields: ") +
      chalk.white(structureComplexity.uniqueFields)
  );
  logger.info(chalk.dim("   Top-level Fields: ") + chalk.white(topLevelFields));
  if (Array.isArray(structure)) {
    logger.info(
      chalk.dim("   Root Array Items: ") +
        chalk.white(structure.length.toString())
    );
  }
  logger.info(`\n${chalk.blue.bold("⚡ Performance:")}`);
  logger.info(
    chalk.dim("   Processing Time: ") +
      (Number(timeTaken) < 1
        ? chalk.green(`${timeTaken.toFixed(2)} seconds`)
        : chalk.yellow(`${timeTaken.toFixed(2)} seconds`))
  );
  const memoryUsage = process.memoryUsage();
  logger.info(
    chalk.dim("   Memory Used: ") +
      chalk.white(formatFileSize(memoryUsage.heapUsed))
  );
  logger.success(
    `\n${chalk.bold.green("✅ Analysis completed successfully!")}`
  );
}

function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

main();
