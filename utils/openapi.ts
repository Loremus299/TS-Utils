import type z from "zod";

interface OpenAPI {
  openapi: string;

  info: {
    title: string;
    description: string;
    version: string;
  };

  paths: OpenAPIPath;
}

type HTTPMethod =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "head"
  | "options"
  | "trace";

interface OpenAPIPath {
  [path: string]: {
    [method: string]: {
      summary?: string;
      description?: string;
      tags?: string[];

      parameters?: OpenAPIParameter[];
      requestBody?: {};
      responses: {};
    };
  };
}

interface OpenAPIParameter {
  name: string;
  description?: string;
  in?: "query" | "path" | "header" | "cookie";
  required?: boolean;
  schema: {
    type: string;
    format?: string;
  };
  example?: unknown;
}

class OpenAPIPathHandler {
  pathObject: OpenAPIPath;
  private operation: OpenAPIPath[string][HTTPMethod];

  constructor(
    path: string,
    method: HTTPMethod,
    {
      summary,
      description,
      tags,
    }: { summary?: string; description?: string; tags?: string[] },
  ) {
    this.operation = {
      ...(summary && { summary }),
      ...(description && { description }),
      ...(tags && { tags }),
      responses: {},
    };

    this.pathObject = {
      [path]: {
        [method]: this.operation,
      },
    };
  }

  parameter(arr: z.ZodArray) {
    this.operation.parameters = [];
  }
}
