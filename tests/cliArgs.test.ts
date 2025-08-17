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

  test("unsupported input extension throws", () => {
    const bad = join(process.cwd(), "bad.txt");
    writeFileSync(bad, "hello");
    expect(() => parseCliArgs({ args: [bad], allowExit: false })).toThrow(
      /Unsupported file type/
    );
  });

  test("nonexistent file path throws", () => {
    const missing = join(process.cwd(), "__nope__does_not_exist.json");
    expect(() => parseCliArgs({ args: [missing], allowExit: false })).toThrow(
      /not found/
    );
  });

  test("no-color flag sets option", () => {
    const { options } = parseCliArgs({
      args: [tmpFile, "--no-color"],
      allowExit: false,
    });
    expect(options.noColor).toBe(true);
  });

  test("output extension warning does not throw", () => {
    const { options } = parseCliArgs({
      args: [tmpFile, "-o", "out.txt"],
      allowExit: false,
    });
    expect(options.outputPath?.endsWith("out.txt")).toBe(true);
  });
});
