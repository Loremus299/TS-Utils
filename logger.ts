const C = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
};

function colorForKey(key: string) {
  if (key.startsWith("[DATA ]")) return C.cyan;
  if (key.startsWith("[INFO ]")) return C.green;
  if (key.startsWith("[WARN ]")) return C.yellow;
  if (key.startsWith("[ERROR]")) return C.red;
  if (key.startsWith("[DEBUG]")) return C.magenta;
  if (key.startsWith("[TRACE]")) return C.gray;
  return C.reset;
}

interface LogEntry {
  key: string;
  value: unknown;
  time: number;
}

type LogType = "data" | "error" | "warn" | "info" | "debug" | "trace";

type LogContext = Array<LogEntry>;

export class Logger {
  private readonly context: LogContext;

  public constructor() {
    this.context = [
      {
        key: "RequestId",
        value: globalThis.crypto.randomUUID(),
        time: new Date().getTime(),
      },
    ];
  }

  public push(type: LogType, data: Record<string, unknown>) {
    for (const [k, v] of Object.entries(data)) {
      this.context.push({
        key: `[${type.toUpperCase().padEnd(5)}] ${k}`,
        value: v,
        time: new Date().getTime(),
      });
    }
  }

  public print() {
    let lastTime = this.context[0].time;
    console.log(
      `${C.gray}${this.context[0].time} ID - ${this.context[0].value} ${"-".repeat(77)}${C.reset}`,
    );

    for (const logItem of this.context.slice(1)) {
      const delta = String(logItem.time - lastTime + " ms").padEnd(8);
      const paddedKey = logItem.key.padEnd(20);
      const color = colorForKey(logItem.key);

      console.log(
        `${color}---> ${delta} ${paddedKey} | ${logItem.value}${C.reset}`,
      );

      lastTime = logItem.time;
    }
  }
}
