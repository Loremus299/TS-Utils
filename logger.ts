const C = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

function colorForKey(key: string) {
  if (key.startsWith("[DATA ]")) return C.cyan;
  if (key.startsWith("[ERROR]")) return C.red;
  if (key.startsWith("[WARN ]")) return C.yellow;
  if (key.startsWith("[INFO ]")) return C.green;
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

  private push(type: LogType, data: Record<string, unknown>) {
    for (const [k, v] of Object.entries(data)) {
      this.context.push({
        key: `[${type.toUpperCase().padEnd(5)}] ${k}`,
        value: v,
        time: new Date().getTime(),
      });
    }
  }

  public data(data: Record<string, unknown>) {
    this.push("data", data);
  }

  public error(data: Record<string, unknown>) {
    this.push("error", data);
  }

  public warn(data: Record<string, unknown>) {
    this.push("warn", data);
  }

  public info(data: Record<string, unknown>) {
    this.push("info", data);
  }

  public debug(data: Record<string, unknown>) {
    this.push("debug", data);
  }

  public trace(data: Record<string, unknown>) {
    this.push("trace", data);
  }

  public print() {
    let lastTime = this.context[0].time;
    const time = new Date(this.context[0].time);
    const pad = (n: number) => String(n).padStart(2, "0");
    const formattedTime =
      `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}` +
      ` ${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}` +
      `.${pad(time.getMilliseconds())}`;

    const lastLogItem = this.context[this.context.length - 1];

    console.log(
      `${C.blue}┌─ ${this.context[0].value} @ ${formattedTime} ${"─".repeat(50)}${C.reset}`,
    );

    for (const logItem of this.context.slice(1)) {
      const delta = ("⏱ " + String(logItem.time - lastTime)).padEnd(8);
      const paddedKey = logItem.key.padEnd(30);
      const color = colorForKey(logItem.key);
      const symbol = logItem === lastLogItem ? "└─" : "├─";

      console.log(
        `${color}${symbol} ${delta} ${paddedKey} │ ${logItem.value}${C.reset}`,
      );

      lastTime = logItem.time;
    }
    console.log("\n");
  }
}
