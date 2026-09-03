import {
  and,
  eq,
  getColumns,
  type AnyColumn,
  type EmptyRelations,
  type InferInsertModel,
  type InferSelectModel,
  type or,
  type SQL,
} from "drizzle-orm";
import type {
  AnyPgTable,
  PgAsyncTransaction,
  PgQueryResultHKT,
} from "drizzle-orm/pg-core";
import type { Logger } from "../../utils/logger";
import { Result } from "../../utils/result";

type DB = PgAsyncTransaction<PgQueryResultHKT, EmptyRelations>;
type Condition<T> = (
  t: T,
) => SQL | ReturnType<typeof and> | ReturnType<typeof or>;
type ExecutableQuery<TResult> = {
  execute(): Promise<TResult>;
  toSQL(): {
    sql: string;
    params: unknown[];
  };
};

function usableDB(tx?: DB) {
  return tx!; //?? db
}

interface DrizzleOpsInterface {
  executeQuery: <TResult>(
    query: ExecutableQuery<TResult>,
    log: Logger,
  ) => Promise<Result<TResult, unknown>>;

  insert: <T extends AnyPgTable>(
    table: T,
    data: InferInsertModel<T>,
    log: Logger,
    tx?: DB,
  ) => Promise<Result<InferSelectModel<T>, unknown>>;

  readTable: <T extends AnyPgTable>(
    table: T,
    data: Partial<InferInsertModel<T>>,
    log: Logger,
    tx?: DB,
  ) => Promise<Result<InferSelectModel<T>[], unknown>>;

  readTableUnique: <T extends AnyPgTable>(
    table: T,
    data: Partial<InferInsertModel<T>>,
    log: Logger,
    tx?: DB,
  ) => Promise<Result<InferSelectModel<T>, unknown>>;

  update: <T extends AnyPgTable>(
    table: T,
    data: Partial<InferInsertModel<T>>,
    condition: Condition<T>,
    log: Logger,
    tx?: DB,
  ) => Promise<Result<InferSelectModel<T>, unknown>>;

  delete: <T extends AnyPgTable>(
    table: T,
    condition: Condition<T>,
    log: Logger,
    tx?: DB,
  ) => Promise<Result<InferSelectModel<T>, unknown>>;
}

const drizzleOps: DrizzleOpsInterface = {
  async executeQuery(query, log) {
    const { sql, params } = query.toSQL();
    log.info({ query: sql });
    log.debug({ parameters: params });

    const rows = (
      await Result.tryCatch({}, async () => {
        return await query.execute();
      })
    )
      .onError((e) => log.error({ error: e }))
      .onOk((t) => log.debug({ rows: t }));

    return rows;
  },

  async insert(table, data, log, tx) {
    const db = usableDB(tx);
    log.info({ data });

    return (
      await this.executeQuery(db.insert(table).values(data).returning(), log)
    ).mapOk((t) => {
      const cast = t as InferSelectModel<typeof table>[];
      return cast[0] as InferSelectModel<typeof table>;
    });
  },

  async readTable(table, data, log, tx) {
    const db = usableDB(tx);

    const columns = getColumns(table);
    const conditions: SQL[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key in columns) {
        const column = columns[key as keyof typeof columns];
        log.info({ data: (column?.name, value) });
        conditions.push(eq(column as AnyColumn, value as never));
      }
    }

    return (
      await this.executeQuery(
        db
          .select()
          .from(table as AnyPgTable)
          .where(and(...conditions)),
        log,
      )
    ).mapOk((t) => t as InferSelectModel<typeof table>[]);
  },

  async readTableUnique(table, data, log, tx) {
    const db = usableDB(tx);

    const columns = getColumns(table);
    const conditions: SQL[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key in columns) {
        const column = columns[key as keyof typeof columns];
        log.info({ data: (column?.name, value) });
        conditions.push(eq(column as AnyColumn, value as never));
      }
    }

    const rows = (
      await this.executeQuery(
        db
          .select()
          .from(table as AnyPgTable)
          .where(and(...conditions)),
        log,
      )
    ).mapOk((t) => t as unknown as InferSelectModel<typeof table>[]);

    if (!rows.value.success) return Result.error(rows.value.error);
    if (rows.value.data.length !== 1)
      return Result.error("The data queried was not a single row" as unknown);

    return Result.ok(rows.value.data[0]!);
  },

  async update(table, data, condition, log, tx) {
    const db = usableDB(tx);
    log.info({ data });

    return (
      await this.executeQuery(
        db.update(table).set(data).where(condition(table)).returning(),
        log,
      )
    ).mapOk((t) => {
      const cast = t as InferSelectModel<typeof table>[];
      return cast[0] as InferSelectModel<typeof table>;
    });
  },

  async delete(table, condition, log, tx) {
    const db = usableDB(tx);

    return (
      await this.executeQuery(
        db.delete(table).where(condition(table)).returning(),
        log,
      )
    ).mapOk((t) => {
      const cast = t as InferSelectModel<typeof table>[];
      return cast[0] as InferSelectModel<typeof table>;
    });
  },
};

export default drizzleOps;
