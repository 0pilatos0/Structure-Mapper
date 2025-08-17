import { describe, test, expect } from "bun:test";
import { parseCliArgs } from "../cli/args";
import { writeFileSync } from "fs";
import { join } from "path";

// Create a temp JSON file for input path tests
const tmpFile = join(process.cwd(), "tmp-cli-test.json");
writeFileSync(tmpFile, JSON.stringify({ a: 1 }));

describe("parseCliArgs", () => {
  test("positional input path", () => {
    const { options } = parseCliArgs({ args: [tmpFile], allowExit: false });
    expect(options.inputPath?.endsWith("tmp-cli-test.json")).toBe(true);
    expect(options.print).toBe(false);
  });

  test("print only mode", () => {
    const { options } = parseCliArgs({
      args: [tmpFile, "--print"],
      allowExit: false,
    });
    expect(options.print).toBe(true);
    expect(options.outputPath).toBeUndefined();
  });

  test("stdin mode requires no path", () => {
    const { options } = parseCliArgs({
      args: ["--stdin", "--print"],
      allowExit: false,
    });
    expect(options.stdin).toBe(true);
    expect(options.inputPath).toBeUndefined();
  });

  test("help mode returns mode flag when no args", () => {
    const { mode } = parseCliArgs({ args: ["--help"], allowExit: false });
    expect(mode).toBe("help");
  });

  test("version mode returns version flag", () => {
    const { mode } = parseCliArgs({ args: ["--version"], allowExit: false });
    expect(mode).toBe("version");
  });

  test("missing input defaults to help mode", () => {
    const { mode } = parseCliArgs({ args: [], allowExit: false });
    expect(mode).toBe("help");
  });
});
