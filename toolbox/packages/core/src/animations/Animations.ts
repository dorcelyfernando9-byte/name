import { Color, Gradient } from "../colors/ColorSystem";

type FrameCallback = (frame: number, total: number) => string;
type AnimationEndCallback = () => void;

interface AnimationOptions {
  frames: number;
  interval: number;
  loop?: boolean;
  onEnd?: AnimationEndCallback;
}

export class ConsoleAnimation {
  private timer: ReturnType<typeof setInterval> | null = null;
  private currentFrame = 0;
  private options: AnimationOptions;
  private renderFn: FrameCallback;
  private running = false;

  constructor(renderFn: FrameCallback, options: Partial<AnimationOptions> = {}) {
    this.renderFn = renderFn;
    this.options = {
      frames: 20,
      interval: 100,
      loop: false,
      ...options,
    };
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.renderFrame();
    this.timer = setInterval(() => this.renderFrame(), this.options.interval);
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.options.onEnd?.();
  }

  private renderFrame(): void {
    const output = this.renderFn(this.currentFrame, this.options.frames);
    process.stdout.write(`\r${output}`);
    this.currentFrame++;

    if (this.currentFrame >= this.options.frames) {
      if (this.options.loop) {
        this.currentFrame = 0;
      } else {
        this.stop();
      }
    }
  }
}

export class Spinner {
  private frames: string[];
  private current = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private message: string = "";

  constructor(message?: string) {
    this.frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    if (message) this.message = message;
  }

  start(message?: string): void {
    if (message) this.message = message;
    if (this.running) return;
    this.running = true;
    this.timer = setInterval(() => this.tick(), 80);
  }

  private tick(): void {
    const frame = this.frames[this.current % this.frames.length];
    process.stdout.write(`\r\x1b[36m${frame}\x1b[0m ${this.message}`);
    this.current++;
  }

  stop(message?: string): void {
    if (this.timer) clearInterval(this.timer);
    process.stdout.write(`\r${" ".repeat(50)}\r`);
    if (message) {
      console.log(`\x1b[32m✓\x1b[0m ${message}`);
    }
    this.running = false;
  }

  fail(message?: string): void {
    if (this.timer) clearInterval(this.timer);
    process.stdout.write(`\r${" ".repeat(50)}\r`);
    if (message) {
      console.log(`\x1b[31m✗\x1b[0m ${message}`);
    }
    this.running = false;
  }

  setMessage(message: string): void {
    this.message = message;
  }
}

type ColorCycleMode = "rainbow" | "breathing" | "sweep" | "pulse";

interface ColorCycleOptions {
  speed?: number;
  saturation?: number;
  lightness?: number;
  fromColor?: Color;
  toColor?: Color;
}

interface AnimationController {
  start(): void;
  stop(): void;
  setText(text: string): void;
  setRunning(running: boolean): void;
}

export class ColorCycle {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private frame = 0;
  private text: string;
  private mode: ColorCycleMode;
  private options: Required<ColorCycleOptions>;
  private speed: number;

  constructor(text: string, mode: ColorCycleMode = "rainbow", options: ColorCycleOptions = {}) {
    this.text = text;
    this.mode = mode;
    this.speed = options.speed ?? 50;
    this.options = {
      speed: this.speed,
      saturation: options.saturation ?? 80,
      lightness: options.lightness ?? 60,
      fromColor: options.fromColor ?? Color.named("cyan"),
      toColor: options.toColor ?? Color.named("blue"),
    };
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.render();
    this.timer = setInterval(() => this.render(), this.speed);
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    process.stdout.write("\r" + " ".repeat(process.stdout.columns || 80) + "\r");
  }

  setText(text: string): void {
    this.text = text;
  }

  setRunning(running: boolean): void {
    if (running && !this.running) this.start();
    else if (!running && this.running) this.stop();
  }

  private render(): void {
    const output = this.colorize(this.text, this.frame);
    process.stdout.write(`\r${output}`);
    this.frame++;
  }

  private colorize(text: string, frame: number): string {
    switch (this.mode) {
      case "rainbow": return this.renderRainbow(text, frame);
      case "breathing": return this.renderBreathing(text, frame);
      case "sweep": return this.renderSweep(text, frame);
      case "pulse": return this.renderPulse(text, frame);
      default: return this.renderRainbow(text, frame);
    }
  }

  private renderRainbow(text: string, frame: number): string {
    return text.split("").map((char, i) => {
      const hue = ((frame * 5 + i * 30) % 360);
      const c = Color.fromHSL(hue, this.options.saturation, this.options.lightness);
      return c.toAnsi() + char;
    }).join("") + "\x1b[0m";
  }

  private renderBreathing(text: string, frame: number): string {
    const t = (Math.sin(frame * 0.05) + 1) / 2;
    const from = this.options.fromColor;
    const to = this.options.toColor;
    const r = Math.round(from["value"].r + (to["value"].r - from["value"].r) * t);
    const g = Math.round(from["value"].g + (to["value"].g - from["value"].g) * t);
    const b = Math.round(from["value"].b + (to["value"].b - from["value"].b) * t);
    const c = new Color(r, g, b);
    return c.toAnsi() + text + "\x1b[0m";
  }

  private renderSweep(text: string, frame: number): string {
    const sw = Math.max(1, Math.floor(text.length * 0.3));
    const pos = frame % (text.length + sw) - sw;
    return text.split("").map((char, i) => {
      const dist = Math.abs(i - pos);
      if (dist < sw) {
        const hue = ((1 - dist / sw) * 240 + 240) % 360;
        const c = Color.fromHSL(hue, this.options.saturation, this.options.lightness);
        return c.toAnsi() + char;
      }
      return "\x1b[90m" + char;
    }).join("") + "\x1b[0m";
  }

  private renderPulse(text: string, frame: number): string {
    const t = (Math.sin(frame * 0.1) + 1) / 2;
    const brightness = Math.round(t * 200 + 55);
    const c = new Color(brightness, brightness, brightness);
    return c.toAnsi() + text + "\x1b[0m";
  }
}

interface MarqueeOptions {
  width?: number;
  speed?: number;
  direction?: "left" | "right";
  loop?: boolean;
  separator?: string;
}

export class Marquee {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private position = 0;
  private text: string;
  private options: Required<MarqueeOptions>;

  constructor(text: string, options: MarqueeOptions = {}) {
    this.text = text;
    this.options = {
      width: options.width ?? 40,
      speed: options.speed ?? 100,
      direction: options.direction ?? "left",
      loop: options.loop ?? true,
      separator: options.separator ?? "   ",
    };
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.render();
    this.timer = setInterval(() => this.render(), this.options.speed);
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    process.stdout.write("\r" + " ".repeat(this.options.width) + "\r");
  }

  setText(text: string): void {
    this.text = text;
  }

  setRunning(running: boolean): void {
    if (running && !this.running) this.start();
    else if (!running && this.running) this.stop();
  }

  private render(): void {
    const w = this.options.width;
    const dir = this.options.direction;
    const content = this.text + this.options.separator;
    const full = content.repeat(Math.ceil((w + content.length) / content.length) + 1);
    let slice: string;
    if (dir === "left") {
      slice = full.slice(this.position % full.length, this.position % full.length + w);
      this.position++;
    } else {
      this.position--;
      const pos = ((this.position % full.length) + full.length) % full.length;
      slice = full.slice(pos, pos + w);
      if (slice.length < w) slice += full.slice(0, w - slice.length);
    }
    process.stdout.write(`\r${slice}`);
  }
}

interface SlideShowOptions {
  interval?: number;
  speed?: number;
  width?: number;
  loop?: boolean;
}

export class SlideShow {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private currentIndex = 0;
  private texts: string[];
  private options: Required<SlideShowOptions>;

  constructor(texts: string[], options: SlideShowOptions = {}) {
    this.texts = texts;
    this.options = {
      interval: options.interval ?? 3000,
      speed: options.speed ?? 2,
      width: options.width ?? 40,
      loop: options.loop ?? true,
    };
  }

  start(): void {
    if (this.running || this.texts.length === 0) return;
    this.running = true;
    this.renderSlide(0);
    this.timer = setInterval(() => {
      const next = (this.currentIndex + 1) % this.texts.length;
      this.transition(this.texts[this.currentIndex], this.texts[next], () => {
        this.currentIndex = next;
        if (!this.options.loop && this.currentIndex >= this.texts.length - 1) {
          this.stop();
        }
      });
    }, this.options.interval);
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    process.stdout.write("\r" + " ".repeat(this.options.width) + "\r");
  }

  setRunning(running: boolean): void {
    if (running && !this.running) this.start();
    else if (!running && this.running) this.stop();
  }

  private transition(fromText: string, toText: string, onDone: () => void): void {
    const w = this.options.width;
    const steps = Math.max(5, Math.floor(this.options.width / 2));
    let step = 0;
    const t = setInterval(() => {
      const progress = step / steps;
      const fromPadded = fromText.padEnd(w, " ").slice(0, w);
      const toPadded = toText.padEnd(w, " ").slice(0, w);
      const offset = Math.round(progress * w);
      const rightPart = fromPadded.slice(offset);
      const leftPart = toPadded.slice(0, offset);
      const visible = leftPart + rightPart;
      process.stdout.write(`\r${visible.slice(0, w)}`);
      step++;
      if (step >= steps) {
        clearInterval(t);
        this.renderSlide(this.currentIndex);
        onDone();
      }
    }, Math.max(10, this.options.interval / steps / 3));
  }

  private renderSlide(idx: number): void {
    const text = this.texts[idx] || "";
    process.stdout.write(`\r${text.padEnd(this.options.width, " ").slice(0, this.options.width)}`);
  }
}

export const animations = {
  loading: (message: string) => {
    const spinner = new Spinner(message);
    spinner.start();
    return spinner;
  },

  progressBar: (current: number, total: number, width: number = 30, color?: Color): string => {
    const percent = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * width);
    const barColor = color?.toAnsi() || "\x1b[36m";
    const bar = `${barColor}${"█".repeat(filled)}${"\x1b[0m"}${"░".repeat(width - filled)}`;
    return `${bar} ${percent}%`;
  },

  pulse: (message: string, duration: number = 3000): Promise<void> => {
    return new Promise((resolve) => {
      const dots = [".", "..", "...", ""];
      let i = 0;
      const timer = setInterval(() => {
        process.stdout.write(`\r${message}${dots[i % dots.length]}  `);
        i++;
      }, 300);
      setTimeout(() => {
        clearInterval(timer);
        process.stdout.write("\r" + " ".repeat(message.length + 4) + "\r");
        resolve();
      }, duration);
    });
  },

  typewriter: (text: string, speed: number = 50): Promise<void> => {
    return new Promise((resolve) => {
      let i = 0;
      const timer = setInterval(() => {
        if (i < text.length) {
          process.stdout.write(text[i]);
          i++;
        } else {
          clearInterval(timer);
          process.stdout.write("\n");
          resolve();
        }
      }, speed);
    });
  },

  rainbow: (text: string): string => {
    const gradient = Gradient.rainbow();
    return text
      .split("")
      .map((char, i) => {
        const pos = i / (text.length - 1 || 1);
        return gradient.getColor(pos).toAnsi() + char;
      })
      .join("") + "\x1b[0m";
  },

  gradient: (text: string, gradient: Gradient = Gradient.sunset()): string => {
    return text
      .split("")
      .map((char, i) => {
        const pos = i / (text.length - 1 || 1);
        return gradient.getColor(pos).toAnsi() + char;
      })
      .join("") + "\x1b[0m";
  },

  colorCycle: (text: string, mode?: ColorCycleMode, options?: ColorCycleOptions): ColorCycle => {
    return new ColorCycle(text, mode, options);
  },

  marquee: (text: string, options?: MarqueeOptions): Marquee => {
    return new Marquee(text, options);
  },

  slideShow: (texts: string[], options?: SlideShowOptions): SlideShow => {
    return new SlideShow(texts, options);
  },
};
