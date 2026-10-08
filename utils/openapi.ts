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
    const shape = (arr.element as z.ZodObject).shape;

    const itemSchema = z.toJSONSchema(arr).items! as {
      properties: Record<
        string,
        {
          type?: string;
          format?: string;
        }
      >;
      required?: string[];
    };

    this.operation.parameters = [];

    for (const [key, schema] of Object.entries(shape)) {
      const property = itemSchema.properties[key]!;

      this.operation.parameters?.push({
        name: key,
        description: schema.meta()?.description,
        in: schema.meta()?.in,
        required: itemSchema.required?.includes(key) ?? false,
        schema: {
          type: property.type!,
          format: property.format,
        },
        example: schema.meta()?.example,
      });
    }
  }

  response(status: string, description: string, schema: z.ZodObject) {
    const jsonSchema = z.toJSONSchema(schema);

    const example = Object.fromEntries(
      Object.entries(schema.shape).map(([key, field]) => [
        key,
        field.meta()?.example,
      ]),
    );

    this.operation.responses[status] = {
      description,
      content: {
        "application/json": {
          schema: jsonSchema as OpenAPIResponseSchema,
          example,
        },
      },
    };
  }
}

export class OpenAPIHandler {
  openAPIObject: OpenAPI;

  constructor(
    openapi: string,
    {
      title,
      description,
      version,
    }: { title: string; description: string; version: string },
  ) {
    this.openAPIObject = {
      openapi,
      info: {
        title,
        version,
        ...(description && { description }),
      },

      paths: {},
    };
  }

  export() {
    return JSON.stringify(this.openAPIObject, null, 2);
  }
}
