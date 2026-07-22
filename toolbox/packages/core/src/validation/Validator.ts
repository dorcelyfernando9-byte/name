export class Validator {
  static email(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  static url(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  static number(value: any): boolean {
    return typeof value === "number" && !isNaN(value);
  }

  static string(value: any): boolean {
    return typeof value === "string";
  }

  static boolean(value: any): boolean {
    return typeof value === "boolean";
  }

  static array(value: any): boolean {
    return Array.isArray(value);
  }

  static object(value: any): boolean {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  static minLength(value: string, min: number): boolean {
    return value.length >= min;
  }

  static maxLength(value: string, max: number): boolean {
    return value.length <= max;
  }

  static min(value: number, min: number): boolean {
    return value >= min;
  }

  static max(value: number, max: number): boolean {
    return value <= max;
  }

  static regex(pattern: RegExp | string, value: string): boolean {
    const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;
    return regex.test(value);
  }

  static schema(schema: Record<string, string>, data: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [key, type] of Object.entries(schema)) {
      const value = data[key];

      switch (type) {
        case "string":
          if (!this.string(value)) errors.push(`${key} must be a string`);
          break;
        case "number":
          if (!this.number(value)) errors.push(`${key} must be a number`);
          break;
        case "boolean":
          if (!this.boolean(value)) errors.push(`${key} must be a boolean`);
          break;
        case "email":
          if (!this.email(value)) errors.push(`${key} must be a valid email`);
          break;
        case "url":
          if (!this.url(value)) errors.push(`${key} must be a valid URL`);
          break;
        case "array":
          if (!this.array(value)) errors.push(`${key} must be an array`);
          break;
        case "object":
          if (!this.object(value)) errors.push(`${key} must be an object`);
          break;
        default:
          if (typeof value !== type) errors.push(`${key} must be of type ${type}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  static uuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  static ip(value: string): boolean {
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(value);
  }

  static hexColor(value: string): boolean {
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
  }
}
