import z from "zod";

interface OpenAPI {
  openapi: string;

  info: {
    title: string;
    description: string;
    version: string;
  };

  paths: OpenAPIPath;
  components: OpenAPIComponent;
}

interface OpenAPIModel {
  type?: string;
  format?: string;
  properties?: Record<string, OpenAPIModel>;
  required?: string[];
  items?: OpenAPIModel;
  enum?: unknown[];
}

interface OpenAPIComponent {
  [name: string]: OpenAPIModel;
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
  required: boolean;
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
}
