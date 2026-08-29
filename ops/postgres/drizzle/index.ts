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
  executeQuery: <TResult>(query: ExecutableQuery<TResult>) => Promise<TResult>;

  insert: <T extends AnyPgTable>(
    table: T,
    data: InferInsertModel<T>,
    tx?: DB,
  ) => Promise<InferSelectModel<T>>;

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
  async executeQuery(query) {
    // const { sql, params } = query.toSQL();
    // console.log(sql) --> debug;
    // console.log(params) --> debug;
    const rows = await query.execute();
    // console.log(rows) --> debug;
    return rows;
  },

  async insert(table, data, tx) {
    const t = tx!; //?? db;
    //console.log(data) --> info;
    const [row] = (await drizzleOps.executeQuery(
      t.insert(table).values(data).returning(),
    )) as InferSelectModel<typeof table>[];

    // console.log(row) --> debug;
    return row as InferSelectModel<typeof table>;
  },

  async readTable(table, data, tx) {
    const t = tx!; //?? db;
    //console.log(data) --> info;

    const columns = getColumns(table);
    const conditions: SQL[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key in columns) {
        const column = columns[key as keyof typeof columns];
        // console.log(column?.name, value) --> info;
        conditions.push(eq(column as AnyColumn, value as never));
      }
    }

    return (await drizzleOps.executeQuery(
      t
        .select()
        .from(table as AnyPgTable)
        .where(and(...conditions)),
    )) as InferSelectModel<typeof table>[];
  },

  async readTableUnique(table, data, tx) {
    const t = tx!; //?? db;
    //console.log(data) --> info;

    const columns = getColumns(table);
    const conditions: SQL[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key in columns) {
        // console.log(column?.name, value) --> info;
        const column = columns[key as keyof typeof columns];
        conditions.push(eq(column as AnyColumn, value as never));
      }
    }

    const rows = (await drizzleOps.executeQuery(
      t
        .select()
        .from(table as AnyPgTable)
        .where(and(...conditions)),
    )) as InferSelectModel<typeof table>[];

    if (rows.length !== 1) {
      return rows[0] as InferSelectModel<typeof table>;
    } else {
      throw new Error("The data is not unique or unavailable.");
    }
  },

  async update(table, data, condition, tx) {
    const t = tx!;
    //console.log(data) --> info;

    const [row] = (await drizzleOps.executeQuery(
      t.update(table).set(data).where(condition(table)).returning(),
    )) as InferSelectModel<typeof table>[];

    return row as InferSelectModel<typeof table>;
  },

  async delete(table, condition, tx) {
    const t = tx!;

    const [row] = (await drizzleOps.executeQuery(
      t.delete(table).where(condition(table)).returning(),
    )) as InferSelectModel<typeof table>[];

    return row as InferSelectModel<typeof table>;
  },
};

export default drizzleOps;
