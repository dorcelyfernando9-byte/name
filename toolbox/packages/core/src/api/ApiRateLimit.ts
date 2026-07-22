export class ApiRateLimit {
  private maxRequests: number;
  private interval: number;
  private queue: Array<() => void> = [];
  private currentRequests = 0;
  private intervalHandle?: NodeJS.Timeout;

  constructor(maxRequests: number = 60, intervalMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.interval = intervalMs;
    this.startInterval();
  }

  async wait(): Promise<void> {
    if (this.currentRequests < this.maxRequests) {
      this.currentRequests++;
      return;
    }

    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  private startInterval(): void {
    this.intervalHandle = setInterval(() => {
      this.currentRequests = 0;
      const toRelease = this.queue.splice(0, this.maxRequests);
      toRelease.forEach((resolve) => {
        this.currentRequests++;
        resolve();
      });
    }, this.interval);
  }

  getStatus(): { current: number; max: number; queued: number } {
    return {
      current: this.currentRequests,
      max: this.maxRequests,
      queued: this.queue.length,
    };
  }

  destroy(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
  }
}
