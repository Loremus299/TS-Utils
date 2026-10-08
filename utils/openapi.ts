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
      responses?: OpenAPIResponse;
    };
  };
}

interface OpenAPIParameter {
  name: string;
  description?: string;
  in: "query" | "path" | "header" | "cookie";
  required: boolean;
  schema: {
    type: string;
    format?: string;
    enum?: unknown[];
    default?: unknown;
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

export class OpenAPIHandler {
  openAPIObject: OpenAPI;

  constructor(
    openapi: string,
    title: string,
    version: string,
    description?: string,
  ) {
    this.openAPIObject = {
      openapi,
      info: { title, version, description },
      paths: {},
    };
  }

  path(
    path: string,
    method: HTTPMethod,
    {
      summary,
      description,
      tags,
    }: { summary?: string; description?: string; tags?: string[] },
  ) {
    this.openAPIObject.paths[path] ??= {};
    this.openAPIObject.paths[path][method] = {
      ...(summary && { summary }),
      ...(description && { description }),
      ...(tags && { tags }),
    };
  }

  queryParameters(path: string, method: HTTPMethod, schema: z.ZodObject) {
    const shape = schema.shape;

    const jsonSchema = z.toJSONSchema(schema) as {
      properties: Record<
        string,
        {
          type?: string;
          format?: string;
          enum?: unknown[];
          default?: unknown;
        }
      >;
      required?: string[];
    };

    this.openAPIObject.paths[path] ??= {};
    this.openAPIObject.paths[path][method] ??= {};
    this.openAPIObject.paths[path][method].parameters ??= [];

    for (const [key, schema] of Object.entries(shape)) {
      const property = jsonSchema.properties[key]!;

      this.openAPIObject.paths[path][method].parameters.push({
        name: key,
        description: schema.meta()?.description,
        in: "query",
        required: jsonSchema.required?.includes(key) ?? false,
        schema: {
          type: property.type!,
          format: property.format,
          enum: property.enum,
          default: property.default,
        },
        example: schema.meta()?.example,
      });
    }
  }

  pathParameters(path: string, method: HTTPMethod, schema: z.ZodObject) {
    const shape = schema.shape;

    const jsonSchema = z.toJSONSchema(schema) as {
      properties: Record<
        string,
        {
          type?: string;
          format?: string;
          enum?: unknown[];
        }
      >;
    };

    this.openAPIObject.paths[path] ??= {};
    this.openAPIObject.paths[path][method] ??= {};
    this.openAPIObject.paths[path][method].parameters ??= [];

    for (const [key, schema] of Object.entries(shape)) {
      const property = jsonSchema.properties[key]!;

      this.openAPIObject.paths[path][method].parameters.push({
        name: key,
        description: schema.meta()?.description,
        in: "path",
        required: true,
        schema: {
          type: property.type!,
          format: property.format,
          enum: property.enum,
        },
        example: schema.meta()?.example,
      });
    }
  }

  export() {
    return JSON.stringify(this.openAPIObject, null, 2);
  }
}
