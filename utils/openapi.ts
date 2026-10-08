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
      requestBody?: OpenAPIRequestBody;
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

interface OpenAPIRequestBodySchema {
  type?: string;
  format?: string;
  properties?: Record<string, OpenAPIRequestBodySchema>;
  required?: string[];
  items?: OpenAPIRequestBodySchema;
  enum?: unknown[];
  default?: unknown;
}

interface OpenAPIRequestBody {
  description?: string;
  required?: boolean;
  content: {
    "application/json": {
      schema: OpenAPIRequestBodySchema;
      example: unknown;
    };
  };
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
        example: unknown;
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

    const jsonSchema = z.toJSONSchema(schema, { target: "openapi-3.0" }) as {
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

    const jsonSchema = z.toJSONSchema(schema, { target: "openapi-3.0" }) as {
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

  headerParameters(path: string, method: HTTPMethod, schema: z.ZodObject) {
    const shape = schema.shape;

    const jsonSchema = z.toJSONSchema(schema, {
      target: "openapi-3.0",
    }) as {
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
        in: "header",
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

  cookieParameters(path: string, method: HTTPMethod, schema: z.ZodObject) {
    const shape = schema.shape;

    const jsonSchema = z.toJSONSchema(schema, {
      target: "openapi-3.0",
    }) as {
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
        in: "cookie",
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

  response(
    path: string,
    method: HTTPMethod,
    status: string,
    description: string,
    schema: z.ZodObject,
  ) {
    this.openAPIObject.paths[path] ??= {};
    this.openAPIObject.paths[path][method] ??= {};
    this.openAPIObject.paths[path][method].responses ??= {};

    const exampleExtractor = (field: any): unknown => {
      if (field instanceof z.ZodArray) {
        return [exampleExtractor(field.element)];
      }

      if (field instanceof z.ZodObject) {
        return Object.fromEntries(
          Object.entries(field.shape).map(([key, value]) => [
            key,
            exampleExtractor(value),
          ]),
        );
      }

      return field.meta()?.example;
    };

    const JSONSchema = z.toJSONSchema(schema, {
      target: "openapi-3.0",
    }) as OpenAPIResponseSchema;
    const example = exampleExtractor(schema);

    this.openAPIObject.paths[path][method].responses[status] = {
      description,
      content: { "application/json": { example, schema: JSONSchema } },
    };
  }

  requestBody(
    path: string,
    method: HTTPMethod,
    schema: z.ZodObject,
    description?: string,
    required?: boolean,
  ) {
    this.openAPIObject.paths[path] ??= {};
    this.openAPIObject.paths[path][method] ??= {};

    const exampleExtractor = (field: any): unknown => {
      if (field instanceof z.ZodArray) {
        return [exampleExtractor(field.element)];
      }

      if (field instanceof z.ZodObject) {
        return Object.fromEntries(
          Object.entries(field.shape).map(([key, value]) => [
            key,
            exampleExtractor(value),
          ]),
        );
      }

      return field.meta()?.example;
    };

    const JSONSchema = z.toJSONSchema(schema, {
      target: "openapi-3.0",
    }) as OpenAPIRequestBodySchema;

    const example = exampleExtractor(schema);

    this.openAPIObject.paths[path][method].requestBody = {
      ...(description && { description }),
      ...(required !== undefined && { required }),
      content: {
        "application/json": {
          schema: JSONSchema,
          example,
        },
      },
    };
  }
  export() {
    return JSON.stringify(this.openAPIObject, null, 2);
  }
}
