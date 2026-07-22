type ColorFormat = "hex" | "rgb" | "hsl" | "ansi";
type ColorName = string;

interface RGBColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

interface HSLColor {
  h: number;
  s: number;
  l: number;
  a?: number;
}

interface GradientStop {
  color: string;
  position: number;
}

export class Color {
  private value: RGBColor;

  constructor(r: number, g: number, b: number, a: number = 1) {
    this.value = { r: Math.round(r), g: Math.round(g), b: Math.round(b), a };
  }

  static fromHex(hex: string): Color {
    const clean = hex.replace("#", "");
    if (clean.length === 3) {
      const r = parseInt(clean[0] + clean[0], 16);
      const g = parseInt(clean[1] + clean[1], 16);
      const b = parseInt(clean[2] + clean[2], 16);
      return new Color(r, g, b);
    }
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const a = clean.length === 8 ? parseInt(clean.substring(6, 8), 16) / 255 : 1;
    return new Color(r, g, b, a);
  }

  static fromHSL(h: number, s: number, l: number, a: number = 1): Color {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }

    return new Color(
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255),
      a
    );
  }

  static random(): Color {
    return new Color(
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256)
    );
  }

  static randomBright(): Color {
    const h = Math.random() * 360;
    return Color.fromHSL(h, 80, 60);
  }

  static randomPastel(): Color {
    const h = Math.random() * 360;
    return Color.fromHSL(h, 60, 75);
  }

  static named(name: string): Color {
    const colors: Record<string, [number, number, number]> = {
      red: [255, 50, 50],
      green: [50, 255, 50],
      blue: [50, 50, 255],
      yellow: [255, 255, 50],
      cyan: [50, 255, 255],
      magenta: [255, 50, 255],
      orange: [255, 165, 0],
      purple: [128, 0, 128],
      pink: [255, 192, 203],
      white: [255, 255, 255],
      black: [0, 0, 0],
      gray: [128, 128, 128],
      gold: [255, 215, 0],
      teal: [0, 128, 128],
      coral: [255, 127, 80],
      indigo: [75, 0, 130],
      violet: [238, 130, 238],
      lime: [0, 255, 0],
    };
    const c = colors[name.toLowerCase()];
    return c ? new Color(c[0], c[1], c[2]) : Color.random();
  }

  toHex(): string {
    const r = this.value.r.toString(16).padStart(2, "0");
    const g = this.value.g.toString(16).padStart(2, "0");
    const b = this.value.b.toString(16).padStart(2, "0");
    if (this.value.a !== undefined && this.value.a < 1) {
      const a = Math.round(this.value.a * 255).toString(16).padStart(2, "0");
      return `#${r}${g}${b}${a}`;
    }
    return `#${r}${g}${b}`;
  }

  toRGB(): string {
    if (this.value.a !== undefined && this.value.a < 1) {
      return `rgba(${this.value.r}, ${this.value.g}, ${this.value.b}, ${this.value.a})`;
    }
    return `rgb(${this.value.r}, ${this.value.g}, ${this.value.b})`;
  }

  toHSL(): string {
    const r = this.value.r / 255;
    const g = this.value.g / 255;
    const b = this.value.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / d + 2) * 60;
      else h = ((r - g) / d + 4) * 60;
    }

    return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

  toAnsi(): string {
    const r = Math.round(this.value.r / 51);
    const g = Math.round(this.value.g / 51);
    const b = Math.round(this.value.b / 51);
    return `\x1b[38;5;${16 + 36 * r + 6 * g + b}m`;
  }

  toAnsiBackground(): string {
    const r = Math.round(this.value.r / 51);
    const g = Math.round(this.value.g / 51);
    const b = Math.round(this.value.b / 51);
    return `\x1b[48;5;${16 + 36 * r + 6 * g + b}m`;
  }

  toDiscord(): number {
    return (this.value.r << 16) | (this.value.g << 8) | this.value.b;
  }

  lighten(amount: number): Color {
    return new Color(
      Math.min(255, this.value.r + amount),
      Math.min(255, this.value.g + amount),
      Math.min(255, this.value.b + amount),
      this.value.a
    );
  }

  darken(amount: number): Color {
    return new Color(
      Math.max(0, this.value.r - amount),
      Math.max(0, this.value.g - amount),
      Math.max(0, this.value.b - amount),
      this.value.a
    );
  }

  invert(): Color {
    return new Color(
      255 - this.value.r,
      255 - this.value.g,
      255 - this.value.b,
      this.value.a
    );
  }

  mix(other: Color, ratio: number = 0.5): Color {
    return new Color(
      Math.round(this.value.r * (1 - ratio) + other.value.r * ratio),
      Math.round(this.value.g * (1 - ratio) + other.value.g * ratio),
      Math.round(this.value.b * (1 - ratio) + other.value.b * ratio),
      (this.value.a || 1) * (1 - ratio) + (other.value.a || 1) * ratio
    );
  }

  brightness(): number {
    return (this.value.r * 299 + this.value.g * 587 + this.value.b * 114) / 1000;
  }

  isLight(): boolean {
    return this.brightness() > 128;
  }

  isDark(): boolean {
    return !this.isLight();
  }

  contrast(): Color {
    return this.isLight() ? new Color(0, 0, 0) : new Color(255, 255, 255);
  }

  toString(format: ColorFormat = "hex"): string {
    switch (format) {
      case "hex": return this.toHex();
      case "rgb": return this.toRGB();
      case "hsl": return this.toHSL();
      case "ansi": return this.toAnsi();
      default: return this.toHex();
    }
  }
}

export class Gradient {
  private stops: GradientStop[] = [];

  constructor(stops?: GradientStop[]) {
    if (stops) this.stops = stops;
  }

  addStop(color: string, position: number): this {
    this.stops.push({ color, position });
    this.stops.sort((a, b) => a.position - b.position);
    return this;
  }

  getColor(position: number): Color {
    if (this.stops.length === 0) return Color.random();
    if (this.stops.length === 1) return Color.fromHex(this.stops[0].color);
    if (position <= this.stops[0].position) return Color.fromHex(this.stops[0].color);
    if (position >= this.stops[this.stops.length - 1].position) return Color.fromHex(this.stops[this.stops.length - 1].color);

    for (let i = 0; i < this.stops.length - 1; i++) {
      const a = this.stops[i];
      const b = this.stops[i + 1];
      if (position >= a.position && position <= b.position) {
        const ratio = (position - a.position) / (b.position - a.position);
        return Color.fromHex(a.color).mix(Color.fromHex(b.color), ratio);
      }
    }

    return Color.fromHex(this.stops[0].color);
  }

  toCSS(): string {
    const stops = this.stops.map(s => `${s.color} ${s.position * 100}%`).join(", ");
    return `linear-gradient(${stops})`;
  }

  toAnsi(length: number): string[] {
    const colors: string[] = [];
    for (let i = 0; i < length; i++) {
      const pos = i / (length - 1);
      colors.push(this.getColor(pos).toAnsi());
    }
    return colors;
  }

  static rainbow(): Gradient {
    return new Gradient([
      { color: "#FF0000", position: 0 },
      { color: "#FF8800", position: 0.16 },
      { color: "#FFFF00", position: 0.33 },
      { color: "#00FF00", position: 0.5 },
      { color: "#0088FF", position: 0.66 },
      { color: "#8800FF", position: 0.83 },
      { color: "#FF0000", position: 1 },
    ]);
  }

  static sunset(): Gradient {
    return new Gradient([
      { color: "#FF4500", position: 0 },
      { color: "#FF6347", position: 0.33 },
      { color: "#FF69B4", position: 0.66 },
      { color: "#8B008B", position: 1 },
    ]);
  }

  static ocean(): Gradient {
    return new Gradient([
      { color: "#00BFFF", position: 0 },
      { color: "#1E90FF", position: 0.33 },
      { color: "#00008B", position: 0.66 },
      { color: "#191970", position: 1 },
    ]);
  }

  static fire(): Gradient {
    return new Gradient([
      { color: "#FFFF00", position: 0 },
      { color: "#FF8C00", position: 0.3 },
      { color: "#FF4500", position: 0.6 },
      { color: "#8B0000", position: 1 },
    ]);
  }
}

export const colors = {
  rgb: (r: number, g: number, b: number) => new Color(r, g, b),
  hex: (hex: string) => Color.fromHex(hex),
  hsl: (h: number, s: number, l: number) => Color.fromHSL(h, s, l),
  random: () => Color.random(),
  named: (name: string) => Color.named(name),
  rainbow: (position: number) => Gradient.rainbow().getColor(position),
};
