import z from "zod";

interface OpenAPI {
  openapi: string;

  info: {
    title: string;
    version: string;
    description?: string;
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
      responses: OpenAPIResponse;
    };
  };
}

interface OpenAPIParameter {
  name: string;
  description?: string;
  in?: "query" | "path" | "header" | "cookie";
  required: boolean;
  schema: {
    type: string;
    format?: string;
  };
  example?: unknown;
}

interface OpenAPIResponseSchema {
  type?: string;
  format?: string;
  properties?: Record<string, OpenAPIResponseSchema>;
  required?: string[];
  items?: OpenAPIResponseSchema;
  enum?: unknown[];
}

interface OpenAPIResponse {
  [status: string]: {
    description: string;
    content: {
      "application/json": {
        schema: OpenAPIResponseSchema;
        example: Record<string, unknown>;
      };
    };
  };
}
