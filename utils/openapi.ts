interface OpenAPIPath {
  [path: string]: {
    [method: string]: {
      summary?: string;
      description?: string;
      tags?: string[];

      parameters?: OpenAPIParameter[];
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
    format: string;
  };
  example: unknown;
}

class OpenAPIPathHandler {
  path: OpenAPIPath;

  constructor(
    path: string,
    method: string,
    summary?: string,
    tags?: string[],
    description?: string,
  ) {
    this.path = {
      [path]: {
        [method]: {
          ...(summary && { summary }),
          ...(description && { description }),
          ...(tags && { tags }),
        },
      },
    };
  }
}
