import { describe, test, expect } from "bun:test";
import { JsonAnalyzer } from "../utils/jsonAnalyzer";
import { Logger } from "../utils/logger";

describe("JsonAnalyzer.determineJsonStructure", () => {
  const make = () => new JsonAnalyzer(new Logger(true, false));

  test("primitive types", () => {
    const analyzer = make();
    expect(
      analyzer.determineJsonStructure({ a: 1, b: "x", c: true, d: null })
    ).toEqual({
      a: "number",
      b: "string",
      c: "boolean",
      d: "null",
    });
  });

  test("nested objects", () => {
    const analyzer = make();
    const structure = analyzer.determineJsonStructure({ a: { b: { c: 1 } } });
    expect(structure).toEqual({ a: { b: { c: "number" } } });
  });

  test("empty array handling", () => {
    const analyzer = make();
    const structure = analyzer.determineJsonStructure({ list: [] });
    expect(structure).toEqual({ list: "empty[]" });
  });

  test("array of primitives", () => {
    const analyzer = make();
    const structure = analyzer.determineJsonStructure({ tags: ["a", "b"] });
    expect(structure).toEqual({ tags: ["string"] });
  });

  test("array of objects merged", () => {
    const analyzer = make();
    const input = [{ a: 1 }, { b: 2 }, { a: 5, c: 9 }];
    const structure = analyzer.determineJsonStructure(input);
    expect(structure).toEqual([
      {
        a: "number",
        b: "number",
        c: "number",
      },
    ]);
  });

  test("mixed object field types inside array merge arrays correctly", () => {
    const analyzer = make();
    const input = [
      { a: { x: 1 }, nested: [{ z: 1 }] },
      { a: { y: true }, nested: [{ z: 2 }, { w: "hi" }] },
    ];
    const structure = analyzer.determineJsonStructure(input);
    expect(structure).toEqual([
      {
        a: { x: "number", y: "boolean" },
        nested: [
          {
            z: "number",
            w: "string",
          },
        ],
      },
    ]);
  });

  test("root primitive array", () => {
    const analyzer = make();
    const structure = analyzer.determineJsonStructure([1, 2, 3]);
    expect(structure).toEqual(["number"]);
  });

  test("root empty array", () => {
    const analyzer = make();
    const structure = analyzer.determineJsonStructure([]);
    expect(structure).toBe("empty[]");
  });

  test("union primitive array", () => {
    const analyzer = make();
    const structure = analyzer.determineJsonStructure([1, "a", 2]);
    expect(structure).toEqual(["number|string"]);
  });
});
