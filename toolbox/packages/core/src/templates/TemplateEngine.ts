interface TemplateContext {
  [key: string]: any;
}

export class TemplateEngine {
  private templates: Map<string, string> = new Map();

  define(name: string, template: string): void {
    this.templates.set(name, template);
  }

  render(template: string, context: TemplateContext): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
      const trimmed = expr.trim();
      return this.resolveExpression(trimmed, context);
    });
  }

  renderNamed(name: string, context: TemplateContext): string {
    const template = this.templates.get(name);
    if (!template) throw new Error(`Template not found: ${name}`);
    return this.render(template, context);
  }

  private resolveExpression(expr: string, context: TemplateContext): string {
    if (expr.includes("|")) {
      const parts = expr.split("|").map(p => p.trim());
      let value = this.resolvePath(parts[0], context);
      for (let i = 1; i < parts.length; i++) {
        value = this.applyFilter(value, parts[i]);
      }
      return String(value);
    }

    return String(this.resolvePath(expr, context));
  }

  private resolvePath(path: string, context: TemplateContext): any {
    const parts = path.split(".");
    let value: any = context;
    for (const part of parts) {
      if (value === undefined || value === null) return "";
      value = value[part];
    }
    return value ?? "";
  }

  private applyFilter(value: any, filter: string): any {
    const [name, ...args] = filter.split(":").map(s => s.trim());

    switch (name) {
      case "upper":
        return String(value).toUpperCase();
      case "lower":
        return String(value).toLowerCase();
      case "capitalize":
        return String(value).charAt(0).toUpperCase() + String(value).slice(1);
      case "length":
        return String(value).length;
      case "json":
        return JSON.stringify(value);
      case "default":
        return value || args[0] || "";
      case "truncate":
        const len = parseInt(args[0]) || 100;
        return String(value).length > len ? String(value).slice(0, len) + "..." : value;
      default:
        return value;
    }
  }

  listTemplates(): string[] {
    return Array.from(this.templates.keys());
  }
}

export const templateEngine = new TemplateEngine();
