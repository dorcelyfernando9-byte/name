import { v4 as uuidv4 } from "uuid";
import { EventCallback, EventConnection, EventFilter, EventMiddleware } from "./types";

export class BindableEvent<T = any> {
  private connections: EventConnection[] = [];
  private middlewares: EventMiddleware<T>[] = [];

  Connect(callback: EventCallback<T>): string {
    const id = uuidv4();
    this.connections.push({ id, callback, priority: 0, once: false });
    this.connections.sort((a, b) => b.priority - a.priority);
    return id;
  }

  ConnectOnce(callback: EventCallback<T>): string {
    const id = uuidv4();
    this.connections.push({ id, callback, priority: 0, once: true });
    this.connections.sort((a, b) => b.priority - a.priority);
    return id;
  }

  Disconnect(id: string): boolean {
    const index = this.connections.findIndex(c => c.id === id);
    if (index !== -1) {
      this.connections.splice(index, 1);
      return true;
    }
    return false;
  }

  SetPriority(id: string, priority: number): void {
    const conn = this.connections.find(c => c.id === id);
    if (conn) {
      conn.priority = priority;
      this.connections.sort((a, b) => b.priority - a.priority);
    }
  }

  SetFilter(id: string, filter: EventFilter<T>): void {
    const conn = this.connections.find(c => c.id === id);
    if (conn) {
      conn.filter = filter;
    }
  }

  UseMiddleware(middleware: EventMiddleware<T>): void {
    this.middlewares.push(middleware);
  }

  Fire(data: T): void {
    let processedData = data;

    const runMiddlewares = (idx: number, d: T) => {
      if (idx < this.middlewares.length) {
        this.middlewares[idx](d, (nextData: T) => {
          runMiddlewares(idx + 1, nextData);
        });
      } else {
        for (const conn of this.connections) {
          if (conn.filter && !conn.filter(d)) continue;
          conn.callback(d);
        }
        this.connections = this.connections.filter(c => !c.once);
      }
    };

    runMiddlewares(0, processedData);
  }

  async Wait(timeout?: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = this.ConnectOnce((data: T) => {
        clearTimeout(timer);
        resolve(data);
      });

      const timer = timeout
        ? setTimeout(() => {
            this.Disconnect(id);
            reject(new Error("Wait timeout exceeded"));
          }, timeout)
        : undefined;
    });
  }

  GetConnectionCount(): number {
    return this.connections.length;
  }

  Clear(): void {
    this.connections = [];
    this.middlewares = [];
  }
}
