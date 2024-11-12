import { Logger } from "./logger";

export class JsonAnalyzer {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  determineJsonStructure(data: any, depth: number = 0): any {
    if (Array.isArray(data)) {
      if (data.length === 0) return "empty[]";

      const structures: any[] = [];
      data.forEach((item, index) => {
        if (this.logger.verbose && index % 100 === 0 && depth === 0) {
          this.logger.verboseLog(`Processing item ${index + 1}/${data.length}`);
        }
        structures.push(this.determineJsonStructure(item, depth + 1));
      });

      return [this.mergeStructures(structures)];
    }

    if (data === null) return "null";

    if (typeof data === "object") {
      const structure: Record<string, any> = {};
      const entries = Object.entries(data);

      entries.forEach(([key, value], index) => {
        if (this.logger.verbose && index % 1000 === 0 && depth === 0) {
          this.logger.verboseLog(`Processing field: ${key}`);
        }
        structure[key] = this.determineJsonStructure(value, depth + 1);
      });

      return structure;
    }

    return typeof data;
  }

  private mergeStructures(structures: any[]): any {
    if (structures.length === 0) return {};

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
            const currentIsArray = Array.isArray(merged[key]);
            const newIsArray = Array.isArray(value);

            if (currentIsArray || newIsArray) {
              const currentArray = currentIsArray ? merged[key] : [merged[key]];
              const newArray = newIsArray ? value : [value];

              const combinedArrays = [...currentArray, ...newArray].filter((item) => item !== "empty[]");
              if (combinedArrays.length > 0) {
                merged[key] = [this.mergeStructures(combinedArrays)];
              } else {
                merged[key] = "empty[]";
              }
            } else {
              merged[key] = merged[key];
            }
          }
        });
      }
    });
    return merged;
  }

  calculateStructureComplexity(structure: any): { maxDepth: number; uniqueFields: number } {
    const uniqueFields = new Set<string>();

    function traverse(obj: any, depth: number = 0): number {
      if (!obj || typeof obj !== "object") {
        return depth;
      }

      let maxDepth = depth;

      if (Array.isArray(obj)) {
        if (obj.length > 0) {
          return traverse(obj[0], depth);
        }
        return depth;
      }

      for (const [key, value] of Object.entries(obj)) {
        uniqueFields.add(key);
        if (typeof value === "object" && value !== null) {
          const currentDepth = traverse(value, depth + 1);
          maxDepth = Math.max(maxDepth, currentDepth);
        }
      }

      return maxDepth;
    }

    const maxDepth = traverse(structure);
    return {
      maxDepth,
      uniqueFields: uniqueFields.size,
    };
  }
}
