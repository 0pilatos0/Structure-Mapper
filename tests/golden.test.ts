import { describe, test, expect } from "bun:test";
import { JsonAnalyzer } from "../utils/jsonAnalyzer";
import { Logger } from "../utils/logger";
import { readFileSync } from "fs";
import { join } from "path";

const fixturePath = join(process.cwd(), "tests", "fixtures", "sample.json");

// Expected merged structural schema for sample.json
const expected = {
  user: {
    id: "number",
    name: "string",
    roles: [
      {
        id: "number",
        label: "string",
        permissions: ["string"],
      },
    ],
  },
  events: [
    {
      type: "string",
      success: "boolean",
      meta: {
        duration: "number",
      },
    },
  ],
  active: "boolean",
  tags: "empty[]",
};

describe("Golden structure snapshot", () => {
  test("fixture sample merges as expected", () => {
    const json = JSON.parse(readFileSync(fixturePath, "utf8"));
    const analyzer = new JsonAnalyzer(new Logger(true, false));
    const structure = analyzer.determineJsonStructure(json);
    expect(structure).toEqual(expected);
  });
});
