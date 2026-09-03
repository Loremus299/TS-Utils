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
  value: string;
  time: number;
}

type LogType = "data" | "error" | "warn" | "info" | "debug" | "trace";

type LogContext = [Array<LogEntry>, Array<Logger>, number];

export class Logger {
  private readonly context: LogContext;

  /**
   * Construct a new logger context.
   **/
  public constructor(nest?: number) {
    this.context = [
      [
        {
          key: "RequestId",
          value: globalThis.crypto.randomUUID(),
          time: new Date().getTime(),
        },
      ],
      [],
      nest ?? 0,
    ];
  }

  private push(type: LogType, data: Record<string, unknown>) {
    for (const [k, v] of Object.entries(data)) {
      this.context[0].push({
        key: `[${type.toUpperCase().padEnd(5)}] ${k}`,
        value: JSON.stringify(v),
        time: new Date().getTime(),
      });
    }
  }

  /**
   * Creates a new logger instance and appends it to current logContext with a deeper nesting.
   **/
  public nest(title?: string) {
    const child = new Logger(this.context[2] + 1);
    this.context[1].push(child);
    this.data({
      "sub-logger": `${title ? `${title}` : child.id} @ nest ${child.context[2]}`,
    });
    return child;
  }

  /**
   * Logs user-provided data or input associated with an operation.
   **/
  public data(data: Record<string, unknown>) {
    this.push("data", data);
  }

  /**
   * Logs an error.
   **/
  public error(data: Record<string, unknown>) {
    this.push("error", data);
  }

  /**
   * Logs a potential problem.
   **/
  public warn(data: Record<string, unknown>) {
    this.push("warn", data);
  }

  /**
   * Logs information about a request, operation, or application state.
   **/
  public info(data: Record<string, unknown>) {
    this.push("info", data);
  }

  /**
   * Logging every small little variable and detail.
   **/
  public debug(data: Record<string, unknown>) {
    this.push("debug", data);
  }

  /**
   * Logging an operation across multiple functions.
   **/
  public trace(data: Record<string, unknown>) {
    this.push("trace", data);
  }

  /**
   * Returns the identifier for the logger context.
   **/
  get id() {
    return this.context[0][0]!.value;
  }

  private print() {
    let lastTime = this.context[0][0]!.time;
    const nestPad = "─── ".repeat(this.context[2]);
    const time = new Date(this.context[0][0]!.time);
    const pad = (n: number) => String(n).padStart(2, "0");
    const formattedTime =
      `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}` +
      ` ${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}` +
      `.${pad(time.getMilliseconds())}`;

    const lastLogItem = this.context[0][this.context[0].length - 1];

    const line = `${C.blue}${nestPad}┌─ ${this.context[0][0]!.value} @ ${formattedTime} [NEST = ${this.context[2]}]`;
    console.log(`${line} ${"─".repeat(150 - line.length)}${C.reset}`);

    for (const logItem of this.context[0].slice(1)) {
      const delta = ("⏱ " + String(logItem.time - lastTime)).padEnd(8);
      const paddedKey = logItem.key.padEnd(30);
      const color = colorForKey(logItem.key);
      const symbol = logItem === lastLogItem ? "└─" : "├─";

      console.log(
        `${color}${nestPad}${symbol} ${delta} ${paddedKey} │ ${logItem.value}${C.reset}`,
      );

      lastTime = logItem.time;
    }
  }

  private async dumpLogger() {
    const data = this.context[0];
    const fun = async (data: LogEntry[]) => {
      //custom dump function
    };
    await fun(data);
    this.print();
  }

  /**
   * Dumps the log context using custom function and prints it to console.
   **/
  public async dump() {
    await this.dumpLogger();
    const loggers = this.context[1];
    for (const logger of loggers) {
      await logger.dump();
    }
  }
}
