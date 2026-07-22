export type EventCallback<T = any> = (data: T) => void | Promise<void>;
export type EventFilter<T = any> = (data: T) => boolean;
export type EventMiddleware<T = any> = (data: T, next: (data: T) => void) => void;

export interface EventConnection {
  id: string;
  callback: EventCallback;
  priority: number;
  filter?: EventFilter;
  once: boolean;
}

export interface RemoteEventCallback {
  (player: string, ...args: any[]): void;
}
