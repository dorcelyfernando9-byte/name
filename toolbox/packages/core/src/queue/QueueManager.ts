import { EventBus } from "../events/EventBus";

interface QueueItem {
  id: string;
  data: any;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}

type QueueHandler = (item: QueueItem) => Promise<void>;

interface Queue {
  name: string;
  handler: QueueHandler;
  items: QueueItem[];
  concurrency: number;
  running: number;
  workers: number;
}

export class QueueManager {
  private queues: Map<string, Queue> = new Map();

  create(name: string, handler: QueueHandler, concurrency: number = 1): void {
    this.queues.set(name, {
      name,
      handler,
      items: [],
      concurrency,
      running: 0,
      workers: 0,
    });
  }

  async push(queueName: string, data: any): Promise<string> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue not found: ${queueName}`);

    const item: QueueItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      data,
      status: "pending",
      createdAt: new Date(),
    };

    queue.items.push(item);
    EventBus.emit("queue:item:added", { queue: queueName, item });
    this.processNext(queue);

    return item.id;
  }

  async process(queueName: string, workers: number = 1): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue not found: ${queueName}`);

    queue.workers += workers;
    for (let i = 0; i < workers; i++) {
      this.processNext(queue);
    }
  }

  private async processNext(queue: Queue): Promise<void> {
    if (queue.running >= queue.concurrency || queue.items.length === 0) return;

    const item = queue.items.find(i => i.status === "pending");
    if (!item) return;

    item.status = "processing";
    queue.running++;
    EventBus.emit("queue:item:processing", { queue: queue.name, item });

    try {
      await queue.handler(item);
      item.status = "completed";
      item.processedAt = new Date();
      EventBus.emit("queue:item:completed", { queue: queue.name, item });
    } catch (error: any) {
      item.status = "failed";
      item.error = error.message;
      EventBus.emit("queue:item:failed", { queue: queue.name, item, error: error.message });
    }

    queue.running--;
    this.processNext(queue);
  }

  stats(queueName: string): { pending: number; processing: number; completed: number; failed: number; total: number } {
    const queue = this.queues.get(queueName);
    if (!queue) throw new Error(`Queue not found: ${queueName}`);

    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: queue.items.length,
    };

    for (const item of queue.items) {
      stats[item.status]++;
    }

    return stats;
  }

  list(): string[] {
    return Array.from(this.queues.keys());
  }
}

export const queueManager = new QueueManager();
