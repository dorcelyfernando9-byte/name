import { EventBus, logger } from "@toolbox/core";

export function registerEventCommands(program: any): void {
  const eventCmd = program.command("event").description("Event management");

  eventCmd
    .command("emit <event> [data...]")
    .description("Emit an event")
    .action((event: string, data: string[]) => {
      const payload = data.length > 0 ? data.join(" ") : undefined;
      try {
        EventBus.emit(event, payload ? JSON.parse(payload) : undefined);
        logger.success(`Emitted event: ${event}`);
      } catch {
        EventBus.emit(event, payload);
        logger.success(`Emitted event: ${event}`);
      }
    });

  eventCmd
    .command("listen <event>")
    .description("Listen for an event")
    .action((event: string) => {
      logger.info(`Listening for event: ${event} (press Ctrl+C to stop)`);
      EventBus.on(event, (data) => {
        console.log(`[${event}]`, JSON.stringify(data, null, 2));
      });

      process.on("SIGINT", () => {
        EventBus.off(event, "");
        process.exit();
      });

      setInterval(() => {}, 1000);
    });

  eventCmd
    .command("list")
    .description("List active events")
    .action(() => {
      const events = EventBus.list();
      if (events.length === 0) {
        logger.info("No active events");
      } else {
        events.forEach(e => {
          console.log(`${e} (${EventBus.listenerCount(e)} listeners)`);
        });
      }
    });
}
