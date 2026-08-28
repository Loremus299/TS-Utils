import type {
  and,
  EmptyRelations,
  InferInsertModel,
  InferSelectModel,
  or,
  SQL,
} from "drizzle-orm";
import type {
  AnyPgTable,
  PgAsyncSelect,
  PgAsyncTransaction,
  PgQueryResultHKT,
} from "drizzle-orm/pg-core";
import type { QueryResult } from "pg";

type DB = PgAsyncTransaction<PgQueryResultHKT, EmptyRelations>;
type Condition<T> = (
  t: T,
) => SQL | ReturnType<typeof and> | ReturnType<typeof or>;

export interface drizzleOpsInterface {
  insert: <T extends AnyPgTable>(
    table: T,
    data: InferInsertModel<T>,
    tx?: DB,
  ) => Promise<InferSelectModel<T>>;

  readAll: <T extends PgAsyncSelect>(query: T) => Promise<QueryResult<T>>;

  readUnique: <T extends PgAsyncSelect>(query: T) => Promise<QueryResult<T>>;

  update: <T extends AnyPgTable>(
    table: T,
    data: Partial<InferInsertModel<T>>,
    tx?: DB,
  ) => Promise<InferSelectModel<T>>;

  delete: <T extends AnyPgTable>(
    table: T,
    condition: Condition<T>,
    tx?: DB,
  ) => Promise<InferSelectModel<T>>;
}
