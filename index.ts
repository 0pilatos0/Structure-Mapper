import { join, dirname } from "path";
import { existsSync, mkdirSync } from "fs";
import ora from "ora";
import chalk from "chalk";
import { parseCliArgs } from "./cli/args";
import { Logger } from "./utils/logger";
import { JsonAnalyzer } from "./utils/jsonAnalyzer";

// Parse CLI arguments
const { inputPath, outputPath, values } = parseCliArgs();

// Create output directory if it doesn't exist
const outputDir = dirname(outputPath);
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Initialize logger and JSON analyzer
const logger = new Logger(values.silent ?? false, values.verbose ?? false);
const jsonAnalyzer = new JsonAnalyzer(logger);

// Main execution
async function main() {
  const spinner = ora();
  try {
    // Read file in chunks and show progress
    if (!values.silent) spinner.start(chalk.blue("Reading input file"));
    const file = Bun.file(inputPath);
    const fileSize = file.size;

    // Show file size warning for large files
    if (fileSize > 100 * 1024 * 1024) {
      // 100MB
      logger.info(chalk.yellow("\n⚠️  Large file detected. This might take a while..."));
    }

    logger.verboseLog(`Total file size: ${formatFileSize(fileSize)}`);

    // Read the file
    let json = await file.text();
    if (!values.silent) spinner.succeed(chalk.green("File read successfully"));

    // Parse JSON with progress
    if (!values.silent) spinner.start(chalk.blue("Parsing JSON"));
    logger.verboseLog("Starting JSON parse...");

    const parseStart = performance.now();
    let data;

    try {
      data = JSON.parse(json);
      const parseTime = ((performance.now() - parseStart) / 1000).toFixed(2);
      logger.verboseLog(`JSON parsed in ${parseTime} seconds`);
      if (!values.silent) spinner.succeed(chalk.green("JSON parsed successfully"));
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw new Error(`Failed to parse JSON: ${e.message}`);
      }
      throw new Error("Failed to parse JSON: Unknown error");
    }

    // Memory cleanup
    json = "";
    global.gc?.();

    // Analyze structure
    if (!values.silent) {
      spinner.start(chalk.blue("Analyzing JSON structure"));
      logger.verboseLog("Starting structure analysis...");
    }

    const startTime = performance.now();
    const structure = jsonAnalyzer.determineJsonStructure(data);
    const endTime = performance.now();

    // Memory cleanup
    data = null;
    global.gc?.();

    // Write output
    if (!values.silent) spinner.start(chalk.blue("Writing results"));
    const outputFile = Bun.file(outputPath);
    await Bun.write(outputFile, JSON.stringify(structure, null, 2));
    if (!values.silent) spinner.succeed(chalk.green("Analysis complete"));

    // Calculate statistics
    const outputStats = await outputFile.size;
    const compressionRatio = ((outputStats / fileSize) * 100).toFixed(1);
    const structureComplexity = jsonAnalyzer.calculateStructureComplexity(structure);
    const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
    const topLevelFields = Object.keys(structure).length;

    // Display results
    logger.info(`\n${chalk.bold.blue("📊 Analysis Summary")}`);
    logger.info(chalk.dim("─".repeat(40)));

    // File Information Section
    logger.info(`\n${chalk.blue.bold("📁 File Information:")}`);
    logger.info(chalk.dim("   Input: ") + chalk.white(inputPath));
    logger.info(chalk.dim("   Output: ") + chalk.white(outputPath));

    // Size Analysis Section
    logger.info(`\n${chalk.blue.bold("📈 Size Analysis:")}`);
    logger.info(chalk.dim("   Input Size: ") + chalk.white(formatFileSize(fileSize)));
    logger.info(chalk.dim("   Output Size: ") + chalk.white(formatFileSize(outputStats)));
    logger.info(
      chalk.dim("   Compression: ") + (Number(compressionRatio) < 50 ? chalk.green(`${compressionRatio}%`) : chalk.yellow(`${compressionRatio}%`))
    );

    // Structure Analysis Section
    logger.info(`\n${chalk.blue.bold("🔍 Structure Analysis:")}`);
    logger.info(chalk.dim("   Max Depth: ") + chalk.white(`${structureComplexity.maxDepth} levels`));
    logger.info(chalk.dim("   Unique Fields: ") + chalk.white(structureComplexity.uniqueFields));
    logger.info(chalk.dim("   Top-level Fields: ") + chalk.white(topLevelFields));

    if (Array.isArray(structure)) {
      logger.info(chalk.dim("   Root Array Items: ") + chalk.white(structure.length.toString()));
    }

    // Performance Section
    logger.info(`\n${chalk.blue.bold("⚡ Performance:")}`);
    logger.info(
      chalk.dim("   Processing Time: ") + (Number(timeTaken) < 1 ? chalk.green(`${timeTaken} seconds`) : chalk.yellow(`${timeTaken} seconds`))
    );

    // Memory Usage
    const memoryUsage = process.memoryUsage();
    logger.info(chalk.dim("   Memory Used: ") + chalk.white(formatFileSize(memoryUsage.heapUsed)));

    // Success Message
    logger.success(`\n${chalk.bold.green("✅ Analysis completed successfully!")}`);

    spinner.stop();
    process.exit(0);
  } catch (error: any) {
    spinner.stop();
    if (error instanceof SyntaxError) {
      logger.error(`\n${chalk.bold.red("❌ Error:")} Invalid JSON format in input file`);
    } else {
      logger.error(`\n${chalk.bold.red("❌ Error:")} ${error.message}`);
    }
    process.exit(1);
  }
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
