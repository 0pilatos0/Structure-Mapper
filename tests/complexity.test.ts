import { describe, test, expect } from "bun:test";
import { JsonAnalyzer } from "../utils/jsonAnalyzer";
import { Logger } from "../utils/logger";

const makeAnalyzer = () => new JsonAnalyzer(new Logger(true, false));

describe("JsonAnalyzer.calculateStructureComplexity", () => {
  test("simple flat object", () => {
    const a = makeAnalyzer();
    const structure = a.determineJsonStructure({ a: 1, b: 2 });
    const metrics = a.calculateStructureComplexity(structure);
    expect(metrics).toEqual({ maxDepth: 0, uniqueFields: 2 });
  });

  test("nested object depth", () => {
    const a = makeAnalyzer();
    const structure = a.determineJsonStructure({ a: { b: { c: { d: 1 } } } });
    const metrics = a.calculateStructureComplexity(structure);
    expect(metrics.maxDepth).toBe(3); // a.b.c.d -> depth 3 (excluding root)
    expect(metrics.uniqueFields).toBe(4); // a, a.b, a.b.c, a.b.c.d
  });

  test("array of objects counts inner fields", () => {
    const a = makeAnalyzer();
    const structure = a.determineJsonStructure([
      { x: { y: 1 } },
      { x: { z: 2 } },
    ]);
    const metrics = a.calculateStructureComplexity(structure);
    expect(metrics.maxDepth).toBe(1); // After adjustment logic subtracts 1 from traverse depth
    expect(metrics.uniqueFields).toBe(3); // x, x.y, x.z
  });
});
