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

interface DrizzleOpsInterface {
  insert: <T extends AnyPgTable>(
    table: T,
    data: InferInsertModel<T>,
    tx?: DB,
  ) => Promise<InferSelectModel<T>>;

  read: <TResult>(query: ExecutableQuery<TResult>) => Promise<TResult>;

  readTable: <T extends AnyPgTable>(
    table: T,
    data: Partial<InferInsertModel<T>>,
    tx?: DB,
  ) => Promise<InferSelectModel<T>[]>;

  readTableUnique: <T extends AnyPgTable>(
    table: T,
    data: Partial<InferInsertModel<T>>,
    tx?: DB,
  ) => Promise<InferSelectModel<T>>;

  update: <T extends AnyPgTable>(
    table: T,
    data: Partial<InferInsertModel<T>>,
    condition: Condition<T>,
    tx?: DB,
  ) => Promise<InferSelectModel<T>>;

  delete: <T extends AnyPgTable>(
    table: T,
    condition: Condition<T>,
    tx?: DB,
  ) => Promise<InferSelectModel<T>>;
}

const drizzleOps: DrizzleOpsInterface = {
  async insert(table, data, tx) {
    const t = tx!;
    const rows = (await t
      .insert(table)
      .values(data)
      .returning()) as InferSelectModel<typeof table>[];

    return rows[0] as InferSelectModel<typeof table>;
  },

  async read(query) {
    return await query.execute();
  },

  async readTable(table, data, tx) {
    const t = tx!;
    const columns = getColumns(table);
    const conditions: SQL[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key in columns) {
        console.log(key);
        const column = columns[key as keyof typeof columns];
        conditions.push(eq(column as AnyColumn, value as never));
      }
    }

    return (await drizzleOps.read(
      t
        .select()
        .from(table as AnyPgTable)
        .where(and(...conditions)),
    )) as InferSelectModel<typeof table>[];
  },

  async readTableUnique(table, data, tx) {
    const t = tx!;
    const columns = getColumns(table);
    const conditions: SQL[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key in columns) {
        console.log(key);
        const column = columns[key as keyof typeof columns];
        conditions.push(eq(column as AnyColumn, value as never));
      }
    }

    const rows = (await drizzleOps.read(
      t
        .select()
        .from(table as AnyPgTable)
        .where(and(...conditions)),
    )) as InferSelectModel<typeof table>[];

    return rows[0] as InferSelectModel<typeof table>;
  },

  async update(table, data, condition, tx) {
    const t = tx!;

    const rows = (await t
      .update(table)
      .set(data)
      .where(condition(table))
      .returning()) as InferSelectModel<typeof table>[];

    return rows[0] as InferSelectModel<typeof table>;
  },

  async delete(table, condition, tx) {
    const t = tx!;

    const rows = (await t
      .delete(table)
      .where(condition(table))
      .returning()) as InferSelectModel<typeof table>[];

    return rows[0] as InferSelectModel<typeof table>;
  },
};

export default drizzleOps;
