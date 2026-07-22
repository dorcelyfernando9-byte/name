type TransformFunction<T, R = any> = (item: T, index?: number) => R | Promise<R>;

class PipelineStep {
  constructor(
    public transform: TransformFunction<any, any>,
    public name: string = "step"
  ) {}
}

export class StreamPipeline<T = any> {
  private steps: PipelineStep[] = [];
  private source: T[] = [];

  from(data: T[]): this {
    this.source = data;
    return this;
  }

  pipe<R>(transform: TransformFunction<T, R>, name?: string): StreamPipeline<R> {
    const pipeline = new StreamPipeline<R>();
    pipeline.steps = [...this.steps, new PipelineStep(transform as any, name || "pipe")];
    pipeline.source = this.source as any;
    return pipeline;
  }

  filter(predicate: (item: T) => boolean, name?: string): StreamPipeline<T> {
    return this.pipe((item) => predicate(item) ? item : null as any, name || "filter") as unknown as StreamPipeline<T>;
  }

  map<R>(transform: (item: T) => R, name?: string): StreamPipeline<R> {
    return this.pipe(transform, name || "map");
  }

  flatMap<R>(transform: (item: T) => R[], name?: string): StreamPipeline<R> {
    return this.pipe((item) => transform(item) as any, name || "flatMap") as unknown as StreamPipeline<R>;
  }

  take(count: number, name?: string): StreamPipeline<T> {
    const that = this;
    return new StreamPipeline<T>().from(this.source).pipe(function(this: void, item: T, index?: number) {
      if (index! >= count) return null as any;
      return item;
    }, name || "take") as unknown as StreamPipeline<T>;
  }

  skip(count: number, name?: string): StreamPipeline<T> {
    return this.pipe((item: T, index?: number) => {
      if (index! < count) return null as any;
      return item;
    }, name || "skip") as unknown as StreamPipeline<T>;
  }

  async collect(): Promise<any[]> {
    let result: any[] = this.source;

    for (const s of this.steps) {
      const transformed = await Promise.all(
        result.map((item, index) => s.transform(item, index))
      );
      if (s.name === "filter" || s.name.startsWith("pipe") || s.name === "take" || s.name === "skip" || s.name === "unique") {
        result = transformed.filter((r: any) => r !== null && r !== undefined);
      } else {
        result = transformed;
      }
    }

    return result;
  }

  async forEach(callback: (item: T, index?: number) => void | Promise<void>): Promise<void> {
    const results = await this.collect();
    for (let i = 0; i < results.length; i++) {
      await callback(results[i], i);
    }
  }

  async toArray(): Promise<T[]> {
    return this.collect() as Promise<T[]>;
  }

  async first(): Promise<T | undefined> {
    const results = await this.collect();
    return results[0];
  }

  async count(): Promise<number> {
    const results = await this.collect();
    return results.length;
  }
}

export function pipe<T>(data: T[]): StreamPipeline<T> {
  return new StreamPipeline<T>().from(data);
}
