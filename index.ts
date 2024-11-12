import { join, dirname } from "path";
import { existsSync, mkdirSync } from "fs";
import ora from "ora";
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
    if (!values.silent) spinner.start("Reading file");

    const file = Bun.file(inputPath);
    const json = await file.text();

    if (!values.silent) spinner.succeed("File read successfully");
    logger.verboseLog(`File size: ${(file.size / 1024).toFixed(2)} KB`);

    if (!values.silent) spinner.start("Parsing JSON");
    const data = JSON.parse(json);
    if (!values.silent) spinner.succeed("JSON parsed successfully");

    if (!values.silent) spinner.start("Analyzing structure");
    const startTime = performance.now();
    const structure = jsonAnalyzer.determineJsonStructure(data);
    const endTime = performance.now();
    if (!values.silent) spinner.succeed("Structure analysis complete");

    if (!values.silent) spinner.start("Writing results");
    const outputFile = Bun.file(outputPath);
    await Bun.write(outputFile, JSON.stringify(structure, null, 2));
    if (!values.silent) spinner.succeed("Results written successfully");

    const outputStats = await outputFile.size;
    const compressionRatio = ((outputStats / file.size) * 100).toFixed(1);
    const structureComplexity = jsonAnalyzer.calculateStructureComplexity(structure);

    logger.success("\nAnalysis Summary:");
    logger.info(`⏱️  Time taken: ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
    logger.info(`📊 Input size: ${(file.size / 1024).toFixed(2)} KB`);
    logger.info(`📊 Output size: ${(outputStats / 1024).toFixed(2)} KB`);
    logger.info(`📈 Compression ratio: ${compressionRatio}%`);
    logger.info(`🔍 Structure depth: ${structureComplexity.maxDepth} levels`);
    logger.info(`🔢 Unique fields: ${structureComplexity.uniqueFields}`);
    logger.info(`📝 Output path: ${outputPath}`);

    spinner.stop();
    process.exit(0);
  } catch (error: any) {
    spinner.stop();
    if (error instanceof SyntaxError) {
      logger.error("\nError: Invalid JSON format in input file");
    } else {
      logger.error(`\nError: ${error.message}`);
    }
    process.exit(1);
  }
}

main();
