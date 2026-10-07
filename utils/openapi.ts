import z from "zod";

type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

interface OpenAPIOverview {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  paths: OpenAPIPaths;
  components: OpenAPIComponents;
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

interface OpenAPIPaths {
  [path: string]: {
    [method: string]: {
      summary?: string;
      description?: string;
      tags?: string[];

      parameters?: OpenAPIParameter[];
      requestBody?: OpenAPIRequestBody;
      responses?: OpenAPIResponses;
    };
  };
}

interface OpenAPIObjects {
  schema?: Record<string, unknown>;
  example?: JSONValue;
}

interface OpenAPIParameter {
  name?: string;
  description?: string;
  required?: boolean;
  in?: "query" | "header" | "path" | "cookie";

  schema?: JSONValue;
  example?: JSONValue;
}

interface OpenAPIRequestBody {
  description?: string;
  required?: boolean;
  content?: Record<string, OpenAPIObjects>;
}

interface OpenAPIResponses {
  [status: string]: {
    description?: string;
    content?: Record<string, OpenAPIObjects>;
  };
}
interface OpenAPIComponents {
  schemas: Record<string, JSONValue>;
}

class OpenAPI {
  schema: OpenAPIOverview;

  constructor(
    openAPIVersion: string,
    title: string,
    description: string,
    version: string,
  ) {
    this.schema = {
      openapi: openAPIVersion,
      info: {
        title,
        description,
        version,
      },

      paths: {},
      components: {
        schemas: {},
      },
    };
  }

  addPath(
    path: string,
    method: HTTPMethod,
    summary?: string,
    description?: string,
    tags?: string[],
  ) {
    this.schema.paths[path] ??= {};
    const pathItem = this.schema.paths[path];

    const pathMethodItem = pathItem[method] ?? {};
    pathItem[method] = {
      ...pathMethodItem,
      ...(summary && { summary }),
      ...(description && { description }),
      ...(tags && { tags }),
    };
    pathItem[method] = pathMethodItem;

    return {
      addParameters(parameters: OpenAPIParameter[]) {
        pathMethodItem.parameters = parameters;
      },

      addRequestBody(requestBody: OpenAPIRequestBody) {
        pathMethodItem.requestBody = requestBody;
      },

      addResponse(status: string, response: z.ZodType) {},
    };
  }
}
