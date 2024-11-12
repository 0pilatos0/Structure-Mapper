import { Logger } from "./logger";

export class JsonAnalyzer {
  private logger: Logger;
  private processedItems: number = 0;
  private totalItems: number = 0;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  determineJsonStructure(data: any, depth: number = 0): any {
    if (depth === 0) {
      this.processedItems = 0;
      this.totalItems = this.countTotalItems(data);
      this.logger.verboseLog(`Starting analysis of ${this.totalItems} total items/fields`);
    }

    if (Array.isArray(data)) {
      if (data.length === 0) return "empty[]";

      const structures: any[] = [];
      data.forEach((item, index) => {
        this.processedItems++;
        if (this.logger.verbose && index % 100 === 0 && depth === 0) {
          const progress = ((this.processedItems / this.totalItems) * 100).toFixed(1);
          this.logger.verboseLog(`Processing array item ${index + 1}/${data.length} (${progress}% complete)`);
        }
        structures.push(this.determineJsonStructure(item, depth + 1));
      });

      return [this.mergeStructures(structures)];
    }

    if (data === null) return "null";

    if (typeof data === "object") {
      const structure: Record<string, any> = {};
      const entries = Object.entries(data);

      if (depth === 0 && this.logger.verbose) {
        this.logger.verboseLog(`Found ${entries.length} top-level fields`);
      }

      entries.forEach(([key, value], index) => {
        this.processedItems++;
        if (this.logger.verbose && (index % 1000 === 0 || index === entries.length - 1) && depth === 0) {
          const progress = ((this.processedItems / this.totalItems) * 100).toFixed(1);
          this.logger.verboseLog(`Processing field "${key}" (${index + 1}/${entries.length}, ${progress}% complete)`);
        }
        structure[key] = this.determineJsonStructure(value, depth + 1);
      });

      return structure;
    }

    return typeof data;
  }

  private countTotalItems(data: any): number {
    let count = 1;
    if (Array.isArray(data)) {
      data.forEach((item) => {
        count += this.countTotalItems(item);
      });
    } else if (typeof data === "object" && data !== null) {
      Object.values(data).forEach((value) => {
        count += this.countTotalItems(value);
      });
    }
    return count;
  }

  private mergeStructures(structures: any[]): any {
    if (structures.length === 0) return {};

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
            } else if (typeof merged[key] === "object" && typeof value === "object") {
              merged[key] = this.mergeStructures([merged[key], value]);
            } else {
              merged[key] = value;
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
