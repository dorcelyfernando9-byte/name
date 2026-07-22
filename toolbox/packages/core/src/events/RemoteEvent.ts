import { BindableEvent } from "./BindableEvent";
import { RemoteEventCallback } from "./types";

interface RemoteEventOptions {
  transport?: {
    send: (player: string, eventName: string, ...args: any[]) => void;
    broadcast: (eventName: string, ...args: any[]) => void;
    onMessage: (callback: (player: string, eventName: string, ...args: any[]) => void) => void;
  };
}

export class RemoteEvent {
  public readonly OnServerEvent: BindableEvent;
  public readonly OnClientEvent: BindableEvent;
  private name: string;
  private options: RemoteEventOptions;

  constructor(name: string, options?: RemoteEventOptions) {
    this.name = name;
    this.options = options || {};
    this.OnServerEvent = new BindableEvent();
    this.OnClientEvent = new BindableEvent();

    if (this.options.transport) {
      this.options.transport.onMessage((player, eventName, ...args) => {
        if (eventName === this.name) {
          this.OnServerEvent.Fire({ player, args });
        }
      });
    }
  }

  FireServer(...args: any[]): void {
    if (this.options.transport) {
      this.options.transport.send("server", this.name, ...args);
    }
    this.OnServerEvent.Fire({ player: "client", args });
  }

  FireClient(player: string, ...args: any[]): void {
    if (this.options.transport) {
      this.options.transport.send(player, this.name, ...args);
    }
    this.OnClientEvent.Fire({ player, args });
  }

  FireAllClients(...args: any[]): void {
    if (this.options.transport) {
      this.options.transport.broadcast(this.name, ...args);
    }
    this.OnClientEvent.Fire({ player: "*", args });
  }

  GetName(): string {
    return this.name;
  }

  Destroy(): void {
    this.OnServerEvent.Clear();
    this.OnClientEvent.Clear();
  }
}
