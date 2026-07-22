import { BindableEvent } from "./BindableEvent";
import { EventCallback } from "./types";

export class EventBusClass {
  private events: Map<string, BindableEvent> = new Map();

  private getOrCreate(event: string): BindableEvent {
    if (!this.events.has(event)) {
      this.events.set(event, new BindableEvent());
    }
    return this.events.get(event)!;
  }

  on(event: string, callback: EventCallback): string {
    return this.getOrCreate(event).Connect(callback);
  }

  once(event: string, callback: EventCallback): string {
    return this.getOrCreate(event).ConnectOnce(callback);
  }

  off(event: string, id: string): boolean {
    const ev = this.events.get(event);
    if (ev) return ev.Disconnect(id);
    return false;
  }

  emit(event: string, data?: any): void {
    const ev = this.events.get(event);
    if (ev) ev.Fire(data);
  }

  wait(event: string, timeout?: number): Promise<any> {
    return this.getOrCreate(event).Wait(timeout);
  }

  clear(event?: string): void {
    if (event) {
      const ev = this.events.get(event);
      if (ev) ev.Clear();
    } else {
      for (const ev of this.events.values()) {
        ev.Clear();
      }
      this.events.clear();
    }
  }

  list(): string[] {
    return Array.from(this.events.keys());
  }

  listenerCount(event: string): number {
    const ev = this.events.get(event);
    return ev ? ev.GetConnectionCount() : 0;
  }
}

export const EventBus = new EventBusClass();
